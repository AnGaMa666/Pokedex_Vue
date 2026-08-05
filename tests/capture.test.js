import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BALLS,
  calculateBallRates,
  calculateCaptureProbability,
} from '../src/utils/capture.js';

const baseContext = {
  mechanics: 'gen9',
  maxHp: 100,
  currentHp: 100,
  status: 'none',
  targetLevel: 50,
  playerLevel: 50,
  turns: 1,
  badges: 8,
  capturePower: 0,
  backStrike: false,
  isNightOrCave: false,
  isFishingOrUnderwater: false,
  caughtBefore: false,
  sameSpeciesOppositeSex: false,
  evolvesWithMoonStone: false,
  isUltraBeast: false,
  isWaterOrBug: false,
  targetSpeed: 80,
  targetWeightKg: 80,
};

const getBall = (name) => BALLS.find((ball) => ball.name === name);

test('Master Ball is always guaranteed', () => {
  assert.equal(calculateCaptureProbability({
    captureRate: 3,
    ball: getBall('master-ball'),
    context: baseContext,
  }), 1);
});

test('Generation IX uses the modern shake probability instead of catch-rate divided by 255', () => {
  const probability = calculateCaptureProbability({
    captureRate: 45,
    ball: getBall('poke-ball'),
    context: {
      ...baseContext,
      currentHp: 1,
      status: 'sleep',
    },
  });

  assert.ok(Math.abs(probability - 0.5385955232058782) < 0.0000001);
});

test('Generation III and IV use the classic four-shake formula and lower sleep modifier', () => {
  const probability = calculateCaptureProbability({
    captureRate: 45,
    ball: getBall('poke-ball'),
    context: {
      ...baseContext,
      mechanics: 'gen3-4',
      currentHp: 1,
      status: 'sleep',
    },
  });

  assert.ok(Math.abs(probability - 0.34898163172774366) < 0.0000001);
});

test('lower HP and sleep increase the capture probability', () => {
  const healthyProbability = calculateCaptureProbability({
    captureRate: 45,
    ball: getBall('poke-ball'),
    context: baseContext,
  });
  const weakenedProbability = calculateCaptureProbability({
    captureRate: 45,
    ball: getBall('poke-ball'),
    context: {
      ...baseContext,
      currentHp: 1,
      status: 'sleep',
    },
  });

  assert.ok(weakenedProbability > healthyProbability);
});

test('Quick Ball receives its first-turn multiplier in modern games', () => {
  const rates = calculateBallRates({
    captureRate: 45,
    context: baseContext,
  });
  const quickBall = rates.find((ball) => ball.name === 'quick-ball');

  assert.equal(quickBall.multiplier, 5);
  assert.ok(quickBall.probability > 0);
});

test('Quick Ball uses the Generation IV multiplier in classic mode', () => {
  const rates = calculateBallRates({
    captureRate: 45,
    context: {
      ...baseContext,
      mechanics: 'gen3-4',
    },
  });
  const quickBall = rates.find((ball) => ball.name === 'quick-ball');

  assert.equal(quickBall.multiplier, 4);
});

test('Dream Ball only receives its modern bonus while the target is asleep', () => {
  const sleeping = calculateBallRates({
    captureRate: 45,
    context: {
      ...baseContext,
      status: 'sleep',
    },
  }).find((ball) => ball.name === 'dream-ball');
  const frozen = calculateBallRates({
    captureRate: 45,
    context: {
      ...baseContext,
      status: 'freeze',
    },
  }).find((ball) => ball.name === 'dream-ball');

  assert.equal(sleeping.multiplier, 4);
  assert.equal(frozen.multiplier, 1);
});

test('Beast Ball is penalized against ordinary Pokémon', () => {
  const ordinary = calculateBallRates({
    captureRate: 45,
    context: baseContext,
  }).find((ball) => ball.name === 'beast-ball');
  const ultraBeast = calculateBallRates({
    captureRate: 45,
    context: {
      ...baseContext,
      isUltraBeast: true,
    },
  }).find((ball) => ball.name === 'beast-ball');

  assert.equal(ordinary.multiplier, 0.1);
  assert.equal(ultraBeast.multiplier, 5);
  assert.ok(ultraBeast.probability > ordinary.probability);
});
