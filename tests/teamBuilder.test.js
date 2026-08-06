import assert from 'node:assert/strict';
import test from 'node:test';
import { computed, reactive } from 'vue';
import {
  buildHeldItemCatalog,
  classifyHeldItem,
  createTeamExport,
  filterTeamBuilderOptions,
  getMoveLearnMethodLabel,
  getPokemonMoveAvailability,
  mapWithConcurrency,
} from '../src/utils/teamBuilder.js';

const namedResource = (name, collection, id) => ({
  name,
  url: `https://pokeapi.co/api/v2/${collection}/${id}/`,
});

test('held-item catalog uses real attributes and excludes balls and machines', () => {
  const attributePayloads = [{
    name: 'holdable',
    items: [
      namedResource('choice-scarf', 'item', 287),
      namedResource('oran-berry', 'item', 132),
      namedResource('master-ball', 'item', 1),
      namedResource('tm01', 'item', 305),
    ],
  }];
  const categoryPayloads = [
    {
      name: 'choice',
      names: [{ name: 'Wahlitems', language: { name: 'de' } }],
      items: [namedResource('choice-scarf', 'item', 287)],
    },
    {
      name: 'picky-healing',
      names: [{ name: 'Selektive Heilung', language: { name: 'de' } }],
      items: [namedResource('oran-berry', 'item', 132)],
    },
    {
      name: 'standard-balls',
      names: [{ name: 'Standardbälle', language: { name: 'de' } }],
      items: [namedResource('master-ball', 'item', 1)],
    },
    {
      name: 'all-machines',
      names: [{ name: 'Technische Maschinen', language: { name: 'de' } }],
      items: [namedResource('tm01', 'item', 305)],
    },
    {
      name: 'mega-stones',
      names: [{ name: 'Mega-Steine', language: { name: 'de' } }],
      items: [namedResource('charizardite-x', 'item', 660)],
    },
  ];

  const catalog = buildHeldItemCatalog({ attributePayloads, categoryPayloads });

  assert.deepEqual(catalog.map((item) => item.name), [
    'choice-scarf',
    'oran-berry',
    'charizardite-x',
  ]);
  assert.equal(catalog[0].category, 'choice-items');
  assert.equal(catalog[1].category, 'berries');
  assert.equal(catalog[2].category, 'form-items');
  assert.equal(catalog[0].apiCategory.de, 'Wahlitems');
});

test('held-item classification rejects uncategorized and non-holdable resources', () => {
  assert.equal(classifyHeldItem({
    name: 'leftovers',
    categoryName: 'held-items',
    attributes: ['holdable', 'holdable-passive'],
  }), 'healing-items');
  assert.equal(classifyHeldItem({
    name: 'master-ball',
    categoryName: 'standard-balls',
    attributes: ['holdable'],
  }), null);
  assert.equal(classifyHeldItem({
    name: 'potion',
    categoryName: 'healing',
    attributes: ['holdable'],
  }), null);
  assert.equal(classifyHeldItem({
    name: 'berry-juice',
    categoryName: 'healing',
    attributes: ['holdable'],
  }), 'healing-items');
  assert.equal(classifyHeldItem({
    name: 'mystery-item',
    categoryName: '',
    attributes: ['holdable'],
  }), null);
  assert.equal(classifyHeldItem({
    name: 'fire-stone',
    categoryName: 'evolution',
    attributes: ['countable'],
  }), null);
});

test('move availability remains tied to the concrete Pokémon move entry', () => {
  const availability = getPokemonMoveAvailability({
    move: namedResource('flare-blitz', 'move', 394),
    version_group_details: [
      {
        level_learned_at: 62,
        move_learn_method: namedResource('level-up', 'move-learn-method', 1),
        version_group: namedResource('x-y', 'version-group', 15),
      },
      {
        level_learned_at: 0,
        move_learn_method: namedResource('machine', 'move-learn-method', 4),
        version_group: namedResource('scarlet-violet', 'version-group', 25),
      },
    ],
  });

  assert.deepEqual(availability.methods, ['level-up', 'machine']);
  assert.deepEqual(availability.versionGroups, ['x-y', 'scarlet-violet']);
  assert.equal(availability.learning[0].level, 62);
  assert.equal(getMoveLearnMethodLabel('form-change', 'de'), 'Formwechsel');
});

test('picker categories and move filters only return matching concrete options', () => {
  const itemOptions = [
    { value: '', label: 'Kein Item' },
    { value: 'choice-scarf', label: 'Wahlschal', category: 'choice-items' },
    { value: 'oran-berry', label: 'Sinelbeere', category: 'berries' },
  ];
  assert.deepEqual(filterTeamBuilderOptions(itemOptions, {
    categoriesEnabled: true,
    selectedCategory: 'choice-items',
  }).map((option) => option.value), ['', 'choice-scarf']);

  const moveOptions = [
    {
      value: 'flare-blitz',
      label: 'Flammenblitz',
      filterValues: {
        type: 'fire',
        damageClass: 'physical',
        learnMethod: ['level-up'],
        versionGroup: ['x-y'],
      },
    },
    {
      value: 'air-slash',
      label: 'Luftschnitt',
      filterValues: {
        type: 'flying',
        damageClass: 'special',
        learnMethod: ['level-up', 'tutor'],
        versionGroup: ['x-y'],
      },
    },
  ];
  assert.deepEqual(filterTeamBuilderOptions(moveOptions, {
    filters: [{ key: 'type' }, { key: 'learnMethod' }],
    filterValues: { type: 'fire', learnMethod: 'level-up' },
  }).map((option) => option.value), ['flare-blitz']);
  assert.deepEqual(filterTeamBuilderOptions(moveOptions, {
    query: 'luft schnitt',
  }).map((option) => option.value), ['air-slash']);
});

test('team export reacts immediately to nested form, level, move, EV and IV changes', () => {
  const slots = reactive([{
    details: { name: 'charizard-mega-x' },
    speciesName: 'charizard-mega-x',
    ability: 'tough-claws',
    item: 'charizardite-x',
    level: 50,
    nature: 'jolly',
    moves: ['flare-blitz', '', '', ''],
    evs: { hp: 0, attack: 252, defense: 0, 'special-attack': 0, 'special-defense': 4, speed: 252 },
    ivs: { hp: 31, attack: 31, defense: 31, 'special-attack': 0, 'special-defense': 31, speed: 31 },
  }]);
  const exportText = computed(() => createTeamExport(slots, {
    mode: 'showdown',
    statNames: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'],
  }));

  assert.match(exportText.value, /^Charizard-Mega-X @ Charizardite-X/m);
  assert.match(exportText.value, /Level: 50/);
  assert.match(exportText.value, /- Flare Blitz/);

  slots[0].level = 100;
  slots[0].moves[0] = 'dragon-claw';
  slots[0].evs.attack = 248;
  slots[0].ivs['special-attack'] = 31;

  assert.match(exportText.value, /Level: 100/);
  assert.match(exportText.value, /- Dragon Claw/);
  assert.match(exportText.value, /EVs: 248 Atk/);
  assert.doesNotMatch(exportText.value, /IVs:/);
});

test('bounded mapper never exceeds the requested concurrency', async () => {
  let running = 0;
  let maximumRunning = 0;
  const result = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (value) => {
    running += 1;
    maximumRunning = Math.max(maximumRunning, running);
    await new Promise((resolve) => setTimeout(resolve, 2));
    running -= 1;
    return value * 2;
  });

  assert.equal(maximumRunning, 3);
  assert.deepEqual(result, [2, 4, 6, 8, 10, 12, 14]);
});
