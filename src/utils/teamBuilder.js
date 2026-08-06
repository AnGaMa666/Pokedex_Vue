import { getResourceId } from './resource.js';

export const HELD_ITEM_ATTRIBUTE_NAMES = Object.freeze([
  'holdable',
  'holdable-passive',
  'holdable-active',
]);

export const TEAM_ITEM_CATEGORIES = Object.freeze([
  { value: 'type-boosters', de: 'Typverstärker', en: 'Type boosters' },
  { value: 'choice-items', de: 'Wahlitems', en: 'Choice items' },
  { value: 'healing-items', de: 'Heilende Trageitems', en: 'Healing held items' },
  { value: 'status-items', de: 'Statusitems', en: 'Status items' },
  { value: 'berries', de: 'Beeren', en: 'Berries' },
  { value: 'form-items', de: 'Entwicklungs- und Formitems', en: 'Evolution and form items' },
  { value: 'species-items', de: 'Pokémon-spezifische Items', en: 'Species-specific items' },
  { value: 'battle-items', de: 'Kampfitems', en: 'Battle items' },
  { value: 'other-held-items', de: 'Sonstige Trageitems', en: 'Other held items' },
]);

const TEAM_ITEM_CATEGORY_ORDER = new Map(
  TEAM_ITEM_CATEGORIES.map((category, index) => [category.value, index]),
);

const EXCLUDED_ITEM_CATEGORIES = new Set([
  'all-machines',
  'apricorn-balls',
  'apricorn-box',
  'catching-bonus',
  'data-cards',
  'dex-completion',
  'event-items',
  'gameplay',
  'miracle-shooter',
  'plot-advancement',
  'special-balls',
  'standard-balls',
  'tm-materials',
  'unused',
]);

const MACHINE_NAME_PATTERN = /^(?:tm|hm|tr)\d+[a-z]?$/i;

const SUPPLEMENTAL_HELD_ITEM_CATEGORIES = new Set([
  'mega-stones',
  'plates',
  'species-specific',
  'z-crystals',
]);

const PASSIVE_HELD_ITEM_CATEGORIES = new Set([
  'bad-held-items',
  'choice',
  'effort-training',
  'held-items',
  'in-a-pinch',
  'jewels',
  'memories',
  'picky-healing',
  'plates',
  'scarves',
  'species-specific',
  'training',
  'type-enhancement',
  'type-protection',
]);

const HEALING_HELD_ITEMS = new Set([
  'berry-juice',
  'big-root',
  'black-sludge',
  'leftovers',
  'shell-bell',
]);

const getLocalizedApiName = (names = [], language = 'de') => names.find(
  (entry) => entry?.language?.name === language && entry.name,
)?.name || '';

const normalizeAttributeName = (attribute) => typeof attribute === 'string'
  ? attribute
  : attribute?.name || '';

export const classifyHeldItem = ({
  name = '',
  categoryName = '',
  attributes = [],
} = {}) => {
  const attributeNames = new Set(attributes.map(normalizeAttributeName).filter(Boolean));
  const isExplicitlyHoldable = attributeNames.has('holdable-active')
    || attributeNames.has('holdable-passive');
  const isCategoryHoldable = SUPPLEMENTAL_HELD_ITEM_CATEGORIES.has(categoryName)
    || (attributeNames.has('holdable') && PASSIVE_HELD_ITEM_CATEGORIES.has(categoryName))
    || (attributeNames.has('holdable') && name.endsWith('-berry'))
    || (attributeNames.has('holdable') && HEALING_HELD_ITEMS.has(name));

  if (
    (!isExplicitlyHoldable && !isCategoryHoldable)
    || !name
    || !categoryName
    || MACHINE_NAME_PATTERN.test(name)
    || EXCLUDED_ITEM_CATEGORIES.has(categoryName)
  ) {
    return null;
  }

  if (name.endsWith('-berry')) return 'berries';
  if (HEALING_HELD_ITEMS.has(name)) return 'healing-items';
  if (categoryName === 'choice') return 'choice-items';
  if (['in-a-pinch', 'picky-healing'].includes(categoryName)) return 'healing-items';
  if (['bad-held-items', 'type-protection'].includes(categoryName)) return 'status-items';
  if (['evolution', 'mega-stones', 'z-crystals', 'dynamax-crystals'].includes(categoryName)) {
    return 'form-items';
  }
  if (categoryName === 'species-specific') return 'species-items';
  if (['type-enhancement', 'plates', 'memories'].includes(categoryName)) return 'type-boosters';
  if ([
    'effort-training',
    'held-items',
    'jewels',
    'scarves',
    'stat-boosts',
    'training',
  ].includes(categoryName)) {
    return 'battle-items';
  }

  return 'other-held-items';
};

export const buildHeldItemCatalog = ({
  attributePayloads = [],
  categoryPayloads = [],
} = {}) => {
  const candidates = new Map();

  for (const attributePayload of attributePayloads) {
    const attributeName = attributePayload?.name || '';
    if (!HELD_ITEM_ATTRIBUTE_NAMES.includes(attributeName)) continue;

    for (const item of attributePayload.items || []) {
      if (!item?.name) continue;
      const current = candidates.get(item.name) || {
        name: item.name,
        url: item.url || '',
        attributes: new Set(),
      };
      current.attributes.add(attributeName);
      if (!current.url && item.url) current.url = item.url;
      candidates.set(item.name, current);
    }
  }

  const itemCategories = new Map();
  for (const category of categoryPayloads) {
    if (!category?.name) continue;
    const categoryMetadata = {
      name: category.name,
      de: getLocalizedApiName(category.names, 'de'),
      en: getLocalizedApiName(category.names, 'en'),
    };
    for (const item of category.items || []) {
      if (item?.name && !itemCategories.has(item.name)) {
        itemCategories.set(item.name, categoryMetadata);
      }
      if (item?.name && SUPPLEMENTAL_HELD_ITEM_CATEGORIES.has(category.name)) {
        const current = candidates.get(item.name) || {
          name: item.name,
          url: item.url || '',
          attributes: new Set(),
        };
        if (!current.url && item.url) current.url = item.url;
        candidates.set(item.name, current);
      }
    }
  }

  return [...candidates.values()]
    .map((candidate) => {
      const apiCategory = itemCategories.get(candidate.name) || {
        name: '',
        de: '',
        en: '',
      };
      const attributes = [...candidate.attributes].sort();
      const category = classifyHeldItem({
        name: candidate.name,
        categoryName: apiCategory.name,
        attributes,
      });

      if (!category) return null;
      return {
        name: candidate.name,
        url: candidate.url,
        id: getResourceId(candidate.url),
        attributes,
        apiCategory,
        category,
      };
    })
    .filter(Boolean)
    .sort((first, second) => {
      const firstOrder = TEAM_ITEM_CATEGORY_ORDER.get(first.category) ?? Number.MAX_SAFE_INTEGER;
      const secondOrder = TEAM_ITEM_CATEGORY_ORDER.get(second.category) ?? Number.MAX_SAFE_INTEGER;
      return firstOrder - secondOrder
        || (first.id ?? Number.MAX_SAFE_INTEGER) - (second.id ?? Number.MAX_SAFE_INTEGER)
        || first.name.localeCompare(second.name);
    });
};

export const normalizePickerSearchText = (value = '') => String(value)
  .toLocaleLowerCase('de-DE')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const filterTeamBuilderOptions = (options = [], {
  query = '',
  categoriesEnabled = false,
  selectedCategory = '',
  filters = [],
  filterValues = {},
} = {}) => {
  const terms = normalizePickerSearchText(query).split(/\s+/).filter(Boolean);

  return options.filter((option) => {
    const matchesCategory = !categoriesEnabled
      || !selectedCategory
      || option.category === selectedCategory
      || option.value === '';
    if (!matchesCategory) return false;

    const matchesFilters = filters.every((filter) => {
      const selectedValue = filterValues[filter.key];
      if (!selectedValue) return true;
      const optionValues = option.filterValues?.[filter.key];
      if (Array.isArray(optionValues)) return optionValues.includes(selectedValue);
      return optionValues === selectedValue;
    });
    if (!matchesFilters) return false;
    if (!terms.length) return true;

    const searchable = normalizePickerSearchText([
      option.label,
      option.value,
      option.number,
      option.description,
      option.categoryLabel,
      ...(option.aliases || []),
      ...(option.chips || []),
    ].filter(Boolean).join(' '));
    return terms.every((term) => searchable.includes(term));
  });
};

export const mapWithConcurrency = async (entries = [], concurrency = 6, worker = async (entry) => entry) => {
  const results = new Array(entries.length);
  const workerCount = Math.max(1, Math.min(Number(concurrency) || 1, entries.length || 1));
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < entries.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(entries[index], index);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
};

const LEARN_METHOD_LABELS = Object.freeze({
  de: {
    'level-up': 'Levelaufstieg',
    egg: 'Zucht',
    tutor: 'Attacken-Lehrer',
    machine: 'TM / VM / TR',
    'stadium-surfing-pikachu': 'Stadium: Surfendes Pikachu',
    'light-ball-egg': 'Zucht mit Kugelblitz',
    'colosseum-purification': 'Reinigung in Pokémon Colosseum',
    'xd-shadow': 'Crypto-Attacke in Pokémon XD',
    'xd-purification': 'Reinigung in Pokémon XD',
    'form-change': 'Formwechsel',
    'zygarde-cube': 'Zygarde-Würfel',
    train: 'Training',
  },
  en: {
    'level-up': 'Level up',
    egg: 'Breeding',
    tutor: 'Move Tutor',
    machine: 'TM / HM / TR',
    'stadium-surfing-pikachu': 'Stadium Surfing Pikachu',
    'light-ball-egg': 'Light Ball breeding',
    'colosseum-purification': 'Pokémon Colosseum purification',
    'xd-shadow': 'Pokémon XD Shadow move',
    'xd-purification': 'Pokémon XD purification',
    'form-change': 'Form change',
    'zygarde-cube': 'Zygarde Cube',
    train: 'Training',
  },
});

const titleCase = (name = '') => name
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

export const getMoveLearnMethodLabel = (method = '', language = 'en') => (
  LEARN_METHOD_LABELS[language]?.[method]
  || LEARN_METHOD_LABELS.en[method]
  || titleCase(method)
);

export const getPokemonMoveAvailability = (moveEntry = {}) => {
  const methods = new Set();
  const versionGroups = new Set();
  const learning = [];

  for (const detail of moveEntry.version_group_details || []) {
    const method = detail?.move_learn_method?.name || '';
    const versionGroup = detail?.version_group?.name || '';
    if (method) methods.add(method);
    if (versionGroup) versionGroups.add(versionGroup);
    learning.push({
      method,
      versionGroup,
      level: Number(detail?.level_learned_at) || 0,
    });
  }

  return {
    methods: [...methods],
    versionGroups: [...versionGroups],
    learning,
  };
};

export const formatShowdownIdentifier = (identifier = '') => identifier
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('-');

const defaultStatAbbreviation = (statName) => ({
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
})[statName] || statName;

export const createTeamExport = (slots = [], {
  mode = 'summary',
  statNames = [],
  labels = {},
  resolvePokemonName = (slot) => titleCase(slot.details?.name || slot.speciesName),
  resolveAbilityName = (_slot, name) => titleCase(name),
  resolveItemName = (name) => titleCase(name),
  resolveMoveName = (_slot, name) => titleCase(name),
  resolveNatureName = (name) => titleCase(name),
  resolveStatName = defaultStatAbbreviation,
} = {}) => slots
  .filter((slot) => slot?.details)
  .map((slot) => {
    const pokemonIdentifier = slot.details?.name || slot.speciesName || '';
    const pokemonName = mode === 'showdown'
      ? formatShowdownIdentifier(pokemonIdentifier)
      : resolvePokemonName(slot);
    const itemName = slot.item
      ? (mode === 'showdown' ? formatShowdownIdentifier(slot.item) : resolveItemName(slot.item))
      : '';
    const lines = [itemName ? `${pokemonName} @ ${itemName}` : pokemonName];

    if (slot.ability) {
      const abilityName = mode === 'showdown'
        ? formatShowdownIdentifier(slot.ability).replaceAll('-', ' ')
        : resolveAbilityName(slot, slot.ability);
      lines.push(`${mode === 'showdown' ? 'Ability' : labels.ability || 'Ability'}: ${abilityName}`);
    }

    lines.push(`${mode === 'showdown' ? 'Level' : labels.level || 'Level'}: ${slot.level}`);
    const natureName = mode === 'showdown'
      ? formatShowdownIdentifier(slot.nature).replaceAll('-', ' ')
      : resolveNatureName(slot.nature);
    lines.push(mode === 'showdown'
      ? `${natureName} Nature`
      : `${labels.nature || 'Nature'}: ${natureName}`);

    const evLine = statNames
      .filter((statName) => Number(slot.evs?.[statName]) > 0)
      .map((statName) => `${slot.evs[statName]} ${mode === 'showdown'
        ? defaultStatAbbreviation(statName)
        : resolveStatName(statName)}`)
      .join(' / ');
    const ivLine = statNames
      .filter((statName) => Number(slot.ivs?.[statName]) < 31)
      .map((statName) => `${slot.ivs[statName]} ${mode === 'showdown'
        ? defaultStatAbbreviation(statName)
        : resolveStatName(statName)}`)
      .join(' / ');
    if (evLine) lines.push(`${mode === 'showdown' ? 'EVs' : labels.evs || 'EVs'}: ${evLine}`);
    if (ivLine) lines.push(`${mode === 'showdown' ? 'IVs' : labels.ivs || 'IVs'}: ${ivLine}`);

    for (const move of slot.moves || []) {
      if (!move) continue;
      const moveName = mode === 'showdown'
        ? formatShowdownIdentifier(move).replaceAll('-', ' ')
        : resolveMoveName(slot, move);
      lines.push(`- ${moveName}`);
    }
    return lines.join('\n');
  })
  .join('\n\n');
