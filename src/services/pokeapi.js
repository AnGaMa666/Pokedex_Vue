import axios from 'axios';

const POKE_API_ORIGIN = 'https://pokeapi.co';
const POKE_API_PATH_PREFIX = '/api/v2/';

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

export default {
  async getPokemons() {
    const countResponse = await apiClient.get('pokemon', {
      params: {
        limit: 1,
        offset: 0,
      },
    });

    return apiClient.get('pokemon', {
      params: {
        limit: countResponse.data.count,
        offset: 0,
      },
    });
  },

  getPokemonDetails(nameOrId) {
    return apiClient.get(`pokemon/${encodeURIComponent(nameOrId)}`);
  },

  getPokemonSpecies(nameOrId) {
    return apiClient.get(`pokemon-species/${encodeURIComponent(nameOrId)}`);
  },

  getEvolutionChain(url) {
    return apiClient.get(getValidatedApiPath(url));
  },

  async getPokemonDamageRelations(types) {
    const typeResponses = await Promise.all(
      types.map((typeEntry) => {
        return apiClient.get(`type/${encodeURIComponent(typeEntry.type.name)}`);
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
