<template>
  <div>
    <Header :searchQuery="searchQuery" @updateSearchQuery="updateSearchQuery" @toggleShiny="toggleShiny" :isShiny="isShiny" />
    <div class="main-container">
      <Navbar />
      <div class="content-container">
        <Pokedex :searchQuery="searchQuery" @select="selectPokemon" />
        <div class="details-container">
          <PokemonDetails v-if="selectedPokemon" :pokemon="selectedPokemon" :isShiny="isShiny" />
          <MoveList v-if="selectedPokemonDetails && selectedPokemonDetails.moves" :pokemonDetails="selectedPokemonDetails" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Pokedex from './components/Pokedex.vue';
import PokemonDetails from './components/PokemonDetails.vue';
import MoveList from './components/MoveList.vue';
import Header from './components/Header.vue';
import Navbar from './components/Navbar.vue';

const searchQuery = ref('');
const selectedPokemon = ref(null);
const selectedPokemonDetails = ref({});

const isShiny = ref(false);

const selectPokemon = async (pokemon) => {
  selectedPokemon.value = pokemon;

  // Fetching the detailed data of the selected Pokémon
  const response = await fetch(pokemon.url);
  const data = await response.json();
  selectedPokemonDetails.value = data;
};

const updateSearchQuery = (query) => {
  searchQuery.value = query;
};

const toggleShiny = () => {
  isShiny.value = !isShiny.value;
};
</script>

<style scoped>
.main-container {
  display: flex;
  margin-top: 60px;
}

.content-container {
  display: flex;
  justify-content: space-between;
  height: calc(100vh - 60px);
  overflow: hidden;
  margin-left: 200px; /* Adjusted to accommodate the Navbar */
}

.details-container {
  flex: 1;
  display: flex;
}
</style>
