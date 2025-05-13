<template>
  <header class="header">
    <div class="left">
      <img class="pokeball" :src="pokeballSprite" :alt="pokeballName" />
      <h1 class="title">Pokémon Explorer</h1>
    </div>

    <div v-if="showSearch" class="search-area">
      <input
          type="text"
          placeholder="Search Pokémon"
          v-model="searchQuery"
          @input="updateQuery"
          class="search-input"
      />
    </div>

    <button @click="toggleShiny" class="styled-button">
      Toggle Shiny
    </button>
  </header>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  searchQuery: String,
  isShiny: Boolean,
  showSearch: Boolean,
});
const emit = defineEmits(['updateSearchQuery', 'toggleShiny']);

const searchQuery = ref(props.searchQuery);
watch(() => props.searchQuery, val => (searchQuery.value = val));

const updateQuery = () => {
  emit('updateSearchQuery', searchQuery.value);
};
const toggleShiny = () => {
  emit('toggleShiny');
};

// Zufälliger Pokéball
const pokeballNames = [
  'poke-ball', 'great-ball', 'ultra-ball', 'master-ball', 'dusk-ball',
  'luxury-ball', 'quick-ball', 'heal-ball', 'repeat-ball', 'net-ball',
  'nest-ball', 'timer-ball', 'premier-ball', 'safari-ball'
];
const pokeballName = pokeballNames[Math.floor(Math.random() * pokeballNames.length)];
const pokeballSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${pokeballName}.png`;

onMounted(() => {
  console.log('[Header] Zufälliger Pokéball:', pokeballName);
});
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: white;
  padding: 10px 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  box-sizing: border-box;
}

.left {
  display: flex;
  align-items: center;
}

.pokeball {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.title {
  font-size: 1.6rem;
  font-weight: bold;
  white-space: nowrap;
}

.search-area {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  margin: 0 20px;
}

.search-input {
  padding: 6px;
  font-size: 16px;
  width: 250px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.styled-button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
}

.styled-button:hover {
  background-color: #e0e0e0;
}
</style>
