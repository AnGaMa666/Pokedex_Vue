import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getEvolutionSpeciesNames,
  getFinalEvolutionSpeciesNames,
} from '../src/utils/evolutionChain.js';

const chain = {
  species: { name: 'eevee' },
  evolves_to: [
    { species: { name: 'vaporeon' }, evolves_to: [] },
    { species: { name: 'jolteon' }, evolves_to: [] },
    {
      species: { name: 'custom-middle' },
      evolves_to: [
        { species: { name: 'custom-final' }, evolves_to: [] },
      ],
    },
  ],
};

test('returns every leaf species from a branched evolution chain', () => {
  assert.deepEqual(
    getFinalEvolutionSpeciesNames(chain),
    ['vaporeon', 'jolteon', 'custom-final'],
  );
});

test('returns the current species when the chain has no descendants', () => {
  assert.deepEqual(
    getFinalEvolutionSpeciesNames({ species: { name: 'beedrill' }, evolves_to: [] }),
    ['beedrill'],
  );
});

test('returns all species in traversal order without duplicates', () => {
  assert.deepEqual(
    getEvolutionSpeciesNames(chain),
    ['eevee', 'vaporeon', 'jolteon', 'custom-middle', 'custom-final'],
  );
});

test('handles malformed chains safely', () => {
  assert.deepEqual(getFinalEvolutionSpeciesNames(null), []);
  assert.deepEqual(getEvolutionSpeciesNames({}), []);
});
