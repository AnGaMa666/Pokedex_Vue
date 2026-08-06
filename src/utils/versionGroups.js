const VERSION_GROUPS = Object.freeze({
  'red-green-japan': { id: 28, order: 1, generation: 1, de: 'Japanische Rote/Grüne Edition', en: 'Japanese Red / Green' },
  'blue-japan': { id: 29, order: 2, generation: 1, de: 'Japanische Blaue Edition', en: 'Japanese Blue' },
  'red-blue': { id: 1, order: 3, generation: 1, de: 'Rot / Blau', en: 'Red / Blue' },
  yellow: { id: 2, order: 4, generation: 1, de: 'Gelb', en: 'Yellow' },
  'gold-silver': { id: 3, order: 5, generation: 2, de: 'Gold / Silber', en: 'Gold / Silver' },
  crystal: { id: 4, order: 6, generation: 2, de: 'Kristall', en: 'Crystal' },
  'ruby-sapphire': { id: 5, order: 7, generation: 3, de: 'Rubin / Saphir', en: 'Ruby / Sapphire' },
  emerald: { id: 6, order: 8, generation: 3, de: 'Smaragd', en: 'Emerald' },
  colosseum: { id: 12, order: 9, generation: 3, de: 'Pokémon Colosseum', en: 'Pokémon Colosseum' },
  xd: { id: 13, order: 10, generation: 3, de: 'Pokémon XD', en: 'Pokémon XD' },
  'firered-leafgreen': { id: 7, order: 11, generation: 3, de: 'Feuerrot / Blattgrün', en: 'FireRed / LeafGreen' },
  'diamond-pearl': { id: 8, order: 12, generation: 4, de: 'Diamant / Perl', en: 'Diamond / Pearl' },
  platinum: { id: 9, order: 13, generation: 4, de: 'Platin', en: 'Platinum' },
  'heartgold-soulsilver': { id: 10, order: 14, generation: 4, de: 'HeartGold / SoulSilver', en: 'HeartGold / SoulSilver' },
  'black-white': { id: 11, order: 15, generation: 5, de: 'Schwarz / Weiß', en: 'Black / White' },
  'black-2-white-2': { id: 14, order: 16, generation: 5, de: 'Schwarz 2 / Weiß 2', en: 'Black 2 / White 2' },
  'x-y': { id: 15, order: 17, generation: 6, de: 'X / Y', en: 'X / Y' },
  'omega-ruby-alpha-sapphire': { id: 16, order: 18, generation: 6, de: 'Omega Rubin / Alpha Saphir', en: 'Omega Ruby / Alpha Sapphire' },
  'sun-moon': { id: 17, order: 19, generation: 7, de: 'Sonne / Mond', en: 'Sun / Moon' },
  'ultra-sun-ultra-moon': { id: 18, order: 20, generation: 7, de: 'Ultrasonne / Ultramond', en: 'Ultra Sun / Ultra Moon' },
  'lets-go-pikachu-lets-go-eevee': { id: 19, order: 21, generation: 7, de: 'Let’s Go, Pikachu! / Let’s Go, Evoli!', en: 'Let’s Go, Pikachu! / Let’s Go, Eevee!' },
  'sword-shield': { id: 20, order: 22, generation: 8, de: 'Schwert / Schild', en: 'Sword / Shield' },
  'the-isle-of-armor': { id: 21, order: 23, generation: 8, de: 'Die Insel der Rüstung', en: 'The Isle of Armor' },
  'the-crown-tundra': { id: 22, order: 24, generation: 8, de: 'Die Schneelande der Krone', en: 'The Crown Tundra' },
  'brilliant-diamond-shining-pearl': { id: 23, order: 25, generation: 8, de: 'Strahlender Diamant / Leuchtende Perle', en: 'Brilliant Diamond / Shining Pearl' },
  'legends-arceus': { id: 24, order: 26, generation: 8, de: 'Pokémon-Legenden: Arceus', en: 'Pokémon Legends: Arceus' },
  'scarlet-violet': { id: 25, order: 27, generation: 9, de: 'Karmesin / Purpur', en: 'Scarlet / Violet' },
  'the-teal-mask': { id: 26, order: 28, generation: 9, de: 'Die Türkisgrüne Maske', en: 'The Teal Mask' },
  'the-indigo-disk': { id: 27, order: 29, generation: 9, de: 'Die Indigoblaue Scheibe', en: 'The Indigo Disk' },
  'legends-za': { id: 30, order: 30, generation: 9, de: 'Pokémon-Legenden: Z-A', en: 'Pokémon Legends: Z-A' },
  'mega-dimension': { id: 31, order: 31, generation: 9, de: 'Mega-Dimension', en: 'Mega Dimension' },
  champions: { id: 32, order: 32, generation: 9, de: 'Pokémon Champions', en: 'Pokémon Champions' },
});

const ROMAN_GENERATIONS = Object.freeze({
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
});

const GENERATION_NUMBERS = Object.freeze({
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5,
  'generation-vi': 6,
  'generation-vii': 7,
  'generation-viii': 8,
  'generation-ix': 9,
});

const formatFallback = (name = '') => name
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' / ');

const getGenerationNumber = (generation) => {
  const value = generation?.name ?? generation;
  if (Number.isFinite(Number(value)) && Number(value) > 0) return Number(value);
  if (typeof value === 'string' && GENERATION_NUMBERS[value]) return GENERATION_NUMBERS[value];

  const urlMatch = generation?.url?.match?.(/\/generation\/(\d+)\/?(?:\?.*)?$/);
  return urlMatch ? Number(urlMatch[1]) : null;
};

const getApiMetadata = (fallback) => (
  fallback && typeof fallback === 'object'
    ? fallback
    : { id: fallback }
);

export const getVersionGroupMetadata = (name = '', fallback = 0) => {
  const known = VERSION_GROUPS[name];
  const apiMetadata = getApiMetadata(fallback);
  const apiId = Number(apiMetadata.id);
  const apiOrder = Number(apiMetadata.order);
  const apiGeneration = getGenerationNumber(apiMetadata.generation);
  const id = Number.isFinite(apiId) && apiId > 0
    ? apiId
    : known?.id || Number.MAX_SAFE_INTEGER;
  const order = Number.isFinite(apiOrder) && apiOrder >= 0
    ? apiOrder
    : known?.order ?? id;
  const generation = apiGeneration || known?.generation || 99;

  return {
    name,
    id,
    order,
    generation,
    de: known?.de || formatFallback(name),
    en: known?.en || formatFallback(name),
  };
};

export const getVersionGroupLabel = (name = '', language = 'en') => {
  const metadata = getVersionGroupMetadata(name);
  return language === 'de' ? metadata.de : metadata.en;
};

export const getGenerationLabel = (generation, language = 'en') => {
  const numericGeneration = Number(generation);
  const roman = ROMAN_GENERATIONS[numericGeneration] || String(numericGeneration || '?');
  return language === 'de' ? `Generation ${roman}` : `Generation ${roman}`;
};

export const sortVersionGroups = (groups = []) => [...groups].sort((first, second) => {
  const firstMetadata = getVersionGroupMetadata(first.name, first);
  const secondMetadata = getVersionGroupMetadata(second.name, second);
  return firstMetadata.generation - secondMetadata.generation
    || firstMetadata.order - secondMetadata.order
    || firstMetadata.id - secondMetadata.id
    || first.name.localeCompare(second.name);
});

export const groupVersionGroupsByGeneration = (groups = [], language = 'en') => {
  const sections = new Map();

  for (const group of sortVersionGroups(groups)) {
    const metadata = getVersionGroupMetadata(group.name, group);
    if (!sections.has(metadata.generation)) {
      sections.set(metadata.generation, {
        generation: metadata.generation,
        label: getGenerationLabel(metadata.generation, language),
        groups: [],
      });
    }

    sections.get(metadata.generation).groups.push({
      ...group,
      ...metadata,
      label: getVersionGroupLabel(group.name, language),
    });
  }

  return [...sections.values()].sort((first, second) => first.generation - second.generation);
};

export const getLatestVersionGroupName = (groups = []) => {
  const sorted = sortVersionGroups(groups);
  return sorted.at(-1)?.name || '';
};
