<template>
  <section class="home-page" aria-labelledby="home-title">
    <div class="hero-card">
      <div>
        <p class="eyebrow">PokéAPI explorer</p>
        <h1 id="home-title">Explore the data without wasting requests</h1>
        <p class="hero-copy">
          Every area loads its resource index once. Full details are requested only after you choose an entry and are cached for the browser session.
        </p>
      </div>
      <span class="hero-mark" aria-hidden="true"></span>
    </div>

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
          <h2>{{ section.title }}</h2>
          <p>{{ section.description }}</p>
        </div>
        <span class="request-note">{{ section.requestNote }}</span>
      </a>
    </div>
  </section>
</template>

<script setup>
const sections = [
  {
    id: 'pokedex',
    symbol: '#',
    kicker: 'National index',
    title: 'Pokédex',
    description: 'Profiles, types, abilities, evolutions and the complete move list for each Pokémon.',
    requestNote: '1 index call · details on selection',
  },
  {
    id: 'moves',
    symbol: '⚡',
    kicker: 'Battle data',
    title: 'Moves',
    description: 'Power, accuracy, PP, priority, type, damage class and the official effect description.',
    requestNote: '1 index call · 1 detail call',
  },
  {
    id: 'items',
    symbol: '◆',
    kicker: 'Inventory data',
    title: 'Items',
    description: 'Costs, categories, attributes, effects, fling values and official item sprites.',
    requestNote: '1 index call · 1 detail call',
  },
  {
    id: 'berries',
    symbol: '●',
    kicker: 'Growth data',
    title: 'Berries',
    description: 'Harvest, growth time, firmness, flavors and Natural Gift values without extra item lookups.',
    requestNote: '1 index call · 1 detail call',
  },
];
</script>

<style scoped>
.home-page {
  display: grid;
  gap: 24px;
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 32px;
  align-items: center;
  min-height: 260px;
  padding: clamp(28px, 5vw, 54px);
  border: 1px solid rgba(213, 217, 225, 0.9);
  border-radius: 26px;
  background:
    radial-gradient(circle at 85% 20%, rgba(220, 38, 38, 0.16), transparent 22rem),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 252, 0.94));
  box-shadow: 0 18px 48px rgba(23, 32, 51, 0.08);
}

.eyebrow,
.section-kicker {
  margin: 0 0 8px;
  color: #b91c1c;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-card h1 {
  max-width: 820px;
  margin: 0;
  color: #172033;
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.02;
  letter-spacing: -0.045em;
}

.hero-copy {
  max-width: 760px;
  margin: 20px 0 0;
  color: #596579;
  font-size: 1.05rem;
  line-height: 1.7;
}

.hero-mark {
  position: relative;
  width: clamp(120px, 14vw, 190px);
  aspect-ratio: 1;
  border: clamp(24px, 3vw, 38px) solid #dc2626;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    inset 0 0 0 8px #172033,
    0 24px 48px rgba(23, 32, 51, 0.14);
}

.hero-mark::before,
.hero-mark::after {
  position: absolute;
  content: '';
}

.hero-mark::before {
  top: 50%;
  left: -22%;
  width: 144%;
  height: 10px;
  background: #172033;
  transform: translateY(-50%);
}

.hero-mark::after {
  top: 50%;
  left: 50%;
  width: 30%;
  aspect-ratio: 1;
  border: 7px solid #172033;
  border-radius: 50%;
  background: #ffffff;
  transform: translate(-50%, -50%);
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
  color: #ffffff;
  font-size: 1.35rem;
  font-weight: 900;
  background: #172033;
}

.section-symbol[data-section='moves'] {
  background: #d97706;
}

.section-symbol[data-section='items'] {
  background: #2563eb;
}

.section-symbol[data-section='berries'] {
  background: #a21caf;
}

.section-card h2 {
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
  .hero-card {
    grid-template-columns: 1fr;
  }

  .hero-mark {
    display: none;
  }

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
