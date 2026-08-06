import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('renders the legal footer on every application section', async () => {
  const app = await readProjectFile('src/App.vue');

  assert.match(app, /import AppFooter from '.\/components\/AppFooter\.vue'/);
  assert.match(app, /<AppFooter\s*\/>/);
});

test('footer documents privacy, rights, sources and disclaimer information', async () => {
  const footer = await readProjectFile('src/components/AppFooter.vue');

  assert.match(footer, /Datenschutz \/ DSGVO/);
  assert.match(footer, /Rechte und Datenquellen/);
  assert.match(footer, /Disclaimer \/ Haftungshinweis/);
  assert.match(footer, /pokeapi\.co/);
  assert.match(footer, /raw\.githubusercontent\.com/);
  assert.match(footer, /maximal sieben Tagen/);
  assert.match(footer, /keine eigene Reichweitenanalyse/);
  assert.match(footer, /stammen überwiegend aus PokéAPI/);
  assert.match(footer, /je Spielversion abweichen/);
  assert.match(footer, /historische oder editionsspezifische Informationen können unvollständig sein/);
  assert.match(footer, /Garantie für Vollständigkeit und Fehlerfreiheit/);
});
