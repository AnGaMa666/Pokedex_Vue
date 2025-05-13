<template>
  <div class="pokedex-view">
    <Navbar />
    <div class="page-wrapper">
      <Header
          :searchQuery="searchQuery"
          @updateSearchQuery="updateSearchQuery"
          @toggleShiny="toggleShiny"
          :isShiny="isShiny"
          :showSearch="true"
      />

      <div class="horizontal-layout">
        <div class="pokedex-column">
          <Pokedex
              :searchQuery="searchQuery"
              :isShiny="isShiny"
              @select="selectPokemon"
          />
        </div>

        <div class="details-column" v-if="selectedPokemon">
          <PokemonDetails
              :pokemon="selectedPokemon"
              :isShiny="isShiny"
          />
        </div>

        <div class="moves-column" v-if="selectedPokemonDetails?.moves">
          <MoveList
              :pokemonDetails="selectedPokemonDetails"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Header from '@/components/Header.vue';
import Navbar from '@/components/Navbar.vue';
import Pokedex from '@/components/Pokedex.vue';
import PokemonDetails from '@/components/PokemonDetails.vue';
import MoveList from '@/components/MoveList.vue';

const searchQuery = ref('');
const selectedPokemon = ref(null);
const selectedPokemonDetails = ref({});
const isShiny = ref(false);

const updateSearchQuery = (query) => {
  searchQuery.value = query;
};

const toggleShiny = () => {
  isShiny.value = !isShiny.value;
};

const selectPokemon = async (pokemon) => {
  try {
    selectedPokemon.value = pokemon;
    const response = await fetch(pokemon.url);
    const data = await response.json();
    selectedPokemonDetails.value = data;
  } catch (error) {
    console.error('[PokedexViewPage] Fehler beim Laden des Pokémon:', error);
  }
};
</script>

<style scoped>
.pokedex-view {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.page-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.horizontal-layout {
  display: flex;
  flex-direction: row;
  height: calc(100vh - 70px); /* Höhe des Headers */
  overflow: hidden;
}

/* Linke Spalte: Pokedex direkt neben Navbar */
.pokedex-column {
  width: 200px;
  overflow-y: auto;
  border-right: 1px solid #ccc;
  background-color: #fafafa;
  box-sizing: border-box;
  padding: 10px;
}

/* Mitte: Details */
.details-column {
  width: 480px;
  overflow-y: auto;
  background-color: #fff;
  padding: 20px;
  box-sizing: border-box;
  border-right: 1px solid #ccc;
}

/* Rechte Spalte: Moves */
.moves-column {
  flex: 1;
  overflow-y: auto;
  background-color: #f9f9f9;
  padding: 20px;
  box-sizing: border-box;
}
</style>
