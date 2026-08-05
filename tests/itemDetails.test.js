import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createGameAppearanceRows,
  createHeldPokemonRows,
  getHolderVersionResources,
  getItemVersionGroupResources,
  getLocalizedItemMetadataName,
  getVersionResourcesFromGroups,
} from '../src/utils/itemDetails.js';

test('deduplicates item version groups from flavor texts and machines', () => {
  const groups = getItemVersionGroupResources({
    flavor_text_entries: [
      {
        version_group: {
          name: 'red-blue',
          url: 'https://pokeapi.co/api/v2/version-group/1/',
        },
      },
      {
        version_group: {
          name: 'red-blue',
          url: 'https://pokeapi.co/api/v2/version-group/1/',
        },
      },
    ],
    machines: [
      {
        version_group: {
          name: 'yellow',
          url: 'https://pokeapi.co/api/v2/version-group/2/',
        },
      },
    ],
  });

  assert.deepEqual(
    groups.map((group) => group.name),
    ['red-blue', 'yellow'],
  );
});

test('collects unique game versions from groups and wild holder data', () => {
  const groupVersions = getVersionResourcesFromGroups([
    {
      versions: [
        { name: 'red', url: 'https://pokeapi.co/api/v2/version/1/' },
        { name: 'blue', url: 'https://pokeapi.co/api/v2/version/2/' },
      ],
    },
    {
      versions: [
        { name: 'blue', url: 'https://pokeapi.co/api/v2/version/2/' },
        { name: 'yellow', url: 'https://pokeapi.co/api/v2/version/3/' },
      ],
    },
  ]);
  const holderVersions = getHolderVersionResources([
    {
      version_details: [
        {
          version: { name: 'red', url: 'https://pokeapi.co/api/v2/version/1/' },
        },
        {
          version: { name: 'red', url: 'https://pokeapi.co/api/v2/version/1/' },
        },
      ],
    },
  ]);

  assert.deepEqual(
    groupVersions.map((version) => version.name),
    ['red', 'blue', 'yellow'],
  );
  assert.deepEqual(
    holderVersions.map((version) => version.name),
    ['red'],
  );
});

test('creates localized game appearance rows', () => {
  const rows = createGameAppearanceRows({
    versionGroups: [
      {
        id: 1,
        name: 'red-blue',
        order: 1,
        generation: { name: 'generation-i' },
        versions: [
          { name: 'red' },
          { name: 'blue' },
        ],
      },
    ],
    versionsByName: {
      red: {
        names: [
          { language: { name: 'de' }, name: 'Rot' },
          { language: { name: 'en' }, name: 'Red' },
        ],
      },
      blue: {
        names: [
          { language: { name: 'de' }, name: 'Blau' },
          { language: { name: 'en' }, name: 'Blue' },
        ],
      },
    },
    language: 'de',
  });

  assert.deepEqual(rows, [
    {
      id: 1,
      groupName: 'Rot / Blau',
      generation: 'Generation I',
      games: [
        { slug: 'red', name: 'Rot' },
        { slug: 'blue', name: 'Blau' },
      ],
    },
  ]);
});

test('creates localized wild holder rows with game-specific rarity', () => {
  const rows = createHeldPokemonRows({
    heldByPokemon: [
      {
        pokemon: {
          name: 'chansey',
          url: 'https://pokeapi.co/api/v2/pokemon/113/',
        },
        version_details: [
          {
            rarity: 50,
            version: { name: 'soulsilver' },
          },
        ],
      },
    ],
    speciesByName: {
      chansey: {
        names: [
          { language: { name: 'de' }, name: 'Chaneira' },
          { language: { name: 'en' }, name: 'Chansey' },
        ],
      },
    },
    versionsByName: {
      soulsilver: {
        names: [
          { language: { name: 'de' }, name: 'SoulSilver' },
          { language: { name: 'en' }, name: 'SoulSilver' },
        ],
      },
    },
    language: 'de',
  });

  assert.deepEqual(rows, [
    {
      id: 113,
      slug: 'chansey',
      name: 'Chaneira',
      spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/113.png',
      versions: [
        {
          slug: 'soulsilver',
          name: 'SoulSilver',
          rarity: 50,
        },
      ],
    },
  ]);
});

test('uses German attribute fallbacks when metadata requests fail', () => {
  assert.equal(
    getLocalizedItemMetadataName({
      fallback: 'usable-in-battle',
      language: 'de',
      kind: 'attribute',
    }),
    'Im Kampf einsetzbar',
  );
});

test('does not fall back to English item attribute names in German mode', () => {
  assert.equal(
    getLocalizedItemMetadataName({
      details: {
        names: [
          { language: { name: 'en' }, name: 'Consumable' },
        ],
      },
      fallback: 'consumable',
      language: 'de',
      kind: 'attribute',
    }),
    'Verbrauchbar',
  );
});

test('translates standard ball category in German mode', () => {
  assert.equal(
    getLocalizedItemMetadataName({
      details: {
        names: [
          { language: { name: 'en' }, name: 'Standard Balls' },
        ],
      },
      fallback: 'standard-balls',
      language: 'de',
      kind: 'category',
    }),
    'Standardbälle',
  );
});

test('prefers an exact German metadata name when PokéAPI provides one', () => {
  assert.equal(
    getLocalizedItemMetadataName({
      details: {
        names: [
          { language: { name: 'de' }, name: 'Offizielle Übersetzung' },
          { language: { name: 'en' }, name: 'Official translation' },
        ],
      },
      fallback: 'standard-balls',
      language: 'de',
      kind: 'category',
    }),
    'Offizielle Übersetzung',
  );
});
