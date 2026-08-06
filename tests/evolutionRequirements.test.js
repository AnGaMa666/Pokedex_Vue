import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectEvolutionResourceNames,
  collectEvolutionTransitions,
  normalizeEvolutionDetails,
} from '../src/utils/evolutionRequirements.js';

test('keeps every alternative evolution detail instead of only the first one', () => {
  const details = normalizeEvolutionDetails([
    {
      trigger: { name: 'level-up' },
      min_level: 20,
      gender: 1,
    },
    {
      trigger: { name: 'level-up' },
      min_level: 20,
      gender: 2,
    },
  ]);

  assert.equal(details.length, 2);
  assert.equal(details[0].gender, 1);
  assert.equal(details[1].gender, 2);
});

test('extracts all transitions and all form-relevant conditions from a chain', () => {
  const transitions = collectEvolutionTransitions({
    species: {
      name: 'burmy',
      url: 'https://pokeapi.co/api/v2/pokemon-species/412/',
    },
    evolves_to: [
      {
        species: {
          name: 'wormadam',
          url: 'https://pokeapi.co/api/v2/pokemon-species/413/',
        },
        evolution_details: [
          {
            trigger: { name: 'level-up' },
            min_level: 20,
            gender: 1,
          },
        ],
        evolves_to: [],
      },
      {
        species: {
          name: 'mothim',
          url: 'https://pokeapi.co/api/v2/pokemon-species/414/',
        },
        evolution_details: [
          {
            trigger: { name: 'level-up' },
            min_level: 20,
            gender: 2,
          },
        ],
        evolves_to: [],
      },
    ],
  });

  assert.equal(transitions.length, 2);
  assert.deepEqual(
    transitions.map((transition) => [transition.targetName, transition.details[0].gender]),
    [['wormadam', 1], ['mothim', 2]],
  );
});

test('collects referenced items, moves, locations and species for localization', () => {
  const resources = collectEvolutionResourceNames([
    {
      sourceName: 'eevee',
      targetName: 'leafeon',
      details: [
        {
          item: 'leaf-stone',
          heldItem: '',
          knownMove: 'fairy-wind',
          location: 'eterna-forest',
          partySpecies: 'remoraid',
          tradeSpecies: '',
        },
      ],
    },
  ]);

  assert.deepEqual(resources.items, ['leaf-stone']);
  assert.deepEqual(resources.moves, ['fairy-wind']);
  assert.deepEqual(resources.locations, ['eterna-forest']);
  assert.deepEqual(resources.species.sort(), ['eevee', 'leafeon', 'remoraid']);
});
