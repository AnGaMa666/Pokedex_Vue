<template>
  <section class="home-page" :aria-label="t('section.home.label')">
    <header class="creator-hero">
      <div class="creator-copy">
        <p class="creator-kicker">{{ brandContent.kicker }}</p>
        <h1>{{ brandContent.title }}</h1>
        <p>{{ brandContent.description }}</p>
        <small>{{ brandContent.disclaimer }}</small>
      </div>

      <div class="creator-links" :aria-label="brandContent.profileLabel">
        <a
          v-for="profile in socialProfiles"
          :key="profile.id"
          :href="profile.url"
          target="_blank"
          rel="me external noopener noreferrer"
        >
          <span aria-hidden="true">{{ profile.symbol }}</span>
          {{ language === 'de' ? profile.labelDe : profile.labelEn }}
        </a>
      </div>
    </header>

    <div class="section-grid">
      <a
        v-for="section in sections"
        :key="section.id"
        :href="`#${section.id}`"
        class="section-card"
      >
        <span class="section-symbol" :data-section="section.id" aria-hidden="true">
          {{ section.symbol }}
        </span>
        <div class="section-copy">
          <p class="section-kicker">{{ section.kicker }}</p>
          <h2>{{ section.title }}</h2>
          <p>{{ section.description }}</p>
        </div>
        <span class="request-note">{{ section.requestNote }}</span>
      </a>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/i18n';

const { language, t } = useI18n();

const brandContent = computed(() => language.value === 'de'
  ? {
      kicker: 'Ein Projekt von AnGaMa',
      title: 'AnGaMa Pokédex',
      description: 'Der kostenlose Pokémon Explorer von AnGaMa verbindet den nationalen Pokédex mit Entwicklungen, Attacken, Items, Routen, Fangchancen und einem kompetitiven Team Builder. Offizielle Profile: AnGaMa666 auf Twitch, Instagram, X und GitHub sowie AnGaMaVT auf TikTok.',
      profileLabel: 'Offizielle Social-Media-Profile von AnGaMa',
      disclaimer: 'Unabhängiges Fanprojekt. Nicht mit Nintendo, GAME FREAK oder The Pokémon Company verbunden.',
    }
  : {
      kicker: 'A project by AnGaMa',
      title: 'AnGaMa Pokédex',
      description: 'The free Pokémon Explorer by AnGaMa combines the National Pokédex with evolutions, moves, items, routes, catch chances and a competitive team builder. Official profiles: AnGaMa666 on Twitch, Instagram, X and GitHub, plus AnGaMaVT on TikTok.',
      profileLabel: 'Official AnGaMa social media profiles',
      disclaimer: 'Independent fan project. Not affiliated with Nintendo, GAME FREAK or The Pokémon Company.',
    });

const socialProfiles = [
  {
    id: 'twitch',
    url: 'https://www.twitch.tv/angama666',
    symbol: '▶',
    labelDe: 'Twitch: AnGaMa666',
    labelEn: 'Twitch: AnGaMa666',
  },
  {
    id: 'tiktok',
    url: 'https://www.tiktok.com/@angamavt',
    symbol: '♪',
    labelDe: 'TikTok: AnGaMaVT',
    labelEn: 'TikTok: AnGaMaVT',
  },
  {
    id: 'instagram',
    url: 'https://www.instagram.com/angama666/',
    symbol: '◎',
    labelDe: 'Instagram: AnGaMa666',
    labelEn: 'Instagram: AnGaMa666',
  },
  {
    id: 'x',
    url: 'https://x.com/AnGaMa666',
    symbol: 'X',
    labelDe: 'X: AnGaMa666',
    labelEn: 'X: AnGaMa666',
  },
  {
    id: 'github',
    url: 'https://github.com/AnGaMa666',
    symbol: '</>',
    labelDe: 'GitHub: AnGaMa666',
    labelEn: 'GitHub: AnGaMa666',
  },
];

const sections = computed(() => [
  {
    id: 'pokedex',
    symbol: '#',
    kicker: t('home.pokedex.kicker'),
    title: t('home.pokedex.title'),
    description: t('home.pokedex.description'),
    requestNote: t('home.pokedex.request'),
  },
  {
    id: 'moves',
    symbol: '⚡',
    kicker: t('home.moves.kicker'),
    title: t('home.moves.title'),
    description: t('home.moves.description'),
    requestNote: t('home.moves.request'),
  },
  {
    id: 'items',
    symbol: '◆',
    kicker: t('home.items.kicker'),
    title: t('home.items.title'),
    description: t('home.items.description'),
    requestNote: t('home.items.request'),
  },
  {
    id: 'berries',
    symbol: '●',
    kicker: t('home.berries.kicker'),
    title: t('home.berries.title'),
    description: t('home.berries.description'),
    requestNote: t('home.berries.request'),
  },
  {
    id: 'balls',
    symbol: '◉',
    kicker: t('home.balls.kicker'),
    title: t('home.balls.title'),
    description: t('home.balls.description'),
    requestNote: t('home.balls.request'),
  },
  {
    id: 'special-items',
    symbol: '✦',
    kicker: t('home.specialItems.kicker'),
    title: t('home.specialItems.title'),
    description: t('home.specialItems.description'),
    requestNote: t('home.specialItems.request'),
  },
  {
    id: 'routes',
    symbol: '⌖',
    kicker: t('home.routes.kicker'),
    title: t('home.routes.title'),
    description: t('home.routes.description'),
    requestNote: t('home.routes.request'),
  },
  {
    id: 'team',
    symbol: 'Ⅵ',
    kicker: t('home.team.kicker'),
    title: t('home.team.title'),
    description: t('home.team.description'),
    requestNote: t('home.team.request'),
  },
]);
</script>

<style scoped>
.home-page {
  display: grid;
  gap: 18px;
}

.creator-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(250px, 350px);
  gap: 24px;
  align-items: center;
  padding: clamp(22px, 4vw, 42px);
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background:
    radial-gradient(circle at 90% 15%, color-mix(in srgb, #ef4444 18%, transparent), transparent 34%),
    radial-gradient(circle at 78% 90%, color-mix(in srgb, #2563eb 18%, transparent), transparent 38%),
    var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.creator-copy {
  min-width: 0;
}

.creator-kicker {
  margin: 0 0 8px;
  color: var(--legacy-muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.creator-hero h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 4.5rem);
  line-height: 0.98;
  letter-spacing: -0.045em;
}

.creator-copy > p:not(.creator-kicker) {
  max-width: 920px;
  margin: 16px 0 0;
  color: var(--legacy-muted);
  font-size: clamp(0.9rem, 1.2vw, 1.05rem);
  line-height: 1.65;
}

.creator-copy small {
  display: block;
  margin-top: 14px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  line-height: 1.5;
}

.creator-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

.creator-links a {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 48px;
  padding: 7px 12px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  font-size: 0.8rem;
  font-weight: 850;
  text-decoration: none;
  background: color-mix(in srgb, var(--legacy-page) 88%, transparent);
}

.creator-links a:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.creator-links a:hover {
  border-color: var(--legacy-border-strong);
  background: var(--legacy-surface-hover);
}

.creator-links a:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 3px;
}

.creator-links a span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  font-size: 0.68rem;
  background: var(--legacy-surface);
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.section-card {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  grid-template-rows: 1fr auto;
  gap: 13px;
  min-width: 0;
  min-height: 220px;
  padding: 18px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  text-decoration: none;
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
  transition: border-color 160ms ease, transform 160ms ease;
}

.section-card:hover {
  border-color: var(--legacy-border-strong);
  transform: translateY(-2px);
}

.section-card:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 3px;
}

.section-symbol {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  font-size: 1.25rem;
  font-weight: 900;
  background: var(--legacy-page);
}

.section-symbol[data-section='moves'] {
  color: #ca8a04;
}

.section-symbol[data-section='berries'] {
  color: #a21caf;
}

.section-symbol[data-section='balls'] {
  color: #dc2626;
}

.section-symbol[data-section='special-items'] {
  color: #7c3aed;
}

.section-symbol[data-section='routes'] {
  color: #2563eb;
}

.section-symbol[data-section='team'] {
  color: #15803d;
}

.section-copy {
  min-width: 0;
}

.section-kicker {
  margin: 0 0 6px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.section-card h2 {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--legacy-text);
  font-size: 1.25rem;
}

.section-card p:not(.section-kicker) {
  margin: 8px 0 0;
  color: var(--legacy-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.request-note {
  grid-column: 2;
  align-self: end;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.4;
}

@media (max-width: 1500px) {
  .section-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1120px) {
  .creator-hero {
    grid-template-columns: 1fr;
  }

  .creator-links {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .creator-links a:last-child:nth-child(odd) {
    grid-column: auto;
  }
}

@media (max-width: 1050px) {
  .section-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .creator-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .creator-links a:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
}

@media (max-width: 620px) {
  .creator-links,
  .section-grid {
    grid-template-columns: 1fr;
  }

  .creator-links a:last-child:nth-child(odd) {
    grid-column: auto;
  }

  .section-card {
    min-height: 0;
  }
}

@media (max-width: 420px) {
  .creator-hero {
    padding: 18px;
  }

  .section-card {
    grid-template-columns: 44px minmax(0, 1fr);
    padding: 14px;
  }

  .section-symbol {
    width: 44px;
    height: 44px;
  }
}
</style>
