const normalizeName = (resource) => resource?.name || '';

const normalizeDetail = (detail = {}) => ({
  trigger: normalizeName(detail.trigger),
  item: normalizeName(detail.item),
  heldItem: normalizeName(detail.held_item),
  minLevel: detail.min_level ?? null,
  minHappiness: detail.min_happiness ?? null,
  minAffection: detail.min_affection ?? null,
  minBeauty: detail.min_beauty ?? null,
  gender: detail.gender ?? null,
  relativePhysicalStats: detail.relative_physical_stats ?? null,
  timeOfDay: detail.time_of_day || '',
  knownMove: normalizeName(detail.known_move),
  knownMoveType: normalizeName(detail.known_move_type),
  location: normalizeName(detail.location),
  needsOverworldRain: Boolean(detail.needs_overworld_rain),
  turnUpsideDown: Boolean(detail.turn_upside_down),
  partySpecies: normalizeName(detail.party_species),
  partyType: normalizeName(detail.party_type),
  tradeSpecies: normalizeName(detail.trade_species),
});

const createDetailKey = (detail) => JSON.stringify(detail);

export const normalizeEvolutionDetails = (details = []) => {
  const uniqueDetails = new Map();

  for (const rawDetail of details) {
    const detail = normalizeDetail(rawDetail);
    uniqueDetails.set(createDetailKey(detail), detail);
  }

  return [...uniqueDetails.values()];
};

export const collectEvolutionTransitions = (chain) => {
  if (!chain?.species?.name) {
    return [];
  }

  const transitions = [];

  const visit = (node, stage = 0) => {
    for (const child of node.evolves_to || []) {
      transitions.push({
        sourceName: node.species?.name || '',
        sourceUrl: node.species?.url || '',
        targetName: child.species?.name || '',
        targetUrl: child.species?.url || '',
        stage: stage + 1,
        details: normalizeEvolutionDetails(child.evolution_details || []),
      });
      visit(child, stage + 1);
    }
  };

  visit(chain);
  return transitions;
};

export const collectEvolutionResourceNames = (transitions = []) => {
  const names = {
    items: new Set(),
    moves: new Set(),
    locations: new Set(),
    species: new Set(),
  };

  for (const transition of transitions) {
    names.species.add(transition.sourceName);
    names.species.add(transition.targetName);

    for (const detail of transition.details) {
      if (detail.item) names.items.add(detail.item);
      if (detail.heldItem) names.items.add(detail.heldItem);
      if (detail.knownMove) names.moves.add(detail.knownMove);
      if (detail.location) names.locations.add(detail.location);
      if (detail.partySpecies) names.species.add(detail.partySpecies);
      if (detail.tradeSpecies) names.species.add(detail.tradeSpecies);
    }
  }

  return {
    items: [...names.items].filter(Boolean),
    moves: [...names.moves].filter(Boolean),
    locations: [...names.locations].filter(Boolean),
    species: [...names.species].filter(Boolean),
  };
};
