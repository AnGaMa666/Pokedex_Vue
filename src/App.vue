<template>
  <div class="app-shell">
    <Header
      :search-query="searchQuery"
      :is-shiny="isShiny"
      :is-dark="isDark"
      :sprite-mode="spriteMode"
      :show-search="showGlobalSearch"
      :show-shiny="activeSection === 'pokedex' || activeSection === 'team'"
      :show-sprite-selector="activeSection === 'pokedex' || activeSection === 'team'"
      :section-label="activeConfig.label"
      :search-label="activeConfig.searchLabel"
      :search-placeholder="activeConfig.searchPlaceholder"
      @update-search-query="updateSearchQuery"
      @toggle-shiny="toggleShiny"
      @toggle-dark="toggleDark"
      @update-sprite-mode="setSpriteMode"
    />

    <div class="workspace">
      <AppNavigation :active-section="activeSection" />

      <main class="page-content">
        <HomePage v-if="activeSection === 'home'" />

        <section v-else-if="activeSection === 'pokedex'" class="pokedex-layout">
          <PokemonList
            :search-query="searchQuery"
            :selected-pokemon-id="selectedPokemon?.id ?? null"
            :is-shiny="isShiny"
            :sprite-mode="spriteMode"
            @select="selectPokemon"
          />

          <section ref="detailsContainer" class="details-container" aria-live="polite">
            <PokemonProfile
              v-if="selectedPokemon"
              :key="selectedPokemon.name"
              :pokemon="selectedPokemon"
              :is-shiny="isShiny"
              :sprite-mode="spriteMode"
              @details-loaded="updateSelectedPokemonDetails"
              @open-resource="openResource"
            />

            <MoveList
              v-if="selectedPokemonDetails?.moves?.length"
              :key="selectedPokemonDetails.name"
              :pokemon-details="selectedPokemonDetails"
              @open-resource="openResource"
            />

            <div v-else-if="!selectedPokemon" class="empty-state">
              <span class="empty-state-mark" aria-hidden="true"></span>
              <div>
                <h1>{{ t('pokedex.chooseTitle') }}</h1>
                <p>{{ t('pokedex.chooseText') }}</p>
                <small>{{ t('pokedex.chooseNote') }}</small>
              </div>
            </div>
          </section>
        </section>

        <RouteDirectory
          v-else-if="activeSection === 'routes'"
          :search-query="searchQuery"
        />

        <TeamBuilder
          v-else-if="activeSection === 'team'"
          :is-shiny="isShiny"
          :sprite-mode="spriteMode"
        />

        <ExplorerDirectory
          v-else
          :key="activeSection"
          :kind="activeSection"
          :search-query="searchQuery"
          :requested-resource="requestedResource"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue';
import { useI18n } from '@/i18n';
import AppNavigation from './components/AppNavigation.vue';
import ExplorerDirectory from './components/ExplorerDirectory.vue';
import Header from './components/Header.vue';
import HomePage from './components/HomePage.vue';
import MoveList from './components/MoveList.vue';
import PokemonList from './components/PokemonList.vue';
import PokemonProfile from './components/PokemonProfile.vue';
import RouteDirectory from './components/RouteDirectory.vue';
import TeamBuilder from './components/TeamBuilder.vue';

const { t } = useI18n();
const THEME_STORAGE_KEY = 'pokedex-vue:theme';
const SPRITE_STORAGE_KEY = 'pokedex-vue:sprite-mode';
const SHINY_STORAGE_KEY = 'pokedex-vue:shiny';

const sectionConfigs = computed(() => ({
  home: {
    label: t('section.home.label'),
    searchLabel: '',
    searchPlaceholder: '',
  },
  pokedex: {
    label: t('section.pokedex.label'),
    searchLabel: t('section.pokedex.searchLabel'),
    searchPlaceholder: t('section.pokedex.searchPlaceholder'),
  },
  moves: {
    label: t('section.moves.label'),
    searchLabel: t('section.moves.searchLabel'),
    searchPlaceholder: t('section.moves.searchPlaceholder'),
  },
  items: {
    label: t('section.items.label'),
    searchLabel: t('section.items.searchLabel'),
    searchPlaceholder: t('section.items.searchPlaceholder'),
  },
  berries: {
    label: t('section.berries.label'),
    searchLabel: t('section.berries.searchLabel'),
    searchPlaceholder: t('section.berries.searchPlaceholder'),
  },
  balls: {
    label: t('section.balls.label'),
    searchLabel: t('section.balls.searchLabel'),
    searchPlaceholder: t('section.balls.searchPlaceholder'),
  },
  'special-items': {
    label: t('section.specialItems.label'),
    searchLabel: t('section.specialItems.searchLabel'),
    searchPlaceholder: t('section.specialItems.searchPlaceholder'),
  },
  routes: {
    label: t('section.routes.label'),
    searchLabel: t('section.routes.searchLabel'),
    searchPlaceholder: t('section.routes.searchPlaceholder'),
  },
  team: {
    label: t('section.team.label'),
    searchLabel: '',
    searchPlaceholder: '',
  },
}));

const parseHashRoute = () => {
  const rawHash = window.location.hash.slice(1);
  const [requestedSection = '', query = ''] = rawHash.split('?');
  const section = requestedSection.toLowerCase();
  const resolvedSection = Object.hasOwn(sectionConfigs.value, section) ? section : 'home';
  const params = new URLSearchParams(query);

  return {
    section: resolvedSection,
    resource: params.get('resource')?.trim().toLowerCase() || '',
  };
};

const activeSection = ref('home');
const requestedResource = ref('');
const searchQueries = reactive({
  pokedex: '',
  moves: '',
  items: '',
  berries: '',
  balls: '',
  'special-items': '',
  routes: '',
});
const selectedPokemon = ref(null);
const selectedPokemonDetails = ref(null);
const detailsContainer = ref(null);
const isShiny = ref(false);
const isDark = ref(false);
const spriteMode = ref('pixel');

const activeConfig = computed(() => sectionConfigs.value[activeSection.value]);
const searchQuery = computed(() => searchQueries[activeSection.value] || '');
const showGlobalSearch = computed(() => !['home', 'team'].includes(activeSection.value));

const syncSectionFromHash = () => {
  const route = parseHashRoute();
  activeSection.value = route.section;
  requestedResource.value = route.resource;

  const expectedHash = route.resource
    ? `#${route.section}?resource=${encodeURIComponent(route.resource)}`
    : `#${route.section}`;

  if (window.location.hash !== expectedHash) {
    window.history.replaceState(null, '', expectedHash);
  }
};

const scrollToPokemonDetailsOnMobile = async () => {
  await nextTick();

  if (window.matchMedia('(max-width: 900px)').matches) {
    detailsContainer.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

const selectPokemon = async (pokemon) => {
  const isSamePokemon = selectedPokemon.value?.id === pokemon.id
    && selectedPokemon.value?.name === pokemon.name;

  if (isSamePokemon) {
    await scrollToPokemonDetailsOnMobile();
    return;
  }

  selectedPokemon.value = pokemon;
  selectedPokemonDetails.value = null;
  await scrollToPokemonDetailsOnMobile();
};

const updateSelectedPokemonDetails = (pokemonDetails) => {
  selectedPokemonDetails.value = pokemonDetails;
};

const updateSearchQuery = (query) => {
  if (Object.hasOwn(searchQueries, activeSection.value)) {
    searchQueries[activeSection.value] = query;
  }
};

const getResourceSection = (kind, name) => {
  if (kind !== 'items') {
    return kind;
  }

  const specialItemPattern = /(?:ite(?:-[xy])?|ium-z|memory|plate|drive|orb)$/;
  return specialItemPattern.test(name) ? 'special-items' : 'items';
};

const openResource = ({ kind, name }) => {
  if (!['moves', 'items', 'berries', 'balls', 'special-items'].includes(kind) || !name) {
    return;
  }

  const section = getResourceSection(kind, name);
  const nextHash = `#${section}?resource=${encodeURIComponent(name)}`;

  if (window.location.hash === nextHash) {
    syncSectionFromHash();
    return;
  }

  window.location.hash = nextHash;
};

const persistPreference = (key, value) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Preferences remain active for the current page when storage is unavailable.
  }
};

const applyTheme = () => {
  document.documentElement.classList.toggle('dark', isDark.value);
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light';
};

const toggleShiny = () => {
  isShiny.value = !isShiny.value;
  persistPreference(SHINY_STORAGE_KEY, isShiny.value);
};

const toggleDark = () => {
  isDark.value = !isDark.value;
  applyTheme();
  persistPreference(THEME_STORAGE_KEY, isDark.value ? 'dark' : 'light');
};

const setSpriteMode = (mode) => {
  if (!['pixel', 'official', 'home', 'showdown'].includes(mode)) {
    return;
  }

  spriteMode.value = mode;
  persistPreference(SPRITE_STORAGE_KEY, mode);
};

const restorePreferences = () => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const storedSpriteMode = window.localStorage.getItem(SPRITE_STORAGE_KEY);
    const storedShiny = window.localStorage.getItem(SHINY_STORAGE_KEY);
    isDark.value = storedTheme
      ? storedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    spriteMode.value = ['pixel', 'official', 'home', 'showdown'].includes(storedSpriteMode)
      ? storedSpriteMode
      : 'pixel';
    isShiny.value = storedShiny === 'true';
  } catch {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  applyTheme();
};

onMounted(() => {
  restorePreferences();
  syncSectionFromHash();
  window.addEventListener('hashchange', syncSectionFromHash);
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncSectionFromHash);
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(190px, 230px) minmax(0, 1fr);
  gap: 18px;
  width: min(100%, 2160px);
  min-height: 100vh;
  padding: 86px 16px 28px;
  margin: 0 auto;
}

.page-content {
  min-width: 0;
}

.pokedex-layout {
  display: grid;
  grid-template-columns: minmax(360px, 440px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.details-container {
  display: grid;
  grid-template-columns: minmax(620px, 1fr) minmax(390px, 520px);
  gap: 18px;
  min-width: 0;
  align-items: start;
  scroll-margin-top: 100px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  gap: 18px;
  align-items: center;
  min-height: 280px;
  padding: 30px;
  border: 1px dashed var(--legacy-border-strong);
  color: var(--legacy-muted);
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.empty-state h1 {
  margin: 0 0 6px;
  color: var(--legacy-text);
  font-size: clamp(1.5rem, 3vw, 2.2rem);
}

.empty-state p {
  max-width: 560px;
  margin: 0;
  line-height: 1.6;
}

.empty-state small {
  display: block;
  max-width: 620px;
  margin-top: 12px;
  color: var(--legacy-muted);
  line-height: 1.5;
}

.empty-state-mark {
  position: relative;
  flex: 0 0 auto;
  width: 66px;
  height: 66px;
  border: 14px solid #dc2626;
  border-radius: 50%;
  background: var(--legacy-page);
  box-shadow: inset 0 0 0 4px var(--legacy-text);
}

.empty-state-mark::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 15px;
  height: 15px;
  border: 3px solid var(--legacy-text);
  border-radius: 50%;
  content: '';
  background: var(--legacy-page);
  transform: translate(-50%, -50%);
}

@media (max-width: 1680px) {
  .details-container {
    grid-template-columns: minmax(560px, 1fr) minmax(360px, 440px);
  }
}

@media (max-width: 1380px) {
  .details-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1000px) {
  .workspace {
    grid-template-columns: 1fr;
    padding-top: 14px;
  }
}

@media (max-width: 900px) {
  .workspace {
    gap: 12px;
    padding: 12px 9px 20px;
  }

  .pokedex-layout,
  .details-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .details-container {
    scroll-margin-top: 108px;
  }

  .empty-state {
    align-items: flex-start;
    min-height: 0;
    padding: 18px;
  }
}

@media (max-width: 460px) {
  .empty-state {
    flex-direction: column;
  }
}
</style>
