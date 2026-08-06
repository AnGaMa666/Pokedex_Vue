import { getResourceId } from './resource.js';

export const createPokemonVariantSelection = ({
  species = {},
  variety = {},
  image = '',
} = {}) => {
  const pokemon = variety?.pokemon;
  const id = getResourceId(pokemon?.url);
  if (!pokemon?.name || id === null) return null;

  return {
    name: pokemon.name,
    url: pokemon.url,
    id,
    image,
    speciesId: Number(species?.id) || null,
    speciesName: species?.name || '',
    isVariant: !variety.is_default,
  };
};
