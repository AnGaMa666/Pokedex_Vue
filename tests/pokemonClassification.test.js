import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPokemonClassifications,
  matchesPokemonStatus,
} from '../src/utils/pokemonClassification.js';

test('classifies starter and fossil species without changing their National number', () => {
  assert.deepEqual(getPokemonClassifications(1), ['starter']);
  assert.deepEqual(getPokemonClassifications(138), ['fossil']);
});

test('uses species flags for legendary, mythical and baby Pokémon', () => {
  assert.deepEqual(getPokemonClassifications(9999, {
    is_legendary: true,
    is_mythical: false,
    is_baby: false,
  }), ['legendary']);
  assert.deepEqual(getPokemonClassifications(9998, {
    is_legendary: false,
    is_mythical: true,
    is_baby: true,
  }), ['mythical', 'baby']);
});

test('classifies Ultra Beasts and Paradox Pokémon', () => {
  assert.ok(getPokemonClassifications(793).includes('ultra-beast'));
  assert.ok(getPokemonClassifications(984).includes('paradox'));
});

test('matches selected filters while ordinary species remain regular', () => {
  assert.equal(matchesPokemonStatus(25, 'regular'), true);
  assert.equal(matchesPokemonStatus(25, 'legendary'), false);
  assert.equal(matchesPokemonStatus(150, 'legendary'), true);
  assert.equal(matchesPokemonStatus(150, 'all'), true);
});
