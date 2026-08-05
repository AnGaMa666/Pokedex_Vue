import assert from 'node:assert/strict';
import test from 'node:test';
import { getMegaStone, hasMegaStone } from '../src/utils/megaStones.js';
import { getSpecialBattleForms } from '../src/utils/pokemonForms.js';

test('resolves classic X and Y Mega Stones', () => {
  assert.deepEqual(getMegaStone('charizard-mega-x'), {
    name: 'charizardite-x',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/charizardite-x.png',
  });
  assert.equal(getMegaStone('mewtwo-mega-y')?.name, 'mewtwonite-y');
});

test('resolves current Mega Stones from the PokéAPI data set', () => {
  assert.equal(getMegaStone('dragonite-mega')?.name, 'dragoninite');
  assert.equal(getMegaStone('greninja-mega')?.name, 'greninjite');
  assert.equal(getMegaStone('raichu-mega-x')?.name, 'raichunite-x');
  assert.equal(getMegaStone('garchomp-mega-z')?.name, 'garchompite-z');
});

test('shares stones where multiple forms use the same Mega Stone', () => {
  assert.equal(getMegaStone('meowstic-male-mega')?.name, 'meowsticite');
  assert.equal(getMegaStone('meowstic-female-mega')?.name, 'meowsticite');
  assert.equal(getMegaStone('tatsugiri-curly-mega')?.name, 'tatsugirinite');
  assert.equal(getMegaStone('tatsugiri-stretchy-mega')?.name, 'tatsugirinite');
});

test('does not invent a stone for Mega Rayquaza or Gigantamax forms', () => {
  assert.equal(getMegaStone('rayquaza-mega'), null);
  assert.equal(hasMegaStone('charizard-gmax'), false);
});

test('attaches the stone only to Mega varieties', () => {
  const forms = getSpecialBattleForms([
    {
      is_default: false,
      pokemon: {
        name: 'charizard-mega-x',
        url: 'https://pokeapi.co/api/v2/pokemon/10034/',
      },
    },
    {
      is_default: false,
      pokemon: {
        name: 'charizard-gmax',
        url: 'https://pokeapi.co/api/v2/pokemon/10195/',
      },
    },
  ]);

  assert.equal(forms[0].megaStone?.name, 'charizardite-x');
  assert.equal(forms[1].megaStone, null);
});
