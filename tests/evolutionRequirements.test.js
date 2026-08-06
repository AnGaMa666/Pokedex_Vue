import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectPokemonFormConditionResources,
  collectEvolutionResourceNames,
  collectEvolutionTransitions,
  normalizeEvolutionDetails,
  normalizePokemonFormConditions,
} from '../src/utils/evolutionRequirements.js';

test('keeps every alternative evolution detail instead of only the first one', () => {
  const details = normalizeEvolutionDetails([
    {
      trigger: { name: 'level-up' },
      min_level: 20,
      gender: 1,
    },
    {
      trigger: { name: 'level-up' },
      min_level: 20,
      gender: 2,
    },
  ]);

  assert.equal(details.length, 2);
  assert.equal(details[0].gender, 1);
  assert.equal(details[1].gender, 2);
});

test('extracts all transitions and all form-relevant conditions from a chain', () => {
  const transitions = collectEvolutionTransitions({
    species: {
      name: 'burmy',
      url: 'https://pokeapi.co/api/v2/pokemon-species/412/',
    },
    evolves_to: [
      {
        species: {
          name: 'wormadam',
          url: 'https://pokeapi.co/api/v2/pokemon-species/413/',
        },
        evolution_details: [
          {
            trigger: { name: 'level-up' },
            min_level: 20,
            gender: 1,
          },
        ],
        evolves_to: [],
      },
      {
        species: {
          name: 'mothim',
          url: 'https://pokeapi.co/api/v2/pokemon-species/414/',
        },
        evolution_details: [
          {
            trigger: { name: 'level-up' },
            min_level: 20,
            gender: 2,
          },
        ],
        evolves_to: [],
      },
    ],
  });

  assert.equal(transitions.length, 2);
  assert.deepEqual(
    transitions.map((transition) => [transition.targetName, transition.details[0].gender]),
    [['wormadam', 1], ['mothim', 2]],
  );
});

test('collects referenced items, moves, locations and species for localization', () => {
  const resources = collectEvolutionResourceNames([
    {
      sourceName: 'eevee',
      targetName: 'leafeon',
      details: [
        {
          item: 'leaf-stone',
          heldItem: '',
          knownMove: 'fairy-wind',
          location: 'eterna-forest',
          partySpecies: 'remoraid',
          tradeSpecies: '',
        },
      ],
    },
  ]);

  assert.deepEqual(resources.items, ['leaf-stone']);
  assert.deepEqual(resources.moves, ['fairy-wind']);
  assert.deepEqual(resources.locations, ['eterna-forest']);
  assert.deepEqual(resources.species.sort(), ['eevee', 'leafeon', 'remoraid']);
});

test('preserves every current evolution field and concrete source and target forms', () => {
  const [detail] = normalizeEvolutionDetails([{
    version_group: {
      name: 'sun-moon',
      url: 'https://pokeapi.co/api/v2/version-group/17/',
    },
    is_default: true,
    trigger: { name: 'level-up' },
    near_special_rock: true,
    needs_multiplayer: true,
    region: { name: 'alola' },
    base_form: {
      name: 'rattata-alola',
      url: 'https://pokeapi.co/api/v2/pokemon/10091/',
    },
    evolved_form: {
      name: 'raticate-alola',
      url: 'https://pokeapi.co/api/v2/pokemon/10092/',
    },
    used_move: { name: 'rage-fist' },
    min_move_count: 20,
    min_steps: 1000,
    min_damage_taken: 49,
  }]);

  assert.deepEqual({
    versionGroup: detail.versionGroup,
    versionGroupId: detail.versionGroupId,
    isDefault: detail.isDefault,
    nearSpecialRock: detail.nearSpecialRock,
    needsMultiplayer: detail.needsMultiplayer,
    region: detail.region,
    baseForm: detail.baseForm,
    evolvedForm: detail.evolvedForm,
    usedMove: detail.usedMove,
    minMoveCount: detail.minMoveCount,
    minSteps: detail.minSteps,
    minDamageTaken: detail.minDamageTaken,
  }, {
    versionGroup: 'sun-moon',
    versionGroupId: 17,
    isDefault: true,
    nearSpecialRock: true,
    needsMultiplayer: true,
    region: 'alola',
    baseForm: 'rattata-alola',
    evolvedForm: 'raticate-alola',
    usedMove: 'rage-fist',
    minMoveCount: 20,
    minSteps: 1000,
    minDamageTaken: 49,
  });
});

test('keeps Alolan Rattata evolution separate from the default Rattata path', () => {
  const [transition] = collectEvolutionTransitions({
    species: {
      name: 'rattata',
      url: 'https://pokeapi.co/api/v2/pokemon-species/19/',
    },
    evolves_to: [{
      species: {
        name: 'raticate',
        url: 'https://pokeapi.co/api/v2/pokemon-species/20/',
      },
      evolution_details: [
        {
          version_group: { name: 'red-blue' },
          is_default: true,
          trigger: { name: 'level-up' },
          min_level: 20,
          base_form: null,
          evolved_form: null,
        },
        {
          version_group: { name: 'sun-moon' },
          is_default: true,
          trigger: { name: 'level-up' },
          min_level: 20,
          time_of_day: 'night',
          base_form: {
            name: 'rattata-alola',
            url: 'https://pokeapi.co/api/v2/pokemon/10091/',
          },
          evolved_form: {
            name: 'raticate-alola',
            url: 'https://pokeapi.co/api/v2/pokemon/10092/',
          },
        },
      ],
      evolves_to: [],
    }],
  });

  assert.equal(transition.details.length, 2);
  assert.equal(transition.details[0].baseForm, '');
  assert.equal(transition.details[1].baseForm, 'rattata-alola');
  assert.equal(transition.details[1].evolvedForm, 'raticate-alola');
  assert.equal(transition.details[1].timeOfDay, 'night');
});

test('normalizes and classifies concrete PokemonForm trigger conditions', () => {
  const forms = normalizePokemonFormConditions([{
    id: 10134,
    name: 'charizard-mega-x',
    form_name: 'mega-x',
    is_battle_only: true,
    is_mega: true,
    pokemon: {
      name: 'charizard-mega-x',
      url: 'https://pokeapi.co/api/v2/pokemon/10034/',
    },
    trigger_conditions: [{
      trigger: 'held-item',
      name: 'charizardite-x',
      url: 'https://pokeapi.co/api/v2/item/699/',
      base_form: null,
    }],
  }]);
  const resources = collectPokemonFormConditionResources(forms);

  assert.equal(forms.length, 1);
  assert.equal(forms[0].pokemonName, 'charizard-mega-x');
  assert.equal(forms[0].conditions[0].resourceKind, 'item');
  assert.deepEqual(resources.items, ['charizardite-x']);
  assert.deepEqual(resources.moves, []);
});
