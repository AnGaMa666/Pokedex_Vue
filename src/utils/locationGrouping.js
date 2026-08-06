import { getGenerationLabel } from './versionGroups.js';

export const LOCATION_GENERATIONS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);
export const UNKNOWN_LOCATION_GENERATION = 99;
export const LOCATION_KINDS = Object.freeze([
  'city',
  'route',
  'cave',
  'building',
  'island',
  'forest',
  'mountain',
  'water',
  'other',
]);

const REGION_METADATA = Object.freeze({
  kanto: { order: 1, generation: 1 },
  johto: { order: 2, generation: 2 },
  hoenn: { order: 3, generation: 3 },
  sinnoh: { order: 4, generation: 4 },
  unova: { order: 5, generation: 5 },
  kalos: { order: 6, generation: 6 },
  alola: { order: 7, generation: 7 },
  galar: { order: 8, generation: 8 },
  hisui: { order: 9, generation: 8 },
  paldea: { order: 10, generation: 9 },
});

const LOCATION_KIND_PATTERNS = Object.freeze([
  ['city', /(?:^|-)(?:city|town|village|hamlet|settlement|metropolis|stadt|dorf)(?:-|$)/],
  ['route', /(?:^|-)(?:route|road|path|trail|highway|lane|way|pfad|strasse)(?:-|$)/],
  ['cave', /(?:^|-)(?:cave|cavern|tunnel|grotto|mine|underground|hoehle|hohle|stollen)(?:-|$)/],
  ['building', /(?:^|-)(?:building|house|home|lab|laboratory|tower|museum|center|centre|mart|shop|store|school|academy|mansion|villa|palace|castle|factory|warehouse|gym|league|station|hotel|restaurant|library|lighthouse|temple|shrine|office|headquarters|hq|gate|ship|ferry|airport|arena|stadium|gebaeude|gebaude|haus|turm)(?:-|$)/],
  ['island', /(?:^|-)(?:island|isle|archipelago|atoll|insel)(?:-|$)/],
  ['forest', /(?:^|-)(?:forest|woods|woodland|jungle|grove|thicket|wald|hain)(?:-|$)/],
  ['mountain', /(?:^|-)(?:mountain|mount|mt|peak|hill|cliff|volcano|range|plateau|summit|berg|gipfel)(?:-|$)/],
  ['water', /(?:^|-)(?:sea|ocean|lake|pond|river|bay|beach|coast|shore|reef|spring|falls|waterfall|canal|wetland|marsh|swamp|reservoir|seafloor|underwater|meer|see|fluss|strand|wasser|gewaesser|gewasser)(?:-|$)/],
]);

const GAME_RELEASE_ORDER = Object.freeze([
  ['red', 1], ['blue', 1], ['yellow', 1],
  ['gold', 2], ['silver', 2], ['crystal', 2],
  ['ruby', 3], ['sapphire', 3], ['emerald', 3], ['colosseum', 3], ['xd', 3],
  ['firered', 3], ['leafgreen', 3],
  ['diamond', 4], ['pearl', 4], ['platinum', 4], ['heartgold', 4], ['soulsilver', 4],
  ['black', 5], ['white', 5], ['black-2', 5], ['white-2', 5],
  ['x', 6], ['y', 6], ['omega-ruby', 6], ['alpha-sapphire', 6],
  ['sun', 7], ['moon', 7], ['ultra-sun', 7], ['ultra-moon', 7],
  ['lets-go-pikachu', 7], ['lets-go-eevee', 7],
  ['sword', 8], ['shield', 8], ['brilliant-diamond', 8], ['shining-pearl', 8],
  ['legends-arceus', 8],
  ['scarlet', 9], ['violet', 9],
]);

const GAME_METADATA = new Map(GAME_RELEASE_ORDER.map(([name, generation], index) => [name, {
  generation,
  order: index + 1,
}]));

const normalizeSearchText = (...values) => values
  .filter((value) => typeof value === 'string' || typeof value === 'number')
  .map((value) => String(value))
  .join('-')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const normalizeCollection = (value) => {
  if (value instanceof Set) return [...value];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) return [value];
  return [];
};

const getMapValue = (map, ...keys) => {
  if (!(map instanceof Map)) return undefined;
  for (const key of keys) {
    if (key !== undefined && key !== null && map.has(key)) return map.get(key);
  }
  return undefined;
};

const getNumericId = (location) => {
  const id = Number(location?.id);
  return Number.isFinite(id) ? id : Number.MAX_SAFE_INTEGER;
};

export const getSafeDisplayText = (value, fallback = '') => {
  const seen = new Set();
  const resolve = (candidate, depth = 0) => {
    if (typeof candidate === 'string') return candidate.trim();
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
    if (!candidate || Array.isArray(candidate) || typeof candidate !== 'object'
      || depth > 3 || seen.has(candidate)) return '';
    seen.add(candidate);
    for (const field of [
      'name', 'label', 'pokemon_name', 'form_name', 'identifier', 'title', 'text', 'value', 'de', 'en',
    ]) {
      const resolved = resolve(candidate[field], depth + 1);
      if (resolved) return resolved;
    }
    return '';
  };

  return resolve(value) || resolve(fallback);
};

export const getLocationKind = (identifier = '', localizedLabel = '') => {
  const normalized = normalizeSearchText(identifier, localizedLabel);
  const match = LOCATION_KIND_PATTERNS.find(([, pattern]) => pattern.test(normalized));
  return match?.[0] || 'other';
};

export const getRegionOrder = (regionName = '') => (
  REGION_METADATA[getSafeDisplayText(regionName).toLowerCase()]?.order ?? Number.MAX_SAFE_INTEGER
);

export const getLocationRegions = (locationName = '', locationRegions = new Map()) => {
  const values = normalizeCollection(getMapValue(locationRegions, locationName));
  return [...new Set(values.map((value) => getSafeDisplayText(value)).filter(Boolean))]
    .sort((first, second) => getRegionOrder(first) - getRegionOrder(second)
      || first.localeCompare(second, 'en-US'));
};

export const getLocationGenerations = (entries = [], regionNames = []) => {
  const indexedGenerations = (Array.isArray(entries) ? entries : [])
    .map((entry) => Number(entry?.generation_id))
    .filter((generation) => LOCATION_GENERATIONS.includes(generation));

  if (indexedGenerations.length > 0) {
    return [...new Set(indexedGenerations)].sort((first, second) => first - second);
  }

  const regionalGenerations = normalizeCollection(regionNames)
    .map((regionName) => REGION_METADATA[getSafeDisplayText(regionName).toLowerCase()]?.generation)
    .filter((generation) => LOCATION_GENERATIONS.includes(generation));
  return [...new Set(regionalGenerations)].sort((first, second) => first - second);
};

export const getPrimaryLocationGeneration = (entries = [], regionNames = []) => (
  getLocationGenerations(entries, regionNames)[0] || UNKNOWN_LOCATION_GENERATION
);

export const getAdditionalLocationGenerations = (entries = [], regionNames = []) => (
  getLocationGenerations(entries, regionNames).slice(1)
);

export const getPrimaryLocationGameIndex = (entries = [], regionNames = []) => {
  const primaryGeneration = getPrimaryLocationGeneration(entries, regionNames);
  const gameIndices = (Array.isArray(entries) ? entries : [])
    .filter((entry) => Number(entry?.generation_id) === primaryGeneration)
    .map((entry) => Number(entry?.game_index))
    .filter((gameIndex) => Number.isInteger(gameIndex) && gameIndex >= 0);
  return gameIndices.length > 0 ? Math.min(...gameIndices) : Number.MAX_SAFE_INTEGER;
};

export const buildLocationRegionIndex = (regionDetails = []) => {
  const locationRegionSets = new Map();
  const regionLocations = new Map();

  for (const rawRegion of regionDetails) {
    const region = rawRegion?.data || rawRegion;
    const regionName = getSafeDisplayText(region?.name);
    if (!regionName) continue;

    const locationNames = new Set();
    for (const location of Array.isArray(region?.locations) ? region.locations : []) {
      const locationName = getSafeDisplayText(location?.name);
      if (!locationName) continue;
      locationNames.add(locationName);
      const regionsForLocation = locationRegionSets.get(locationName) || new Set();
      regionsForLocation.add(regionName);
      locationRegionSets.set(locationName, regionsForLocation);
    }
    regionLocations.set(regionName, locationNames);
  }

  const locationRegions = new Map([...locationRegionSets.entries()].map(([locationName, regionNames]) => [
    locationName,
    [...regionNames].sort((first, second) => getRegionOrder(first) - getRegionOrder(second)
      || first.localeCompare(second, 'en-US')),
  ]));

  return { locationRegions, regionLocations };
};

export const sortLocations = ({
  locations = [],
  locationGameIndices = new Map(),
  locationRegions = new Map(),
  getLabel = (location) => location?.name || '',
  language = 'en',
  mode = 'generation-game',
} = {}) => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
  const metadata = new WeakMap();

  const resolveMetadata = (location) => {
    if (location && typeof location === 'object' && metadata.has(location)) return metadata.get(location);
    const id = getNumericId(location);
    const label = getSafeDisplayText(getLabel(location), location?.name || '');
    const regions = getLocationRegions(location?.name, locationRegions);
    const gameIndices = getMapValue(locationGameIndices, id, String(id), location?.name) || [];
    const value = {
      id,
      label,
      kind: getLocationKind(location?.name, label),
      regions,
      region: regions[0] || '',
      generation: getPrimaryLocationGeneration(gameIndices, regions),
      gameIndex: getPrimaryLocationGameIndex(gameIndices, regions),
    };
    if (location && typeof location === 'object') metadata.set(location, value);
    return value;
  };

  const compareGenerationAndGame = (first, second) => first.generation - second.generation
    || first.gameIndex - second.gameIndex
    || getRegionOrder(first.region) - getRegionOrder(second.region)
    || collator.compare(first.region, second.region)
    || collator.compare(first.label, second.label)
    || first.id - second.id;

  return [...locations].sort((firstLocation, secondLocation) => {
    const first = resolveMetadata(firstLocation);
    const second = resolveMetadata(secondLocation);

    if (mode === 'name') return collator.compare(first.label, second.label) || first.id - second.id;
    if (mode === 'number') return first.id - second.id || collator.compare(first.label, second.label);
    if (mode === 'region') {
      return getRegionOrder(first.region) - getRegionOrder(second.region)
        || collator.compare(first.region, second.region)
        || first.generation - second.generation
        || collator.compare(first.label, second.label)
        || first.id - second.id;
    }
    if (mode === 'city-first') {
      return Number(first.kind !== 'city') - Number(second.kind !== 'city')
        || compareGenerationAndGame(first, second);
    }
    if (mode === 'route-first') {
      return Number(first.kind !== 'route') - Number(second.kind !== 'route')
        || compareGenerationAndGame(first, second);
    }
    return compareGenerationAndGame(first, second);
  });
};

export const locationMatchesFilters = ({
  location,
  locationGameIndices = new Map(),
  locationRegions = new Map(),
  generation = '',
  region = '',
  kind = '',
  localizedLabel = '',
} = {}) => {
  const id = getNumericId(location);
  const regions = getLocationRegions(location?.name, locationRegions);
  const entries = getMapValue(locationGameIndices, id, String(id), location?.name) || [];
  const generations = getLocationGenerations(entries, regions);

  return (!generation || generations.includes(Number(generation)))
    && (!region || regions.includes(region))
    && (!kind || getLocationKind(location?.name, localizedLabel) === kind);
};

export const groupLocationsByGeneration = ({
  locations = [],
  locationGameIndices = new Map(),
  locationRegions = new Map(),
  getLabel = (location) => location?.name || '',
  language = 'en',
  sortMode = 'generation-game',
  includeEmptyGenerations = false,
} = {}) => {
  const sections = new Map();

  if (includeEmptyGenerations) {
    for (const generation of LOCATION_GENERATIONS) {
      sections.set(generation, {
        generation,
        label: getGenerationLabel(generation, language),
        locations: [],
      });
    }
  }

  const sortedLocations = sortLocations({
    locations,
    locationGameIndices,
    locationRegions,
    getLabel,
    language,
    mode: sortMode,
  });

  for (const location of sortedLocations) {
    const id = getNumericId(location);
    const regions = getLocationRegions(location?.name, locationRegions);
    const entries = getMapValue(locationGameIndices, id, String(id), location?.name) || [];
    const generation = getPrimaryLocationGeneration(entries, regions);
    if (!sections.has(generation)) {
      sections.set(generation, {
        generation,
        label: generation === UNKNOWN_LOCATION_GENERATION
          ? (language === 'de' ? 'Generation nicht zugeordnet' : 'Generation not assigned')
          : getGenerationLabel(generation, language),
        locations: [],
      });
    }
    sections.get(generation).locations.push(location);
  }

  return [...sections.values()].sort((first, second) => first.generation - second.generation);
};

export const getGameMetadata = (versionName = '') => {
  const name = getSafeDisplayText(versionName);
  return {
    name,
    generation: GAME_METADATA.get(name)?.generation ?? UNKNOWN_LOCATION_GENERATION,
    order: GAME_METADATA.get(name)?.order ?? Number.MAX_SAFE_INTEGER,
  };
};

export const sortGameVersions = (versions = []) => [...new Set(versions
  .map((version) => getSafeDisplayText(version?.name || version))
  .filter(Boolean))]
  .sort((firstName, secondName) => {
    const first = getGameMetadata(firstName);
    const second = getGameMetadata(secondName);
    return first.order - second.order || first.name.localeCompare(second.name, 'en-US');
  });

export const groupGameVersionsByGeneration = (versions = [], language = 'en') => {
  const sections = new Map();
  for (const version of sortGameVersions(versions)) {
    const metadata = getGameMetadata(version);
    if (!sections.has(metadata.generation)) {
      sections.set(metadata.generation, {
        generation: metadata.generation,
        label: metadata.generation === UNKNOWN_LOCATION_GENERATION
          ? (language === 'de' ? 'Weitere Spiele' : 'Other games')
          : getGenerationLabel(metadata.generation, language),
        versions: [],
      });
    }
    sections.get(metadata.generation).versions.push(version);
  }
  return [...sections.values()].sort((first, second) => first.generation - second.generation);
};

export const mapWithConcurrencySettled = async (items = [], concurrency = 1, mapper = (item) => item) => {
  const entries = Array.isArray(items) ? items : [];
  const workerCount = Math.min(entries.length, Math.max(1, Math.floor(Number(concurrency)) || 1));
  const results = new Array(entries.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < entries.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = { status: 'fulfilled', value: await mapper(entries[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  };

  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
};
