<template>
  <section
    v-if="moves.length"
    class="pokemon-moves"
    :style="{ '--type-color': typeColor }"
    aria-labelledby="move-list-title"
  >
    <div class="move-heading">
      <h2 id="move-list-title">Moves</h2>
      <span>{{ moves.length }}</span>
    </div>
    <ul class="move-list">
      <li v-for="move in moves" :key="move.name">
        {{ move.label }}
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  pokemonDetails: {
    type: Object,
    required: true,
  },
});

const typeColors = {
  bug: '#a3b536',
  dark: '#62574b',
  dragon: '#6f5ad8',
  electric: '#e7bd28',
  fairy: '#d987ad',
  fighting: '#b5493f',
  fire: '#e56b3f',
  flying: '#829edb',
  ghost: '#665c99',
  grass: '#5da854',
  ground: '#cfac59',
  ice: '#6fb8b8',
  normal: '#91948f',
  poison: '#9a559d',
  psychic: '#e45c84',
  rock: '#aa9348',
  steel: '#8f9da7',
  water: '#4f85cf',
};

const formatMoveName = (name) => {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const moves = computed(() => {
  return props.pokemonDetails.moves
    .map((moveEntry) => ({
      name: moveEntry.move.name,
      label: formatMoveName(moveEntry.move.name),
    }))
    .sort((firstMove, secondMove) => firstMove.label.localeCompare(secondMove.label));
});

const typeColor = computed(() => {
  const primaryType = props.pokemonDetails.types?.[0]?.type?.name;
  return typeColors[primaryType] || '#64748b';
});
</script>

<style scoped>
.pokemon-moves {
  max-height: calc(100vh - 112px);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--type-color) 42%, #d5d9e1);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(23, 32, 51, 0.08);
}

.move-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 18px;
  border-bottom: 4px solid var(--type-color);
}

.move-heading h2 {
  margin: 0;
  font-size: 1.2rem;
}

.move-heading span {
  color: #687386;
  font-size: 0.875rem;
}

.move-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: calc(100vh - 182px);
  padding: 14px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.move-list li {
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #e3e6eb;
  border-radius: 8px;
  overflow-wrap: anywhere;
  text-align: center;
  background: #f8fafc;
}

@media (max-width: 1100px) {
  .pokemon-moves {
    max-height: none;
  }

  .move-list {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    max-height: 420px;
  }
}
</style>
