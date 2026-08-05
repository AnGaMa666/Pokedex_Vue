import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSpecialBattleForms,
  getSpecialFormKind,
  isNumberedPokedexPokemon,
  isSpecialBattleForm,
} from '../src/utils/pokemonForms.js';

test('recognizes Mega forms including X and Y variants', () => {
  assert.equal(getSpecialFormKind('charizard-mega-x'), 'mega');
  assert.equal(getSpecialFormKind('charizard-mega-y'), 'mega');
  assert.equal(getSpecialFormKind('venusaur-mega'), 'mega');
  assert.equal(isSpecialBattleForm('mewtwo-mega-x'), true);
});

test('recognizes Gigantamax forms', () => {
  assert.equal(getSpecialFormKind('charizard-gmax'), 'gmax');
  assert.equal(isSpecialBattleForm('pikachu-gmax'), true);
});

test('keeps normal and unrelated regional forms in the numbered index', () => {
  assert.equal(isNumberedPokedexPokemon({ id: 6, name: 'charizard' }), true);
  assert.equal(isNumberedPokedexPokemon({ id: 10191, name: 'rattata-alola' }), true);
  assert.equal(isNumberedPokedexPokemon({ id: 10034, name: 'charizard-mega-x' }), false);
  assert.equal(isNumberedPokedexPokemon({ id: 10195, name: 'charizard-gmax' }), false);
});

test('derives special forms from species varieties without Pokédex numbers', () => {
  const forms = getSpecialBattleForms([
    {
      is_default: true,
      pokemon: {
        name: 'charizard',
        url: 'https://pokeapi.co/api/v2/pokemon/6/',
      },
    },
    {
      is_default: false,
      pokemon: {
        name: 'charizard-gmax',
        url: 'https://pokeapi.co/api/v2/pokemon/10195/',
      },
    },
    {
      is_default: false,
      pokemon: {
        name: 'charizard-mega-y',
        url: 'https://pokeapi.co/api/v2/pokemon/10035/',
      },
    },
    {
      is_default: false,
      pokemon: {
        name: 'charizard-mega-x',
        url: 'https://pokeapi.co/api/v2/pokemon/10034/',
      },
    },
  ]);

  assert.deepEqual(
    forms.map(({ id, name, kind }) => ({ id, name, kind })),
    [
      { id: 10034, name: 'charizard-mega-x', kind: 'mega' },
      { id: 10035, name: 'charizard-mega-y', kind: 'mega' },
      { id: 10195, name: 'charizard-gmax', kind: 'gmax' },
    ],
  );
  assert.match(forms[0].sprite, /\/10034\.png$/);
  assert.match(forms[0].shinySprite, /\/shiny\/10034\.png$/);
});

test('ignores malformed and unrelated varieties', () => {
  const forms = getSpecialBattleForms([
    {
      is_default: false,
      pokemon: {
        name: 'charizard-mega-x',
        url: 'https://pokeapi.co/api/v2/pokemon/not-a-number/',
      },
    },
    {
      is_default: false,
      pokemon: {
        name: 'charizard-costume',
        url: 'https://pokeapi.co/api/v2/pokemon/12345/',
      },
    },
  ]);

  assert.deepEqual(forms, []);
});
