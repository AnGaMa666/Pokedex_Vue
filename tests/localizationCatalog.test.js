import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCatalogLabel,
  getLocalizedEncounterMethodName,
  getLocalizedFormSuffix,
  getLocalizedVersionName,
} from '../src/services/localizationCatalog.js';

test('returns German game version names used by route encounters', () => {
  assert.equal(getLocalizedVersionName('ruby', 'de'), 'Rubin');
  assert.equal(getLocalizedVersionName('sapphire', 'de'), 'Saphir');
  assert.equal(getLocalizedVersionName('emerald', 'de'), 'Smaragd');
  assert.equal(getLocalizedVersionName('scarlet', 'de'), 'Karmesin');
  assert.equal(getLocalizedVersionName('violet', 'de'), 'Purpur');
});

test('returns German encounter method names', () => {
  assert.equal(getLocalizedEncounterMethodName('old-rod', 'de'), 'Angel');
  assert.equal(getLocalizedEncounterMethodName('good-rod', 'de'), 'Profiangel');
  assert.equal(getLocalizedEncounterMethodName('super-rod', 'de'), 'Superangel');
  assert.equal(getLocalizedEncounterMethodName('surf', 'de'), 'Surfen');
  assert.equal(getLocalizedEncounterMethodName('dark-grass', 'de'), 'Dunkles Gras');
});

test('returns German form descriptions and readable fallbacks', () => {
  assert.equal(getLocalizedFormSuffix('gmax', 'de'), 'Gigadynamax-Form');
  assert.equal(getLocalizedFormSuffix('mega-x', 'de'), 'Mega-Entwicklung X');
  assert.equal(getLocalizedFormSuffix('unknown-form', 'de'), 'Unknown Form');
});

test('uses catalog names before formatted resource fallbacks', () => {
  const catalog = new Map([
    [39, 'Pummeluff'],
    [56, 'Charmebolzen'],
  ]);

  assert.equal(getCatalogLabel(catalog, 39, 'jigglypuff'), 'Pummeluff');
  assert.equal(getCatalogLabel(catalog, 56, 'cute-charm'), 'Charmebolzen');
  assert.equal(getCatalogLabel(catalog, 9999, 'unknown-resource'), 'Unknown Resource');
});
