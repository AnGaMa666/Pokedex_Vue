import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMoveLearnerRows,
  createPokemonVarietyOptions,
  getDefaultPokemonVariety,
  getPokemonFormLabel,
  isPokemonForSpecies,
  mapWithConcurrency,
  matchesPokemonReference,
} from '../src/utils/pokemonForms.js';
import { getTypeIconDataUri, getTypeSymbol } from '../src/utils/typeIcons.js';
import {
  getLatestVersionGroupName,
  getVersionGroupLabel,
  groupVersionGroupsByGeneration,
  sortVersionGroups,
} from '../src/utils/versionGroups.js';
import { useActivePokemonForm } from '../src/state/activePokemonForm.js';

const venusaurSpecies = {
  id: 3,
  name: 'venusaur',
  names: [
    { name: 'Bisaflor', language: { name: 'de' } },
    { name: 'Venusaur', language: { name: 'en' } },
  ],
  varieties: [
    {
      is_default: true,
      pokemon: { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' },
    },
    {
      is_default: false,
      pokemon: { name: 'venusaur-mega', url: 'https://pokeapi.co/api/v2/pokemon/10033/' },
    },
    {
      is_default: false,
      pokemon: { name: 'venusaur-gmax', url: 'https://pokeapi.co/api/v2/pokemon/10195/' },
    },
  ],
};

const createPokemon = (id, name, speciesId = 3, speciesName = 'venusaur') => ({
  id,
  name,
  species: {
    name: speciesName,
    url: `https://pokeapi.co/api/v2/pokemon-species/${speciesId}/`,
  },
  stats: [],
  moves: [],
  types: [],
});

test('joins varieties only through matching concrete Pokémon references and species', () => {
  const standard = createPokemon(3, 'venusaur');
  const mega = createPokemon(10033, 'venusaur-mega');
  const unrelatedDeoxys = createPokemon(10001, 'deoxys-speed', 386, 'deoxys');
  const options = createPokemonVarietyOptions({
    species: venusaurSpecies,
    detailsByName: new Map([
      ['venusaur', standard],
      ['venusaur-mega', mega],
      ['venusaur-gmax', unrelatedDeoxys],
    ]),
    catalog: new Map([
      [3, 'Bisaflor'],
      [10033, 'Mega-Bisaflor'],
      [10195, 'Gigadynamax-Bisaflor'],
    ]),
    language: 'de',
  });

  assert.deepEqual(options.map(({ id, name, label }) => ({ id, name, label })), [
    { id: 3, name: 'venusaur', label: 'Bisaflor' },
    { id: 10033, name: 'venusaur-mega', label: 'Mega-Bisaflor' },
  ]);
  assert.equal(getDefaultPokemonVariety(options)?.details, standard);
  assert.equal(isPokemonForSpecies(mega, venusaurSpecies), true);
  assert.equal(isPokemonForSpecies(unrelatedDeoxys, venusaurSpecies), false);
});

test('rejects a form-table style ID mismatch even when the map key looks correct', () => {
  const mismatched = createPokemon(10001, 'venusaur-mega');
  assert.equal(matchesPokemonReference(
    mismatched,
    venusaurSpecies.varieties[1].pokemon,
  ), false);

  const options = createPokemonVarietyOptions({
    species: venusaurSpecies,
    detailsByName: new Map([
      ['venusaur', createPokemon(3, 'venusaur')],
      ['venusaur-mega', mismatched],
    ]),
    language: 'de',
  });
  assert.deepEqual(options.map((option) => option.name), ['venusaur']);
});

test('keeps one verified active concrete variety and restores the real default variety', () => {
  const standard = {
    ...createPokemon(3, 'venusaur'),
    stats: [{ base_stat: 80, stat: { name: 'attack' } }],
    moves: [{ move: { name: 'tackle' }, version_group_details: [] }],
    types: [{ slot: 1, type: { name: 'grass' } }],
    abilities: [{ ability: { name: 'overgrow' }, is_hidden: false }],
  };
  const mega = {
    ...createPokemon(10033, 'venusaur-mega'),
    stats: [{ base_stat: 100, stat: { name: 'attack' } }],
    moves: [{ move: { name: 'petal-blizzard' }, version_group_details: [] }],
    types: [
      { slot: 1, type: { name: 'grass' } },
      { slot: 2, type: { name: 'poison' } },
    ],
    abilities: [{ ability: { name: 'thick-fat' }, is_hidden: false }],
  };
  const unrelatedDeoxys = createPokemon(10001, 'deoxys-speed', 386, 'deoxys');
  const state = useActivePokemonForm();
  state.clearActivePokemonForm();

  assert.equal(state.initializeActivePokemonForm(standard, venusaurSpecies), true);
  assert.equal(state.setActivePokemonForm(mega), true);
  assert.equal(state.activePokemonForm.value.name, 'venusaur-mega');
  assert.equal(state.activePokemonForm.value.stats[0].base_stat, 100);
  assert.equal(state.activePokemonForm.value.moves[0].move.name, 'petal-blizzard');
  assert.deepEqual(
    state.activePokemonForm.value.types.map((entry) => entry.type.name),
    ['grass', 'poison'],
  );
  assert.equal(state.activePokemonForm.value.abilities[0].ability.name, 'thick-fat');
  assert.equal(state.setActivePokemonForm(unrelatedDeoxys), false);
  assert.equal(state.activePokemonForm.value.name, 'venusaur-mega');
  assert.equal(state.resetActivePokemonForm()?.name, 'venusaur');
  assert.equal(state.activePokemonForm.value.name, 'venusaur');
  assert.equal(state.activePokemonForm.value.stats[0].base_stat, 80);
  assert.equal(state.activePokemonForm.value.moves[0].move.name, 'tackle');
  assert.deepEqual(
    state.activePokemonForm.value.types.map((entry) => entry.type.name),
    ['grass'],
  );
  assert.equal(state.activePokemonForm.value.abilities[0].ability.name, 'overgrow');

  state.clearActivePokemonForm(venusaurSpecies);
  assert.equal(state.activePokemonForm.value, null);
});

test('uses controlled German form fallbacks when no catalog entry is available', () => {
  const deoxysSpecies = {
    id: 386,
    name: 'deoxys',
    names: [{ name: 'Deoxys', language: { name: 'de' } }],
    varieties: [{
      is_default: true,
      pokemon: { name: 'deoxys-normal', url: 'https://pokeapi.co/api/v2/pokemon/386/' },
    }],
  };
  const speed = createPokemon(10001, 'deoxys-speed', 386, 'deoxys');

  assert.equal(getPokemonFormLabel({
    details: speed,
    species: deoxysSpecies,
    language: 'de',
  }), 'Deoxys – Initiativeform');
});

test('builds localized move learners with National number and explicit form status', () => {
  const learners = buildMoveLearnerRows({
    learnedByPokemon: [
      { name: 'venusaur-mega', url: 'https://pokeapi.co/api/v2/pokemon/10033/' },
      { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' },
    ],
    pokemonIndex: new Map([
      [3, { identifier: 'venusaur', species_id: '3', is_default: '1' }],
      [10033, { identifier: 'venusaur-mega', species_id: '3', is_default: '0' }],
    ]),
    pokemonCatalog: new Map([
      [3, 'Bisaflor'],
      [10033, 'Mega-Bisaflor'],
    ]),
    language: 'de',
  });

  assert.deepEqual(learners.map((entry) => ({
    id: entry.id,
    number: entry.number,
    label: entry.label,
    isDefault: entry.isDefault,
    isForm: entry.isForm,
  })), [
    { id: 3, number: 3, label: 'Bisaflor', isDefault: true, isForm: false },
    { id: 10033, number: 3, label: 'Mega-Bisaflor', isDefault: false, isForm: true },
  ]);
});

test('does not apply a catalog label when its Pokémon index identity disagrees', () => {
  const [learner] = buildMoveLearnerRows({
    learnedByPokemon: [
      { name: 'venusaur-gmax', url: 'https://pokeapi.co/api/v2/pokemon/10195/' },
    ],
    pokemonIndex: new Map([
      [10195, { identifier: 'deoxys-speed', species_id: '386', is_default: '0' }],
    ]),
    pokemonCatalog: new Map([[10195, 'Deoxys – Initiativeform']]),
    language: 'de',
  });

  assert.equal(learner.label, 'Venusaur Gmax');
  assert.equal(learner.number, 10195);
  assert.equal(learner.isForm, true);
});

test('sorts version groups by API generation and order and groups them chronologically', () => {
  const groups = [
    { id: 25, name: 'scarlet-violet', order: 27, generation: { name: 'generation-ix' } },
    { id: 2, name: 'yellow', order: 4, generation: { name: 'generation-i' } },
    { id: 1, name: 'red-blue', order: 3, generation: { name: 'generation-i' } },
    { id: 23, name: 'brilliant-diamond-shining-pearl', order: 25, generation: { name: 'generation-viii' } },
  ];

  assert.deepEqual(sortVersionGroups(groups).map((group) => group.name), [
    'red-blue',
    'yellow',
    'brilliant-diamond-shining-pearl',
    'scarlet-violet',
  ]);
  assert.deepEqual(
    groupVersionGroupsByGeneration(groups, 'de').map((section) => ({
      generation: section.generation,
      groups: section.groups.map((group) => group.label),
    })),
    [
      { generation: 1, groups: ['Rot / Blau', 'Gelb'] },
      { generation: 8, groups: ['Strahlender Diamant / Leuchtende Perle'] },
      { generation: 9, groups: ['Karmesin / Purpur'] },
    ],
  );
  assert.equal(getLatestVersionGroupName(groups), 'scarlet-violet');
});

test('uses understandable German names for the Japanese Generation I groups', () => {
  assert.equal(getVersionGroupLabel('blue-japan', 'de'), 'Japanische Blaue Edition');
  assert.equal(getVersionGroupLabel('red-green-japan', 'de'), 'Japanische Rote/Grüne Edition');
});

test('limits concurrent cached-resource orchestration without changing result order', async () => {
  let active = 0;
  let maximumActive = 0;
  const values = await mapWithConcurrency([1, 2, 3, 4, 5, 6], async (value) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setImmediate(resolve));
    active -= 1;
    return value * 2;
  }, 2);

  assert.equal(maximumActive, 2);
  assert.deepEqual(values, [2, 4, 6, 8, 10, 12]);
});

test('provides self-contained type symbols and encoded SVG icons for all current types', () => {
  for (const type of [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
    'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark',
    'steel', 'fairy', 'stellar', 'shadow', 'unknown',
  ]) {
    if (type !== 'unknown') assert.notEqual(getTypeSymbol(type), '?', `expected a symbol for ${type}`);
    assert.match(getTypeIconDataUri(type), /^data:image\/svg\+xml,/);
  }
});
