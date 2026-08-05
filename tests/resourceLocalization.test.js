import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLocalizedItemDescription,
  getLocalizedMoveDescription,
} from '../src/utils/resource.js';

test('uses localized move flavor text when no localized effect entry exists', () => {
  const description = getLocalizedMoveDescription({
    effectEntries: [
      {
        language: { name: 'en' },
        short_effect: 'Inflicts regular damage with recoil.',
      },
    ],
    flavorTextEntries: [
      {
        language: { name: 'de' },
        flavor_text: 'Lebensgefährlicher Angriff, bei dem sich der Angreifer selbst verletzt.',
      },
    ],
    language: 'de',
  });

  assert.equal(
    description,
    'Lebensgefährlicher Angriff, bei dem sich der Angreifer selbst verletzt.',
  );
});

test('keeps the exact localized effect entry when it exists', () => {
  const description = getLocalizedMoveDescription({
    effectEntries: [
      {
        language: { name: 'de' },
        short_effect: 'Hat eine Chance von $effect_chance Prozent.',
      },
    ],
    effectChance: 30,
    language: 'de',
  });

  assert.equal(description, 'Hat eine Chance von 30 Prozent.');
});

test('uses localized item game text instead of an English effect fallback', () => {
  const description = getLocalizedItemDescription({
    effectEntries: [
      {
        language: { name: 'en' },
        short_effect: 'Catches a wild Pokémon every time.',
      },
    ],
    flavorTextEntries: [
      {
        language: { name: 'de' },
        text: 'Der beste Ball! Damit fängst du garantiert jedes wilde Pokémon.',
      },
    ],
    language: 'de',
  });

  assert.equal(
    description,
    'Der beste Ball! Damit fängst du garantiert jedes wilde Pokémon.',
  );
});

test('keeps a localized item effect when the API provides one', () => {
  const description = getLocalizedItemDescription({
    effectEntries: [
      {
        language: { name: 'de' },
        short_effect: 'Belebt alle besiegten Pokémon vollständig wieder.',
      },
      {
        language: { name: 'en' },
        short_effect: 'Revives all fainted Pokémon with full HP.',
      },
    ],
    flavorTextEntries: [
      {
        language: { name: 'de' },
        text: 'Eine sehr bittere Heilpflanze.',
      },
    ],
    language: 'de',
  });

  assert.equal(
    description,
    'Belebt alle besiegten Pokémon vollständig wieder.',
  );
});
