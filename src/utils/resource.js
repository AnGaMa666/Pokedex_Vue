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
  const englishName = names.find((entry) => entry.language?.name === 'en')?.name;
  return localizedName || englishName || formatResourceName(fallback);
};

const replaceEffectChance = (effect = '', effectChance = null) => {
  return effect.replaceAll('$effect_chance', effectChance ?? '—');
};

export const getLocalizedEffect = (
  entries = [],
  effectChance = null,
  language = 'en',
) => {
  const localizedEntry = entries.find((entry) => entry.language?.name === language)
    || entries.find((entry) => entry.language?.name === 'en');
  const effect = localizedEntry?.short_effect || '';

  if (!effect) {
    return language === 'de'
      ? 'Keine Effektbeschreibung verfügbar.'
      : 'No effect description is available.';
  }

  return replaceEffectChance(effect, effectChance);
};

export const getLocalizedFlavorText = (entries = [], language = 'en') => {
  const localizedEntries = entries.filter((candidate) => candidate.language?.name === language);
  const englishEntries = entries.filter((candidate) => candidate.language?.name === 'en');
  const entry = localizedEntries.at(-1) || englishEntries.at(-1);
  const text = entry?.flavor_text ?? entry?.text ?? '';
  return text.replace(/[\n\f]+/g, ' ');
};

export const getLocalizedMoveDescription = ({
  effectEntries = [],
  flavorTextEntries = [],
  effectChance = null,
  language = 'en',
} = {}) => {
  const localizedEffect = effectEntries.find((entry) => entry.language?.name === language)?.short_effect;

  if (localizedEffect) {
    return replaceEffectChance(localizedEffect, effectChance);
  }

  const localizedFlavorText = getLocalizedFlavorText(flavorTextEntries, language);

  if (localizedFlavorText) {
    return localizedFlavorText;
  }

  return getLocalizedEffect(effectEntries, effectChance, language);
};

export const getLocalizedItemDescription = ({
  effectEntries = [],
  flavorTextEntries = [],
  language = 'en',
} = {}) => {
  const localizedEffect = effectEntries.find((entry) => entry.language?.name === language)?.short_effect;

  if (localizedEffect) {
    return localizedEffect;
  }

  const localizedFlavorText = getLocalizedFlavorText(flavorTextEntries, language);

  if (localizedFlavorText) {
    return localizedFlavorText;
  }

  return getLocalizedEffect(effectEntries, null, language);
};
