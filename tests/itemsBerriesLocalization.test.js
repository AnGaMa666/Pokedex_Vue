import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getCatalogLabel } from '../src/services/localizationCatalog.js';
import {
  createHeldPokemonRows,
  getItemVersionGroupResources,
  getLocalizedItemMetadataName,
} from '../src/utils/itemDetails.js';

const OFFICIAL_ITEM_CATEGORIES = [
  'stat-boosts', 'effort-drop', 'medicine', 'other', 'in-a-pinch', 'picky-healing',
  'type-protection', 'baking-only', 'collectibles', 'evolution', 'spelunking', 'held-items',
  'choice', 'effort-training', 'bad-held-items', 'training', 'plates', 'species-specific',
  'type-enhancement', 'event-items', 'gameplay', 'plot-advancement', 'unused', 'loot',
  'all-mail', 'vitamins', 'healing', 'pp-recovery', 'revival', 'status-cures', 'mulch',
  'special-balls', 'standard-balls', 'dex-completion', 'scarves', 'all-machines', 'flutes',
  'apricorn-balls', 'apricorn-box', 'data-cards', 'jewels', 'miracle-shooter', 'mega-stones',
  'memories', 'z-crystals', 'species-candies', 'catching-bonus', 'dynamax-crystals',
  'nature-mints', 'curry-ingredients', 'tera-shard', 'sandwich-ingredients', 'tm-materials',
  'picnic',
];

const readComponent = (name) => readFileSync(
  new URL(`../src/components/${name}`, import.meta.url),
  'utf8',
);

test('provides a controlled German label for every current item category', () => {
  for (const category of OFFICIAL_ITEM_CATEGORIES) {
    const label = getLocalizedItemMetadataName({
      fallback: category,
      language: 'de',
      kind: 'category',
    });

    assert.ok(label, `Missing German label for ${category}`);
    if (category !== 'other') {
      assert.notEqual(label, 'Sonstige Items', `Generic fallback used for ${category}`);
    }
    assert.notEqual(label, category, `Raw category identifier leaked for ${category}`);
  }
});

test('uses localized API metadata names and safe German fallbacks', () => {
  assert.equal(getLocalizedItemMetadataName({
    details: {
      names: [
        { language: { name: 'de' }, name: 'Offizielle Kategorie' },
        { language: { name: 'en' }, name: 'Official category' },
      ],
    },
    fallback: 'medicine',
    language: 'de',
    kind: 'category',
  }), 'Offizielle Kategorie');

  assert.equal(getLocalizedItemMetadataName({
    fallback: { identifier: 'medicine' },
    language: 'de',
    kind: 'category',
  }), 'Medizin');

  assert.equal(getLocalizedItemMetadataName({
    fallback: 'new-untranslated-category',
    language: 'de',
    kind: 'category',
  }), 'Sonstige Items');

  assert.equal(getLocalizedItemMetadataName({
    fallback: 'in-a-pinch',
    language: 'de',
    kind: 'category',
  }), 'Notfallbeeren');
  assert.equal(getLocalizedItemMetadataName({
    fallback: 'standard-balls',
    language: 'de',
    kind: 'category',
  }), 'Standardbälle');
  assert.equal(getLocalizedItemMetadataName({
    fallback: 'mega-stones',
    language: 'de',
    kind: 'category',
  }), 'Mega-Steine');
  assert.equal(getLocalizedItemMetadataName({
    fallback: 'z-crystals',
    language: 'de',
    kind: 'category',
  }), 'Z-Kristalle');
});

test('extracts safe catalog text from string and object entries', () => {
  const catalog = new Map([
    [1, 'Pummeluff'],
    [2, { name: 'Schiffswrack', subtitle: '' }],
    [3, { label: 'Sicherer Name' }],
    [4, { name: { de: 'Verschachtelter Name', en: 'Nested name' } }],
    [5, { identifier: 'unknown-place' }],
    [6, [{ generation_id: '3', game_index: '12' }]],
    ['7', { name: 'Stringschlüssel' }],
  ]);

  assert.equal(getCatalogLabel(catalog, 1, 'fallback'), 'Pummeluff');
  assert.equal(getCatalogLabel(catalog, 2, 'fallback'), 'Schiffswrack');
  assert.equal(getCatalogLabel(catalog, 3, 'fallback'), 'Sicherer Name');
  assert.equal(getCatalogLabel(catalog, 4, 'fallback'), 'Verschachtelter Name');
  assert.equal(getCatalogLabel(catalog, 5, 'fallback'), 'Unknown Place');
  assert.equal(getCatalogLabel(catalog, 6, { name: 'Fallback-Ort' }), 'Fallback Ort');
  assert.equal(getCatalogLabel(catalog, 7, 'fallback'), 'Stringschlüssel');
  assert.equal(getCatalogLabel({ 1: { name: 'Kein Map-Objekt' } }, 1, 'safe-fallback'), 'Safe Fallback');
  assert.doesNotMatch(getCatalogLabel(catalog, 2, 'fallback'), /\{|\[object Object\]/);
});

test('collects price version groups together with flavor text and machine groups', () => {
  const groups = getItemVersionGroupResources({
    flavor_text_entries: [{ version_group: { name: 'red-blue' } }],
    machines: [{ version_group: { name: 'yellow' } }],
    prices: [
      { version_group: { name: 'scarlet-violet' } },
      { version_group: { name: 'red-blue' } },
    ],
  });

  assert.deepEqual(groups.map((group) => group.name), [
    'red-blue',
    'yellow',
    'scarlet-violet',
  ]);
});

test('localizes concrete wild holders through the safe Pokémon catalog', () => {
  const rows = createHeldPokemonRows({
    heldByPokemon: [{
      pokemon: {
        name: 'raticate-alola-totem',
        url: 'https://pokeapi.co/api/v2/pokemon/10093/',
      },
      version_details: [{
        rarity: 5,
        version: { name: 'ultra-sun' },
      }],
    }],
    localizedNamesById: new Map([
      [10093, { name: 'Rattikarl – Alola-Totemform' }],
    ]),
    versionsByName: {
      'ultra-sun': {
        names: [{ language: { name: 'de' }, name: 'Ultrasonne' }],
      },
    },
    language: 'de',
  });

  assert.equal(rows[0].name, 'Rattikarl – Alola-Totemform');
  assert.equal(rows[0].versions[0].name, 'Ultrasonne');
  assert.equal(rows[0].versions[0].rarity, 5);
});

test('item details retain prices, effects, attributes, holders, games, and responsive dark-theme styles', () => {
  const source = readComponent('ItemDetails.vue');

  for (const requiredSource of [
    'ItemPriceOverview',
    'effect_entries',
    'flavor_text_entries',
    'details.value?.attributes',
    'held_by_pokemon',
    'getHolderVersionResources',
    'createHeldPokemonRows',
    'game_indices',
    'loadWildHolders',
    'loadGameAppearances',
    'var(--legacy-surface)',
    '@media (max-width: 760px)',
  ]) {
    assert.match(source, new RegExp(requiredSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('berry details retain all berry values and load prices from berry.item', () => {
  const source = readComponent('BerryDetails.vue');

  for (const requiredSource of [
    'ItemPriceOverview',
    'berryResponse.data.item?.name',
    'growth_time',
    'max_harvest',
    'size',
    'smoothness',
    'soil_dryness',
    'natural_gift_power',
    'natural_gift_type',
    'details.value?.flavors',
    'var(--legacy-surface)',
    '@media (max-width: 760px)',
  ]) {
    assert.match(source, new RegExp(requiredSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('explorer keeps search, pagination, category localization, detail navigation, and both compact prices', () => {
  const source = readComponent('ExplorerDirectory.vue');

  for (const requiredSource of [
    'props.searchQuery',
    'pagedResources',
    'pageCount',
    'selectedResource',
    'requestedResource',
    "'balls'",
    "'special-items'",
    'getLocalizedItemMetadataName',
    'createCompactItemPriceSummaries',
    'labels.purchasePrice',
    'labels.salePrice',
  ]) {
    assert.match(source, new RegExp(requiredSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
