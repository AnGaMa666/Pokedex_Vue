const RAW_DATA_BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const STORAGE_PREFIX = 'pokedex-vue:de-catalog:v3:';
const GERMAN_LANGUAGE_ID = '6';
const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000;

const catalogPromises = new Map();

const CATALOGS = Object.freeze({
  species: {
    file: 'pokemon_species_names.csv',
    idField: 'pokemon_species_id',
    languageField: 'local_language_id',
    valueFields: ['name'],
  },
  forms: {
    file: 'pokemon_form_names.csv',
    idField: 'pokemon_form_id',
    languageField: 'local_language_id',
    valueFields: ['form_name', 'pokemon_name'],
  },
  pokemonIndex: {
    file: 'pokemon.csv',
    idField: 'id',
    valueFields: ['identifier', 'species_id', 'is_default'],
  },
  pokemonFormsIndex: {
    file: 'pokemon_forms.csv',
    idField: 'id',
    valueFields: [
      'identifier',
      'form_identifier',
      'pokemon_id',
      'introduced_in_version_group_id',
      'is_default',
      'is_battle_only',
      'is_mega',
      'form_order',
      'order',
    ],
  },
  moves: {
    file: 'move_names.csv',
    idField: 'move_id',
    languageField: 'local_language_id',
    valueFields: ['name'],
  },
  abilities: {
    file: 'ability_names.csv',
    idField: 'ability_id',
    languageField: 'local_language_id',
    valueFields: ['name'],
  },
  items: {
    file: 'item_names.csv',
    idField: 'item_id',
    languageField: 'local_language_id',
    valueFields: ['name'],
  },
  itemIndex: {
    file: 'items.csv',
    idField: 'id',
    valueFields: ['identifier', 'category_id', 'cost', 'fling_power', 'fling_effect_id'],
  },
  itemCategories: {
    file: 'item_categories.csv',
    idField: 'id',
    valueFields: ['pocket_id', 'identifier'],
  },
  locations: {
    file: 'location_names.csv',
    idField: 'location_id',
    languageField: 'local_language_id',
    valueFields: ['name', 'subtitle'],
  },
  locationGameIndices: {
    file: 'location_game_indices.csv',
    idField: 'location_id',
    valueFields: ['generation_id', 'game_index'],
    collect: true,
  },
});

const VERSION_NAMES_DE = Object.freeze({
  red: 'Rot', blue: 'Blau', yellow: 'Gelb', gold: 'Gold', silver: 'Silber', crystal: 'Kristall',
  ruby: 'Rubin', sapphire: 'Saphir', emerald: 'Smaragd', firered: 'Feuerrot', leafgreen: 'Blattgrün',
  diamond: 'Diamant', pearl: 'Perl', platinum: 'Platin', heartgold: 'HeartGold', soulsilver: 'SoulSilver',
  black: 'Schwarz', white: 'Weiß', 'black-2': 'Schwarz 2', 'white-2': 'Weiß 2', x: 'X', y: 'Y',
  'omega-ruby': 'Omega Rubin', 'alpha-sapphire': 'Alpha Saphir', sun: 'Sonne', moon: 'Mond',
  'ultra-sun': 'Ultrasonne', 'ultra-moon': 'Ultramond',
  'lets-go-pikachu': 'Pokémon: Let’s Go, Pikachu!', 'lets-go-eevee': 'Pokémon: Let’s Go, Evoli!',
  sword: 'Schwert', shield: 'Schild', 'brilliant-diamond': 'Strahlender Diamant',
  'shining-pearl': 'Leuchtende Perle', 'legends-arceus': 'Pokémon-Legenden: Arceus',
  scarlet: 'Karmesin', violet: 'Purpur', colosseum: 'Pokémon Colosseum', xd: 'Pokémon XD',
});

const ENCOUNTER_METHOD_NAMES_DE = Object.freeze({
  walk: 'Laufen',
  'old-rod': 'Angel',
  'good-rod': 'Profiangel',
  'super-rod': 'Superangel',
  surf: 'Surfen',
  'rock-smash': 'Zertrümmerer',
  headbutt: 'Kopfnuss',
  'dark-grass': 'Dunkles Gras',
  'grass-spots': 'Raschelndes Gras',
  'cave-spots': 'Staubwolke',
  'bridge-spots': 'Brückenschatten',
  'super-rod-spots': 'Angelstelle',
  'surf-spots': 'Wasserstelle',
  'yellow-flowers': 'Gelbe Blumen',
  'purple-flowers': 'Violette Blumen',
  'red-flowers': 'Rote Blumen',
  'rough-terrain': 'Unwegsames Gelände',
  gift: 'Geschenk',
  'gift-egg': 'Geschenk-Ei',
  'only-one': 'Einmalig',
  pokeflute: 'Pokéflöte',
  'headbutt-low': 'Kopfnuss – seltene Bäume',
  'headbutt-normal': 'Kopfnuss – normale Bäume',
  'squirt-bottle': 'Schiggykanne',
  'wailmer-pail': 'Wailmerkanne',
  'devon-scope': 'Devon-Scope',
  'feebas-tile-fishing': 'Barschwa-Feld beim Angeln',
  'island-scan': 'Insel-Scanner',
  'sos-encounter': 'Quereinsteiger-Kampf',
  'bubbling-spots': 'Blubbernde Wasserstelle',
  'roaming-grass': 'Wanderndes Pokémon im Gras',
  'roaming-water': 'Wanderndes Pokémon im Wasser',
});

const FORM_SUFFIXES_DE = Object.freeze({
  alola: 'Alola-Form', galar: 'Galar-Form', hisui: 'Hisui-Form', paldea: 'Paldea-Form',
  mega: 'Mega-Entwicklung', 'mega-x': 'Mega-Entwicklung X', 'mega-y': 'Mega-Entwicklung Y',
  gmax: 'Gigadynamax-Form', female: 'weibliche Form', male: 'männliche Form', origin: 'Urform',
  altered: 'Wandelform', attack: 'Angriffsform', defense: 'Verteidigungsform', speed: 'Initiativeform',
  normal: 'Normalform', therian: 'Tiergeistform', incarnate: 'Inkarnationsform', resolute: 'Resolutform',
  ordinary: 'Standardform', school: 'Schwarmform', solo: 'Einzelform', complete: 'Optimumform',
  '10': '10%-Form', '50': '50%-Form', blade: 'Klingenform', shield: 'Schildform', zen: 'Trance-Modus',
});

const formatFallbackName = (name = '') => name
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const parseCsv = (source) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
};

const readStoredCatalog = (key) => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_CACHE_AGE) {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return null;
    }
    return new Map(parsed.entries || []);
  } catch {
    return null;
  }
};

const storeCatalog = (key, catalog) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify({
      savedAt: Date.now(),
      entries: [...catalog.entries()],
    }));
  } catch {
    // In-memory data remains usable when browser storage is unavailable or full.
  }
};

const loadCatalogInternal = async (kind) => {
  const config = CATALOGS[kind];
  if (!config) throw new Error(`Unknown localization catalog: ${kind}`);
  const stored = readStoredCatalog(kind);
  if (stored) return stored;

  const response = await fetch(`${RAW_DATA_BASE}/${config.file}`, {
    headers: { Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8' },
  });
  if (!response.ok) throw new Error(`Unable to load localization catalog ${kind}: ${response.status}`);

  const rows = parseCsv(await response.text());
  const headers = rows.shift() || [];
  const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
  const catalog = new Map();

  for (const row of rows) {
    if (!row.length) continue;
    if (config.languageField && row[indexes[config.languageField]] !== GERMAN_LANGUAGE_ID) continue;
    const id = Number(row[indexes[config.idField]]);
    if (!Number.isFinite(id)) continue;
    const values = Object.fromEntries(config.valueFields.map((fieldName) => [
      fieldName,
      row[indexes[fieldName]] || '',
    ]));
    const value = config.valueFields.length === 1 ? values[config.valueFields[0]] : values;

    if (config.collect) {
      const existing = catalog.get(id) || [];
      catalog.set(id, [...existing, value]);
    } else {
      catalog.set(id, value);
    }
  }

  storeCatalog(kind, catalog);
  return catalog;
};

export const loadGermanCatalog = (kind) => {
  if (!catalogPromises.has(kind)) {
    catalogPromises.set(kind, loadCatalogInternal(kind).catch((error) => {
      catalogPromises.delete(kind);
      throw error;
    }));
  }
  return catalogPromises.get(kind);
};

const resolveFormLabel = ({ speciesName, formEntry, indexEntry }) => {
  const explicitPokemonName = formEntry?.pokemon_name?.trim();
  const explicitFormName = formEntry?.form_name?.trim();

  if (explicitPokemonName) return explicitPokemonName;
  if (explicitFormName && explicitFormName.toLocaleLowerCase('de-DE') !== speciesName.toLocaleLowerCase('de-DE')) {
    return `${speciesName} – ${explicitFormName}`;
  }

  const identifier = indexEntry.identifier || '';
  const defaultIdentifier = indexEntry.defaultIdentifier || '';
  const suffix = defaultIdentifier && identifier.startsWith(`${defaultIdentifier}-`)
    ? identifier.slice(defaultIdentifier.length + 1)
    : '';
  const localizedSuffix = FORM_SUFFIXES_DE[suffix];
  return localizedSuffix ? `${speciesName} – ${localizedSuffix}` : speciesName;
};

export const loadGermanPokemonCatalog = async () => {
  const cacheKey = 'pokemon-combined';
  const stored = readStoredCatalog(cacheKey);
  if (stored) return stored;
  if (catalogPromises.has(cacheKey)) return catalogPromises.get(cacheKey);

  const request = Promise.all([
    loadGermanCatalog('species'),
    loadGermanCatalog('forms'),
    loadGermanCatalog('pokemonIndex'),
    loadGermanCatalog('pokemonFormsIndex'),
  ]).then(([speciesNames, formNames, pokemonIndex, pokemonFormsIndex]) => {
    const combined = new Map();
    const defaultIdentifiersBySpecies = new Map();
    const formRowsByPokemonId = new Map();

    for (const indexEntry of pokemonIndex.values()) {
      if (String(indexEntry.is_default) === '1') {
        defaultIdentifiersBySpecies.set(Number(indexEntry.species_id), indexEntry.identifier);
      }
    }

    for (const [formId, formIndex] of pokemonFormsIndex.entries()) {
      const pokemonId = Number(formIndex.pokemon_id);
      if (!Number.isFinite(pokemonId)) continue;
      const existing = formRowsByPokemonId.get(pokemonId) || [];
      existing.push({ id: formId, ...formIndex });
      formRowsByPokemonId.set(pokemonId, existing);
    }

    for (const [pokemonId, rawIndexEntry] of pokemonIndex.entries()) {
      const speciesId = Number(rawIndexEntry.species_id) || pokemonId;
      const speciesName = speciesNames.get(speciesId) || formatFallbackName(rawIndexEntry.identifier);
      const defaultIdentifier = defaultIdentifiersBySpecies.get(speciesId) || '';
      const formRows = formRowsByPokemonId.get(Number(pokemonId)) || [];
      const matchingForm = formRows.find((entry) => entry.identifier === rawIndexEntry.identifier)
        || formRows.find((entry) => String(entry.is_default) === '1')
        || formRows[0];
      const formEntry = matchingForm ? formNames.get(Number(matchingForm.id)) : null;
      combined.set(pokemonId, resolveFormLabel({
        speciesName,
        formEntry,
        indexEntry: { ...rawIndexEntry, defaultIdentifier },
      }));
    }

    storeCatalog(cacheKey, combined);
    return combined;
  });

  catalogPromises.set(cacheKey, request);
  return request;
};

const getCatalogTextValue = (value, depth = 0, seen = new Set()) => {
  if (typeof value === 'string') return value.trim();
  if (!value || Array.isArray(value) || typeof value !== 'object' || depth > 3 || seen.has(value)) {
    return '';
  }

  seen.add(value);
  const preferredFields = [
    'name',
    'label',
    'pokemon_name',
    'form_name',
    'title',
    'text',
    'value',
    'de',
    'en',
  ];

  for (const field of preferredFields) {
    const text = getCatalogTextValue(value[field], depth + 1, seen);
    if (text) return text;
  }

  if (typeof value.identifier === 'string' && value.identifier.trim()) {
    return formatFallbackName(value.identifier.trim());
  }

  return '';
};

export const getCatalogLabel = (catalog, id, fallback = '') => {
  const numericId = Number(id);
  const primaryKey = Number.isFinite(numericId) ? numericId : id;
  const value = typeof catalog?.get === 'function'
    ? (catalog.get(primaryKey) ?? catalog.get(String(id)))
    : undefined;
  const catalogText = getCatalogTextValue(value);
  if (catalogText) return catalogText;

  const fallbackText = getCatalogTextValue(fallback)
    || (typeof fallback === 'string' ? fallback.trim() : '');
  return formatFallbackName(fallbackText);
};

export const getLocalizedVersionName = (name = '', language = 'en') => (
  language === 'de' ? VERSION_NAMES_DE[name] || formatFallbackName(name) : formatFallbackName(name)
);

export const getLocalizedEncounterMethodName = (name = '', language = 'en') => (
  language === 'de'
    ? ENCOUNTER_METHOD_NAMES_DE[name] || formatFallbackName(name)
    : formatFallbackName(name)
);

export const getLocalizedFormSuffix = (name = '', language = 'en') => (
  language === 'de' ? FORM_SUFFIXES_DE[name] || formatFallbackName(name) : formatFallbackName(name)
);
