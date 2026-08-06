import { getTypeColor } from './typeColors.js';

const TYPE_SYMBOLS = Object.freeze({
  normal: '●',
  fire: '▲',
  water: '◆',
  electric: 'ϟ',
  grass: '♧',
  ice: '✦',
  fighting: '✹',
  poison: '☠',
  ground: '◒',
  flying: '⌁',
  psychic: '◎',
  bug: '✳',
  rock: '⬟',
  ghost: '◉',
  dragon: '◇',
  dark: '☾',
  steel: '⬢',
  fairy: '✧',
  stellar: '✷',
  shadow: '◐',
  unknown: '?',
});

const escapeXml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export const getTypeSymbol = (typeName = '') => TYPE_SYMBOLS[typeName] || '?';

export const getTypeIconDataUri = (typeName = '') => {
  const color = getTypeColor(typeName) || '#64748b';
  const symbol = escapeXml(getTypeSymbol(typeName));
  const fontSize = 28;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${color}"/><circle cx="32" cy="32" r="22" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.55)" stroke-width="2"/><text x="32" y="41" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="${fontSize}" font-weight="900" fill="#fff">${symbol}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
