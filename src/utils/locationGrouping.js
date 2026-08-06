import { getGenerationLabel } from './versionGroups.js';

const CITY_PATTERN = /(?:^|-)(?:city|town|village|settlement|metropolis)(?:-|$)/;
const ROUTE_PATTERN = /(?:^|-)(?:route|road|path|trail|highway|passage)(?:-|$)/;

export const getLocationKind = (identifier = '') => {
  const normalized = String(identifier).toLowerCase();
  if (CITY_PATTERN.test(normalized)) return 'city';
  if (ROUTE_PATTERN.test(normalized)) return 'route';
  return 'other';
};

export const getPrimaryLocationGeneration = (entries = []) => {
  const generations = entries
    .map((entry) => Number(entry?.generation_id))
    .filter((generation) => Number.isInteger(generation) && generation > 0)
    .sort((first, second) => first - second);
  return generations[0] || 99;
};

export const groupLocationsByGeneration = ({
  locations = [],
  locationGameIndices = new Map(),
  getLabel = (location) => location.name,
  language = 'en',
} = {}) => {
  const sections = new Map();

  for (const location of locations) {
    const generation = getPrimaryLocationGeneration(locationGameIndices.get(Number(location.id)) || []);
    if (!sections.has(generation)) {
      sections.set(generation, {
        generation,
        label: generation === 99
          ? (language === 'de' ? 'Generation nicht zugeordnet' : 'Generation not assigned')
          : getGenerationLabel(generation, language),
        locations: [],
      });
    }
    sections.get(generation).locations.push(location);
  }

  for (const section of sections.values()) {
    section.locations.sort((first, second) => getLabel(first).localeCompare(
      getLabel(second),
      language === 'de' ? 'de-DE' : 'en-US',
    ) || first.id - second.id);
  }

  return [...sections.values()].sort((first, second) => first.generation - second.generation);
};
