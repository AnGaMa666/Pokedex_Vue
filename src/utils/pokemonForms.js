import { getMegaStone } from './megaStones.js';

const MEGA_FORM_PATTERN = /-mega(?:-[a-z0-9]+)*$/;
const GIGANTAMAX_FORM_PATTERN = /-gmax$/;

const getPokemonIdFromUrl = (url = '') => {
  const match = url.match(/\/pokemon\/(\d+)\/?(?:\?.*)?$/);
  return match ? Number(match[1]) : null;
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
