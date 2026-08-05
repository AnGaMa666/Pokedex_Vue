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
        <div>
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
]);
</script>

<style scoped>
.home-page {
  display: grid;
  gap: 24px;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.section-card {
  position: relative;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 18px;
  min-height: 210px;
  padding: 24px;
  border: 1px solid #d5d9e1;
  border-radius: 20px;
  color: inherit;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(23, 32, 51, 0.06);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.section-card:hover {
  border-color: rgba(220, 38, 38, 0.4);
  box-shadow: 0 18px 38px rgba(23, 32, 51, 0.1);
  transform: translateY(-3px);
}

.section-card:focus-visible {
  outline: 3px solid rgba(220, 38, 38, 0.24);
  outline-offset: 3px;
}

.section-symbol {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 18px;
  color: #172033;
  font-size: 1.35rem;
  font-weight: 900;
  background: lightgray;
}

.section-symbol[data-section='moves'] {
  background: lightyellow;
}

.section-symbol[data-section='items'] {
  background: lightblue;
}

.section-symbol[data-section='berries'] {
  background: lightpink;
}

.section-kicker {
  margin: 0 0 8px;
  color: #b91c1c;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-card h1 {
  margin: 0;
  color: #172033;
  font-size: 1.5rem;
}

.section-card p:not(.section-kicker) {
  margin: 10px 0 0;
  color: #596579;
  line-height: 1.6;
}

.request-note {
  grid-column: 2;
  align-self: end;
  color: #687386;
  font-size: 0.78rem;
  font-weight: 800;
}

@media (max-width: 760px) {
  .section-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 460px) {
  .section-card {
    grid-template-columns: 46px minmax(0, 1fr);
    padding: 20px;
  }

  .section-symbol {
    width: 46px;
    height: 46px;
    border-radius: 14px;
  }
}
</style>
