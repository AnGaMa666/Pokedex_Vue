import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const extractJsonLd = (html) => {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'index.html must contain JSON-LD structured data');
  return JSON.parse(match[1]);
};

test('connects the canonical Pokédex with the AnGaMa Twitch identity', async () => {
  const html = await readProjectFile('index.html');

  assert.match(html, /<html lang="de">/);
  assert.match(html, /<title>AnGaMa Pokédex/);
  assert.match(html, /https:\/\/pokedex\.byangama\.de\//);
  assert.match(html, /https:\/\/www\.twitch\.tv\/angama666/);
  assert.match(html, /rel="me"/);
  assert.match(html, /AnGaMa Pokédex von Twitch-Creator AnGaMa666/);
});

test('publishes valid Organization, WebSite and WebApplication JSON-LD nodes', async () => {
  const html = await readProjectFile('index.html');
  const structuredData = extractJsonLd(html);
  const graph = structuredData['@graph'];

  assert.ok(Array.isArray(graph));
  assert.ok(graph.some((entry) => entry['@type'] === 'Organization'
    && entry.name === 'AnGaMa'
    && entry.sameAs.includes('https://www.twitch.tv/angama666')));
  assert.ok(graph.some((entry) => entry['@type'] === 'WebSite'
    && entry.name === 'AnGaMa Pokédex'));
  assert.ok(graph.some((entry) => entry['@type'] === 'WebApplication'
    && entry.isAccessibleForFree === true));
});

test('exposes sitemap, robots and machine-readable project information', async () => {
  const [robots, sitemap, llms] = await Promise.all([
    readProjectFile('public/robots.txt'),
    readProjectFile('public/sitemap.xml'),
    readProjectFile('public/llms.txt'),
  ]);

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Sitemap: https:\/\/pokedex\.byangama\.de\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/pokedex\.byangama\.de\/<\/loc>/);
  assert.match(llms, /AnGaMa Pokédex/);
  assert.match(llms, /https:\/\/www\.twitch\.tv\/angama666/);
});
