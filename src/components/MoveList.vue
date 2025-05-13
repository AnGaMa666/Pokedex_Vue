<template>
  <div class="move-list" v-if="movesWithType.length">
    <h2 class="header">Moves</h2>
    <div class="move-grid">
      <div
          v-for="move in movesWithType"
          :key="move.name"
          class="move-item"
          :style="{ backgroundColor: TypeColors[move.type] || '#f8f8f8' }"
      >
        {{ move.name }}<br><small class="type" v-if="move.type">( {{ move.type }} )</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import PokeAPI from '@/services/pokeapi';
import { TypeColors } from '@/utils/colors.js';

const props = defineProps(['pokemonDetails']);
const movesWithType = ref([]);

watch(
    () => props.pokemonDetails,
    async (newDetails) => {
      if (newDetails?.moves) {
        const movePromises = newDetails.moves.map(move =>
            PokeAPI.getMoveDetailsByUrl(move.move.url)
                .then(response => ({
                  name: move.move.name,
                  type: response.data.type.name.toLowerCase()
                }))
                .catch(() => ({
                  name: move.move.name,
                  type: 'unknown'
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
  text-transform: capitalize;
}
</style>
