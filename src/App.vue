<template>
  <div class="app-shell">
    <Header
      :search-query="searchQuery"
      :is-shiny="isShiny"
      @update-search-query="updateSearchQuery"
      @toggle-shiny="toggleShiny"
    />
    <main class="main-container">
      <PokemonList
        :search-query="searchQuery"
        :selected-pokemon-id="selectedPokemon?.id ?? null"
        @select="selectPokemon"
      />
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
        <div v-else-if="!selectedPokemon" class="empty-state">
          <span class="empty-state-mark" aria-hidden="true"></span>
          <div>
            <h2>Choose a Pokémon</h2>
            <p>Select an entry from the Pokédex to explore its profile, evolution chain and moves.</p>
          </div>
        </div>
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
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 24px;
  width: min(100%, 1680px);
  min-height: 100vh;
  padding: 96px 24px 32px;
  margin: 0 auto;
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
  display: flex;
  gap: 20px;
  align-items: center;
  min-height: 260px;
  padding: 36px;
  border: 1px dashed #aeb6c3;
  border-radius: 20px;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 12px 36px rgba(23, 32, 51, 0.06);
  backdrop-filter: blur(10px);
}

.empty-state h2 {
  margin: 0 0 6px;
  color: #172033;
  font-size: clamp(1.5rem, 3vw, 2rem);
}

.empty-state p {
  max-width: 560px;
  margin: 0;
  line-height: 1.6;
}

.empty-state-mark {
  position: relative;
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
  border: 16px solid #dc2626;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    inset 0 0 0 4px #172033,
    0 12px 24px rgba(23, 32, 51, 0.12);
}

.empty-state-mark::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  border: 3px solid #172033;
  border-radius: 50%;
  content: '';
  background: #ffffff;
  transform: translate(-50%, -50%);
}

@media (max-width: 1100px) {
  .details-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .main-container {
    grid-template-columns: 1fr;
    padding: 164px 16px 20px;
  }

  .empty-state {
    align-items: flex-start;
    min-height: 0;
    padding: 24px;
  }

  .empty-state-mark {
    width: 52px;
    height: 52px;
    border-width: 11px;
  }
}

@media (max-width: 460px) {
  .empty-state {
    flex-direction: column;
  }
}
</style>
