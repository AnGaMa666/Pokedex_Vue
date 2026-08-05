import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPokemonListSprite,
  getPokemonSprite,
  getSpriteModeLabel,
} from '../src/utils/sprites.js';

test('builds list URLs for all selectable sprite sources', () => {
  assert.equal(
    getPokemonListSprite(25, 'pixel', false),
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  );
  assert.equal(
    getPokemonListSprite(25, 'official', true),
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/25.png',
  );
  assert.equal(
    getPokemonListSprite(25, 'home', false),
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/25.png',
  );
  assert.equal(
    getPokemonListSprite(25, 'showdown', true),
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/25.gif',
  );
});

test('prefers selected nested sprites and falls back to pixel sprites', () => {
  const details = {
    id: 25,
    sprites: {
      front_default: 'pixel.png',
      front_shiny: 'pixel-shiny.png',
      other: {
        home: {
          front_default: 'home.png',
          front_shiny: null,
        },
      },
    },
  };

  assert.equal(getPokemonSprite(details, 'home', false), 'home.png');
  assert.equal(getPokemonSprite(details, 'home', true), 'pixel-shiny.png');
});

test('localizes sprite mode labels', () => {
  assert.equal(getSpriteModeLabel('official', 'de'), 'Offizielles Artwork');
  assert.equal(getSpriteModeLabel('official', 'en'), 'Official artwork');
});
