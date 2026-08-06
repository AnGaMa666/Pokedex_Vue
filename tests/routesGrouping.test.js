import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLocationRegionIndex,
  getAdditionalLocationGenerations,
  getLocationGenerations,
  getLocationKind,
  getPrimaryLocationGeneration,
  getSafeDisplayText,
  groupGameVersionsByGeneration,
  groupLocationsByGeneration,
  LOCATION_GENERATIONS,
  locationMatchesFilters,
  sortGameVersions,
  sortLocations,
} from '../src/utils/locationGrouping.js';

const location = (id, name) => ({ id, name });

test('turns structured catalog values into readable labels without exposing JSON', () => {
  assert.equal(getSafeDisplayText({ name: 'Schiffswrack', subtitle: '' }, 'shipwreck'), 'Schiffswrack');
  assert.equal(getSafeDisplayText({ label: 'Route 1' }, 'route-1'), 'Route 1');
  assert.equal(getSafeDisplayText({ name: { de: 'Siegesstraße' } }, 'victory-road'), 'Siegesstraße');
  assert.equal(getSafeDisplayText({ unexpected: true }, 'Fallback name'), 'Fallback name');
  assert.equal(getSafeDisplayText({ unexpected: true }), '');
});

test('classifies every supported location type from real location-style identifiers', () => {
  const cases = new Map([
    ['cerulean-city', 'city'],
    ['sinnoh-route-201', 'route'],
    ['union-cave', 'cave'],
    ['pokemon-tower', 'building'],
    ['cinnabar-island', 'island'],
    ['viridian-forest', 'forest'],
    ['mt-coronet', 'mountain'],
    ['lake-acuity', 'water'],
    ['battle-frontier', 'other'],
  ]);

  for (const [identifier, expectedKind] of cases) {
    assert.equal(getLocationKind(identifier), expectedKind, identifier);
  }
  assert.equal(getLocationKind('mysterious-place', 'Alte Höhle'), 'cave');
});

test('uses the earliest indexed generation and retains later appearances', () => {
  const entries = [
    { generation_id: '6', game_index: '42' },
    { generation_id: '2', game_index: '7' },
    { generation_id: '4', game_index: '21' },
    { generation_id: '2', game_index: '8' },
  ];

  assert.deepEqual(getLocationGenerations(entries), [2, 4, 6]);
  assert.equal(getPrimaryLocationGeneration(entries), 2);
  assert.deepEqual(getAdditionalLocationGenerations(entries), [4, 6]);
});

test('falls back to canonical region generations only when game indices are absent', () => {
  assert.deepEqual(getLocationGenerations([], ['hisui']), [8]);
  assert.deepEqual(getLocationGenerations([], ['galar', 'paldea']), [8, 9]);
  assert.deepEqual(getLocationGenerations([{ generation_id: 3 }], ['paldea']), [3]);
});

test('builds bidirectional region metadata without loading individual locations', () => {
  const indexes = buildLocationRegionIndex([
    {
      name: 'kanto',
      locations: [{ name: 'pallet-town' }, { name: 'indigo-plateau' }],
    },
    {
      name: 'johto',
      locations: [{ name: 'new-bark-town' }, { name: 'indigo-plateau' }],
    },
  ]);

  assert.deepEqual(indexes.locationRegions.get('indigo-plateau'), ['kanto', 'johto']);
  assert.deepEqual([...indexes.regionLocations.get('kanto')], ['pallet-town', 'indigo-plateau']);
  assert.equal(indexes.regionLocations.get('johto').has('new-bark-town'), true);
});

test('groups multi-generation locations under their earliest introduction', () => {
  const entries = new Map([
    [1, [{ generation_id: 3, game_index: 20 }, { generation_id: 6, game_index: 30 }]],
    [2, [{ generation_id: 1, game_index: 2 }]],
    [3, [{ generation_id: 2, game_index: 1 }]],
  ]);
  const groups = groupLocationsByGeneration({
    locations: [location(1, 'southern-island'), location(2, 'pallet-town'), location(3, 'new-bark-town')],
    locationGameIndices: entries,
    getLabel: (entry) => entry.name,
    language: 'de',
  });

  assert.deepEqual(groups.map((group) => group.generation), [1, 2, 3]);
  assert.deepEqual(groups.map((group) => group.locations.map((entry) => entry.id)), [[2], [3], [1]]);
  assert.equal(groups[2].label, 'Generation III');
});

test('can create the complete default Generation I through IX section structure', () => {
  const groups = groupLocationsByGeneration({
    locations: [],
    includeEmptyGenerations: true,
    language: 'en',
  });

  assert.deepEqual(groups.map((group) => group.generation), LOCATION_GENERATIONS);
  assert.equal(groups[0].label, 'Generation I');
  assert.equal(groups.at(-1).label, 'Generation IX');
});

test('generation filters include later appearances while grouping remains based on introduction', () => {
  const multiGenerationLocation = location(25, 'victory-road');
  const indices = new Map([[25, [
    { generation_id: 1, game_index: 88 },
    { generation_id: 3, game_index: 91 },
  ]]]);

  assert.equal(locationMatchesFilters({
    location: multiGenerationLocation,
    locationGameIndices: indices,
    generation: '3',
    localizedLabel: 'Siegesstraße',
  }), true);
  assert.equal(getPrimaryLocationGeneration(indices.get(25)), 1);
});

test('filters cities, routes and other places independently', () => {
  assert.equal(locationMatchesFilters({
    location: location(1, 'lavender-town'),
    kind: 'city',
    localizedLabel: 'Lavandia',
  }), true);
  assert.equal(locationMatchesFilters({
    location: location(2, 'kanto-route-1'),
    kind: 'route',
  }), true);
  assert.equal(locationMatchesFilters({
    location: location(3, 'battle-frontier'),
    kind: 'other',
  }), true);
  assert.equal(locationMatchesFilters({
    location: location(3, 'battle-frontier'),
    kind: 'route',
  }), false);
});

test('sorts by generation and game index, name, number, region and requested priority', () => {
  const entries = [
    location(30, 'johto-route-29'),
    location(20, 'viridian-city'),
    location(10, 'kanto-route-1'),
    location(40, 'pallet-town'),
  ];
  const gameIndices = new Map([
    [10, [{ generation_id: 1, game_index: 10 }]],
    [20, [{ generation_id: 1, game_index: 20 }]],
    [30, [{ generation_id: 2, game_index: 1 }]],
    [40, [{ generation_id: 1, game_index: 40 }]],
  ]);
  const regions = new Map([
    ['johto-route-29', ['johto']],
    ['viridian-city', ['kanto']],
    ['kanto-route-1', ['kanto']],
    ['pallet-town', ['kanto']],
  ]);
  const options = {
    locations: entries,
    locationGameIndices: gameIndices,
    locationRegions: regions,
    getLabel: (entry) => ({ name: entry.name }),
  };

  assert.deepEqual(sortLocations({ ...options, mode: 'generation-game' }).map((entry) => entry.id), [10, 20, 40, 30]);
  assert.deepEqual(sortLocations({ ...options, mode: 'number' }).map((entry) => entry.id), [10, 20, 30, 40]);
  assert.deepEqual(sortLocations({ ...options, mode: 'region' }).map((entry) => entry.id), [10, 40, 20, 30]);
  assert.equal(sortLocations({ ...options, mode: 'city-first' })[0].name, 'viridian-city');
  assert.equal(sortLocations({ ...options, mode: 'route-first' })[0].name, 'kanto-route-1');
  assert.deepEqual(sortLocations({ ...options, mode: 'name' }).map((entry) => entry.name), [
    'johto-route-29',
    'kanto-route-1',
    'pallet-town',
    'viridian-city',
  ]);
});

test('orders encounter games chronologically and groups them from Generation I to IX', () => {
  const versions = sortGameVersions(['violet', 'blue', 'black-2', 'red', 'scarlet', 'gold']);
  assert.deepEqual(versions, ['red', 'blue', 'gold', 'black-2', 'scarlet', 'violet']);

  const sections = groupGameVersionsByGeneration(versions, 'de');
  assert.deepEqual(sections.map((section) => section.generation), [1, 2, 5, 9]);
  assert.equal(sections[0].label, 'Generation I');
  assert.deepEqual(sections.at(-1).versions, ['scarlet', 'violet']);
});
