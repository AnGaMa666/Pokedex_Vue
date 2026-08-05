export const getFinalEvolutionSpeciesNames = (chain) => {
  if (!chain?.species?.name) {
    return [];
  }

  const descendants = chain.evolves_to || [];

  if (!descendants.length) {
    return [chain.species.name];
  }

  const names = descendants.flatMap(getFinalEvolutionSpeciesNames);
  return [...new Set(names.filter(Boolean))];
};

export const getEvolutionSpeciesNames = (chain) => {
  if (!chain?.species?.name) {
    return [];
  }

  const descendantNames = (chain.evolves_to || []).flatMap(getEvolutionSpeciesNames);
  return [...new Set([chain.species.name, ...descendantNames])];
};
