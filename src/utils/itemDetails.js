import {
  formatResourceName,
  getLocalizedName,
  getResourceId,
} from './resource.js';

const ATTRIBUTE_TRANSLATIONS = {
  de: {
    countable: 'Zählbar',
    consumable: 'Verbrauchbar',
    'usable-overworld': 'Außerhalb des Kampfes einsetzbar',
    'usable-in-battle': 'Im Kampf einsetzbar',
    holdable: 'Tragbar',
    'holdable-passive': 'Passiver Trageeffekt',
    'holdable-active': 'Aktiver Trageeffekt',
    underground: 'Im Untergrund',
  },
};

const ROMAN_GENERATIONS = {
  'generation-i': 'I',
  'generation-ii': 'II',
  'generation-iii': 'III',
  'generation-iv': 'IV',
  'generation-v': 'V',
  'generation-vi': 'VI',
  'generation-vii': 'VII',
  'generation-viii': 'VIII',
  'generation-ix': 'IX',
};

const uniqueNamedResources = (resources = []) => {
  const resourcesByName = new Map();

  for (const resource of resources) {
    if (resource?.name && !resourcesByName.has(resource.name)) {
      resourcesByName.set(resource.name, resource);
    }
  }

  return [...resourcesByName.values()];
};

export const getLocalizedItemMetadataName = ({
  details = null,
  fallback = '',
  language = 'en',
  kind = 'category',
} = {}) => {
  const localizedName = getLocalizedName(details?.names, '', language);

  if (localizedName) {
    return localizedName;
  }

  if (kind === 'attribute') {
    const translatedAttribute = ATTRIBUTE_TRANSLATIONS[language]?.[fallback];

    if (translatedAttribute) {
      return translatedAttribute;
    }
  }

  return formatResourceName(fallback);
};

export const getItemVersionGroupResources = (itemDetails = {}) => {
  const flavorTextGroups = (itemDetails.flavor_text_entries || [])
    .map((entry) => entry.version_group);
  const machineGroups = (itemDetails.machines || [])
    .map((entry) => entry.version_group);

  return uniqueNamedResources([...flavorTextGroups, ...machineGroups]);
};

export const getHolderVersionResources = (heldByPokemon = []) => {
  return uniqueNamedResources(
    heldByPokemon.flatMap((holder) => {
      return (holder.version_details || []).map((entry) => entry.version);
    }),
  );
};

export const getVersionResourcesFromGroups = (versionGroups = []) => {
  return uniqueNamedResources(
    versionGroups.flatMap((versionGroup) => versionGroup.versions || []),
  );
};

export const formatGenerationName = (generationName = '', language = 'en') => {
  const romanNumber = ROMAN_GENERATIONS[generationName];

  if (romanNumber) {
    return `${language === 'de' ? 'Generation' : 'Generation'} ${romanNumber}`;
  }

  return formatResourceName(generationName);
};

const getLocalizedVersionName = (versionResource, versionsByName, language) => {
  const versionDetails = versionsByName[versionResource?.name];
  return getLocalizedName(versionDetails?.names, versionResource?.name, language);
};

export const createGameAppearanceRows = ({
  versionGroups = [],
  versionsByName = {},
  language = 'en',
} = {}) => {
  return [...versionGroups]
    .sort((firstGroup, secondGroup) => {
      return (firstGroup.order ?? Number.MAX_SAFE_INTEGER)
        - (secondGroup.order ?? Number.MAX_SAFE_INTEGER);
    })
    .map((versionGroup) => ({
      id: versionGroup.id ?? versionGroup.name,
      groupName: formatResourceName(versionGroup.name),
      generation: formatGenerationName(versionGroup.generation?.name, language),
      games: uniqueNamedResources(versionGroup.versions || []).map((version) => ({
        slug: version.name,
        name: getLocalizedVersionName(version, versionsByName, language),
      })),
    }))
    .filter((row) => row.games.length > 0);
};

export const getPokemonSpriteUrl = (pokemonResource = {}) => {
  const pokemonId = getResourceId(pokemonResource.url);

  if (!pokemonId) {
    return '';
  }

  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
};

export const createHeldPokemonRows = ({
  heldByPokemon = [],
  speciesByName = {},
  versionsByName = {},
  language = 'en',
} = {}) => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';

  return heldByPokemon
    .map((holder) => {
      const pokemonName = holder.pokemon?.name || '';
      const speciesDetails = speciesByName[pokemonName];
      const localizedPokemonName = getLocalizedName(
        speciesDetails?.names,
        pokemonName,
        language,
      );
      const versions = (holder.version_details || [])
        .map((versionDetail) => ({
          slug: versionDetail.version?.name || '',
          name: getLocalizedVersionName(
            versionDetail.version,
            versionsByName,
            language,
          ),
          rarity: versionDetail.rarity ?? 0,
        }))
        .sort((firstVersion, secondVersion) => {
          return firstVersion.name.localeCompare(secondVersion.name, locale);
        });

      return {
        id: getResourceId(holder.pokemon?.url),
        slug: pokemonName,
        name: localizedPokemonName,
        spriteUrl: getPokemonSpriteUrl(holder.pokemon),
        versions,
      };
    })
    .sort((firstHolder, secondHolder) => {
      return firstHolder.name.localeCompare(secondHolder.name, locale);
    });
};
