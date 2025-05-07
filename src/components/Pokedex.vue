<template>
  <div class="pokedex">
    <h1>Pokedex</h1>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="loading">Lade Pokémon...</div>
    <ul v-if="!loading && !error">
      <li
          v-for="pokemon in filteredPokemons"
          :key="pokemon.name"
          @click="selectPokemon(pokemon)"
      >
        <img
            :src="isShiny ? pokemon.shinyImage : pokemon.defaultImage"
            :alt="pokemon.name"
        />
        <span>{{ pokemon.id }} - {{ pokemon.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import PokeAPI from '@/services/pokeapi';
import { preloadSprites } from '@/utils/preloadSprite.js';

const props = defineProps({
  searchQuery: String,
  isShiny: Boolean,
});
const emit = defineEmits(['select']);

const pokemons = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchPokemons = async () => {
  try {
    const response = await PokeAPI.getPokemons();
    const list = response.data.results.map((pokemon, index) => ({
      ...pokemon,
      id: index + 1,
      defaultImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`,
      shinyImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${index + 1}.png`,
    }));

    await preloadSprites(list.flatMap(p => [p.defaultImage, p.shinyImage]));

    pokemons.value = list;
  } catch (err) {
    error.value = 'Fehler beim Laden der Pokémon';
  } finally {
    loading.value = false;
  }
};

const filteredPokemons = computed(() => {
  if (!props.searchQuery) return pokemons.value;
  return pokemons.value.filter((p) =>
      p.name.toLowerCase().includes(props.searchQuery.toLowerCase())
  );
});

const selectPokemon = (pokemon) => {
  emit('select', pokemon);
};

onMounted(fetchPokemons);
</script>

<style scoped>
.pokedex {
  text-align: center;
  padding-top: 80px; /* Platz für fixierten Header */
  height: calc(100vh - 80px);
  overflow-y: auto;
}

.loading {
  margin-top: 10px;
  font-size: 1.5em;
}
.error {
  color: red;
  font-size: 1.5em;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  cursor: pointer;
  text-transform: capitalize;
  display: flex;
  align-items: center;
  padding: 6px 12px;
}
img {
  width: 50px;
  height: 50px;
  margin-right: 10px;
}
</style>
