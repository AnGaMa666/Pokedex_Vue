import {
  formatResourceName,
  getLocalizedName,
  getResourceId,
} from './resource.js';
import {
  getCatalogLabel,
  getLocalizedVersionName as getCatalogVersionLabel,
} from '../services/localizationCatalog.js';

const ATTRIBUTE_TRANSLATIONS = {
  de: {
    countable: 'Zählbar',
    consumable: 'Verbrauchbar',
    'usable-overworld': 'Außerhalb des Kampfes einsetzbar',
    'usable-in-battle': 'Im Kampf einsetzbar',
    holdable: 'Tragbar',
    'holdable-passive': 'Passiver Trageeffekt',
    'holdable-active': 'Aktiver Trageeffekt',
    underground: 'Im Untergrund einsetzbar',
  },
};

const CATEGORY_TRANSLATIONS = {
  de: {
    'stat-boosts': 'Statuswertverstärker',
    'effort-drop': 'Fleißwertsenker',
    medicine: 'Medizin',
    other: 'Sonstige Items',
    'in-a-pinch': 'Notfallbeeren',
    'picky-healing': 'Selektive Heilung',
    'type-protection': 'Typschutz',
    'baking-only': 'Backzutaten',
    collectibles: 'Sammelgegenstände',
    evolution: 'Entwicklungsitems',
    spelunking: 'Höhlenerkundung',
    'held-items': 'Trageitems',
    choice: 'Wahlitems',
    'effort-training': 'Fleißtraining',
    'bad-held-items': 'Nachteilig wirkende Trageitems',
    training: 'Trainingsitems',
    plates: 'Tafeln',
    'species-specific': 'Pokémon-spezifische Items',
    'type-enhancement': 'Typverstärker',
    'event-items': 'Event-Items',
    gameplay: 'Spielmechanik-Items',
    'plot-advancement': 'Storyitems',
    unused: 'Nicht verwendete Items',
    loot: 'Verkaufsgegenstände',
    'all-mail': 'Briefpapier',
    vitamins: 'Vitamine',
    healing: 'Heilitems',
    'pp-recovery': 'AP-Heilung',
    revival: 'Belebungsitems',
    'status-cures': 'Statusheilung',
    mulch: 'Mulch',
    'special-balls': 'Spezialbälle',
    'standard-balls': 'Standardbälle',
    'dex-completion': 'Pokédex-Vervollständigung',
    scarves: 'Schals',
    'all-machines': 'Technische Maschinen',
    flutes: 'Flöten',
    'apricorn-balls': 'Aprikokobälle',
    'apricorn-box': 'Aprikokobox',
    'data-cards': 'Datenkarten',
    jewels: 'Juwelen',
    'miracle-shooter': 'Wunderwerfer-Items',
    'mega-stones': 'Mega-Steine',
    memories: 'Discs',
    'z-crystals': 'Z-Kristalle',
    'species-candies': 'Pokémon-Bonbons',
    'catching-bonus': 'Fangbonus-Items',
    'dynamax-crystals': 'Dynamax-Kristalle',
    'nature-mints': 'Wesen-Minzen',
    'curry-ingredients': 'Curry-Zutaten',
    'tera-shard': 'Tera-Stücke',
    'sandwich-ingredients': 'Sandwich-Zutaten',
    'tm-materials': 'TM-Materialien',
    'picnic': 'Picknick-Items',
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

  for (const rawResource of resources) {
    const resource = typeof rawResource === 'string'
      ? { name: rawResource }
      : rawResource;
    if (resource?.name && !resourcesByName.has(resource.name)) {
      resourcesByName.set(resource.name, resource);
    }
  }

  return [...resourcesByName.values()];
};

const getExactLocalizedName = (names = [], language = 'en') => {
  if (!Array.isArray(names)) return '';

  const value = names.find((entry) => entry?.language?.name === language)?.name;
  return typeof value === 'string' ? value.trim() : '';
};

const getMetadataFallbackName = (fallback) => {
  if (typeof fallback === 'string') return fallback.trim();
  if (!fallback || Array.isArray(fallback) || typeof fallback !== 'object') return '';

  for (const field of ['name', 'label', 'identifier']) {
    if (typeof fallback[field] === 'string' && fallback[field].trim()) {
      return fallback[field].trim();
    }
  }

  return '';
};

export const getLocalizedItemMetadataName = ({
  details = null,
  fallback = '',
  language = 'en',
  kind = 'category',
} = {}) => {
  const exactLocalizedName = getExactLocalizedName(details?.names, language);

  if (exactLocalizedName) {
    return exactLocalizedName;
  }

  const translationDictionary = kind === 'attribute'
    ? ATTRIBUTE_TRANSLATIONS[language]
    : CATEGORY_TRANSLATIONS[language];
  const safeFallback = getMetadataFallbackName(fallback);
  const translatedFallback = translationDictionary?.[safeFallback];

  if (translatedFallback) {
    return translatedFallback;
  }

  if (language === 'en') {
    return getLocalizedName(details?.names, safeFallback, language);
  }

  return kind === 'attribute' ? 'Weitere Eigenschaft' : 'Sonstige Items';
};

export const getItemVersionGroupResources = (itemDetails = {}) => {
  const flavorTextGroups = (itemDetails.flavor_text_entries || [])
    .map((entry) => entry.version_group);
  const machineGroups = (itemDetails.machines || [])
    .map((entry) => entry.version_group);
  const priceGroups = (itemDetails.prices || [])
    .map((entry) => entry.version_group);

  return uniqueNamedResources([...flavorTextGroups, ...machineGroups, ...priceGroups]);
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

export const formatGenerationName = (generationName = '') => {
  const romanNumber = ROMAN_GENERATIONS[generationName];

  if (romanNumber) {
    return `Generation ${romanNumber}`;
  }

  return formatResourceName(generationName);
};

const resolveLocalizedVersionName = (versionResource, versionsByName, language) => {
  const versionDetails = versionsByName[versionResource?.name];
  if (language === 'de') {
    const exactName = getExactLocalizedName(versionDetails?.names, 'de');
    return exactName || getCatalogVersionLabel(versionResource?.name, 'de');
  }
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
    .map((versionGroup) => {
      const games = uniqueNamedResources(versionGroup.versions || []).map((version) => ({
        slug: version.name,
        name: resolveLocalizedVersionName(version, versionsByName, language),
      }));

      return {
        id: versionGroup.id ?? versionGroup.name,
        groupName: games.map((game) => game.name).join(' / '),
        generation: formatGenerationName(versionGroup.generation?.name),
        games,
      };
    })
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
  localizedNamesById = null,
  speciesByName = {},
  versionsByName = {},
  language = 'en',
} = {}) => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';

  return heldByPokemon
    .map((holder) => {
      const pokemonName = holder.pokemon?.name || '';
      const pokemonId = getResourceId(holder.pokemon?.url);
      const speciesDetails = speciesByName[pokemonName];
      const localizedPokemonName = language === 'de' && localizedNamesById
        ? getCatalogLabel(localizedNamesById, pokemonId, pokemonName)
        : getLocalizedName(speciesDetails?.names, pokemonName, language);
      const versions = (holder.version_details || [])
        .map((versionDetail) => ({
          slug: versionDetail.version?.name || '',
          name: resolveLocalizedVersionName(
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
        id: pokemonId,
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
