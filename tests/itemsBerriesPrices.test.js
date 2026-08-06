import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCompactItemPriceSummaries,
  createItemPriceSections,
  formatItemPrice,
  getCompactItemPriceSummary,
  getCurrencyLabel,
  normalizeItemPrices,
} from '../src/utils/itemPrices.js';

const versionGroup = (name, id) => ({
  name,
  url: `https://pokeapi.co/api/v2/version-group/${id}/`,
});

const currency = (name) => ({
  name,
  url: `https://pokeapi.co/api/v2/item-currency/${name}/`,
});

test('normal potion uses version-specific purchase and sale prices instead of legacy cost', () => {
  const prices = normalizeItemPrices({
    name: 'potion',
    cost: 9999,
    prices: [
      {
        purchase_price: 300,
        sell_price: 150,
        currency: currency('poke-dollar'),
        version_group: versionGroup('red-blue', 1),
      },
      {
        purchase_price: 200,
        sell_price: 100,
        currency: currency('poke-dollar'),
        version_group: versionGroup('scarlet-violet', 25),
      },
    ],
  });

  assert.deepEqual(
    prices.map((price) => [price.versionGroup, price.purchasePrice, price.sellPrice]),
    [
      ['red-blue', 300, 150],
      ['scarlet-violet', 200, 100],
    ],
  );
  assert.ok(prices.every((price) => price.source === 'prices'));
  assert.ok(prices.every((price) => price.purchasePrice !== 9999));
});

test('distinguishes null, zero, and missing values', () => {
  const prices = normalizeItemPrices({
    prices: [
      {
        purchase_price: null,
        sell_price: 0,
        currency: currency('poke-dollar'),
        version_group: versionGroup('red-blue', 1),
      },
      {
        purchase_price: 0,
        sell_price: null,
        currency: currency('poke-dollar'),
        version_group: versionGroup('yellow', 2),
      },
    ],
  });

  assert.equal(prices[0].purchasePrice, null);
  assert.equal(prices[0].sellPrice, 0);
  assert.equal(prices[1].purchasePrice, 0);
  assert.equal(prices[1].sellPrice, null);
  assert.equal(formatItemPrice(0, 'poke-dollar', 'de'), '0 ₽');
  assert.equal(formatItemPrice(null, 'poke-dollar', 'de'), 'Nicht verfügbar');
});

test('uses cost only when the prices field is completely absent', () => {
  assert.deepEqual(normalizeItemPrices({ prices: [], cost: 200 }), []);
  assert.deepEqual(normalizeItemPrices({ prices: null, cost: 200 }), []);

  const fallback = normalizeItemPrices({ cost: 0 });
  assert.equal(fallback.length, 1);
  assert.equal(fallback[0].purchasePrice, 0);
  assert.equal(fallback[0].sellPrice, null);
  assert.equal(fallback[0].source, 'legacy-cost');
  assert.equal(fallback[0].isFallback, true);
});

test('summarizes each currency independently without mixing amounts', () => {
  const summaries = createCompactItemPriceSummaries({
    prices: [
      {
        purchase_price: 300,
        sell_price: 150,
        currency: currency('poke-dollar'),
        version_group: versionGroup('red-blue', 1),
      },
      {
        purchase_price: 200,
        sell_price: 100,
        currency: currency('poke-dollar'),
        version_group: versionGroup('scarlet-violet', 25),
      },
      {
        purchase_price: 48,
        sell_price: 12,
        currency: currency('battle-point'),
        version_group: versionGroup('sword-shield', 20),
      },
    ],
  }, 'de');

  assert.equal(summaries.length, 2);
  const pokeDollarSummary = summaries.find((summary) => summary.currency === 'poke-dollar');
  const battlePointSummary = summaries.find((summary) => summary.currency === 'battle-point');

  assert.deepEqual(
    [pokeDollarSummary.purchaseAmount, pokeDollarSummary.sellAmount],
    [200, 150],
  );
  assert.equal(pokeDollarSummary.purchaseLabel, 'ab 200 ₽');
  assert.equal(pokeDollarSummary.sellLabel, 'bis 150 ₽');
  assert.deepEqual(
    [battlePointSummary.purchaseAmount, battlePointSummary.sellAmount],
    [48, 12],
  );
  assert.equal(battlePointSummary.purchaseLabel, 'ab 48 GP');
  assert.equal(battlePointSummary.sellLabel, 'bis 12 GP');
});

test('selects a useful compact summary without claiming all null rows are unavailable', () => {
  const summary = getCompactItemPriceSummary({
    prices: [
      {
        purchase_price: null,
        sell_price: null,
        currency: currency('poke-dollar'),
        version_group: versionGroup('red-blue', 1),
      },
      {
        purchase_price: 200,
        sell_price: 100,
        currency: currency('poke-dollar'),
        version_group: versionGroup('scarlet-violet', 25),
      },
    ],
  }, 'de');

  assert.equal(summary.purchaseLabel, 'ab 200 ₽');
  assert.equal(summary.sellLabel, 'bis 100 ₽');
});

test('creates chronological German price sections with exact null labels', () => {
  const sections = createItemPriceSections({
    prices: [
      {
        purchase_price: 200,
        sell_price: null,
        currency: currency('poke-dollar'),
        version_group: versionGroup('scarlet-violet', 25),
      },
      {
        purchase_price: null,
        sell_price: 0,
        currency: currency('poke-dollar'),
        version_group: versionGroup('red-blue', 1),
      },
    ],
  }, 'de');

  assert.deepEqual(sections.map((section) => section.label), ['Generation I', 'Generation IX']);
  assert.equal(sections[0].prices[0].versionGroupLabel, 'Rot / Blau');
  assert.equal(sections[0].prices[0].purchaseLabel, 'Nicht kaufbar');
  assert.equal(sections[0].prices[0].sellLabel, '0 ₽');
  assert.equal(sections[1].prices[0].sellLabel, 'Nicht verkaufbar');
});

test('marks the legacy cost section clearly as a fallback', () => {
  const sections = createItemPriceSections({ cost: 700 }, 'de');

  assert.equal(sections.length, 1);
  assert.equal(sections[0].isFallback, true);
  assert.equal(sections[0].label, 'Allgemeiner Listenpreis (Fallback)');
  assert.equal(sections[0].prices[0].purchaseLabel, '700 ₽');
  assert.equal(sections[0].prices[0].sellLabel, 'Nicht verkaufbar');
});

test('localizes known currencies and keeps unknown identifiers readable', () => {
  assert.equal(getCurrencyLabel('battle-point', 'de'), 'Gewinnpunkte');
  assert.equal(getCurrencyLabel('festival-coin', 'en'), 'Festival Coins');
  assert.equal(formatItemPrice(12, 'coin', 'en'), '12 Coins');
  assert.equal(getCurrencyLabel('mystery-token', 'de'), 'Mystery Token');
});
