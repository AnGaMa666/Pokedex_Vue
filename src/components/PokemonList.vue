<template>
  <section class="pokedex" aria-labelledby="pokemon-list-title">
    <div class="list-heading">
      <div>
        <p class="list-eyebrow">{{ labels.kicker }}</p>
        <h1 id="pokemon-list-title">{{ labels.title }}</h1>
      </div>
      <div v-if="!loading && !hasError" class="result-summary">
        <strong>{{ totalPokemonEntries || pokemons.length }} {{ labels.entries }}</strong>
        <small>
          {{ filteredPokemons.length }} {{ labels.species }} ·
          {{ totalVariantCount }} {{ labels.formsAndVariants }}
        </small>
      </div>
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

      <label class="variant-toggle">
        <input v-model="showVariants" type="checkbox">
        <span>{{ labels.showVariants }}</span>
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
      <ul ref="pokemonList" class="pokemon-list" :aria-busy="enrichingPage">
        <li
          v-for="pokemon in pagedPokemons"
          :key="pokemon.id"
          v-memo="[
            pokemon.id === selectedPokemonId,
            isShiny,
            spriteMode,
            language,
            getSpeciesDetails(pokemon),
            showVariants,
          ]"
          class="species-entry"
        >
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
                decoding="async"
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
                <span v-if="getVariants(pokemon).length">
                  {{ getVariants(pokemon).length }} {{ labels.formsAndVariants }}
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

          <ul
            v-if="showVariants && getVariants(pokemon).length"
            class="variant-list"
            :aria-label="labels.variantsFor.replace('{name}', getPokemonLabel(pokemon))"
          >
            <li v-for="variant in getVariants(pokemon)" :key="variant.pokemon.name">
              <button
                type="button"
                class="variant-button"
                :aria-label="labels.openVariant
                  .replace('{variant}', getVariantLabel(pokemon, variant))
                  .replace('{name}', getPokemonLabel(pokemon))"
                @click="selectPokemon(pokemon)"
              >
                <span class="variant-connector" aria-hidden="true"></span>
                <span class="variant-sprite" aria-hidden="true">
                  <img
                    :src="getVariantSprite(variant)"
                    alt=""
                    width="52"
                    height="52"
                    loading="lazy"
                    decoding="async"
                    @error="useFallbackSprite($event, pokemon.id)"
                  >
                </span>
                <span class="variant-copy">
                  <span class="variant-number">
                    #{{ formatPokemonId(pokemon.id) }} · {{ labels.variant }}
                  </span>
                  <strong>{{ getVariantLabel(pokemon, variant) }}</strong>
                  <small>{{ getVariantKind(variant) }}</small>
                </span>
                <span class="selection-arrow" aria-hidden="true">›</span>
              </button>
            </li>
          </ul>
        </li>
      </ul>

      <nav v-if="pageCount > 1" class="pagination" :aria-label="labels.pages">
        <button type="button" :disabled="page === 1" @click="setPage(page - 1)">
          {{ labels.previous }}
        </button>
        <label class="page-selector">
          <span class="sr-only">{{ labels.selectPage }}</span>
          <select :value="page" @change="setPage(Number($event.target.value))">
            <option v-for="pageNumber in pageCount" :key="pageNumber" :value="pageNumber">
              {{ labels.page }} {{ pageNumber }} / {{ pageCount }}
            </option>
          </select>
        </label>
        <button type="button" :disabled="page === pageCount" @click="setPage(page + 1)">
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
import {
  formatResourceName,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';
import { getPokemonListSprite } from '@/utils/sprites';
import { getLocalizedTypeName } from '@/utils/localization';
import { getSpecialFormKind } from '@/utils/pokemonForms';

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
const PAGE_SIZE = 30;
const MAX_PARALLEL_REQUESTS = 6;
const VARIANT_STORAGE_KEY = 'pokedex-vue:show-variants';
const MAIN_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

const pokemons = ref([]);
const totalPokemonEntries = ref(0);
const regions = ref([]);
const regionPokedexes = ref([]);
const regionalNumbers = ref(new Map());
const allowedTypeIds = ref(null);
const speciesDetailsByName = ref({});
const pokedexDetailsByName = ref({});
const pokemonList = ref(null);
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
const showVariants = ref(true);
const page = ref(1);
let activeEnrichmentId = 0;
let activeRegionRequestId = 0;
let activePokedexRequestId = 0;
let activeTypeRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      kicker: 'Nationaler Index',
      title: 'Pokémon',
      entries: 'Pokémon-Einträge',
      species: 'Arten in der Auswahl',
      formsAndVariants: 'Formen/Varianten',
      filters: 'Pokémon filtern und sortieren',
      region: 'Region',
      allRegions: 'Alle Regionen',
      regionalDex: 'Regionaler Pokédex',
      allRegionalDexes: 'Alle Pokédexe',
      type: 'Typ',
      allTypes: 'Alle Typen',
      status: 'Status',
      sort: 'Sortierung',
      showVariants: 'Formen und Sonderformen anzeigen',
      nationalAscending: 'Nationalnummer aufsteigend',
      nationalDescending: 'Nationalnummer absteigend',
      nameAscending: 'Name A–Z',
      regionalAscending: 'Regionalnummer aufsteigend',
      loading: 'Pokémon werden geladen…',
      loadError: 'Die Pokémon-Liste konnte nicht geladen werden.',
      tryAgain: 'Erneut versuchen',
      noMatches: 'Keine Pokémon-Art entspricht den gewählten Filtern.',
      openLabel: '{name} mit nationaler Pokédex-Nummer {id} öffnen',
      openVariant: '{variant} beim Profil von {name} öffnen',
      variantsFor: 'Formen und Varianten von {name}',
      regionalShort: 'Regional',
      captureRate: 'Fangrate',
      variant: 'Variante',
      regionalForm: 'Regionalform',
      megaForm: 'Mega-Entwicklung',
      gmaxForm: 'Gigadynamax-Form',
      alternateForm: 'Alternative Form',
      pages: 'Pokémon-Seiten',
      selectPage: 'Pokémon-Seite auswählen',
      previous: 'Zurück',
      next: 'Weiter',
      page: 'Seite',
    }
  : {
      kicker: 'National index',
      title: 'Pokémon',
      entries: 'Pokémon entries',
      species: 'species in selection',
      formsAndVariants: 'forms/variants',
      filters: 'Filter and sort Pokémon',
      region: 'Region',
      allRegions: 'All regions',
      regionalDex: 'Regional Pokédex',
      allRegionalDexes: 'All Pokédexes',
      type: 'Type',
      allTypes: 'All types',
      status: 'Status',
      sort: 'Sort',
      showVariants: 'Show forms and special forms',
      nationalAscending: 'National number ascending',
      nationalDescending: 'National number descending',
      nameAscending: 'Name A–Z',
      regionalAscending: 'Regional number ascending',
      loading: 'Loading Pokémon…',
      loadError: 'The Pokémon list could not be loaded.',
      tryAgain: 'Try again',
      noMatches: 'No Pokémon species match the selected filters.',
      openLabel: 'Open {name}, National Pokédex number {id}',
      openVariant: 'Open {variant} in the profile of {name}',
      variantsFor: 'Forms and variants of {name}',
      regionalShort: 'Regional',
      captureRate: 'Catch rate',
      variant: 'Variant',
      regionalForm: 'Regional form',
      megaForm: 'Mega Evolution',
      gmaxForm: 'Gigantamax form',
      alternateForm: 'Alternate form',
      pages: 'Pokémon pages',
      selectPage: 'Select Pokémon page',
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
const totalVariantCount = computed(() => Math.max(
  0,
  Number(totalPokemonEntries.value || 0) - pokemons.value.length,
));
const getSpeciesDetails = (pokemon) => speciesDetailsByName.value[pokemon.name] || null;
const getPokemonLabel = (pokemon) => getLocalizedName(
  getSpeciesDetails(pokemon)?.names,
  pokemon.name,
  language.value,
);
const getVariants = (pokemon) => {
  return (getSpeciesDetails(pokemon)?.varieties || [])
    .filter((variety) => !variety.is_default && variety.pokemon?.name);
};
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

const getVariantId = (variant) => getResourceId(variant.pokemon?.url);
const getVariantSprite = (variant) => {
  const id = getVariantId(variant);
  return id
    ? getPokemonListSprite(id, props.spriteMode, props.isShiny)
    : getPokemonListSprite(0, 'pixel', false);
};
const getVariantLabel = (pokemon, variant) => {
  const baseLabel = getPokemonLabel(pokemon);
  const variantName = variant.pokemon?.name || '';
  const suffix = variantName.startsWith(`${pokemon.name}-`)
    ? variantName.slice(pokemon.name.length + 1)
    : variantName;
  const localizedSuffixes = language.value === 'de'
    ? {
        alola: 'Alola-Form',
        galar: 'Galar-Form',
        hisui: 'Hisui-Form',
        paldea: 'Paldea-Form',
        mega: 'Mega',
        'mega-x': 'Mega X',
        'mega-y': 'Mega Y',
        gmax: 'Gigadynamax',
        female: 'weiblich',
        male: 'männlich',
      }
    : {
        alola: 'Alolan Form',
        galar: 'Galarian Form',
        hisui: 'Hisuian Form',
        paldea: 'Paldean Form',
        mega: 'Mega',
        'mega-x': 'Mega X',
        'mega-y': 'Mega Y',
        gmax: 'Gigantamax',
        female: 'female',
        male: 'male',
      };
  const suffixLabel = localizedSuffixes[suffix] || formatResourceName(suffix);
  return suffixLabel ? `${baseLabel} – ${suffixLabel}` : baseLabel;
};
const getVariantKind = (variant) => {
  const name = variant.pokemon?.name || '';
  const specialKind = getSpecialFormKind(name);

  if (specialKind === 'mega') {
    return labels.value.megaForm;
  }

  if (specialKind === 'gmax') {
    return labels.value.gmaxForm;
  }

  if (/-(?:alola|galar|hisui|paldea)(?:-|$)/.test(name)) {
    return labels.value.regionalForm;
  }

  return labels.value.alternateForm;
};

const filteredPokemons = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase(language.value);
  const regionalMap = regionalNumbers.value;
  const entries = pokemons.value.filter((pokemon) => {
    const label = getPokemonLabel(pokemon).toLocaleLowerCase(language.value);
    const variantLabels = getVariants(pokemon).map((variant) => {
      return getVariantLabel(pokemon, variant).toLocaleLowerCase(language.value);
    });
    const matchesQuery = !query
      || pokemon.name.includes(query)
      || label.includes(query)
      || variantLabels.some((variantLabel) => variantLabel.includes(query))
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

const setPage = (nextPage) => {
  const normalizedPage = Math.min(pageCount.value, Math.max(1, Number(nextPage) || 1));

  if (page.value === normalizedPage) {
    pokemonList.value?.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  page.value = normalizedPage;
  requestAnimationFrame(() => {
    pokemonList.value?.scrollTo({ top: 0, behavior: 'auto' });
  });
};

const resetPage = () => {
  page.value = 1;
  requestAnimationFrame(() => {
    pokemonList.value?.scrollTo({ top: 0, behavior: 'auto' });
  });
};

const restoreVariantPreference = () => {
  try {
    const storedValue = window.localStorage.getItem(VARIANT_STORAGE_KEY);
    showVariants.value = storedValue === null ? true : storedValue === 'true';
  } catch {
    showVariants.value = true;
  }
};

const persistVariantPreference = () => {
  try {
    window.localStorage.setItem(VARIANT_STORAGE_KEY, String(showVariants.value));
  } catch {
    // The setting remains active for the current page when storage is unavailable.
  }
};

const fetchPokemons = async () => {
  loading.value = true;
  hasError.value = false;

  try {
    const [speciesResponse, countResponse] = await Promise.all([
      PokeAPI.getPokemonSpeciesList(),
      PokeAPI.getPokemonEntryCount(),
    ]);
    pokemons.value = speciesResponse.data.results
      .map((pokemon) => ({ ...pokemon, id: getResourceId(pokemon.url) }))
      .filter((pokemon) => pokemon.id !== null)
      .sort((firstPokemon, secondPokemon) => firstPokemon.id - secondPokemon.id);
    totalPokemonEntries.value = Number(countResponse.data.count) || pokemons.value.length;
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

    for (const details of resolvedDetails) {
      pokedexDetailsByName.value[details.name] = details;
    }

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

    pokedexDetailsByName.value[response.data.name] = response.data;
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

        speciesDetailsByName.value[pokemon.name] = response.data;
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
  resetPage();
  void loadRegionPokedexes();
});
watch(selectedPokedex, () => {
  resetPage();
  void loadPokedexEntries();
});
watch(selectedType, () => {
  resetPage();
  void loadTypeFilter();
});
watch([selectedStatus, sortMode, () => props.searchQuery], resetPage);
watch(showVariants, persistVariantPreference);
watch(
  () => `${page.value}:${pagedPokemons.value.map((pokemon) => pokemon.name).join('|')}`,
  () => void enrichPagedSpecies(),
);
watch(pageCount, (newPageCount) => {
  if (page.value > newPageCount) {
    setPage(newPageCount);
  }
});

onMounted(async () => {
  restoreVariantPreference();
  await Promise.all([fetchPokemons(), loadRegions()]);
  void enrichPagedSpecies();
});
</script>

<style scoped>
.pokedex {
  position: sticky;
  top: 86px;
  display: flex;
  flex-direction: column;
  align-self: start;
  height: calc(100vh - 104px);
  max-height: calc(100vh - 104px);
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.list-heading {
  display: flex;
  flex: 0 0 auto;
  gap: 14px;
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

.result-summary {
  display: grid;
  justify-items: end;
  color: var(--legacy-muted);
  text-align: right;
}

.result-summary strong {
  color: var(--legacy-text);
  font-size: 0.76rem;
}

.result-summary small {
  margin-top: 3px;
  font-size: 0.63rem;
}

.filter-panel {
  display: grid;
  flex: 0 0 auto;
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

.filter-panel label:nth-child(5),
.filter-panel .variant-toggle {
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

.filter-panel .variant-toggle {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 6px 8px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  cursor: pointer;
  background: var(--legacy-page);
  font-size: 0.72rem;
}

.filter-panel .variant-toggle input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--focus-color);
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
  flex: 1 1 auto;
  min-height: 0;
  padding: 6px;
  margin: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  list-style: none;
}

.species-entry {
  margin: 0;
  content-visibility: auto;
  contain-intrinsic-size: 96px;
}

.pokemon-button,
.variant-button {
  display: grid;
  align-items: center;
  width: 100%;
  border: 1px solid transparent;
  color: var(--legacy-text);
  text-align: left;
  cursor: pointer;
  background: transparent;
}

.pokemon-button {
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 10px;
  min-height: 88px;
  padding: 6px 9px 6px 6px;
}

.pokemon-button:hover,
.variant-button:hover {
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
.regional-number,
.variant-number {
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

.variant-list {
  padding: 0 0 5px 28px;
  margin: 0;
  list-style: none;
}

.variant-button {
  position: relative;
  grid-template-columns: 18px 52px minmax(0, 1fr) auto;
  gap: 8px;
  min-height: 66px;
  padding: 5px 8px 5px 0;
  border-left-color: var(--legacy-border);
  background: color-mix(in srgb, var(--legacy-page) 72%, transparent);
}

.variant-connector {
  align-self: stretch;
  border-left: 1px solid var(--legacy-border-strong);
  border-bottom: 1px solid var(--legacy-border-strong);
  transform: translateY(-50%);
}

.variant-sprite {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.variant-sprite img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated;
}

.variant-copy {
  display: grid;
  min-width: 0;
}

.variant-copy strong {
  margin-top: 2px;
  overflow: hidden;
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.variant-copy small {
  margin-top: 2px;
  color: var(--legacy-muted);
  font-size: 0.62rem;
}

.pagination {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-top: 1px solid var(--legacy-border);
  background: var(--legacy-page);
  box-shadow: 0 -4px 10px color-mix(in srgb, var(--legacy-shadow) 55%, transparent);
}

.pagination button,
.page-selector select {
  min-height: 34px;
  padding: 5px 9px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: var(--legacy-surface);
}

.pagination button:disabled {
  opacity: 0.45;
}

.page-selector {
  min-width: 0;
}

.page-selector select {
  width: 100%;
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 900px) {
  .pokedex {
    position: static;
    display: block;
    height: auto;
    max-height: none;
  }

  .pokemon-list {
    max-height: 620px;
  }
}

@media (max-width: 460px) {
  .list-heading {
    align-items: flex-start;
  }

  .filter-panel {
    grid-template-columns: 1fr;
  }

  .filter-panel label:nth-child(5),
  .filter-panel .variant-toggle {
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

  .variant-list {
    padding-left: 16px;
  }

  .variant-button {
    grid-template-columns: 12px 46px minmax(0, 1fr) auto;
  }

  .variant-sprite {
    width: 46px;
    height: 46px;
  }

  .variant-sprite img {
    width: 42px;
    height: 42px;
  }

  .pagination {
    grid-template-columns: 1fr 1fr;
  }

  .page-selector {
    grid-column: 1 / -1;
    grid-row: 1;
  }
}
</style>
