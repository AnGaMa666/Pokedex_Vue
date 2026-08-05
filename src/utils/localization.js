const TYPE_LABELS = Object.freeze({
  de: {
    normal: 'Normal',
    fire: 'Feuer',
    water: 'Wasser',
    electric: 'Elektro',
    grass: 'Pflanze',
    ice: 'Eis',
    fighting: 'Kampf',
    poison: 'Gift',
    ground: 'Boden',
    flying: 'Flug',
    psychic: 'Psycho',
    bug: 'Käfer',
    rock: 'Gestein',
    ghost: 'Geist',
    dragon: 'Drache',
    dark: 'Unlicht',
    steel: 'Stahl',
    fairy: 'Fee',
    stellar: 'Stellar',
    unknown: 'Unbekannt',
    shadow: 'Crypto',
  },
  en: {},
});

const DAMAGE_CLASS_LABELS = Object.freeze({
  de: {
    physical: 'Physisch',
    special: 'Spezial',
    status: 'Status',
  },
  en: {},
});

const TARGET_LABELS = Object.freeze({
  de: {
    'specific-move': 'Bestimmte Attacke',
    'selected-pokemon-me-first': 'Ausgewähltes Pokémon',
    'ally': 'Verbündetes Pokémon',
    'users-field': 'Eigenes Feld',
    'user-or-ally': 'Anwender oder Verbündeter',
    'opponents-field': 'Gegnerisches Feld',
    'user': 'Anwender',
    'random-opponent': 'Zufälliger Gegner',
    'all-other-pokemon': 'Alle anderen Pokémon',
    'selected-pokemon': 'Ausgewähltes Pokémon',
    'all-opponents': 'Alle Gegner',
    'entire-field': 'Gesamtes Kampffeld',
    'user-and-allies': 'Anwender und Verbündete',
    'all-pokemon': 'Alle Pokémon',
    'all-allies': 'Alle Verbündeten',
    'fainting-pokemon': 'Besiegtes Pokémon',
  },
  en: {},
});

const GENERATION_ROMAN = Object.freeze({
  'generation-i': 'I',
  'generation-ii': 'II',
  'generation-iii': 'III',
  'generation-iv': 'IV',
  'generation-v': 'V',
  'generation-vi': 'VI',
  'generation-vii': 'VII',
  'generation-viii': 'VIII',
  'generation-ix': 'IX',
  'generation-x': 'X',
});

const DARK_TYPE_NAMES = new Set([
  'dark',
  'dragon',
  'fire',
  'ghost',
  'poison',
  'rock',
  'water',
]);

const titleCase = (name = '') => name
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const getMappedLabel = (map, name, language) => {
  return map[language]?.[name] || titleCase(name);
};

export const getLocalizedTypeName = (name = '', language = 'en') => {
  return getMappedLabel(TYPE_LABELS, name, language);
};

export const getLocalizedDamageClassName = (name = '', language = 'en') => {
  return getMappedLabel(DAMAGE_CLASS_LABELS, name, language);
};

export const getLocalizedMoveTargetName = (name = '', language = 'en') => {
  return getMappedLabel(TARGET_LABELS, name, language);
};

export const getLocalizedGenerationName = (name = '', language = 'en') => {
  const roman = GENERATION_ROMAN[name];

  if (!roman) {
    return titleCase(name);
  }

  return language === 'de' ? `Generation ${roman}` : `Generation ${roman}`;
};

export const getTypeTextColor = (typeName = '') => {
  return DARK_TYPE_NAMES.has(typeName) ? '#ffffff' : '#333333';
};

export const getLocalizedSpecialFormName = ({
  formName = '',
  sourceName = '',
  kind = '',
  language = 'en',
} = {}) => {
  const variantMatch = formName.match(/-mega-([xyz])$/);
  const variant = variantMatch ? ` ${variantMatch[1].toUpperCase()}` : '';

  if (kind === 'mega') {
    return language === 'de'
      ? `Mega-${sourceName}${variant}`
      : `Mega ${sourceName}${variant}`;
  }

  if (kind === 'gmax') {
    return language === 'de'
      ? `Gigadynamax-${sourceName}`
      : `Gigantamax ${sourceName}`;
  }

  return sourceName || titleCase(formName);
};
