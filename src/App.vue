<template>
  <div class="app-shell">
    <Header
      :search-query="searchQuery"
      :is-shiny="isShiny"
      :show-search="activeSection !== 'home'"
      :show-shiny="activeSection === 'pokedex'"
      :section-label="activeConfig.label"
      :search-label="activeConfig.searchLabel"
      :search-placeholder="activeConfig.searchPlaceholder"
      @update-search-query="updateSearchQuery"
      @toggle-shiny="toggleShiny"
    />

    <div class="workspace">
      <AppNavigation :active-section="activeSection" />

      <main class="page-content">
        <HomePage v-if="activeSection === 'home'" />

        <section v-else-if="activeSection === 'pokedex'" class="pokedex-layout">
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
                <h1>{{ t('pokedex.chooseTitle') }}</h1>
                <p>{{ t('pokedex.chooseText') }}</p>
                <small>{{ t('pokedex.chooseNote') }}</small>
              </div>
            </div>
          </section>
        </section>

        <ResourceSection
          v-else
          :key="activeSection"
          :kind="activeSection"
          :search-query="searchQuery"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue';
import { useI18n } from '@/i18n';
import AppNavigation from './components/AppNavigation.vue';
import Header from './components/Header.vue';
import HomePage from './components/HomePage.vue';
import MoveList from './components/MoveList.vue';
import PokemonDetails from './components/PokemonDetails.vue';
import PokemonList from './components/PokemonList.vue';
import ResourceSection from './components/ResourceSection.vue';

const { t } = useI18n();

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
}));

const getSectionFromHash = () => {
  const requestedSection = window.location.hash.slice(1).split('?')[0].toLowerCase();
  return Object.hasOwn(sectionConfigs.value, requestedSection) ? requestedSection : 'home';
};

const activeSection = ref('home');
const searchQueries = reactive({
  pokedex: '',
  moves: '',
  items: '',
  berries: '',
});
const selectedPokemon = ref(null);
const selectedPokemonDetails = ref(null);
const isShiny = ref(false);

const activeConfig = computed(() => sectionConfigs.value[activeSection.value]);
const searchQuery = computed(() => searchQueries[activeSection.value] || '');

const syncSectionFromHash = () => {
  const resolvedSection = getSectionFromHash();
  activeSection.value = resolvedSection;

  if (window.location.hash !== `#${resolvedSection}`) {
    window.history.replaceState(null, '', `#${resolvedSection}`);
  }
};

const selectPokemon = (pokemon) => {
  selectedPokemon.value = pokemon;
  selectedPokemonDetails.value = null;
};

const updateSelectedPokemonDetails = (pokemonDetails) => {
  selectedPokemonDetails.value = pokemonDetails;
};

const updateSearchQuery = (query) => {
  if (activeSection.value !== 'home') {
    searchQueries[activeSection.value] = query;
  }
};

const toggleShiny = () => {
  isShiny.value = !isShiny.value;
};

onMounted(() => {
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
  gap: 24px;
  width: min(100%, 1680px);
  min-height: 100vh;
  padding: 96px 24px 32px;
  margin: 0 auto;
}

.page-content {
  min-width: 0;
}

.pokedex-layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
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
  min-height: 300px;
  padding: 36px;
  border: 1px dashed #aeb6c3;
  border-radius: 22px;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 14px 38px rgba(23, 32, 51, 0.06);
  backdrop-filter: blur(10px);
}

.empty-state h1 {
  margin: 0 0 6px;
  color: #172033;
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
  color: #7a8494;
  line-height: 1.5;
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

@media (max-width: 1220px) {
  .details-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .workspace {
    grid-template-columns: 1fr;
    padding-top: 92px;
  }
}

@media (max-width: 760px) {
  .workspace {
    gap: 16px;
    padding: 164px 16px 20px;
  }

  .pokedex-layout {
    grid-template-columns: 1fr;
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
