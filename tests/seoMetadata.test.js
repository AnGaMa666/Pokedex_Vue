import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const SOCIAL_PROFILES = [
  'https://www.twitch.tv/angama666',
  'https://www.tiktok.com/@angamavt',
  'https://www.instagram.com/angama666/',
  'https://x.com/AnGaMa666',
  'https://github.com/AnGaMa666',
];

const extractJsonLd = (html) => {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'index.html must contain JSON-LD structured data');
  return JSON.parse(match[1]);
};

test('connects the canonical Pokédex with all official AnGaMa profiles', async () => {
  const html = await readProjectFile('index.html');

  assert.match(html, /<html lang="de">/);
  assert.match(html, /<title>AnGaMa Pokédex/);
  assert.match(html, /https:\/\/pokedex\.byangama\.de\//);
  assert.match(html, /AnGaMa Pokédex von Twitch-Creator AnGaMa666/);
  assert.match(html, /twitter:site" content="@AnGaMa666"/);

  for (const profile of SOCIAL_PROFILES) {
    assert.ok(html.includes(profile), `index.html must include ${profile}`);
  }

  assert.ok((html.match(/rel="me"/g) || []).length >= SOCIAL_PROFILES.length);
});

test('publishes valid Organization, WebSite and WebApplication JSON-LD nodes', async () => {
  const html = await readProjectFile('index.html');
  const structuredData = extractJsonLd(html);
  const graph = structuredData['@graph'];

  assert.ok(Array.isArray(graph));
  const organization = graph.find((entry) => entry['@type'] === 'Organization');
  assert.ok(organization);
  assert.equal(organization.name, 'AnGaMa');

  for (const profile of SOCIAL_PROFILES) {
    assert.ok(organization.sameAs.includes(profile), `sameAs must include ${profile}`);
  }

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
  assert.match(llms, /AnGaMaVT/);

  for (const profile of SOCIAL_PROFILES) {
    assert.ok(llms.includes(profile), `llms.txt must include ${profile}`);
  }
});
