import assert from 'node:assert/strict';
import test from 'node:test';

import { getEvolutionItem } from '../src/utils/evolution.js';

test('returns the used evolution item with its sprite', () => {
  assert.deepEqual(
    getEvolutionItem([
      {
        item: {
          name: 'fire-stone',
          url: 'https://pokeapi.co/api/v2/item/82/',
        },
        trigger: {
          name: 'use-item',
        },
      },
    ]),
    {
      name: 'fire-stone',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png',
    },
  );
});

test('returns a held item when the evolution requires one', () => {
  assert.deepEqual(
    getEvolutionItem([
      {
        held_item: {
          name: 'metal-coat',
          url: 'https://pokeapi.co/api/v2/item/210/',
        },
        trigger: {
          name: 'trade',
        },
      },
    ]),
    {
      name: 'metal-coat',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/metal-coat.png',
    },
  );
});

test('returns null when no evolution item is required', () => {
  assert.equal(
    getEvolutionItem([
      {
        min_level: 16,
        trigger: {
          name: 'level-up',
        },
      },
    ]),
    null,
  );
  assert.equal(getEvolutionItem([]), null);
});
