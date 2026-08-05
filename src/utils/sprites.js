const SPRITE_ROOT = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export const SPRITE_MODES = [
  {
    id: 'pixel',
    labelDe: 'Pixel-Sprite',
    labelEn: 'Pixel sprite',
  },
  {
    id: 'official',
    labelDe: 'Offizielles Artwork',
    labelEn: 'Official artwork',
  },
  {
    id: 'home',
    labelDe: 'Pokémon HOME',
    labelEn: 'Pokémon HOME',
  },
  {
    id: 'showdown',
    labelDe: 'Pokémon Showdown',
    labelEn: 'Pokémon Showdown',
  },
];

const buildListPath = (id, mode, shiny) => {
  const shinySegment = shiny ? '/shiny' : '';

  if (mode === 'official') {
    return `${SPRITE_ROOT}/other/official-artwork${shinySegment}/${id}.png`;
  }

  if (mode === 'home') {
    return `${SPRITE_ROOT}/other/home${shinySegment}/${id}.png`;
  }

  if (mode === 'showdown') {
    return `${SPRITE_ROOT}/other/showdown${shinySegment}/${id}.gif`;
  }

  return `${SPRITE_ROOT}${shinySegment}/${id}.png`;
};

export const getPokemonListSprite = (id, mode = 'pixel', shiny = false) => {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return '';
  }

  return buildListPath(Number(id), mode, shiny);
};

const getModeSprites = (details, mode) => {
  if (mode === 'official') {
    return details?.sprites?.other?.['official-artwork'] || null;
  }

  if (mode === 'home') {
    return details?.sprites?.other?.home || null;
  }

  if (mode === 'showdown') {
    return details?.sprites?.other?.showdown || null;
  }

  return details?.sprites || null;
};

export const getPokemonSprite = (details, mode = 'pixel', shiny = false) => {
  if (!details) {
    return '';
  }

  const selectedSprites = getModeSprites(details, mode);
  const selected = shiny
    ? selectedSprites?.front_shiny
    : selectedSprites?.front_default;

  if (selected) {
    return selected;
  }

  const fallback = shiny
    ? details.sprites?.front_shiny
    : details.sprites?.front_default;

  if (fallback) {
    return fallback;
  }

  return getPokemonListSprite(details.id, mode, shiny);
};

export const getSpriteModeLabel = (mode, language = 'de') => {
  const entry = SPRITE_MODES.find((candidate) => candidate.id === mode)
    || SPRITE_MODES[0];
  return language === 'de' ? entry.labelDe : entry.labelEn;
};
