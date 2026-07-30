<template>
  <section class="pokedex" aria-labelledby="pokemon-list-title">
    <div class="list-heading">
      <h1 id="pokemon-list-title">Pokémon</h1>
      <span v-if="!loading && !error" class="result-count">
        {{ filteredPokemons.length }} results
      </span>
    </div>

    <p v-if="loading" class="status-message" role="status">
      Loading Pokémon…
    </p>

    <div v-else-if="error" class="error" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="retry-button" @click="fetchPokemons">
        Try again
      </button>
    </div>

    <p v-else-if="filteredPokemons.length === 0" class="status-message">
      No Pokémon match your search.
    </p>

    <ul v-else class="pokemon-list">
      <li v-for="pokemon in filteredPokemons" :key="pokemon.id">
        <button
          type="button"
          class="pokemon-button"
          :aria-label="`Open ${formatPokemonName(pokemon.name)}, Pokédex number ${pokemon.id}`"
          @click="selectPokemon(pokemon)"
        >
          <img
            :src="pokemon.image"
            :alt="`${formatPokemonName(pokemon.name)} sprite`"
            width="64"
            height="64"
            loading="lazy"
            @error="hideBrokenImage"
          >
          <span class="pokemon-number">#{{ formatPokemonId(pokemon.id) }}</span>
          <span class="pokemon-name">{{ formatPokemonName(pokemon.name) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import PokeAPI from '@/services/pokeapi';

const props = defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['select']);

const pokemons = ref([]);
const loading = ref(true);
const error = ref('');

const getPokemonId = (url) => {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
};

const formatPokemonId = (id) => String(id).padStart(4, '0');

const formatPokemonName = (name) => {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const fetchPokemons = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await PokeAPI.getPokemons();
    pokemons.value = response.data.results
      .map((pokemon) => {
        const id = getPokemonId(pokemon.url);

        if (!id) {
          return null;
        }

        return {
          ...pokemon,
          id,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        };
      })
      .filter(Boolean)
      .sort((firstPokemon, secondPokemon) => firstPokemon.id - secondPokemon.id);
  } catch (requestError) {
    console.error('Failed to load Pokémon:', requestError);
    error.value = 'The Pokémon list could not be loaded.';
  } finally {
    loading.value = false;
  }
};

const filteredPokemons = computed(() => {
  const query = props.searchQuery.trim().toLowerCase();

  if (!query) {
    return pokemons.value;
  }

  return pokemons.value.filter((pokemon) => {
    return pokemon.name.toLowerCase().includes(query)
      || String(pokemon.id).includes(query);
  });
});

const selectPokemon = (pokemon) => {
  emit('select', pokemon);
};

const hideBrokenImage = (event) => {
  event.currentTarget.hidden = true;
};

onMounted(fetchPokemons);
</script>

<style scoped>
.pokedex {
  position: sticky;
  top: 88px;
  align-self: start;
  max-height: calc(100vh - 112px);
  overflow: hidden;
  border: 1px solid #d5d9e1;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(23, 32, 51, 0.08);
}

.list-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 18px 18px 12px;
  border-bottom: 1px solid #e3e6eb;
}

.list-heading h1 {
  margin: 0;
  font-size: 1.35rem;
}

.result-count {
  color: #687386;
  font-size: 0.875rem;
}

.status-message,
.error {
  margin: 0;
  padding: 24px 18px;
  color: #4b5563;
}

.error {
  color: #991b1b;
}

.retry-button {
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid #b91c1c;
  border-radius: 8px;
  color: #991b1b;
  cursor: pointer;
  background: #fff7f7;
}

.pokemon-list {
  max-height: calc(100vh - 172px);
  padding: 8px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.pokemon-button {
  display: grid;
  grid-template-columns: 64px 62px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 72px;
  padding: 4px 10px;
  border: 0;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  background: transparent;
}

.pokemon-button:hover {
  background: #f1f5f9;
}

.pokemon-button:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.35);
  outline-offset: -2px;
}

.pokemon-button img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.pokemon-number {
  color: #687386;
  font-variant-numeric: tabular-nums;
}

.pokemon-name {
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .pokedex {
    position: static;
    max-height: none;
  }

  .pokemon-list {
    max-height: 420px;
  }
}
</style>
