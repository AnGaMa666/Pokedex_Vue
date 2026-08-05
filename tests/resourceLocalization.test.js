import assert from 'node:assert/strict';
import test from 'node:test';
import { getLocalizedMoveDescription } from '../src/utils/resource.js';

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
