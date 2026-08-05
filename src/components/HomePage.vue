<template>
  <section class="home-page" :aria-label="t('section.home.label')">
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
          <h1>{{ section.title }}</h1>
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

const { t } = useI18n();

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

.section-card h1 {
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

@media (max-width: 1050px) {
  .section-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .section-grid {
    grid-template-columns: 1fr;
  }

  .section-card {
    min-height: 0;
  }
}

@media (max-width: 420px) {
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
