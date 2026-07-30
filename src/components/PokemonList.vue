<template>
  <section class="pokedex" aria-labelledby="pokemon-list-title">
    <div class="list-heading">
      <div>
        <p class="list-eyebrow">National index</p>
        <h1 id="pokemon-list-title">Pokémon</h1>
      </div>
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
          :class="{ 'is-active': pokemon.id === selectedPokemonId }"
          :aria-current="pokemon.id === selectedPokemonId ? 'true' : undefined"
          :aria-label="`Open ${formatPokemonName(pokemon.name)}, Pokédex number ${pokemon.id}`"
          @click="selectPokemon(pokemon)"
        >
          <span class="sprite-frame" aria-hidden="true">
            <img
              :src="pokemon.image"
              alt=""
              width="64"
              height="64"
              loading="lazy"
              @error="hideBrokenImage"
            >
          </span>
          <span class="pokemon-copy">
            <span class="pokemon-number">#{{ formatPokemonId(pokemon.id) }}</span>
            <span class="pokemon-name">{{ formatPokemonName(pokemon.name) }}</span>
          </span>
          <span class="selection-arrow" aria-hidden="true">›</span>
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
  selectedPokemonId: {
    type: Number,
    default: null,
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
  top: 96px;
  align-self: start;
  max-height: calc(100vh - 128px);
  overflow: hidden;
  border: 1px solid rgba(213, 217, 225, 0.95);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 40px rgba(23, 32, 51, 0.09);
  backdrop-filter: blur(12px);
}

.list-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 20px 18px 16px;
  border-bottom: 1px solid #e3e6eb;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
}

.list-heading h1 {
  margin: 0;
  font-size: 1.45rem;
  letter-spacing: -0.02em;
}

.list-eyebrow {
  margin: 0 0 4px;
  color: #dc2626;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.result-count {
  padding: 5px 8px;
  border-radius: 999px;
  color: #687386;
  font-size: 0.78rem;
  font-weight: 700;
  background: #eef1f6;
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

.retry-button:hover {
  background: #fee2e2;
}

.retry-button:focus-visible {
  outline: 3px solid rgba(185, 28, 28, 0.25);
  outline-offset: 2px;
}

.pokemon-list {
  max-height: calc(100vh - 206px);
  padding: 8px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
  scrollbar-color: #b9c0cc transparent;
  scrollbar-width: thin;
}

.pokemon-button {
  position: relative;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  min-height: 76px;
  padding: 6px 10px 6px 8px;
  border: 1px solid transparent;
  border-radius: 14px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.pokemon-button:hover {
  border-color: #e3e6eb;
  background: #f8fafc;
  transform: translateX(2px);
}

.pokemon-button.is-active {
  border-color: rgba(220, 38, 38, 0.28);
  background: linear-gradient(90deg, rgba(220, 38, 38, 0.12), rgba(255, 255, 255, 0.96));
  box-shadow: inset 4px 0 0 #dc2626;
}

.pokemon-button:focus-visible {
  outline: 3px solid rgba(220, 38, 38, 0.24);
  outline-offset: -2px;
}

.sprite-frame {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border: 1px solid #e7eaf0;
  border-radius: 16px;
  background:
    radial-gradient(circle at 50% 58%, #ffffff 0 32%, transparent 33%),
    linear-gradient(145deg, #f8fafc, #eef1f6);
}

.sprite-frame img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  image-rendering: pixelated;
}

.pokemon-copy {
  display: grid;
  min-width: 0;
}

.pokemon-number {
  margin-bottom: 3px;
  color: #687386;
  font-size: 0.75rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.pokemon-name {
  overflow: hidden;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selection-arrow {
  color: #98a2b3;
  font-size: 1.75rem;
  line-height: 1;
  transition: color 150ms ease, transform 150ms ease;
}

.pokemon-button:hover .selection-arrow,
.pokemon-button.is-active .selection-arrow {
  color: #dc2626;
  transform: translateX(2px);
}

@media (max-width: 760px) {
  .pokedex {
    position: static;
    max-height: none;
  }

  .pokemon-list {
    max-height: 460px;
  }
}
</style>
