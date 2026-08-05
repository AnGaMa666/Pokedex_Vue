export const CAPTURE_STATUSES = [
  { id: 'none', modifier: 1 },
  { id: 'paralysis', modifier: 1.5 },
  { id: 'poison', modifier: 1.5 },
  { id: 'burn', modifier: 1.5 },
  { id: 'sleep', modifier: 2.5 },
  { id: 'freeze', modifier: 2.5 },
];

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
    getMultiplier: (context) => context.isWaterOrBug ? 3.5 : 1,
    condition: 'waterOrBug',
  },
  {
    name: 'dive-ball',
    getMultiplier: (context) => context.isFishingOrUnderwater ? 3.5 : 1,
    condition: 'fishingOrUnderwater',
  },
  {
    name: 'nest-ball',
    getMultiplier: (context) => Math.max(1, Math.min(4, (41 - context.targetLevel) / 10)),
    condition: 'lowLevel',
  },
  {
    name: 'repeat-ball',
    getMultiplier: (context) => context.caughtBefore ? 3.5 : 1,
    condition: 'caughtBefore',
  },
  {
    name: 'timer-ball',
    getMultiplier: (context) => Math.min(4, 1 + Math.max(0, context.turns - 1) * 0.3),
    condition: 'turns',
  },
  {
    name: 'dusk-ball',
    getMultiplier: (context) => context.isNightOrCave ? 3 : 1,
    condition: 'nightOrCave',
  },
  {
    name: 'quick-ball',
    getMultiplier: (context) => context.turns <= 1 ? 5 : 1,
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
      if (context.playerLevel >= context.targetLevel * 4) {
        return 8;
      }

      if (context.playerLevel >= context.targetLevel * 2) {
        return 4;
      }

      if (context.playerLevel > context.targetLevel) {
        return 2;
      }

      return 1;
    },
    condition: 'levelDifference',
  },
  {
    name: 'lure-ball',
    getMultiplier: (context) => context.isFishingOrUnderwater ? 4 : 1,
    condition: 'fishing',
  },
  {
    name: 'heavy-ball',
    fixedMultiplier: 1,
    getRateAdjustment: (context) => {
      if (context.targetWeightKg < 100) {
        return -20;
      }

      if (context.targetWeightKg < 200) {
        return 0;
      }

      if (context.targetWeightKg < 300) {
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
    getMultiplier: (context) => ['sleep', 'freeze'].includes(context.status) ? 4 : 1,
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

const getStatusModifier = (status) => {
  return CAPTURE_STATUSES.find((entry) => entry.id === status)?.modifier ?? 1;
};

export const getBallModifier = (ball, context) => {
  return ball.getMultiplier?.(context) ?? ball.fixedMultiplier ?? 1;
};

export const getAdjustedCatchRate = (captureRate, ball, context) => {
  const adjustment = ball.getRateAdjustment?.(context) ?? 0;
  return clamp(Number(captureRate) + adjustment, 1, 255);
};

export const calculateCaptureProbability = ({
  captureRate,
  ball,
  context,
}) => {
  if (ball.guaranteed) {
    return 1;
  }

  const maximumHp = clamp(context.maxHp, 1, 9999);
  const currentHp = clamp(context.currentHp, 1, maximumHp);
  const hpFactor = (3 * maximumHp - 2 * currentHp) / (3 * maximumHp);
  const ballModifier = getBallModifier(ball, context);
  const statusModifier = getStatusModifier(context.status);
  const adjustedCatchRate = getAdjustedCatchRate(captureRate, ball, context);
  const modifiedRate = hpFactor * adjustedCatchRate * ballModifier * statusModifier;

  if (modifiedRate >= 255) {
    return 1;
  }

  if (modifiedRate <= 0) {
    return 0;
  }

  const shakeThreshold = 1048560 / Math.sqrt(Math.sqrt(16711680 / modifiedRate));
  const singleShakeChance = clamp(shakeThreshold / 65536, 0, 1);
  return clamp(singleShakeChance ** 4, 0, 1);
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
