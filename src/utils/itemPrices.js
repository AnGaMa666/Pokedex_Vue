import {
  getGenerationLabel,
  getVersionGroupLabel,
  getVersionGroupMetadata,
} from './versionGroups.js';

const CURRENCY_LABELS = Object.freeze({
  'poke-dollar': {
    de: 'Pokédollar',
    en: 'Poké Dollars',
    suffix: { de: '₽', en: '₽' },
  },
  coin: {
    de: 'Münzen',
    en: 'Coins',
    suffix: { de: 'Münzen', en: 'Coins' },
  },
  'volcanic-ash': {
    de: 'Vulkanasche',
    en: 'Volcanic Ash',
    suffix: { de: 'Asche', en: 'Ash' },
  },
  'poke-coupon': {
    de: 'PokéCoupons',
    en: 'Poké Coupons',
    suffix: { de: 'Coupons', en: 'Coupons' },
  },
  'berry-powder': {
    de: 'Beerenstaub',
    en: 'Berry Powder',
    suffix: { de: 'Staub', en: 'Powder' },
  },
  'battle-point': {
    de: 'Gewinnpunkte',
    en: 'Battle Points',
    suffix: { de: 'GP', en: 'BP' },
  },
  sphere: {
    de: 'Sphären',
    en: 'Spheres',
    suffix: { de: 'Sphären', en: 'Spheres' },
  },
  'castle-point': {
    de: 'Burgenpunkte',
    en: 'Castle Points',
    suffix: { de: 'BP', en: 'CP' },
  },
  watt: {
    de: 'Watt',
    en: 'Watts',
    suffix: { de: 'W', en: 'W' },
  },
  'athlete-point': {
    de: 'Athletenpunkte',
    en: 'Athlete Points',
    suffix: { de: 'AP', en: 'AP' },
  },
  'dream-point': {
    de: 'Traumpunkte',
    en: 'Dream Points',
    suffix: { de: 'TP', en: 'DP' },
  },
  'dream-world-berry': {
    de: 'Traumwelt-Beeren',
    en: 'Dream World Berries',
    suffix: { de: 'Beeren', en: 'Berries' },
  },
  'poke-mile': {
    de: 'PokéMeilen',
    en: 'Poké Miles',
    suffix: { de: 'PM', en: 'PM' },
  },
  'festival-coin': {
    de: 'Festivalmünzen',
    en: 'Festival Coins',
    suffix: { de: 'FM', en: 'FC' },
  },
  'poke-bean': {
    de: 'Pokébohnen',
    en: 'Poké Beans',
    suffix: { de: 'Bohnen', en: 'Beans' },
  },
  'home-point': {
    de: 'HOME-Punkte',
    en: 'HOME Points',
    suffix: { de: 'HP', en: 'HP' },
  },
  'merit-point': {
    de: 'Dankbarkeitspunkte',
    en: 'Merit Points',
    suffix: { de: 'DP', en: 'MP' },
  },
  'league-point': {
    de: 'Ligapunkte',
    en: 'League Points',
    suffix: { de: 'LP', en: 'LP' },
  },
  'blueberry-point': {
    de: 'Blaubeer-Punkte',
    en: 'Blueberry Points',
    suffix: { de: 'BP', en: 'BP' },
  },
});

const GERMAN_CURRENCY_PARTS = Object.freeze({
  ash: 'Asche', athlete: 'Athleten', battle: 'Gewinn', bean: 'Bohnen', berry: 'Beeren',
  blueberry: 'Blaubeer', castle: 'Burgen', coin: 'Münzen', coupon: 'Coupons', dream: 'Traum',
  festival: 'Festival', home: 'HOME', league: 'Liga', merit: 'Dankbarkeits', mile: 'Meilen',
  point: 'Punkte', poke: 'Poké', powder: 'Staub', sphere: 'Sphären', volcanic: 'Vulkan',
  watt: 'Watt', world: 'Welt',
});

const parseNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getNamedResourceName = (resource) => {
  if (typeof resource === 'string') return resource.trim();
  return typeof resource?.name === 'string' ? resource.name.trim() : '';
};

const getResourceId = (resource) => {
  const url = typeof resource === 'string' ? '' : resource?.url;
  const match = typeof url === 'string' ? url.match(/\/(\d+)\/?(?:\?.*)?$/) : null;
  return match ? Number(match[1]) : 0;
};

const formatCurrencyFallback = (currencyName, language) => {
  if (!currencyName) {
    return language === 'de' ? 'Keine Währungsangabe' : 'No currency specified';
  }

  const parts = currencyName.split('-').filter(Boolean);
  if (language === 'de') {
    return parts
      .map((part) => GERMAN_CURRENCY_PARTS[part]
        || `${part.charAt(0).toLocaleUpperCase('de-DE')}${part.slice(1)}`)
      .join(' ');
  }

  return parts
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
};

const getPriceSectionOrder = (section) => {
  if (Number.isFinite(section.generation)) return section.generation;
  return section.isFallback ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER - 1;
};

export const getCurrencyLabel = (currencyName = '', language = 'en') => {
  const currency = CURRENCY_LABELS[currencyName];
  if (currency) return language === 'de' ? currency.de : currency.en;
  return formatCurrencyFallback(currencyName, language);
};

export const getUnavailableItemPriceLabel = (kind = 'generic', language = 'en') => {
  const labels = language === 'de'
    ? {
        purchase: 'Nicht kaufbar',
        sell: 'Nicht verkaufbar',
        generic: 'Nicht verfügbar',
      }
    : {
        purchase: 'Not purchasable',
        sell: 'Not sellable',
        generic: 'Unavailable',
      };

  return labels[kind] || labels.generic;
};

export const formatItemPrice = (amount, currencyName = '', language = 'en') => {
  const numericAmount = parseNullableNumber(amount);
  if (numericAmount === null) return getUnavailableItemPriceLabel('generic', language);

  const locale = language === 'de' ? 'de-DE' : 'en-US';
  const formattedAmount = new Intl.NumberFormat(locale).format(numericAmount);
  const currency = CURRENCY_LABELS[currencyName];
  const suffix = currency?.suffix?.[language === 'de' ? 'de' : 'en'];

  if (suffix) return `${formattedAmount} ${suffix}`;
  if (!currencyName) return formattedAmount;
  return `${formattedAmount} ${getCurrencyLabel(currencyName, language)}`;
};

export const normalizeItemPrices = (itemDetails = {}) => {
  const hasPricesField = Object.prototype.hasOwnProperty.call(itemDetails, 'prices');

  if (hasPricesField) {
    if (!Array.isArray(itemDetails.prices)) return [];

    return itemDetails.prices
      .map((price = {}, index) => {
        const versionGroup = getNamedResourceName(price.version_group);
        const fallbackId = getResourceId(price.version_group);
        const metadata = getVersionGroupMetadata(versionGroup, fallbackId);

        return {
          id: `price-${index}`,
          purchasePrice: parseNullableNumber(price.purchase_price),
          sellPrice: parseNullableNumber(price.sell_price),
          currency: getNamedResourceName(price.currency),
          versionGroup,
          generation: metadata.generation === 99 ? null : metadata.generation,
          order: metadata.order,
          source: 'prices',
          isFallback: false,
          inputOrder: index,
        };
      })
      .sort((first, second) => first.order - second.order
        || first.currency.localeCompare(second.currency)
        || first.inputOrder - second.inputOrder);
  }

  const legacyCost = parseNullableNumber(itemDetails.cost);
  if (legacyCost === null) return [];

  return [{
    id: 'legacy-cost',
    purchasePrice: legacyCost,
    sellPrice: null,
    currency: 'poke-dollar',
    versionGroup: '',
    generation: null,
    order: Number.MAX_SAFE_INTEGER,
    source: 'legacy-cost',
    isFallback: true,
    inputOrder: 0,
  }];
};

export const createCompactItemPriceSummaries = (itemDetails = {}, language = 'en') => {
  const prices = normalizeItemPrices(itemDetails);
  const pricesByCurrency = new Map();

  for (const price of prices) {
    const currency = price.currency || '';
    const existing = pricesByCurrency.get(currency) || [];
    existing.push(price);
    pricesByCurrency.set(currency, existing);
  }

  return [...pricesByCurrency.entries()]
    .map(([currency, currencyPrices]) => {
      const purchaseAmounts = currencyPrices
        .map((price) => price.purchasePrice)
        .filter((amount) => amount !== null);
      const sellAmounts = currencyPrices
        .map((price) => price.sellPrice)
        .filter((amount) => amount !== null);
      const purchaseAmount = purchaseAmounts.length ? Math.min(...purchaseAmounts) : null;
      const sellAmount = sellAmounts.length ? Math.max(...sellAmounts) : null;
      const latestOrder = Math.max(...currencyPrices.map((price) => price.order));
      const fromLabel = language === 'de' ? 'ab' : 'from';
      const upToLabel = language === 'de' ? 'bis' : 'up to';

      return {
        currency,
        currencyLabel: getCurrencyLabel(currency, language),
        purchaseAmount,
        sellAmount,
        purchaseLabel: purchaseAmount === null
          ? getUnavailableItemPriceLabel('purchase', language)
          : `${fromLabel} ${formatItemPrice(purchaseAmount, currency, language)}`,
        sellLabel: sellAmount === null
          ? getUnavailableItemPriceLabel('sell', language)
          : `${upToLabel} ${formatItemPrice(sellAmount, currency, language)}`,
        hasPrice: purchaseAmount !== null || sellAmount !== null,
        isFallback: currencyPrices.every((price) => price.isFallback),
        latestOrder,
      };
    })
    .sort((first, second) => Number(second.hasPrice) - Number(first.hasPrice)
      || Number(second.currency === 'poke-dollar') - Number(first.currency === 'poke-dollar')
      || second.latestOrder - first.latestOrder
      || first.currencyLabel.localeCompare(second.currencyLabel, language === 'de' ? 'de-DE' : 'en-US'));
};

export const getCompactItemPriceSummary = (itemDetails = {}, language = 'en') => (
  createCompactItemPriceSummaries(itemDetails, language)[0] || null
);

export const getRepresentativeItemPrice = (itemDetails = {}) => {
  const prices = normalizeItemPrices(itemDetails);
  const summary = getCompactItemPriceSummary(itemDetails, 'en');
  if (!summary) return null;

  const currencyPrices = prices.filter((price) => price.currency === summary.currency);
  return currencyPrices.filter((price) => price.purchasePrice !== null).at(-1)
    || currencyPrices.filter((price) => price.sellPrice !== null).at(-1)
    || currencyPrices.at(-1)
    || null;
};

export const createItemPriceSections = (itemDetails = {}, language = 'en') => {
  const sections = new Map();

  for (const price of normalizeItemPrices(itemDetails)) {
    const sectionKey = price.isFallback ? 'fallback' : (price.generation ?? 'unknown');
    if (!sections.has(sectionKey)) {
      const label = price.isFallback
        ? (language === 'de' ? 'Allgemeiner Listenpreis (Fallback)' : 'General list price (fallback)')
        : (price.generation === null
            ? (language === 'de' ? 'Weitere Spielgruppen' : 'Other game groups')
            : getGenerationLabel(price.generation, language));

      sections.set(sectionKey, {
        generation: price.generation,
        label,
        isFallback: price.isFallback,
        prices: [],
      });
    }

    sections.get(sectionKey).prices.push({
      ...price,
      versionGroupLabel: price.versionGroup
        ? getVersionGroupLabel(price.versionGroup, language)
        : (language === 'de' ? 'Allgemeiner Listenpreis (Fallback)' : 'General list price (fallback)'),
      currencyLabel: getCurrencyLabel(price.currency, language),
      purchaseLabel: price.purchasePrice === null
        ? getUnavailableItemPriceLabel('purchase', language)
        : formatItemPrice(price.purchasePrice, price.currency, language),
      sellLabel: price.sellPrice === null
        ? getUnavailableItemPriceLabel('sell', language)
        : formatItemPrice(price.sellPrice, price.currency, language),
    });
  }

  return [...sections.values()].sort((first, second) => getPriceSectionOrder(first) - getPriceSectionOrder(second));
};
