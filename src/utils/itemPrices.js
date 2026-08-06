import {
  getGenerationLabel,
  getVersionGroupLabel,
  getVersionGroupMetadata,
} from './versionGroups.js';

const CURRENCY_LABELS = Object.freeze({
  'poke-dollar': { de: 'Pokédollar', en: 'Poké Dollars', suffix: '₽' },
  coin: { de: 'Münzen', en: 'Coins', suffix: 'Münzen' },
  'volcanic-ash': { de: 'Vulkanasche', en: 'Volcanic Ash', suffix: 'Asche' },
  'poke-coupon': { de: 'PokéCoupons', en: 'Poké Coupons', suffix: 'Coupons' },
  'berry-powder': { de: 'Beerenstaub', en: 'Berry Powder', suffix: 'Staub' },
  'battle-point': { de: 'Gewinnpunkte', en: 'Battle Points', suffix: 'GP' },
  sphere: { de: 'Sphären', en: 'Spheres', suffix: 'Sphären' },
  'castle-point': { de: 'Burgenpunkte', en: 'Castle Points', suffix: 'BP' },
  watt: { de: 'Watt', en: 'Watts', suffix: 'W' },
  'athlete-point': { de: 'Athletenpunkte', en: 'Athlete Points', suffix: 'AP' },
  'dream-point': { de: 'Traumpunkte', en: 'Dream Points', suffix: 'TP' },
  'dream-world-berry': { de: 'Traumwelt-Beeren', en: 'Dream World Berries', suffix: 'Beeren' },
  'poke-mile': { de: 'PokéMeilen', en: 'Poké Miles', suffix: 'PM' },
  'festival-coin': { de: 'Festivalmünzen', en: 'Festival Coins', suffix: 'FM' },
  'poke-bean': { de: 'Pokébohnen', en: 'Poké Beans', suffix: 'Bohnen' },
  'home-point': { de: 'HOME-Punkte', en: 'HOME Points', suffix: 'HP' },
  'merit-point': { de: 'Dankbarkeitspunkte', en: 'Merit Points', suffix: 'DP' },
  'league-point': { de: 'Ligapunkte', en: 'League Points', suffix: 'LP' },
  'blueberry-point': { de: 'Blaubeer-Punkte', en: 'Blueberry Points', suffix: 'BP' },
});

const parseNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

export const getCurrencyLabel = (currencyName = 'poke-dollar', language = 'en') => {
  const currency = CURRENCY_LABELS[currencyName];
  if (currency) {
    return language === 'de' ? currency.de : currency.en;
  }

  return currencyName
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const formatItemPrice = (amount, currencyName = 'poke-dollar', language = 'en') => {
  const numericAmount = parseNullableNumber(amount);
  if (numericAmount === null) {
    return language === 'de' ? 'Nicht verfügbar' : 'Unavailable';
  }

  const locale = language === 'de' ? 'de-DE' : 'en-US';
  const formattedAmount = new Intl.NumberFormat(locale).format(numericAmount);
  const currency = CURRENCY_LABELS[currencyName];

  if (currencyName === 'poke-dollar') {
    return `${formattedAmount} ₽`;
  }

  return `${formattedAmount} ${currency?.suffix || getCurrencyLabel(currencyName, language)}`;
};

export const normalizeItemPrices = (itemDetails = {}) => {
  const explicitPrices = Array.isArray(itemDetails.prices) ? itemDetails.prices : [];
  const normalized = explicitPrices.map((price, index) => {
    const versionGroupName = price.version_group?.name || '';
    const metadata = getVersionGroupMetadata(versionGroupName, index + 1);
    return {
      purchasePrice: parseNullableNumber(price.purchase_price),
      sellPrice: parseNullableNumber(price.sell_price),
      currency: price.currency?.name || 'poke-dollar',
      versionGroup: versionGroupName,
      generation: metadata.generation,
      order: metadata.order,
      source: 'prices',
    };
  });

  if (normalized.length) {
    return normalized.sort((first, second) => first.order - second.order
      || first.currency.localeCompare(second.currency));
  }

  const legacyCost = parseNullableNumber(itemDetails.cost);
  if (legacyCost !== null && legacyCost > 0) {
    return [{
      purchasePrice: legacyCost,
      sellPrice: null,
      currency: 'poke-dollar',
      versionGroup: '',
      generation: 99,
      order: Number.MAX_SAFE_INTEGER,
      source: 'legacy-cost',
    }];
  }

  return [];
};

export const getRepresentativeItemPrice = (itemDetails = {}) => {
  const prices = normalizeItemPrices(itemDetails);
  const purchasable = prices.filter((price) => price.purchasePrice !== null);
  const pokeDollarPrices = purchasable.filter((price) => price.currency === 'poke-dollar');
  const candidates = pokeDollarPrices.length ? pokeDollarPrices : purchasable;
  return candidates.at(-1) || prices.at(-1) || null;
};

export const createItemPriceSections = (itemDetails = {}, language = 'en') => {
  const sections = new Map();

  for (const price of normalizeItemPrices(itemDetails)) {
    const generation = price.generation;
    if (!sections.has(generation)) {
      sections.set(generation, {
        generation,
        label: generation === 99
          ? (language === 'de' ? 'Allgemeiner Preis' : 'General price')
          : getGenerationLabel(generation, language),
        prices: [],
      });
    }

    sections.get(generation).prices.push({
      ...price,
      versionGroupLabel: price.versionGroup
        ? getVersionGroupLabel(price.versionGroup, language)
        : (language === 'de' ? 'Allgemein' : 'General'),
      currencyLabel: getCurrencyLabel(price.currency, language),
      purchaseLabel: formatItemPrice(price.purchasePrice, price.currency, language),
      sellLabel: formatItemPrice(price.sellPrice, price.currency, language),
    });
  }

  return [...sections.values()].sort((first, second) => first.generation - second.generation);
};
