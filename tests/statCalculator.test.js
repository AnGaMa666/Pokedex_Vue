import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePokemonStats,
  calculateStat,
  getNatureModifier,
  getTotalEvs,
} from '../src/utils/statCalculator.js';

test('calculates HP with the main-series stat formula', () => {
  const hp = calculateStat({
    base: 108,
    iv: 31,
    ev: 0,
    level: 50,
    statName: 'hp',
    nature: 'hardy',
  });

  assert.equal(hp, 183);
});

test('uses level 50 with zero IV/DV and zero EV as the neutral default', () => {
  const stats = calculatePokemonStats({
    pokemonStats: [
      { base_stat: 78, stat: { name: 'hp' } },
      { base_stat: 84, stat: { name: 'attack' } },
      { base_stat: 78, stat: { name: 'defense' } },
      { base_stat: 109, stat: { name: 'special-attack' } },
      { base_stat: 85, stat: { name: 'special-defense' } },
      { base_stat: 100, stat: { name: 'speed' } },
    ],
  });

  assert.deepEqual(stats, {
    hp: 138,
    attack: 89,
    defense: 83,
    'special-attack': 114,
    'special-defense': 90,
    speed: 105,
  });
});

test('applies a beneficial nature after the non-HP stat calculation', () => {
  const speed = calculateStat({
    base: 102,
    iv: 31,
    ev: 252,
    level: 50,
    statName: 'speed',
    nature: 'jolly',
  });

  assert.equal(speed, 169);
  assert.equal(getNatureModifier('speed', 'jolly'), 1.1);
  assert.equal(getNatureModifier('special-attack', 'jolly'), 0.9);
});

test('calculates all six stats from PokéAPI stat entries', () => {
  const stats = calculatePokemonStats({
    pokemonStats: [
      { base_stat: 80, stat: { name: 'hp' } },
      { base_stat: 82, stat: { name: 'attack' } },
      { base_stat: 83, stat: { name: 'defense' } },
      { base_stat: 100, stat: { name: 'special-attack' } },
      { base_stat: 100, stat: { name: 'special-defense' } },
      { base_stat: 80, stat: { name: 'speed' } },
    ],
    ivs: {
      hp: 31,
      attack: 31,
      defense: 31,
      'special-attack': 31,
      'special-defense': 31,
      speed: 31,
    },
    evs: {
      hp: 252,
      attack: 0,
      defense: 0,
      'special-attack': 252,
      'special-defense': 4,
      speed: 0,
    },
    level: 50,
    nature: 'modest',
  });

  assert.deepEqual(stats, {
    hp: 187,
    attack: 91,
    defense: 103,
    'special-attack': 167,
    'special-defense': 121,
    speed: 100,
  });
});

test('counts the complete EV allocation', () => {
  assert.equal(getTotalEvs({
    hp: 252,
    attack: 0,
    defense: 4,
    'special-attack': 252,
    'special-defense': 0,
    speed: 0,
  }), 508);
});
