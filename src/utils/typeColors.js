export const TYPE_COLORS = {
  bug: '#91a119',
  dark: '#624d4e',
  dragon: '#5060e1',
  electric: '#fac000',
  fairy: '#ef70ef',
  fighting: '#ff8000',
  fire: '#e62829',
  flying: '#81b9ef',
  ghost: '#704170',
  grass: '#3fa129',
  ground: '#915121',
  ice: '#3dcef3',
  normal: '#9fa19f',
  poison: '#9141cb',
  psychic: '#ef4179',
  rock: '#afa981',
  steel: '#60a1b8',
  water: '#2980ef',
};

export const getTypeColor = (typeName) => TYPE_COLORS[typeName] || '#64748b';

export const getTypeGradient = (types = []) => {
  const primaryColor = getTypeColor(types[0]?.type?.name);
  const secondaryColor = getTypeColor(types[1]?.type?.name || types[0]?.type?.name);

  return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
};
