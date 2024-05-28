<template>
  <div class="pokedex">
    <h1>Pokedex</h1>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>
    <ul v-if="!loading && !error">
      <li v-for="pokemon in filteredPokemons" :key="pokemon.name" @click="selectPokemon(pokemon)">
        <img :src="pokemon.image" :alt="pokemon.name" />
        <span>{{ pokemon.id }} - {{ pokemon.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import PokeAPI from '@/services/pokeapi';

const props = defineProps(['searchQuery']);
const emit = defineEmits(['select']);

const pokemons = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchPokemons = async () => {
  try {
    const response = await PokeAPI.getPokemons();
    pokemons.value = response.data.results.map((pokemon, index) => ({
      ...pokemon,
      id: index + 1,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`
    }));
  } catch (err) {
    error.value = 'Failed to load pokemons';
  } finally {
    loading.value = false;
  }
};

const filteredPokemons = computed(() => {
  if (!props.searchQuery) {
    return pokemons.value;
  }
  return pokemons.value.filter(pokemon =>
      pokemon.name.toLowerCase().includes(props.searchQuery.toLowerCase())
  );
});

const selectPokemon = (pokemon) => {
  emit('select', pokemon);
};

onMounted(fetchPokemons);

watch(props, () => {
  // React to changes in props
});
</script>

<style scoped>
.pokedex {
  text-align: center;
  overflow-y: scroll;
  margin-top: 10px;
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
}
li {
  cursor: pointer;
  text-transform: capitalize;
  display: flex;
  align-items: center;
}
img {
  width: 50px;
  height: 50px;
  margin-right: 10px;
}
</style>
