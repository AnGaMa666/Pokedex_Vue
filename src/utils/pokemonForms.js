import { getMegaStone } from './megaStones.js';
import { formatResourceName, getLocalizedName, getResourceId } from './resource.js';

const MEGA_FORM_PATTERN = /-mega(?:-[a-z0-9]+)*$/;
const GIGANTAMAX_FORM_PATTERN = /-gmax$/;

const FORM_SUFFIXES_DE = Object.freeze({
  alola: 'Alola-Form',
  galar: 'Galar-Form',
  hisui: 'Hisui-Form',
  paldea: 'Paldea-Form',
  mega: 'Mega-Entwicklung',
  'mega-x': 'Mega-Entwicklung X',
  'mega-y': 'Mega-Entwicklung Y',
  'mega-z': 'Mega-Entwicklung Z',
  gmax: 'Gigadynamax-Form',
  attack: 'Angriffsform',
  defense: 'Verteidigungsform',
  speed: 'Initiativeform',
  origin: 'Urform',
  altered: 'Wandelform',
  therian: 'Tiergeistform',
  incarnate: 'Inkarnationsform',
  resolute: 'Resolutform',
  school: 'Schwarmform',
  solo: 'Einzelform',
  complete: 'Optimumform',
  blade: 'Klingenform',
  shield: 'Schildform',
  zen: 'Trance-Modus',
  female: 'weibliche Form',
  male: 'männliche Form',
  totem: 'Herrscherform',
  'alola-totem': 'Alola-Herrscherform',
  '10': '10%-Form',
  '50': '50%-Form',
});

const getPokemonIdFromUrl = (url = '') => {
  const match = url.match(/\/pokemon\/(\d+)\/?(?:\?.*)?$/);
  return match ? Number(match[1]) : null;
};

const getLocalizedCatalogValue = (catalog, id) => {
  const value = catalog?.get?.(Number(id));
  if (typeof value === 'string') return value.trim();
  if (!value || Array.isArray(value) || typeof value !== 'object') return '';
  return value.pokemon_name?.trim()
    || value.form_name?.trim()
    || value.name?.trim()
    || '';
};

const getDefaultVarietyName = (species = {}) => (
  species.varieties?.find((variety) => variety.is_default)?.pokemon?.name
  || species.name
  || ''
);

const getFormSuffix = (pokemonName = '', defaultName = '') => {
  if (defaultName && pokemonName.startsWith(`${defaultName}-`)) {
    return pokemonName.slice(defaultName.length + 1);
  }

  return '';
};

const getLocalizedEntryName = (entries = [], language = 'en') => (
  entries.find((entry) => entry.language?.name === language)?.name?.trim()
  || entries.find((entry) => entry.language?.name === 'en')?.name?.trim()
  || ''
);

const getLocalizedEmbeddedFormNames = (details = {}, language = 'en') => {
  const formDetails = details.form_details || details.formDetails || {};
  const fullNames = formDetails.names || details.names || [];
  const formNames = formDetails.form_names || details.form_names || [];
  return {
    fullName: getLocalizedEntryName(fullNames, language),
    formName: getLocalizedEntryName(formNames, language),
  };
};

export const getPokemonSpeciesIdentity = (speciesOrPokemon = {}) => {
  const nestedSpecies = speciesOrPokemon.species;
  const id = getResourceId(nestedSpecies?.url)
    || (!nestedSpecies && Number(speciesOrPokemon.id))
    || getResourceId(speciesOrPokemon.url)
    || null;
  const name = nestedSpecies?.name || speciesOrPokemon.name || '';
  return { id, name };
};

export const isPokemonForSpecies = (pokemon = {}, species = {}) => {
  if (!pokemon?.name || !pokemon.species) return false;

  const pokemonSpeciesId = getResourceId(pokemon.species.url);
  const speciesId = Number(species.id) || getResourceId(species.url);
  if (pokemonSpeciesId && speciesId) return pokemonSpeciesId === speciesId;

  return Boolean(pokemon.species.name && species.name)
    && pokemon.species.name === species.name;
};

export const matchesPokemonReference = (pokemon = {}, reference = {}) => {
  if (!pokemon?.name || !reference) return false;

  const referenceId = Number(reference.id) || getPokemonIdFromUrl(reference.url);
  if (referenceId && Number(pokemon.id) !== referenceId) return false;
  if (reference.name && pokemon.name !== reference.name) return false;
  return Boolean(referenceId || reference.name);
};

export const getPokemonFormLabel = ({
  details = {},
  species = {},
  catalog = null,
  language = 'en',
} = {}) => {
  const catalogLabel = language === 'de'
    ? getLocalizedCatalogValue(catalog, details.id)
    : '';
  if (catalogLabel) return catalogLabel;

  const defaultName = getDefaultVarietyName(species);
  const speciesLabel = getLocalizedName(species.names, species.name || defaultName, language);
  if (details.name === defaultName || details.name === species.name) return speciesLabel;

  const embeddedNames = getLocalizedEmbeddedFormNames(details, language);
  if (embeddedNames.fullName) return embeddedNames.fullName;
  if (embeddedNames.formName) {
    if (embeddedNames.formName.toLocaleLowerCase(language).includes(
      speciesLabel.toLocaleLowerCase(language),
    )) {
      return embeddedNames.formName;
    }
    return `${speciesLabel} – ${embeddedNames.formName}`;
  }

  const suffix = getFormSuffix(details.name, defaultName)
    || getFormSuffix(details.name, species.name);
  if (language === 'de' && suffix && FORM_SUFFIXES_DE[suffix]) {
    if (suffix.startsWith('mega')) {
      const variant = suffix === 'mega' ? '' : ` ${suffix.slice(5).toUpperCase()}`;
      return `Mega-${speciesLabel}${variant}`;
    }
    if (suffix === 'gmax') return `Gigadynamax-${speciesLabel}`;
    return `${speciesLabel} – ${FORM_SUFFIXES_DE[suffix]}`;
  }

  return formatResourceName(details.name || species.name);
};

export const createPokemonVarietyOptions = ({
  species = {},
  detailsByName = new Map(),
  catalog = null,
  language = 'en',
} = {}) => {
  const detailMap = detailsByName instanceof Map
    ? detailsByName
    : new Map(Object.entries(detailsByName || {}));
  const options = [];

  for (const [index, variety] of (species.varieties || []).entries()) {
    const reference = variety.pokemon;
    const details = detailMap.get(reference?.name);
    if (
      !details
      || !matchesPokemonReference(details, reference)
      || !isPokemonForSpecies(details, species)
    ) {
      continue;
    }

    options.push({
      id: Number(details.id),
      name: details.name,
      details,
      isDefault: Boolean(variety.is_default),
      isForm: !variety.is_default,
      order: index,
      label: getPokemonFormLabel({ details, species, catalog, language }),
    });
  }

  return options.sort((first, second) => (
    Number(second.isDefault) - Number(first.isDefault)
    || first.order - second.order
    || first.id - second.id
  ));
};

export const getDefaultPokemonVariety = (options = []) => (
  options.find((option) => option.isDefault) || null
);

export const buildMoveLearnerRows = ({
  learnedByPokemon = [],
  pokemonIndex = new Map(),
  pokemonCatalog = new Map(),
  language = 'en',
} = {}) => {
  const rowsById = new Map();

  for (const pokemon of learnedByPokemon) {
    const id = getPokemonIdFromUrl(pokemon?.url);
    if (!id || !pokemon?.name || rowsById.has(id)) continue;

    const indexEntry = pokemonIndex?.get?.(id);
    const hasMatchingIndex = indexEntry?.identifier === pokemon.name;
    const speciesId = hasMatchingIndex ? Number(indexEntry.species_id) : null;
    const isDefault = hasMatchingIndex
      ? String(indexEntry.is_default) === '1'
      : id < 10000;
    const catalogLabel = language === 'de' && (hasMatchingIndex || !indexEntry)
      ? getLocalizedCatalogValue(pokemonCatalog, id)
      : '';

    rowsById.set(id, {
      id,
      pokemonId: id,
      number: speciesId || id,
      name: pokemon.name,
      label: catalogLabel || formatResourceName(pokemon.name),
      isDefault,
      isForm: !isDefault,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    });
  }

  return [...rowsById.values()].sort((first, second) => (
    first.number - second.number
    || Number(first.isForm) - Number(second.isForm)
    || first.label.localeCompare(second.label, language === 'de' ? 'de-DE' : 'en-US')
  ));
};

export const mapWithConcurrency = async (items = [], mapper, limit = 6) => {
  if (typeof mapper !== 'function') throw new TypeError('mapper must be a function');
  const values = [...items];
  if (!values.length) return [];

  const results = new Array(values.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  };

  const workerCount = Math.min(
    values.length,
    Math.max(1, Math.trunc(Number(limit)) || 1),
  );
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
};

export const getSpecialFormKind = (name = '') => {
  if (MEGA_FORM_PATTERN.test(name)) {
    return 'mega';
  }

  if (GIGANTAMAX_FORM_PATTERN.test(name)) {
    return 'gmax';
  }

  return null;
};

export const isSpecialBattleForm = (name = '') => getSpecialFormKind(name) !== null;

export const isNumberedPokedexPokemon = (pokemon = {}) => {
  return Boolean(pokemon.id) && !isSpecialBattleForm(pokemon.name);
};

export const getSpecialBattleForms = (varieties = []) => {
  return varieties
    .filter((variety) => !variety.is_default && isSpecialBattleForm(variety.pokemon?.name))
    .map((variety) => {
      const id = getPokemonIdFromUrl(variety.pokemon?.url);
      const name = variety.pokemon?.name || '';
      const kind = getSpecialFormKind(name);

      if (!id || !kind) {
        return null;
      }

      return {
        id,
        name,
        kind,
        megaStone: kind === 'mega' ? getMegaStone(name) : null,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        shinySprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
      };
    })
    .filter(Boolean)
    .sort((firstForm, secondForm) => {
      if (firstForm.kind !== secondForm.kind) {
        return firstForm.kind === 'mega' ? -1 : 1;
      }

      return firstForm.name.localeCompare(secondForm.name);
    });
};
