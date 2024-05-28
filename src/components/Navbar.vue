<template>
  <div class="pokemon-moves">
    <div><strong>Moves:</strong></div>
    <ul class="move-list">
     <!-- <li v-for="move in getMoves(pokemonDetails.moves)" :key="move">{{ move }}</li> -->
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  pokemonDetails: Object,
});

const getMoves = (moves) => {
  return moves.map(move => move.move.name);
};
</script>

<style scoped>
.pokemon-moves {
  position: fixed;
  top: 60px;
  right: 0;
  background: white;
  padding: 25px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid #ccc;
  background-color: #f8f8f8;
  max-width: 300px;
}

.move-list {
  list-style-type: none;
  padding: 0;
}

.move-list li {
  padding: 1px 0;
}
</style>
