<template>
  <section class="pokedex" aria-labelledby="pokemon-list-title">
    <div class="list-heading">
      <div>
        <p class="list-eyebrow">{{ labels.kicker }}</p>
        <h1 id="pokemon-list-title">{{ labels.title }}</h1>
      </div>
      <span v-if="!loading && !hasError" class="result-count">
        {{ filteredPokemons.length }} {{ labels.results }}
      </span>
    </div>

    <div class="filter-panel" :aria-label="labels.filters">
      <label>
        <span>{{ labels.region }}</span>
        <select v-model="selectedRegion" :disabled="loadingRegions">
          <option value="">{{ labels.allRegions }}</option>
          <option v-for="region in regions" :key="region.name" :value="region.name">
            {{ formatName(region.name) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ labels.regionalDex }}</span>
        <select v-model="selectedPokedex" :disabled="!selectedRegion || loadingPokedexes">
          <option value="">{{ labels.allRegionalDexes }}</option>
          <option v-for="pokedex in regionPokedexes" :key="pokedex.name" :value="pokedex.name">
            {{ getPokedexLabel(pokedex) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ labels.type }}</span>
        <select v-model="selectedType" :disabled="loadingTypes">
          <option value="">{{ labels.allTypes }}</option>
          <option v-for="type in typeOptions" :key="type" :value="type">
            {{ getTypeLabel(type) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ labels.status }}</span>
        <select v-model="selectedStatus">
          <option v-for="status in statusOptions" :key="status" :value="status">
            {{ getStatusLabel(status) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ labels.sort }}</span>
        <select v-model="sortMode">
          <option value="national-asc">{{ labels.nationalAscending }}</option>
          <option value="national-desc">{{ labels.nationalDescending }}</option>
          <option value="name-asc">{{ labels.nameAscending }}</option>
          <option value="region-asc" :disabled="!selectedPokedex">
            {{ labels.regionalAscending }}
          </option>
        </select>
      </label>
    </div>

    <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>

    <div v-else-if="hasError" class="error" role="alert">
      <p>{{ labels.loadError }}</p>
      <button type="button" class="retry-button" @click="fetchPokemons">
        {{ labels.tryAgain }}
      </button>
    </div>

    <p v-else-if="filteredPokemons.length === 0" class="status-message">
      {{ labels.noMatches }}
    </p>

    <template v-else>
      <ul class="pokemon-list" :aria-busy="enrichingPage">
        <li v-for="pokemon in pagedPokemons" :key="pokemon.id">
          <button
            type="button"
            class="pokemon-button"
            :class="{ 'is-active': pokemon.id === selectedPokemonId }"
            :aria-current="pokemon.id === selectedPokemonId ? 'true' : undefined"
            :aria-label="labels.openLabel
              .replace('{name}', getPokemonLabel(pokemon))
              .replace('{id}', pokemon.id)"
            @click="selectPokemon(pokemon)"
          >
            <span class="sprite-frame" aria-hidden="true">
              <img
                :src="getListSprite(pokemon.id)"
                alt=""
                width="72"
                height="72"
                loading="lazy"
                @error="useFallbackSprite($event, pokemon.id)"
              >
            </span>

            <span class="pokemon-copy">
              <span class="number-row">
                <span class="pokemon-number">#{{ formatPokemonId(pokemon.id) }}</span>
                <span v-if="getRegionalNumber(pokemon) !== null" class="regional-number">
                  {{ labels.regionalShort }} #{{ getRegionalNumber(pokemon) }}
                </span>
              </span>
              <span class="pokemon-name">{{ getPokemonLabel(pokemon) }}</span>
              <span v-if="getSpeciesDetails(pokemon)" class="pokemon-meta">
                <span>{{ labels.captureRate }} {{ getSpeciesDetails(pokemon).capture_rate }}</span>
                <span v-if="getSpeciesDetails(pokemon).varieties?.length > 1">
                  {{ getSpeciesDetails(pokemon).varieties.length - 1 }} {{ labels.variants }}
                </span>
              </span>
              <span class="status-row">
                <span
                  v-for="classification in getVisibleClassifications(pokemon)"
                  :key="classification"
                  class="status-chip"
                >
                  {{ getStatusLabel(classification) }}
                </span>
              </span>
            </span>

            <span class="selection-arrow" aria-hidden="true">›</span>
          </button>
        </li>
      </ul>

      <nav v-if="pageCount > 1" class="pagination" :aria-label="labels.pages">
        <button type="button" :disabled="page === 1" @click="page -= 1">
          {{ labels.previous }}
        </button>
        <span>{{ labels.page }} {{ page }} / {{ pageCount }}</span>
        <button type="button" :disabled="page === pageCount" @click="page += 1">
          {{ labels.next }}
        </button>
      </nav>
    </template>
  </section>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  STATUS_OPTIONS,
  getPokemonClassifications,
  matchesPokemonStatus,
} from '@/utils/pokemonClassification';
import { getLocalizedName, getResourceId } from '@/utils/resource';
import { getPokemonListSprite } from '@/utils/sprites';
import { getLocalizedTypeName } from '@/utils/localization';

const props = defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
  selectedPokemonId: {
    type: Number,
    default: null,
  },
  isShiny: {
    type: Boolean,
    default: false,
  },
  spriteMode: {
    type: String,
    default: 'pixel',
  },
});

const emit = defineEmits(['select']);
const { language } = useI18n();
const PAGE_SIZE = 70;
const MAX_PARALLEL_REQUESTS = 8;
const MAIN_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

const pokemons = ref([]);
const regions = ref([]);
const regionPokedexes = ref([]);
const regionalNumbers = ref(new Map());
const allowedTypeIds = ref(null);
const speciesDetailsByName = ref({});
const pokedexDetailsByName = ref({});
const loading = ref(true);
const loadingRegions = ref(false);
const loadingPokedexes = ref(false);
const loadingTypes = ref(false);
const enrichingPage = ref(false);
const hasError = ref(false);
const selectedRegion = ref('');
const selectedPokedex = ref('');
const selectedType = ref('');
const selectedStatus = ref('all');
const sortMode = ref('national-asc');
const page = ref(1);
let activeEnrichmentId = 0;
let activeRegionRequestId = 0;
let activePokedexRequestId = 0;
let activeTypeRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      kicker: 'Nationaler Index',
      title: 'Pokémon-Arten',
      results: 'Ergebnisse',
      filters: 'Pokémon filtern und sortieren',
      region: 'Region',
      allRegions: 'Alle Regionen',
      regionalDex: 'Regionaler Pokédex',
      allRegionalDexes: 'Alle Pokédexe',
      type: 'Typ',
      allTypes: 'Alle Typen',
      status: 'Status',
      sort: 'Sortierung',
      nationalAscending: 'Nationalnummer aufsteigend',
      nationalDescending: 'Nationalnummer absteigend',
      nameAscending: 'Name A–Z',
      regionalAscending: 'Regionalnummer aufsteigend',
      loading: 'Pokémon-Arten werden geladen…',
      loadError: 'Die Artenliste konnte nicht geladen werden.',
      tryAgain: 'Erneut versuchen',
      noMatches: 'Keine Pokémon-Art entspricht den gewählten Filtern.',
      openLabel: '{name} mit nationaler Pokédex-Nummer {id} öffnen',
      regionalShort: 'Regional',
      captureRate: 'Fangrate',
      variants: 'Varianten',
      pages: 'Pokémon-Seiten',
      previous: 'Zurück',
      next: 'Weiter',
      page: 'Seite',
    }
  : {
      kicker: 'National index',
      title: 'Pokémon species',
      results: 'results',
      filters: 'Filter and sort Pokémon',
      region: 'Region',
      allRegions: 'All regions',
      regionalDex: 'Regional Pokédex',
      allRegionalDexes: 'All Pokédexes',
      type: 'Type',
      allTypes: 'All types',
      status: 'Status',
      sort: 'Sort',
      nationalAscending: 'National number ascending',
      nationalDescending: 'National number descending',
      nameAscending: 'Name A–Z',
      regionalAscending: 'Regional number ascending',
      loading: 'Loading Pokémon species…',
      loadError: 'The species list could not be loaded.',
      tryAgain: 'Try again',
      noMatches: 'No Pokémon species match the selected filters.',
      openLabel: 'Open {name}, National Pokédex number {id}',
      regionalShort: 'Regional',
      captureRate: 'Catch rate',
      variants: 'variants',
      pages: 'Pokémon pages',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
    });

const statusLabels = computed(() => language.value === 'de'
  ? {
      all: 'Alle Status',
      legendary: 'Legendär',
      mythical: 'Mysteriös',
      starter: 'Starter',
      fossil: 'Fossil',
      'ultra-beast': 'Ultrabestie',
      paradox: 'Paradox',
      baby: 'Baby-Pokémon',
      regular: 'Regulär',
    }
  : {
      all: 'All statuses',
      legendary: 'Legendary',
      mythical: 'Mythical',
      starter: 'Starter',
      fossil: 'Fossil',
      'ultra-beast': 'Ultra Beast',
      paradox: 'Paradox',
      baby: 'Baby Pokémon',
      regular: 'Regular',
    });

const statusOptions = STATUS_OPTIONS;
const typeOptions = MAIN_TYPES;
const maximumSpeciesId = computed(() => pokemons.value.at(-1)?.id ?? 0);
const getSpeciesDetails = (pokemon) => speciesDetailsByName.value[pokemon.name] || null;
const getPokemonLabel = (pokemon) => getLocalizedName(
  getSpeciesDetails(pokemon)?.names,
  pokemon.name,
  language.value,
);
const getVisibleClassifications = (pokemon) => getPokemonClassifications(
  pokemon.id,
  getSpeciesDetails(pokemon),
).filter((classification) => classification !== 'regular' || selectedStatus.value === 'regular');
const getRegionalNumber = (pokemon) => regionalNumbers.value.has(pokemon.name)
  ? regionalNumbers.value.get(pokemon.name)
  : null;
const getTypeLabel = (type) => getLocalizedTypeName(type, language.value);
const getStatusLabel = (status) => statusLabels.value[status] || status;
const getPokedexLabel = (pokedex) => getLocalizedName(
  pokedexDetailsByName.value[pokedex.name]?.names,
  pokedex.name,
  language.value,
);

const filteredPokemons = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase(language.value);
  const regionalMap = regionalNumbers.value;
  const entries = pokemons.value.filter((pokemon) => {
    const label = getPokemonLabel(pokemon).toLocaleLowerCase(language.value);
    const matchesQuery = !query
      || pokemon.name.includes(query)
      || label.includes(query)
      || String(pokemon.id).includes(query)
      || (regionalMap.has(pokemon.name) && String(regionalMap.get(pokemon.name)).includes(query));
    const matchesRegion = !selectedPokedex.value || regionalMap.has(pokemon.name);
    const matchesType = !selectedType.value || allowedTypeIds.value?.has(pokemon.id);
    const matchesStatus = matchesPokemonStatus(
      pokemon.id,
      selectedStatus.value,
      getSpeciesDetails(pokemon),
    );
    return matchesQuery && matchesRegion && matchesType && matchesStatus;
  });

  return [...entries].sort((firstPokemon, secondPokemon) => {
    if (sortMode.value === 'national-desc') {
      return secondPokemon.id - firstPokemon.id;
    }

    if (sortMode.value === 'name-asc') {
      return getPokemonLabel(firstPokemon).localeCompare(
        getPokemonLabel(secondPokemon),
        language.value,
      );
    }

    if (sortMode.value === 'region-asc' && selectedPokedex.value) {
      return (regionalMap.get(firstPokemon.name) ?? Number.MAX_SAFE_INTEGER)
        - (regionalMap.get(secondPokemon.name) ?? Number.MAX_SAFE_INTEGER);
    }

    return firstPokemon.id - secondPokemon.id;
  });
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredPokemons.value.length / PAGE_SIZE)));
const pagedPokemons = computed(() => {
  const startIndex = (page.value - 1) * PAGE_SIZE;
  return filteredPokemons.value.slice(startIndex, startIndex + PAGE_SIZE);
});

const formatPokemonId = (id) => String(id).padStart(4, '0');
const formatName = (name) => name
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');
const getListSprite = (id) => getPokemonListSprite(id, props.spriteMode, props.isShiny);
const useFallbackSprite = (event, id) => {
  const fallback = getPokemonListSprite(id, 'pixel', props.isShiny);

  if (event.currentTarget.src !== fallback) {
    event.currentTarget.src = fallback;
  } else {
    event.currentTarget.hidden = true;
  }
};
const selectPokemon = (pokemon) => emit('select', {
  ...pokemon,
  image: getListSprite(pokemon.id),
});

const fetchPokemons = async () => {
  loading.value = true;
  hasError.value = false;

  try {
    const response = await PokeAPI.getPokemonSpeciesList();
    pokemons.value = response.data.results
      .map((pokemon) => ({ ...pokemon, id: getResourceId(pokemon.url) }))
      .filter((pokemon) => pokemon.id !== null)
      .sort((firstPokemon, secondPokemon) => firstPokemon.id - secondPokemon.id);
  } catch (requestError) {
    console.error('Failed to load Pokémon species:', requestError);
    hasError.value = true;
  } finally {
    loading.value = false;
  }
};

const loadRegions = async () => {
  loadingRegions.value = true;

  try {
    const response = await PokeAPI.getRegions();
    regions.value = response.data.results;
  } catch (requestError) {
    console.error('Failed to load regions:', requestError);
  } finally {
    loadingRegions.value = false;
  }
};

const loadRegionPokedexes = async () => {
  const requestId = ++activeRegionRequestId;
  selectedPokedex.value = '';
  regionPokedexes.value = [];
  regionalNumbers.value = new Map();

  if (!selectedRegion.value) {
    loadingPokedexes.value = false;
    return;
  }

  loadingPokedexes.value = true;

  try {
    const response = await PokeAPI.getRegionDetails(selectedRegion.value);

    if (requestId !== activeRegionRequestId) {
      return;
    }

    regionPokedexes.value = response.data.pokedexes || [];
    const detailResults = await Promise.allSettled(
      regionPokedexes.value.map((pokedex) => PokeAPI.getPokedexDetails(pokedex.name)),
    );

    if (requestId !== activeRegionRequestId) {
      return;
    }

    const resolvedDetails = detailResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value.data);
    pokedexDetailsByName.value = {
      ...pokedexDetailsByName.value,
      ...Object.fromEntries(resolvedDetails.map((details) => [details.name, details])),
    };

    const preferred = resolvedDetails.find((details) => details.is_main_series)
      || resolvedDetails[0];
    selectedPokedex.value = preferred?.name || '';
  } catch (requestError) {
    console.error('Failed to load regional Pokédexes:', requestError);
  } finally {
    if (requestId === activeRegionRequestId) {
      loadingPokedexes.value = false;
    }
  }
};

const loadPokedexEntries = async () => {
  const requestId = ++activePokedexRequestId;
  regionalNumbers.value = new Map();

  if (!selectedPokedex.value) {
    return;
  }

  loadingPokedexes.value = true;

  try {
    const response = pokedexDetailsByName.value[selectedPokedex.value]
      ? { data: pokedexDetailsByName.value[selectedPokedex.value] }
      : await PokeAPI.getPokedexDetails(selectedPokedex.value);

    if (requestId !== activePokedexRequestId) {
      return;
    }

    pokedexDetailsByName.value = {
      ...pokedexDetailsByName.value,
      [response.data.name]: response.data,
    };
    regionalNumbers.value = new Map(
      (response.data.pokemon_entries || []).map((entry) => [
        entry.pokemon_species.name,
        entry.entry_number,
      ]),
    );
  } catch (requestError) {
    console.error('Failed to load Pokédex entries:', requestError);
  } finally {
    if (requestId === activePokedexRequestId) {
      loadingPokedexes.value = false;
    }
  }
};

const loadTypeFilter = async () => {
  const requestId = ++activeTypeRequestId;
  allowedTypeIds.value = null;

  if (!selectedType.value) {
    loadingTypes.value = false;
    return;
  }

  loadingTypes.value = true;

  try {
    const response = await PokeAPI.getTypeDetails(selectedType.value);

    if (requestId !== activeTypeRequestId) {
      return;
    }

    allowedTypeIds.value = new Set(
      (response.data.pokemon || [])
        .map((entry) => getResourceId(entry.pokemon?.url))
        .filter((id) => id !== null && id <= maximumSpeciesId.value),
    );
  } catch (requestError) {
    console.error('Failed to load type filter:', requestError);
    allowedTypeIds.value = new Set();
  } finally {
    if (requestId === activeTypeRequestId) {
      loadingTypes.value = false;
    }
  }
};

const enrichPagedSpecies = async () => {
  const enrichmentId = ++activeEnrichmentId;
  const missingEntries = pagedPokemons.value.filter((pokemon) => {
    return !speciesDetailsByName.value[pokemon.name];
  });

  if (!missingEntries.length) {
    enrichingPage.value = false;
    return;
  }

  enrichingPage.value = true;
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < missingEntries.length) {
      const pokemon = missingEntries[nextIndex];
      nextIndex += 1;

      try {
        const response = await PokeAPI.getPokemonSpecies(pokemon.name);

        if (enrichmentId !== activeEnrichmentId) {
          return;
        }

        speciesDetailsByName.value = {
          ...speciesDetailsByName.value,
          [pokemon.name]: response.data,
        };
      } catch (requestError) {
        console.error(`Failed to load species ${pokemon.name}:`, requestError);
      }
    }
  };

  await Promise.all(Array.from(
    { length: Math.min(MAX_PARALLEL_REQUESTS, missingEntries.length) },
    worker,
  ));

  if (enrichmentId === activeEnrichmentId) {
    enrichingPage.value = false;
  }
};

watch(selectedRegion, () => {
  page.value = 1;
  void loadRegionPokedexes();
});
watch(selectedPokedex, () => {
  page.value = 1;
  void loadPokedexEntries();
});
watch(selectedType, () => {
  page.value = 1;
  void loadTypeFilter();
});
watch([selectedStatus, sortMode, () => props.searchQuery], () => {
  page.value = 1;
});
watch(
  () => `${page.value}:${pagedPokemons.value.map((pokemon) => pokemon.name).join('|')}`,
  () => void enrichPagedSpecies(),
);
watch(pageCount, (newPageCount) => {
  if (page.value > newPageCount) {
    page.value = newPageCount;
  }
});

onMounted(async () => {
  await Promise.all([fetchPokemons(), loadRegions()]);
  void enrichPagedSpecies();
});
</script>

<style scoped>
.pokedex {
  position: sticky;
  top: 86px;
  align-self: start;
  max-height: calc(100vh - 104px);
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.list-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 16px 14px 12px;
  border-bottom: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.list-heading h1 {
  margin: 0;
  font-size: 1.35rem;
}

.list-eyebrow {
  margin: 0 0 4px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.result-count {
  color: var(--legacy-muted);
  font-size: 0.72rem;
  font-weight: 800;
}

.filter-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  padding: 10px;
  border-bottom: 1px solid var(--legacy-border);
}

.filter-panel label {
  display: grid;
  gap: 3px;
  min-width: 0;
  color: var(--legacy-muted);
  font-size: 0.64rem;
  font-weight: 850;
}

.filter-panel label:last-child {
  grid-column: 1 / -1;
}

.filter-panel select {
  width: 100%;
  min-width: 0;
  min-height: 34px;
  padding: 5px 7px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: var(--legacy-page);
  font-size: 0.76rem;
}

.status-message,
.error {
  margin: 0;
  padding: 24px 18px;
  color: var(--legacy-muted);
}

.error {
  color: var(--danger-color);
}

.retry-button {
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid var(--danger-color);
  color: var(--danger-color);
  background: var(--legacy-page);
}

.pokemon-list {
  max-height: calc(100vh - 382px);
  padding: 6px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.pokemon-button {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 88px;
  padding: 6px 9px 6px 6px;
  border: 1px solid transparent;
  color: var(--legacy-text);
  text-align: left;
  background: transparent;
}

.pokemon-button:hover {
  border-color: var(--legacy-border-strong);
  background: var(--legacy-surface-hover);
}

.pokemon-button.is-active {
  border-color: var(--legacy-border-strong);
  background: var(--legacy-surface-active);
  box-shadow: inset 4px 0 0 #888888;
}

.sprite-frame {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.sprite-frame img {
  width: 68px;
  height: 68px;
  object-fit: contain;
  image-rendering: pixelated;
}

.pokemon-copy {
  display: grid;
  min-width: 0;
}

.number-row,
.pokemon-meta,
.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 8px;
  align-items: center;
}

.pokemon-number,
.regional-number {
  color: var(--legacy-muted);
  font-size: 0.69rem;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}

.regional-number {
  color: var(--focus-color);
}

.pokemon-name {
  margin-top: 2px;
  overflow: hidden;
  font-size: 0.94rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pokemon-meta {
  margin-top: 4px;
  color: var(--legacy-muted);
  font-size: 0.65rem;
}

.status-row {
  margin-top: 4px;
}

.status-chip {
  padding: 2px 5px;
  border: 1px solid var(--legacy-border);
  border-radius: 999px;
  color: var(--legacy-muted);
  font-size: 0.57rem;
  font-weight: 850;
  background: var(--legacy-page);
}

.selection-arrow {
  color: var(--legacy-muted);
  font-size: 1.5rem;
}

.pagination {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-top: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.pagination button {
  min-height: 32px;
  padding: 5px 9px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: var(--legacy-surface);
}

.pagination button:disabled {
  opacity: 0.45;
}

.pagination span {
  color: var(--legacy-muted);
  font-size: 0.7rem;
  text-align: center;
}

@media (max-width: 900px) {
  .pokedex {
    position: static;
    max-height: none;
  }

  .pokemon-list {
    max-height: 520px;
  }
}

@media (max-width: 460px) {
  .filter-panel {
    grid-template-columns: 1fr;
  }

  .filter-panel label:last-child {
    grid-column: auto;
  }

  .pokemon-button {
    grid-template-columns: 62px minmax(0, 1fr) auto;
  }

  .sprite-frame {
    width: 62px;
    height: 62px;
  }

  .sprite-frame img {
    width: 58px;
    height: 58px;
  }
}
</style>
