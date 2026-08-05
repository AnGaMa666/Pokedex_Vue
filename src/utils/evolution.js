const ITEM_SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';

export const getEvolutionItem = (evolutionDetails = []) => {
  const detail = evolutionDetails[0];
  const item = detail?.item || detail?.held_item;

  if (!item?.name) {
    return null;
  }

  return {
    name: item.name,
    sprite: `${ITEM_SPRITE_BASE_URL}/${encodeURIComponent(item.name)}.png`,
  };
};
