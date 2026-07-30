<template>
  <div class="app-shell">
    <Header
      :search-query="searchQuery"
      :is-shiny="isShiny"
      @update-search-query="updateSearchQuery"
      @toggle-shiny="toggleShiny"
    />
    <main class="main-container">
      <PokemonList :search-query="searchQuery" @select="selectPokemon" />
      <section class="details-container" aria-live="polite">
        <PokemonDetails
          v-if="selectedPokemon"
          :pokemon="selectedPokemon"
          :is-shiny="isShiny"
          @details-loaded="updateSelectedPokemonDetails"
        />
        <MoveList
          v-if="selectedPokemonDetails?.moves?.length"
          :pokemon-details="selectedPokemonDetails"
        />
        <p v-else-if="!selectedPokemon" class="empty-state">
          Select a Pokémon to view its details.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Header from './components/Header.vue';
import MoveList from './components/MoveList.vue';
import PokemonDetails from './components/PokemonDetails.vue';
import PokemonList from './components/PokemonList.vue';

const searchQuery = ref('');
const selectedPokemon = ref(null);
const selectedPokemonDetails = ref(null);
const isShiny = ref(false);

const selectPokemon = (pokemon) => {
  selectedPokemon.value = pokemon;
  selectedPokemonDetails.value = null;
};

const updateSelectedPokemonDetails = (pokemonDetails) => {
  selectedPokemonDetails.value = pokemonDetails;
};

const updateSearchQuery = (query) => {
  searchQuery.value = query;
};

const toggleShiny = () => {
  isShiny.value = !isShiny.value;
};
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.main-container {
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  gap: 24px;
  min-height: 100vh;
  padding: 88px 24px 24px;
}

.details-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
  gap: 24px;
  min-width: 0;
  align-items: start;
}

.empty-state {
  grid-column: 1 / -1;
  margin: 0;
  padding: 32px;
  border: 1px dashed #aeb6c3;
  border-radius: 16px;
  color: #4b5563;
  text-align: center;
  background: #ffffff;
}

@media (max-width: 1100px) {
  .details-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .main-container {
    grid-template-columns: 1fr;
    padding: 144px 16px 16px;
  }
}
</style>
