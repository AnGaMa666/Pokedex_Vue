export const TYPE_COLORS = {
  bug: 'lightgreen',
  dark: 'darkgray',
  dragon: 'mediumpurple',
  electric: 'lightyellow',
  fairy: 'lightpink',
  fighting: 'lightpink',
  fire: 'lightcoral',
  flying: 'lightskyblue',
  ghost: 'lightsteelblue',
  grass: 'lightgreen',
  ground: 'burlywood',
  ice: 'lightcyan',
  normal: 'lightgray',
  poison: 'mediumorchid',
  psychic: 'lightcoral',
  rock: 'lightgray',
  steel: 'lightgray',
  water: 'lightblue',
};

export const getTypeColor = (typeName) => TYPE_COLORS[typeName] || 'lightgray';

export const getTypeGradient = (types = []) => {
  const primaryColor = getTypeColor(types[0]?.type?.name);
  const secondaryColor = getTypeColor(types[1]?.type?.name || types[0]?.type?.name);

  return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
};
