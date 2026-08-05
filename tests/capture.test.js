import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BALLS,
  calculateBallRates,
  calculateCaptureProbability,
} from '../src/utils/capture.js';

const baseContext = {
  maxHp: 100,
  currentHp: 100,
  status: 'none',
  targetLevel: 50,
  playerLevel: 50,
  turns: 1,
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

test('lower HP and sleep increase the estimated capture probability', () => {
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

test('Quick Ball receives its conditional first-turn multiplier', () => {
  const rates = calculateBallRates({
    captureRate: 45,
    context: baseContext,
  });
  const quickBall = rates.find((ball) => ball.name === 'quick-ball');

  assert.equal(quickBall.multiplier, 5);
  assert.ok(quickBall.probability > 0);
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
