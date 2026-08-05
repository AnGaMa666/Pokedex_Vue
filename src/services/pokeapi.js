import axios from 'axios';

const POKE_API_ORIGIN = 'https://pokeapi.co';
const POKE_API_PATH_PREFIX = '/api/v2/';
const CACHE_PREFIX = 'pokedex-vue:v4:';
const LIST_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const DETAIL_CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_RESOURCE_LIMIT = 100000;

const memoryCache = new Map();
const pendingRequests = new Map();

const apiClient = axios.create({
  baseURL: `${POKE_API_ORIGIN}${POKE_API_PATH_PREFIX}`,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
});

const sortNames = (names) => [...names].sort((firstName, secondName) => {
  return firstName.localeCompare(secondName);
});

const normalizePath = (path) => path.replace(/^\/+/, '');

const createCacheKey = (path, params = {}) => {
  const sortedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey));
  const query = new URLSearchParams(sortedParams.map(([key, value]) => [key, String(value)]));
  return `${normalizePath(path)}${query.size ? `?${query.toString()}` : ''}`;
};

const readSessionCache = (cacheKey) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  try {
    const storedValue = window.sessionStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);

    if (!parsedValue.expiresAt || parsedValue.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
      return null;
    }

    return parsedValue.data;
  } catch {
    return null;
  }
};

const writeSessionCache = (cacheKey, data, ttl) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      `${CACHE_PREFIX}${cacheKey}`,
      JSON.stringify({
        data,
        expiresAt: Date.now() + ttl,
      }),
    );
  } catch {
    // The in-memory cache remains active when browser storage is full or unavailable.
  }
};

const cachedGet = async (path, { params = {}, ttl = DETAIL_CACHE_TTL } = {}) => {
  const normalizedPath = normalizePath(path);
  const cacheKey = createCacheKey(normalizedPath, params);

  if (memoryCache.has(cacheKey)) {
    return { data: memoryCache.get(cacheKey) };
  }

  const sessionData = readSessionCache(cacheKey);

  if (sessionData !== null) {
    memoryCache.set(cacheKey, sessionData);
    return { data: sessionData };
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const request = apiClient
    .get(normalizedPath, { params })
    .then((response) => {
      memoryCache.set(cacheKey, response.data);
      writeSessionCache(cacheKey, response.data, ttl);
      return response;
    })
    .finally(() => {
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);
  return request;
};

const getValidatedApiPath = (url) => {
  const parsedUrl = new URL(url);

  if (
    parsedUrl.protocol !== 'https:'
    || parsedUrl.origin !== POKE_API_ORIGIN
    || !parsedUrl.pathname.startsWith(POKE_API_PATH_PREFIX)
  ) {
    throw new Error('Rejected an unexpected PokéAPI URL.');
  }

  return `${parsedUrl.pathname.slice(POKE_API_PATH_PREFIX.length)}${parsedUrl.search}`;
};

const getResourceList = (endpoint) => {
  return cachedGet(endpoint, {
    params: {
      limit: MAX_RESOURCE_LIMIT,
      offset: 0,
    },
    ttl: LIST_CACHE_TTL,
  });
};

const getResourceCount = (endpoint) => {
  return cachedGet(endpoint, {
    params: {
      limit: 1,
      offset: 0,
    },
    ttl: LIST_CACHE_TTL,
  });
};

const getNamedResource = (endpoint, nameOrId) => {
  return cachedGet(`${endpoint}/${encodeURIComponent(nameOrId)}`);
};

const deduplicateNamedResources = (resources = []) => {
  const entriesByName = new Map();

  for (const resource of resources) {
    if (resource?.name && !entriesByName.has(resource.name)) {
      entriesByName.set(resource.name, resource);
    }
  }

  return [...entriesByName.values()];
};

const loadItemCategories = async (categoryMatcher) => {
  const categoryListResponse = await getResourceList('item-category');
  const matchingCategories = categoryListResponse.data.results.filter((category) => {
    return categoryMatcher(category.name);
  });
  const categoryResponses = await Promise.all(
    matchingCategories.map((category) => getNamedResource('item-category', category.name)),
  );

  return {
    categories: categoryResponses.map((response) => response.data),
    items: deduplicateNamedResources(
      categoryResponses.flatMap((response) => response.data.items || []),
    ),
  };
};

const getBallCollection = () => {
  return loadItemCategories((name) => /(?:^|-)balls$/.test(name));
};

const getSpecialItemCollection = () => {
  const specialCategoryPattern = /(?:mega-stones|z-crystals|species-specific|plates|memories|drives|orbs|key-items|event-items|plot-advancement)/;
  return loadItemCategories((name) => specialCategoryPattern.test(name));
};

export default {
  getPokemons() {
    return getResourceList('pokemon');
  },

  getPokemonEntryCount() {
    return getResourceCount('pokemon');
  },

  getPokemonSpeciesList() {
    return getResourceList('pokemon-species');
  },

  getMoves() {
    return getResourceList('move');
  },

  getItems() {
    return getResourceList('item');
  },

  getBerries() {
    return getResourceList('berry');
  },

  async getBallItems() {
    const collection = await getBallCollection();
    return {
      data: {
        count: collection.items.length,
        results: collection.items,
        categories: collection.categories,
      },
    };
  },

  async getSpecialItems() {
    const collection = await getSpecialItemCollection();
    return {
      data: {
        count: collection.items.length,
        results: collection.items,
        categories: collection.categories,
      },
    };
  },

  async getStandardItems() {
    const [itemsResponse, balls, specialItems] = await Promise.all([
      getResourceList('item'),
      getBallCollection(),
      getSpecialItemCollection(),
    ]);
    const excludedNames = new Set([
      ...balls.items.map((item) => item.name),
      ...specialItems.items.map((item) => item.name),
    ]);
    const machinePattern = /^(?:tm|hm|tr)\d+$/;
    const results = itemsResponse.data.results.filter((item) => {
      return !excludedNames.has(item.name)
        && !item.name.endsWith('-berry')
        && !machinePattern.test(item.name);
    });

    return {
      data: {
        count: results.length,
        results,
      },
    };
  },

  getPokemonDetails(nameOrId) {
    return getNamedResource('pokemon', nameOrId);
  },

  getPokemonSpecies(nameOrId) {
    return getNamedResource('pokemon-species', nameOrId);
  },

  getPokemonEncounters(nameOrId) {
    return cachedGet(`pokemon/${encodeURIComponent(nameOrId)}/encounters`);
  },

  getMoveDetails(nameOrId) {
    return getNamedResource('move', nameOrId);
  },

  getMoveDamageClass(nameOrId) {
    return getNamedResource('move-damage-class', nameOrId);
  },

  getMoveLearnMethod(nameOrId) {
    return getNamedResource('move-learn-method', nameOrId);
  },

  getItemDetails(nameOrId) {
    return getNamedResource('item', nameOrId);
  },

  getItemCategory(nameOrId) {
    return getNamedResource('item-category', nameOrId);
  },

  getItemAttribute(nameOrId) {
    return getNamedResource('item-attribute', nameOrId);
  },

  getBerryDetails(nameOrId) {
    return getNamedResource('berry', nameOrId);
  },

  getTypeDetails(nameOrId) {
    return getNamedResource('type', nameOrId);
  },

  getTypes() {
    return getResourceList('type');
  },

  getRegions() {
    return getResourceList('region');
  },

  getRegionDetails(nameOrId) {
    return getNamedResource('region', nameOrId);
  },

  getPokedexDetails(nameOrId) {
    return getNamedResource('pokedex', nameOrId);
  },

  getVersionDetails(nameOrId) {
    return getNamedResource('version', nameOrId);
  },

  getVersionGroupDetails(nameOrId) {
    return getNamedResource('version-group', nameOrId);
  },

  getVersionGroup(nameOrId) {
    return getNamedResource('version-group', nameOrId);
  },

  getVersion(nameOrId) {
    return getNamedResource('version', nameOrId);
  },

  getVersions() {
    return getResourceList('version');
  },

  getVersionGroups() {
    return getResourceList('version-group');
  },

  getNatures() {
    return getResourceList('nature');
  },

  getNatureDetails(nameOrId) {
    return getNamedResource('nature', nameOrId);
  },

  getLocations() {
    return getResourceList('location');
  },

  getLocationDetails(nameOrId) {
    return getNamedResource('location', nameOrId);
  },

  getLocationAreaDetails(nameOrId) {
    return getNamedResource('location-area', nameOrId);
  },

  getEvolutionChain(url) {
    return cachedGet(getValidatedApiPath(url));
  },

  async getPokemonDamageRelations(types) {
    const typeResponses = await Promise.all(
      types.map((typeEntry) => {
        return getNamedResource('type', typeEntry.type.name);
      }),
    );

    const defensiveMultipliers = new Map();
    const effectiveAgainst = new Set();

    const multiplyDefensiveValue = (typeName, factor) => {
      const currentValue = defensiveMultipliers.get(typeName) ?? 1;
      defensiveMultipliers.set(typeName, currentValue * factor);
    };

    for (const response of typeResponses) {
      const relations = response.data.damage_relations;

      for (const type of relations.double_damage_from) {
        multiplyDefensiveValue(type.name, 2);
      }

      for (const type of relations.half_damage_from) {
        multiplyDefensiveValue(type.name, 0.5);
      }

      for (const type of relations.no_damage_from) {
        defensiveMultipliers.set(type.name, 0);
      }

      for (const type of relations.double_damage_to) {
        effectiveAgainst.add(type.name);
      }
    }

    const defensiveEntries = [...defensiveMultipliers.entries()];

    return {
      immunities: sortNames(
        defensiveEntries
          .filter(([, multiplier]) => multiplier === 0)
          .map(([typeName]) => typeName),
      ),
      weaknesses: sortNames(
        defensiveEntries
          .filter(([, multiplier]) => multiplier > 1)
          .map(([typeName]) => typeName),
      ),
      resistances: sortNames(
        defensiveEntries
          .filter(([, multiplier]) => multiplier > 0 && multiplier < 1)
          .map(([typeName]) => typeName),
      ),
      effectiveAgainst: sortNames(effectiveAgainst),
    };
  },
};
