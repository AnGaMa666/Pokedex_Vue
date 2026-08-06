import test from 'node:test';
import assert from 'node:assert/strict';

import { createPokemonVariantSelection } from '../src/utils/pokemonSelection.js';

test('a list variety opens the concrete Pokémon form instead of its base species', () => {
  const selection = createPokemonVariantSelection({
    species: { id: 6, name: 'charizard' },
    variety: {
      is_default: false,
      pokemon: {
        name: 'charizard-mega-x',
        url: 'https://pokeapi.co/api/v2/pokemon/10034/',
      },
    },
    image: '/sprites/10034.png',
  });

  assert.deepEqual(selection, {
    name: 'charizard-mega-x',
    url: 'https://pokeapi.co/api/v2/pokemon/10034/',
    id: 10034,
    image: '/sprites/10034.png',
    speciesId: 6,
    speciesName: 'charizard',
    isVariant: true,
  });
});

test('default varieties retain their concrete identity without being marked as variants', () => {
  const selection = createPokemonVariantSelection({
    species: { id: 25, name: 'pikachu' },
    variety: {
      is_default: true,
      pokemon: {
        name: 'pikachu',
        url: 'https://pokeapi.co/api/v2/pokemon/25/',
      },
    },
  });

  assert.equal(selection.id, 25);
  assert.equal(selection.isVariant, false);
});

test('invalid variety resources cannot create a misleading selection', () => {
  assert.equal(createPokemonVariantSelection({
    species: { id: 6, name: 'charizard' },
    variety: { pokemon: { name: 'charizard-mega-x', url: '' } },
  }), null);
});
