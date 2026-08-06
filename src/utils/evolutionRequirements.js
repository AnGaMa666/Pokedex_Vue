import { getResourceId } from './resource.js';

const normalizeName = (resource) => {
  if (typeof resource === 'string') return resource;
  return resource?.name || '';
};

const normalizeUrl = (resource) => resource?.url || '';

const normalizeNullableBoolean = (value) => (
  typeof value === 'boolean' ? value : null
);

const getVersionGroupReference = (detail = {}) => (
  detail.version_group || detail.version_group_id || null
);

const normalizeDetail = (detail = {}) => ({
  versionGroup: normalizeName(getVersionGroupReference(detail)),
  versionGroupId: Number.isInteger(detail.version_group_id)
    ? detail.version_group_id
    : getResourceId(normalizeUrl(getVersionGroupReference(detail))),
  isDefault: normalizeNullableBoolean(detail.is_default),
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
  nearSpecialRock: Boolean(detail.near_special_rock),
  needsMultiplayer: Boolean(detail.needs_multiplayer),
  needsOverworldRain: Boolean(detail.needs_overworld_rain),
  turnUpsideDown: Boolean(detail.turn_upside_down),
  partySpecies: normalizeName(detail.party_species),
  partyType: normalizeName(detail.party_type),
  tradeSpecies: normalizeName(detail.trade_species),
  region: normalizeName(detail.region),
  baseForm: normalizeName(detail.base_form),
  baseFormUrl: normalizeUrl(detail.base_form),
  evolvedForm: normalizeName(detail.evolved_form),
  evolvedFormUrl: normalizeUrl(detail.evolved_form),
  usedMove: normalizeName(detail.used_move),
  minMoveCount: detail.min_move_count ?? null,
  minSteps: detail.min_steps ?? null,
  minDamageTaken: detail.min_damage_taken ?? null,
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
      if (detail.usedMove) names.moves.add(detail.usedMove);
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

export const normalizePokemonFormConditions = (forms = []) => forms
  .map((form) => ({
    id: Number(form?.id) || null,
    name: form?.name || '',
    names: Array.isArray(form?.names) ? form.names : [],
    formNames: Array.isArray(form?.form_names) ? form.form_names : [],
    formName: form?.form_name || '',
    pokemonName: normalizeName(form?.pokemon),
    pokemonUrl: normalizeUrl(form?.pokemon),
    isBattleOnly: Boolean(form?.is_battle_only),
    isMega: Boolean(form?.is_mega),
    conditions: (form?.trigger_conditions || [])
      .filter((condition) => condition?.trigger)
      .map((condition) => ({
        trigger: condition.trigger,
        name: condition.name || '',
        url: condition.url || '',
        resourceKind: condition.url?.match(/\/api\/v2\/([^/]+)\//)?.[1] || '',
        baseForm: normalizeName(condition.base_form),
        baseFormUrl: normalizeUrl(condition.base_form),
      })),
  }))
  .filter((form) => form.name && form.conditions.length);

export const collectPokemonFormConditionResources = (forms = []) => {
  const resources = {
    abilities: new Set(),
    baseForms: new Set(),
    items: new Set(),
    moves: new Set(),
  };

  for (const form of forms) {
    for (const condition of form.conditions || []) {
      if (condition.resourceKind === 'item' && condition.name) {
        resources.items.add(condition.name);
      } else if (condition.resourceKind === 'move' && condition.name) {
        resources.moves.add(condition.name);
      } else if (condition.resourceKind === 'ability' && condition.name) {
        resources.abilities.add(condition.name);
      }

      if (condition.baseForm) resources.baseForms.add(condition.baseForm);
    }
  }

  return Object.fromEntries(
    Object.entries(resources).map(([key, values]) => [key, [...values]]),
  );
};
