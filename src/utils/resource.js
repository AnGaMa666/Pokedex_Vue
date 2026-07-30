export const formatResourceName = (name = '') => {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const formatResourceId = (id, length = 4) => {
  return String(id ?? '').padStart(length, '0');
};

export const getResourceId = (url = '') => {
  const match = url.match(/\/(\d+)\/?(?:\?.*)?$/);
  return match ? Number(match[1]) : null;
};

export const getLocalizedName = (names = [], fallback = '', language = 'en') => {
  const localizedName = names.find((entry) => entry.language?.name === language)?.name;
  return localizedName || formatResourceName(fallback);
};

export const getLocalizedEffect = (entries = [], effectChance = null) => {
  const effect = entries.find((entry) => entry.language?.name === 'en')?.short_effect || '';

  if (!effect) {
    return 'No effect description is available.';
  }

  return effect.replaceAll('$effect_chance', effectChance ?? '—');
};

export const getLocalizedFlavorText = (entries = [], language = 'en') => {
  const entry = entries.find((candidate) => candidate.language?.name === language);
  return entry?.flavor_text?.replace(/[\n\f]+/g, ' ') || '';
};
