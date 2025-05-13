<template>
  <div class="pokedex">
    <h1>Pokedex</h1>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>
    <ul v-if="!loading && !error">
      <li
          v-for="pokemon in filteredPokemons"
          :key="pokemon.name"
          @click="selectPokemon(pokemon)"
      >
        <img :src="isShiny ? pokemon.shinyImage : pokemon.image" :alt="pokemon.name" />
        <span>{{ pokemon.id }} - {{ pokemon.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import PokeAPI from '@/services/pokeapi';
import { preloadSprites } from '@/utils/preloadSprite.js';
import { getCachedData, setCachedList } from '@/utils/cache.js';

const props = defineProps({
  searchQuery: String,
  isShiny: Boolean
});
const emit = defineEmits(['select']);

const pokemons = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchPokemons = async () => {
  console.log('[Pokedex] Versuche Pokédex aus Cache zu laden…');
  const cached = getCachedData('pokedex');
  if (cached && Array.isArray(cached)) {
    console.log('[Pokedex] Pokédex aus Cache geladen:', cached.length, 'Einträge');
    pokemons.value = cached;
    loading.value = false;
    return;
  }

  try {
    console.log('[Pokedex] Hole Pokédex-Daten von API…');
    const response = await PokeAPI.getPokemons();
    console.log('[Pokedex] API Antwort:', response);

    const rawList = Array.isArray(response.data.results)
        ? response.data.results
        : Array.isArray(response.data)
            ? response.data
            : [];

    if (!rawList.length) {
      throw new Error('API-Rückgabe ist keine gültige Pokémonliste.');
    }

    const data = rawList.map((pokemon, index) => ({
      ...pokemon,
      id: index + 1,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`,
      shinyImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${index + 1}.png`
    }));

    console.log('[Pokedex] Lade Sprites vor…');
    const spriteUrls = data.flatMap(p => [p.image, p.shinyImage]);
    await preloadSprites(spriteUrls);
    console.log('[Pokedex] Sprites erfolgreich vorgeladen.');

    pokemons.value = data;
    setCachedList('pokedex', data);
    console.log('[Pokedex] Pokédex in Cache gespeichert:', data.length, 'Einträge');
  } catch (err) {
    console.error('[Pokedex] Fehler beim Laden:', err);
    error.value = 'Failed to load Pokémon list.';
  } finally {
    loading.value = false;
  }
};

const filteredPokemons = computed(() => {
  if (!props.searchQuery) return pokemons.value;
  return pokemons.value.filter(p =>
      p.name.toLowerCase().includes(props.searchQuery.toLowerCase())
  );
});

const selectPokemon = (pokemon) => {
  console.log('[Pokedex] Pokémon ausgewählt:', pokemon.name);
  emit('select', pokemon);
};

onMounted(fetchPokemons);
</script>

<style scoped>
.pokedex {
  text-align: center;
  overflow-y: auto;
  margin-top: 20px;
  text-transform: capitalize;
}

.loading {
  margin-top: 10px;
  font-size: 1.5em;
}

.error {
  color: red;
  font-size: 1.5em;
  margin-top: 10px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 400px;
}

li {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: start;
  padding: 8px 0;
}

img {
  width: 64px;
  height: 64px;
  margin-right: 12px;
}
</style>
