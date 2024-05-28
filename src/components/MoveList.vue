<template>
  <div :class="['pokemon-moves', pokemonTypeClass]" v-if="pokemonDetails && pokemonDetails.moves">
    <div><strong>Moves:</strong></div>
    <ul class="move-list">
      <li v-for="move in getMoves(pokemonDetails.moves)" :key="move">{{ move }}</li>
    </ul>
  </div>
  <div v-else>
    <strong>No moves available</strong>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  pokemonDetails: {
    type: Object,
    required: true,
    default: () => ({ moves: [], types: [] }),
  },
});

const getMoves = (moves) => {
  return moves.map((move) => move.move.name);
};

const typeColors = {
  fire: 'lightcoral',
  water: 'lightblue',
  grass: 'lightgreen',
  electric: 'lightyellow',
  ice: 'lightcyan',
  fighting: 'lightpink',
  poison: 'mediumorchid',
  ground: 'burlywood',
  flying: 'lightskyblue',
  psychic: 'lightcoral',
  bug: 'lightgreen',
  rock: 'lightgray',
  ghost: 'lightsteelblue',
  dark: 'darkgray',
  dragon: 'mediumpurple',
  steel: 'lightgray',
  fairy: 'lightpink',
  normal: 'lightgray',
};

const pokemonTypeClass = computed(() => {
  if (props.pokemonDetails && props.pokemonDetails.types && props.pokemonDetails.types.length > 0) {
    const type = props.pokemonDetails.types[0].type.name;
    return `type-${type}`;
  }
  return 'type-default';
});
</script>

<style scoped>
.pokemon-moves {
  position: fixed;
  top: 60px;
  right: 0;
  padding: 20px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid #ccc;
  background-color: #f8f8f8;
  max-width: 900px;
}

.type-fire {
  background-color: lightcoral;
}

.type-water {
  background-color: lightblue;
}

.type-grass {
  background-color: lightgreen;
}

.type-electric {
  background-color: lightyellow;
}

.type-ice {
  background-color: lightcyan;
}

.type-fighting {
  background-color: lightpink;
}

.type-poison {
  background-color: mediumorchid;
}

.type-ground {
  background-color: burlywood;
}

.type-flying {
  background-color: lightskyblue;
}

.type-psychic {
  background-color: lightcoral;
}

.type-bug {
  background-color: lightgreen;
}

.type-rock {
  background-color: lightgray;
}

.type-ghost {
  background-color: lightsteelblue;
}

.type-dark {
  background-color: darkgray;
}

.type-dragon {
  background-color: mediumpurple;
}

.type-steel {
  background-color: lightgray;
}

.type-fairy {
  background-color: lightpink;
}

.type-normal {
  background-color: lightgray;
}

.type-default {
  background-color: #f8f8f8;
}

.move-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.move-list li {
  padding: 5px;
  background: #e0e0e0;
  border-radius: 4px;
  text-align: center;
}
</style>
