<template>
  <header class="header">
    <div class="logo-container" @click="goHome" v-if="ballSprite">
      <img :src="ballSprite" alt="Pokéball Logo" class="logo" />
      <span class="logo-text">Pokédex</span>
    </div>
    <div class="search-wrapper">
      <input
          type="text"
          placeholder="Search Pokémon"
          v-model="searchQuery"
          @input="updateQuery"
          class="search-input"
      />
      <button @click="toggleShiny" class="styled-button">
        Toggle Shiny
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PokeAPI from '@/services/pokeapi';
import { preloadSprites } from '@/utils/preloadSprite.js';

const props = defineProps({
  searchQuery: String,
  isShiny: Boolean,
});
const emit = defineEmits(['updateSearchQuery', 'toggleShiny']);

const searchQuery = ref(props.searchQuery);
watch(() => props.searchQuery, (newVal) => {
  searchQuery.value = newVal;
});
const updateQuery = () => emit('updateSearchQuery', searchQuery.value);
const toggleShiny = () => emit('toggleShiny');

const router = useRouter();
const route = useRoute();
const goHome = () => router.push('/');

const ballSprite = ref('');

const loadRandomBall = async () => {
  try {
    const response = await PokeAPI.getItems();
    const balls = response.data.filter(item => item.name.includes('-ball'));
    const randomBall = balls[Math.floor(Math.random() * balls.length)];

    const detail = await PokeAPI.getLanguageData(`https://pokeapi.co/api/v2/item/${randomBall.name}`);
    const sprite = detail.data.sprites?.default;

    await preloadSprites([sprite]);
    ballSprite.value = sprite || '';
  } catch (error) {
    console.error('Fehler beim Pokéball-Laden:', error);
  }
};

onMounted(loadRandomBall);
watch(() => route.fullPath, () => {
  loadRandomBall();
});
</script>
<style scoped>
.header {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  background-color: white;
  padding: 12px 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-sizing: border-box;
}

.logo-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.logo {
  width: 36px;
  height: 36px;
  margin-right: 8px;
}
.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-red);
}

.search-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 10px;
  max-width: 700px;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

.styled-button {
  white-space: nowrap;
  background-color: var(--primary-red);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.styled-button:hover {
  background-color: #d32f2f;
}

</style>