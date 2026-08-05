import axios from 'axios';

const POKE_API_ORIGIN = 'https://pokeapi.co';
const POKE_API_PATH_PREFIX = '/api/v2/';
const CACHE_PREFIX = 'pokedex-vue:v3:';
const LIST_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const DETAIL_CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_RESOURCE_LIMIT = 100000;

const memoryCache = new Map();
const pendingRequests = new Map();

const apiClient = axios.create({
  baseURL: `${POKE_API_ORIGIN}${POKE_API_PATH_PREFIX}`,
  timeout: 15000,
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

const getNamedResource = (endpoint, nameOrId) => {
  return cachedGet(`${endpoint}/${encodeURIComponent(nameOrId)}`);
};

export default {
  getPokemons() {
    return getResourceList('pokemon');
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

  getPokemonDetails(nameOrId) {
    return getNamedResource('pokemon', nameOrId);
  },

  getPokemonSpecies(nameOrId) {
    return getNamedResource('pokemon-species', nameOrId);
  },

  getMoveDetails(nameOrId) {
    return getNamedResource('move', nameOrId);
  },

  getItemDetails(nameOrId) {
    return getNamedResource('item', nameOrId);
  },

  getBerryDetails(nameOrId) {
    return getNamedResource('berry', nameOrId);
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
