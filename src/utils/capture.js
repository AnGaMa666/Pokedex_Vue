export const CAPTURE_STATUSES = [
  { id: 'none' },
  { id: 'paralysis' },
  { id: 'poison' },
  { id: 'burn' },
  { id: 'sleep' },
  { id: 'freeze' },
];

export const CAPTURE_MECHANICS = [
  { id: 'gen9', generation: 9 },
  { id: 'gen8', generation: 8 },
  { id: 'gen6-7', generation: 7 },
  { id: 'gen5', generation: 5 },
  { id: 'gen3-4', generation: 4 },
];

const getMechanicsId = (context = {}) => {
  return CAPTURE_MECHANICS.some((entry) => entry.id === context.mechanics)
    ? context.mechanics
    : 'gen9';
};

const getGeneration = (context = {}) => {
  return CAPTURE_MECHANICS.find((entry) => entry.id === getMechanicsId(context))?.generation ?? 9;
};

export const BALLS = [
  { name: 'poke-ball', fixedMultiplier: 1 },
  { name: 'great-ball', fixedMultiplier: 1.5 },
  { name: 'ultra-ball', fixedMultiplier: 2 },
  { name: 'master-ball', guaranteed: true },
  { name: 'safari-ball', fixedMultiplier: 1.5 },
  { name: 'sport-ball', fixedMultiplier: 1.5 },
  { name: 'premier-ball', fixedMultiplier: 1 },
  { name: 'luxury-ball', fixedMultiplier: 1 },
  { name: 'heal-ball', fixedMultiplier: 1 },
  { name: 'friend-ball', fixedMultiplier: 1 },
  { name: 'cherish-ball', fixedMultiplier: 1 },
  {
    name: 'net-ball',
    getMultiplier: (context) => {
      if (!context.isWaterOrBug) {
        return 1;
      }

      return getGeneration(context) >= 7 ? 3.5 : 3;
    },
    condition: 'waterOrBug',
  },
  {
    name: 'dive-ball',
    getMultiplier: (context) => {
      if (!context.isFishingOrUnderwater) {
        return 1;
      }

      return getGeneration(context) >= 5 ? 3.5 : 3.5;
    },
    condition: 'fishingOrUnderwater',
  },
  {
    name: 'nest-ball',
    getMultiplier: (context) => {
      const generation = getGeneration(context);
      const targetLevel = clamp(context.targetLevel, 1, 100);

      if (generation <= 4) {
        return Math.max(1, Math.min(3, (40 - targetLevel) / 10));
      }

      return Math.max(1, Math.min(4, (41 - targetLevel) / 10));
    },
    condition: 'lowLevel',
  },
  {
    name: 'repeat-ball',
    getMultiplier: (context) => {
      if (!context.caughtBefore) {
        return 1;
      }

      return getGeneration(context) >= 7 ? 3.5 : 3;
    },
    condition: 'caughtBefore',
  },
  {
    name: 'timer-ball',
    getMultiplier: (context) => {
      const turns = clamp(context.turns, 1, 99);
      const generation = getGeneration(context);

      if (generation <= 4) {
        return Math.min(4, 1 + Math.max(0, turns - 1) * 0.1);
      }

      return Math.min(4, 1 + Math.max(0, turns) * 0.3);
    },
    condition: 'turns',
  },
  {
    name: 'dusk-ball',
    getMultiplier: (context) => {
      if (!context.isNightOrCave) {
        return 1;
      }

      return getGeneration(context) >= 7 ? 3 : 3.5;
    },
    condition: 'nightOrCave',
  },
  {
    name: 'quick-ball',
    getMultiplier: (context) => {
      if (clamp(context.turns, 1, 99) > 1) {
        return 1;
      }

      return getGeneration(context) >= 5 ? 5 : 4;
    },
    condition: 'firstTurn',
  },
  {
    name: 'fast-ball',
    getMultiplier: (context) => context.targetSpeed >= 100 ? 4 : 1,
    condition: 'fastTarget',
  },
  {
    name: 'level-ball',
    getMultiplier: (context) => {
      const playerLevel = clamp(context.playerLevel, 1, 100);
      const targetLevel = clamp(context.targetLevel, 1, 100);

      if (playerLevel >= targetLevel * 4) {
        return 8;
      }

      if (playerLevel >= targetLevel * 2) {
        return 4;
      }

      if (playerLevel > targetLevel) {
        return 2;
      }

      return 1;
    },
    condition: 'levelDifference',
  },
  {
    name: 'lure-ball',
    getMultiplier: (context) => {
      if (!context.isFishingOrUnderwater) {
        return 1;
      }

      const generation = getGeneration(context);
      return generation >= 8 ? 5 : generation >= 7 ? 3 : 3;
    },
    condition: 'fishing',
  },
  {
    name: 'heavy-ball',
    fixedMultiplier: 1,
    getRateAdjustment: (context) => {
      const weight = clamp(context.targetWeightKg, 0, 9999);

      if (weight < 100) {
        return -20;
      }

      if (weight < 200) {
        return 0;
      }

      if (weight < 300) {
        return 20;
      }

      return 30;
    },
    condition: 'weight',
  },
  {
    name: 'love-ball',
    getMultiplier: (context) => context.sameSpeciesOppositeSex ? 8 : 1,
    condition: 'love',
  },
  {
    name: 'moon-ball',
    getMultiplier: (context) => context.evolvesWithMoonStone ? 4 : 1,
    condition: 'moonEvolution',
  },
  {
    name: 'dream-ball',
    getMultiplier: (context) => context.status === 'sleep' ? 4 : 1,
    condition: 'sleeping',
  },
  {
    name: 'beast-ball',
    getMultiplier: (context) => context.isUltraBeast ? 5 : 0.1,
    condition: 'ultraBeast',
  },
];

const clamp = (value, minimum, maximum) => {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
};

const getStatusModifier = (status, context) => {
  if (['sleep', 'freeze'].includes(status)) {
    return getGeneration(context) <= 4 ? 2 : 2.5;
  }

  if (['paralysis', 'poison', 'burn'].includes(status)) {
    return 1.5;
  }

  return 1;
};

const getCapturePowerModifier = (context) => {
  const level = clamp(context.capturePower, 0, 3);

  if (level === 1) {
    return getGeneration(context) >= 9 ? 1.1 : 1.1;
  }

  if (level === 2) {
    return getGeneration(context) >= 9 ? 1.25 : 1.2;
  }

  if (level === 3) {
    return getGeneration(context) >= 9 ? 2 : 1.3;
  }

  return 1;
};

const getBadgePenalty = (context) => {
  if (getMechanicsId(context) !== 'gen9') {
    return 1;
  }

  const badges = Math.trunc(clamp(context.badges, 0, 8));
  const targetLevel = clamp(context.targetLevel, 1, 100);
  const obedienceLimits = [20, 25, 30, 35, 40, 45, 50, 55, 100];
  const currentLimit = obedienceLimits[badges];

  if (targetLevel <= currentLimit + 5) {
    return 1;
  }

  const requiredBadges = obedienceLimits.findIndex((limit) => targetLevel <= limit);
  const missingBadges = Math.max(0, (requiredBadges < 0 ? 8 : requiredBadges) - badges);
  return 0.8 ** missingBadges;
};

const getLevelModifier = (context) => {
  const targetLevel = clamp(context.targetLevel, 1, 100);
  const mechanics = getMechanicsId(context);

  if (mechanics === 'gen8') {
    return Math.max((30 - targetLevel) / 10, 1);
  }

  if (mechanics === 'gen9' && targetLevel < 13) {
    return Math.max((36 - 2 * targetLevel) / 10, 1);
  }

  return 1;
};

const getMiscModifier = (context) => {
  const capturePower = getCapturePowerModifier(context);
  const backStrike = getMechanicsId(context) === 'gen9' && context.backStrike ? 2 : 1;
  return capturePower * backStrike;
};

export const getBallModifier = (ball, context) => {
  return ball.getMultiplier?.(context) ?? ball.fixedMultiplier ?? 1;
};

export const getAdjustedCatchRate = (captureRate, ball, context) => {
  const adjustment = ball.getRateAdjustment?.(context) ?? 0;
  const minimum = getMechanicsId(context) === 'gen7-sun-moon' ? 0 : 1;
  return clamp(Number(captureRate) + adjustment, minimum, 255);
};

const calculateGenerationThreeOrFourProbability = ({
  captureRate,
  ball,
  context,
}) => {
  const maximumHp = clamp(context.maxHp, 1, 9999);
  const currentHp = clamp(context.currentHp, 1, maximumHp);
  const hpFactor = (3 * maximumHp - 2 * currentHp) / (3 * maximumHp);
  const adjustedCatchRate = getAdjustedCatchRate(captureRate, ball, context);
  const ballModifier = getBallModifier(ball, context);
  const statusModifier = getStatusModifier(context.status, context);
  const modifiedRate = Math.floor(
    hpFactor * adjustedCatchRate * ballModifier * statusModifier,
  );

  if (modifiedRate >= 255) {
    return 1;
  }

  if (modifiedRate <= 0) {
    return 0;
  }

  const shakeThreshold = Math.floor(
    1048560 / Math.sqrt(Math.sqrt(16711680 / modifiedRate)),
  );
  const singleShakeChance = clamp(shakeThreshold / 65536, 0, 1);
  return clamp(singleShakeChance ** 4, 0, 1);
};

const calculateModernProbability = ({
  captureRate,
  ball,
  context,
}) => {
  const maximumHp = clamp(context.maxHp, 1, 9999);
  const currentHp = clamp(context.currentHp, 1, maximumHp);
  const hpFactor = (3 * maximumHp - 2 * currentHp) / (3 * maximumHp);
  const adjustedCatchRate = getAdjustedCatchRate(captureRate, ball, context);
  const ballModifier = getBallModifier(ball, context);
  const statusModifier = getStatusModifier(context.status, context);
  const badgePenalty = getBadgePenalty(context);
  const levelModifier = getLevelModifier(context);
  const miscModifier = getMiscModifier(context);
  const baseValue = Math.floor(
    hpFactor * 4096 * adjustedCatchRate * ballModifier * badgePenalty,
  );
  const modifiedRate = Math.floor(
    baseValue * levelModifier * statusModifier * miscModifier,
  );
  const maximumRate = 255 * 4096;

  if (modifiedRate >= maximumRate) {
    return 1;
  }

  if (modifiedRate <= 0) {
    return 0;
  }

  const ratio = clamp(modifiedRate / maximumRate, 0, 1);
  const mechanics = getMechanicsId(context);

  if (mechanics === 'gen5') {
    const shakeThreshold = Math.floor(65536 * ratio ** 0.25);
    return clamp((shakeThreshold / 65536) ** 3, 0, 1);
  }

  const shakeThreshold = Math.floor(65536 * ratio ** 0.1875);
  return clamp((shakeThreshold / 65536) ** 4, 0, 1);
};

export const calculateCaptureProbability = ({
  captureRate,
  ball,
  context,
}) => {
  if (ball.guaranteed) {
    return 1;
  }

  if (getMechanicsId(context) === 'gen3-4') {
    return calculateGenerationThreeOrFourProbability({
      captureRate,
      ball,
      context,
    });
  }

  return calculateModernProbability({
    captureRate,
    ball,
    context,
  });
};

export const calculateBallRates = ({
  captureRate,
  context,
}) => {
  return BALLS.map((ball) => ({
    ...ball,
    multiplier: getBallModifier(ball, context),
    probability: calculateCaptureProbability({
      captureRate,
      ball,
      context,
    }),
  })).sort((firstBall, secondBall) => {
    return secondBall.probability - firstBall.probability;
  });
};
