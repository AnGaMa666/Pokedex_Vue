export const BATTLE_STATS = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
];

export const NATURES = [
  { name: 'hardy', increased: null, decreased: null },
  { name: 'lonely', increased: 'attack', decreased: 'defense' },
  { name: 'brave', increased: 'attack', decreased: 'speed' },
  { name: 'adamant', increased: 'attack', decreased: 'special-attack' },
  { name: 'naughty', increased: 'attack', decreased: 'special-defense' },
  { name: 'bold', increased: 'defense', decreased: 'attack' },
  { name: 'docile', increased: null, decreased: null },
  { name: 'relaxed', increased: 'defense', decreased: 'speed' },
  { name: 'impish', increased: 'defense', decreased: 'special-attack' },
  { name: 'lax', increased: 'defense', decreased: 'special-defense' },
  { name: 'timid', increased: 'speed', decreased: 'attack' },
  { name: 'hasty', increased: 'speed', decreased: 'defense' },
  { name: 'serious', increased: null, decreased: null },
  { name: 'jolly', increased: 'speed', decreased: 'special-attack' },
  { name: 'naive', increased: 'speed', decreased: 'special-defense' },
  { name: 'modest', increased: 'special-attack', decreased: 'attack' },
  { name: 'mild', increased: 'special-attack', decreased: 'defense' },
  { name: 'quiet', increased: 'special-attack', decreased: 'speed' },
  { name: 'bashful', increased: null, decreased: null },
  { name: 'rash', increased: 'special-attack', decreased: 'special-defense' },
  { name: 'calm', increased: 'special-defense', decreased: 'attack' },
  { name: 'gentle', increased: 'special-defense', decreased: 'defense' },
  { name: 'sassy', increased: 'special-defense', decreased: 'speed' },
  { name: 'careful', increased: 'special-defense', decreased: 'special-attack' },
  { name: 'quirky', increased: null, decreased: null },
];

const clampInteger = (value, minimum, maximum) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return minimum;
  }

  return Math.min(maximum, Math.max(minimum, Math.trunc(numericValue)));
};

export const getNature = (name) => {
  return NATURES.find((nature) => nature.name === name) || NATURES[0];
};

export const getNatureModifier = (statName, natureName) => {
  if (statName === 'hp') {
    return 1;
  }

  const nature = getNature(natureName);

  if (nature.increased === statName) {
    return 1.1;
  }

  if (nature.decreased === statName) {
    return 0.9;
  }

  return 1;
};

export const calculateStat = ({
  base,
  iv = 31,
  ev = 0,
  level = 50,
  statName,
  nature = 'hardy',
}) => {
  const normalizedBase = clampInteger(base, 1, 255);
  const normalizedIv = clampInteger(iv, 0, 31);
  const normalizedEv = clampInteger(ev, 0, 252);
  const normalizedLevel = clampInteger(level, 1, 100);
  const effortContribution = Math.floor(normalizedEv / 4);
  const commonValue = Math.floor(
    ((2 * normalizedBase + normalizedIv + effortContribution) * normalizedLevel) / 100,
  );

  if (statName === 'hp') {
    if (normalizedBase === 1) {
      return 1;
    }

    return commonValue + normalizedLevel + 10;
  }

  return Math.floor(
    (commonValue + 5) * getNatureModifier(statName, nature),
  );
};

export const normalizeBaseStats = (pokemonStats = []) => {
  return Object.fromEntries(
    BATTLE_STATS.map((statName) => {
      const entry = pokemonStats.find((stat) => stat.stat?.name === statName);
      return [statName, entry?.base_stat ?? 1];
    }),
  );
};

export const calculatePokemonStats = ({
  pokemonStats = [],
  ivs = {},
  evs = {},
  level = 50,
  nature = 'hardy',
}) => {
  const baseStats = normalizeBaseStats(pokemonStats);

  return Object.fromEntries(
    BATTLE_STATS.map((statName) => [
      statName,
      calculateStat({
        base: baseStats[statName],
        iv: ivs[statName] ?? 31,
        ev: evs[statName] ?? 0,
        level,
        statName,
        nature,
      }),
    ]),
  );
};

export const getTotalEvs = (evs = {}) => {
  return BATTLE_STATS.reduce((total, statName) => {
    return total + clampInteger(evs[statName] ?? 0, 0, 252);
  }, 0);
};
