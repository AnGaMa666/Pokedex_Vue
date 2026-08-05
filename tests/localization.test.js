import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLocalizedDamageClassName,
  getLocalizedGenerationName,
  getLocalizedMoveTargetName,
  getLocalizedSpecialFormName,
  getLocalizedTypeName,
  getTypeTextColor,
} from '../src/utils/localization.js';

test('translates battle metadata into German', () => {
  assert.equal(getLocalizedTypeName('grass', 'de'), 'Pflanze');
  assert.equal(getLocalizedDamageClassName('physical', 'de'), 'Physisch');
  assert.equal(getLocalizedMoveTargetName('selected-pokemon', 'de'), 'Ausgewähltes Pokémon');
  assert.equal(getLocalizedGenerationName('generation-i', 'de'), 'Generation I');
});

test('formats Mega and Gigantamax forms from the localized source species', () => {
  assert.equal(
    getLocalizedSpecialFormName({
      formName: 'charizard-mega-x',
      sourceName: 'Glurak',
      kind: 'mega',
      language: 'de',
    }),
    'Mega-Glurak X',
  );
  assert.equal(
    getLocalizedSpecialFormName({
      formName: 'venusaur-gmax',
      sourceName: 'Bisaflor',
      kind: 'gmax',
      language: 'de',
    }),
    'Gigadynamax-Bisaflor',
  );
});

test('uses readable text colors for dark and light type cards', () => {
  assert.equal(getTypeTextColor('ghost'), '#ffffff');
  assert.equal(getTypeTextColor('grass'), '#333333');
});
