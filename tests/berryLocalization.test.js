import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLocalizedBerryFirmnessName,
  getLocalizedBerryFlavorName,
  getLocalizedTypeName,
} from '../src/utils/localization.js';

test('translates all berry firmness values into German', () => {
  assert.equal(getLocalizedBerryFirmnessName('very-soft', 'de'), 'Sehr weich');
  assert.equal(getLocalizedBerryFirmnessName('soft', 'de'), 'Weich');
  assert.equal(getLocalizedBerryFirmnessName('hard', 'de'), 'Hart');
  assert.equal(getLocalizedBerryFirmnessName('very-hard', 'de'), 'Sehr hart');
  assert.equal(getLocalizedBerryFirmnessName('super-hard', 'de'), 'Extrem hart');
});

test('translates all berry flavor values into German', () => {
  assert.equal(getLocalizedBerryFlavorName('spicy', 'de'), 'Scharf');
  assert.equal(getLocalizedBerryFlavorName('dry', 'de'), 'Trocken');
  assert.equal(getLocalizedBerryFlavorName('sweet', 'de'), 'Süß');
  assert.equal(getLocalizedBerryFlavorName('bitter', 'de'), 'Bitter');
  assert.equal(getLocalizedBerryFlavorName('sour', 'de'), 'Sauer');
});

test('uses localized type labels for the Natural Gift type', () => {
  assert.equal(getLocalizedTypeName('fire', 'de'), 'Feuer');
  assert.equal(getLocalizedTypeName('psychic', 'de'), 'Psycho');
  assert.equal(getLocalizedTypeName('fairy', 'de'), 'Fee');
});

test('keeps English fallback labels readable', () => {
  assert.equal(getLocalizedBerryFirmnessName('very-soft', 'en'), 'Very Soft');
  assert.equal(getLocalizedBerryFlavorName('spicy', 'en'), 'Spicy');
});
