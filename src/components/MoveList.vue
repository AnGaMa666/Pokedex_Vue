<template>
  <div class="move-list" v-if="movesWithType && movesWithType.length > 0">
    <h2 class="header">Moves</h2>
    <div class="move-grid">
      <div
          v-for="move in movesWithType"
          :key="move.name"
          class="move-item"
          :style="{ backgroundColor: getMoveTypeColor(move.type) }"
      >
        {{ move.name }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import PokeAPI from '@/services/pokeapi';

const props = defineProps(['pokemonDetails']);
const movesWithType = ref([]);

const typeColors = {
  fire: '#df4747',
  water: '#4a90da',
  grass: '#7cc576',
  electric: '#fdfda9',
  ice: '#9ad6df',
  fighting: '#f08030',
  poison: '#a040a0',
  ground: '#e0c068',
  flying: '#32b3d1',
  psychic: '#ff80ff',
  bug: '#a8b820',
  rock: '#5c4705',
  ghost: '#705898',
  dark: '#838383',
  dragon: '#7038f8',
  steel: 'rgba(135,131,131,0.52)',
  fairy: '#f0b6bc',
  normal: '#b6afaf',
};

const getMoveTypeColor = (type) => {
  return typeColors[type] || '#f8f8f8';
};

watch(
    () => props.pokemonDetails,
    async (newDetails) => {
      if (newDetails && newDetails.moves) {
        const movePromises = newDetails.moves.map(move =>
            PokeAPI.getMoveDetails(move.move.url).then(response => ({
              name: move.move.name,
              type: response.data.type.name
            }))
        );
        movesWithType.value = await Promise.all(movePromises);
      } else {
        movesWithType.value = [];
      }
    },
    { immediate: true }
);
</script>

<style scoped>
.move-list {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 1);
  overflow-y: scroll;
  margin-top: 20px;
  background-color: #f8f8f8;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
}

.header {
  font-size: 1.5em;
  margin-bottom: 10px;
}

.move-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.move-item {
  padding: 10px;
  border-radius: 4px;
  color: #333;
  font-weight: bold;
  text-align: center;
}
</style>
