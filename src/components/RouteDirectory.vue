<template>
  <section class="route-layout">
    <aside class="route-directory">
      <div class="route-heading">
        <div>
          <p>{{ labels.kicker }}</p>
          <h1>{{ labels.title }}</h1>
        </div>
        <span v-if="!loading">{{ filteredLocations.length }}</span>
      </div>

      <p class="route-description">{{ labels.description }}</p>

      <div class="route-filters">
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
          <span>{{ labels.sort }}</span>
          <select v-model="sortMode">
            <option value="name">{{ labels.sortName }}</option>
            <option value="number">{{ labels.sortNumber }}</option>
          </select>
        </label>
      </div>

      <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>
      <div v-else-if="hasError" class="error-message" role="alert">
        <p>{{ labels.loadError }}</p>
        <button type="button" @click="loadLocations">{{ labels.tryAgain }}</button>
      </div>
      <p v-else-if="filteredLocations.length === 0" class="status-message">
        {{ labels.noMatches }}
      </p>

      <template v-else>
        <ul class="route-list">
          <li v-for="location in pagedLocations" :key="location.id">
            <button
              type="button"
              class="route-button"
              :class="{ selected: selectedLocation?.id === location.id }"
              @click="selectLocation(location)"
            >
              <span class="route-number">#{{ formatResourceId(location.id) }}</span>
              <strong>{{ formatName(location.name) }}</strong>
              <span aria-hidden="true">›</span>
            </button>
          </li>
        </ul>

        <nav v-if="pageCount > 1" class="pagination">
          <button type="button" :disabled="page === 1" @click="page -= 1">
            {{ labels.previous }}
          </button>
          <span>{{ labels.page }} {{ page }} / {{ pageCount }}</span>
          <button type="button" :disabled="page === pageCount" @click="page += 1">
            {{ labels.next }}
          </button>
        </nav>
      </template>
    </aside>

    <main ref="detailPanel" class="route-detail" tabindex="-1" aria-live="polite">
      <div v-if="!selectedLocation" class="empty-detail">
        <span aria-hidden="true">⌖</span>
        <div>
          <h2>{{ labels.chooseTitle }}</h2>
          <p>{{ labels.chooseText }}</p>
        </div>
      </div>

      <p v-else-if="detailLoading" class="detail-status" role="status">
        {{ labels.detailLoading }}
      </p>

      <div v-else-if="detailError" class="error-message" role="alert">
        <p>{{ detailError }}</p>
        <button type="button" @click="loadLocationDetails">{{ labels.tryAgain }}</button>
      </div>

      <template v-else-if="locationDetails">
        <header class="location-header">
          <div>
            <p>#{{ formatResourceId(locationDetails.id) }}</p>
            <h2>{{ localizedLocationName }}</h2>
            <span>{{ labels.region }}: {{ formatName(locationDetails.region?.name || labels.unknown) }}</span>
          </div>
          <div class="location-indexes">
            <strong>{{ labels.gameIndexes }}</strong>
            <span v-for="index in locationDetails.game_indices || []" :key="`${index.generation.name}-${index.game_index}`">
              {{ formatName(index.generation.name) }} · {{ index.game_index }}
            </span>
          </div>
        </header>

        <section class="availability-note">
          <h3>{{ labels.dataAvailability }}</h3>
          <p>{{ labels.dataAvailabilityText }}</p>
          <div class="availability-grid">
            <span><strong>✓</strong> {{ labels.encountersAvailable }}</span>
            <span><strong>✓</strong> {{ labels.levelsAvailable }}</span>
            <span><strong>✓</strong> {{ labels.methodsAvailable }}</span>
            <span><strong>–</strong> {{ labels.trainersUnavailable }}</span>
            <span><strong>–</strong> {{ labels.itemsUnavailable }}</span>
            <span><strong>–</strong> {{ labels.mapsUnavailable }}</span>
          </div>
        </section>

        <section class="game-filter-section">
          <label>
            <span>{{ labels.game }}</span>
            <select v-model="selectedVersion">
              <option value="">{{ labels.allGames }}</option>
              <option v-for="version in availableVersions" :key="version" :value="version">
                {{ formatName(version) }}
              </option>
            </select>
          </label>
          <span>{{ filteredEncounterCount }} {{ labels.encounters }}</span>
        </section>

        <section v-if="areaRows.length" class="areas-section">
          <article v-for="area in areaRows" :key="area.id" class="area-card">
            <div class="area-heading">
              <div>
                <p>{{ labels.area }} #{{ area.gameIndex }}</p>
                <h3>{{ area.name }}</h3>
              </div>
              <span>{{ area.encounters.length }} {{ labels.pokemon }}</span>
            </div>

            <p v-if="area.encounters.length === 0" class="area-empty">
              {{ labels.noEncountersForGame }}
            </p>

            <div v-else class="encounter-grid">
              <article v-for="encounter in area.encounters" :key="`${area.id}-${encounter.name}`" class="encounter-card">
                <img
                  :src="getEncounterSprite(encounter)"
                  :alt="`${formatName(encounter.name)} sprite`"
                  width="78"
                  height="78"
                  loading="lazy"
                >
                <div class="encounter-copy">
                  <strong>{{ formatName(encounter.name) }}</strong>
                  <span v-for="detail in encounter.details" :key="`${detail.version}-${detail.method}-${detail.minLevel}-${detail.maxLevel}`">
                    <b>{{ formatName(detail.version) }}</b>
                    · {{ formatEncounterMethod(detail.method) }}
                    · {{ labels.levelShort }} {{ detail.minLevel }}–{{ detail.maxLevel }}
                    · {{ detail.chance }}%
                  </span>
                </div>
              </article>
            </div>
          </article>
        </section>

        <p v-else class="detail-status">{{ labels.noAreaData }}</p>
      </template>
    </main>
  </section>
</template>

<script setup>
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  formatResourceId,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';

const props = defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
});

const { language } = useI18n();
const PAGE_SIZE = 60;
const MAX_PARALLEL_REQUESTS = 6;

const locations = ref([]);
const regions = ref([]);
const allowedLocationNames = ref(null);
const selectedRegion = ref('');
const sortMode = ref('name');
const page = ref(1);
const loading = ref(false);
const loadingRegions = ref(false);
const hasError = ref(false);
const selectedLocation = ref(null);
const locationDetails = ref(null);
const locationAreas = ref([]);
const selectedVersion = ref('');
const detailPanel = ref(null);
const detailLoading = ref(false);
const detailError = ref('');
let activeDetailRequestId = 0;
let activeRegionRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      kicker: 'Spielwelt',
      title: 'Routen & Orte',
      description: 'Orte werden nach Region gefiltert. Die Detailansicht ordnet verfügbare Begegnungen nach Spielversion, Gebiet, Methode, Level und Chance.',
      region: 'Region',
      allRegions: 'Alle Regionen',
      sort: 'Sortierung',
      sortName: 'Name A–Z',
      sortNumber: 'API-Nummer',
      loading: 'Routen und Orte werden geladen…',
      loadError: 'Das Routenverzeichnis konnte nicht geladen werden.',
      tryAgain: 'Erneut versuchen',
      noMatches: 'Keine Route oder kein Ort entspricht der Suche.',
      previous: 'Zurück',
      next: 'Weiter',
      page: 'Seite',
      chooseTitle: 'Route oder Ort auswählen',
      chooseText: 'Wähle links einen Eintrag, um Gebiete und wilde Begegnungen nach Spiel zu sehen.',
      detailLoading: 'Routen- und Begegnungsdaten werden geladen…',
      unknown: 'Unbekannt',
      gameIndexes: 'Spielindizes',
      dataAvailability: 'Verfügbare Routendaten',
      dataAvailabilityText: 'PokéAPI stellt Orte, Untergebiete und wilde Begegnungen bereit. Trainer, Trainer-Sprites, auf der Karte liegende Items und Kartenbilder sind nicht mit den Routen verknüpft und werden deshalb nicht erfunden.',
      encountersAvailable: 'Wilde Pokémon und Chancen',
      levelsAvailable: 'Levelbereiche nach Spiel',
      methodsAvailable: 'Begegnungsmethoden',
      trainersUnavailable: 'Trainer und Trainer-Sprites nicht verfügbar',
      itemsUnavailable: 'Routenitems nicht verfügbar',
      mapsUnavailable: 'Kartenbilder und Koordinaten nicht verfügbar',
      game: 'Spielversion',
      allGames: 'Alle Spiele',
      encounters: 'Begegnungen',
      area: 'Gebiet',
      pokemon: 'Pokémon',
      noEncountersForGame: 'In der gewählten Spielversion sind für dieses Gebiet keine Begegnungen hinterlegt.',
      levelShort: 'Lv.',
      noAreaData: 'Für diesen Ort sind keine Untergebiete mit Begegnungsdaten hinterlegt.',
    }
  : {
      kicker: 'Game world',
      title: 'Routes & locations',
      description: 'Locations can be filtered by region. Details group available encounters by game, area, method, level and chance.',
      region: 'Region',
      allRegions: 'All regions',
      sort: 'Sort',
      sortName: 'Name A–Z',
      sortNumber: 'API number',
      loading: 'Loading routes and locations…',
      loadError: 'The route directory could not be loaded.',
      tryAgain: 'Try again',
      noMatches: 'No route or location matches the search.',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      chooseTitle: 'Choose a route or location',
      chooseText: 'Select an entry to inspect areas and wild encounters by game.',
      detailLoading: 'Loading route and encounter data…',
      unknown: 'Unknown',
      gameIndexes: 'Game indexes',
      dataAvailability: 'Available route data',
      dataAvailabilityText: 'PokéAPI provides locations, sub-areas and wild encounters. Trainers, trainer sprites, route items and map images are not linked to routes, so the application does not invent them.',
      encountersAvailable: 'Wild Pokémon and chances',
      levelsAvailable: 'Level ranges by game',
      methodsAvailable: 'Encounter methods',
      trainersUnavailable: 'Trainers and trainer sprites unavailable',
      itemsUnavailable: 'Route items unavailable',
      mapsUnavailable: 'Map images and coordinates unavailable',
      game: 'Game version',
      allGames: 'All games',
      encounters: 'encounters',
      area: 'Area',
      pokemon: 'Pokémon',
      noEncountersForGame: 'No encounters are listed for this area in the selected game.',
      levelShort: 'Lv.',
      noAreaData: 'No sub-areas with encounter data are listed for this location.',
    });

const formatName = (name = '') => name
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const filteredLocations = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase(language.value);
  let entries = locations.value.filter((location) => {
    const matchesSearch = !query
      || location.name.includes(query)
      || formatName(location.name).toLocaleLowerCase(language.value).includes(query)
      || String(location.id).includes(query);
    const matchesRegion = !selectedRegion.value
      || allowedLocationNames.value?.has(location.name);
    return matchesSearch && matchesRegion;
  });

  entries = [...entries].sort((firstLocation, secondLocation) => {
    if (sortMode.value === 'number') {
      return firstLocation.id - secondLocation.id;
    }

    return formatName(firstLocation.name).localeCompare(
      formatName(secondLocation.name),
      language.value,
    );
  });

  return entries;
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredLocations.value.length / PAGE_SIZE)));
const pagedLocations = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredLocations.value.slice(start, start + PAGE_SIZE);
});
const localizedLocationName = computed(() => getLocalizedName(
  locationDetails.value?.names,
  locationDetails.value?.name,
  language.value,
));
const availableVersions = computed(() => [...new Set(
  locationAreas.value.flatMap((area) => {
    return (area.pokemon_encounters || []).flatMap((encounter) => {
      return (encounter.version_details || []).map((detail) => detail.version?.name).filter(Boolean);
    });
  }),
)].sort((firstVersion, secondVersion) => firstVersion.localeCompare(secondVersion)));

const areaRows = computed(() => locationAreas.value.map((area) => {
  const encounters = (area.pokemon_encounters || [])
    .map((encounter) => {
      const details = (encounter.version_details || [])
        .filter((versionDetail) => {
          return !selectedVersion.value || versionDetail.version?.name === selectedVersion.value;
        })
        .flatMap((versionDetail) => {
          return (versionDetail.encounter_details || []).map((detail) => ({
            version: versionDetail.version?.name || '',
            chance: detail.chance ?? versionDetail.max_chance ?? 0,
            minLevel: detail.min_level ?? 0,
            maxLevel: detail.max_level ?? 0,
            method: detail.method?.name || '',
          }));
        });

      return {
        name: encounter.pokemon?.name || '',
        id: getResourceId(encounter.pokemon?.url),
        details,
      };
    })
    .filter((encounter) => encounter.details.length > 0)
    .sort((firstEncounter, secondEncounter) => firstEncounter.name.localeCompare(secondEncounter.name));

  return {
    id: area.id,
    gameIndex: area.game_index,
    name: getLocalizedName(area.names, area.name, language.value),
    encounters,
  };
}));
const filteredEncounterCount = computed(() => areaRows.value.reduce((total, area) => {
  return total + area.encounters.length;
}, 0));

const getEncounterSprite = (encounter) => {
  return encounter.id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${encounter.id}.png`
    : '';
};
const formatEncounterMethod = (method) => {
  const germanMethods = {
    walk: 'Laufen',
    'old-rod': 'Angel',
    'good-rod': 'Profiangel',
    'super-rod': 'Superangel',
    surf: 'Surfen',
    'rock-smash': 'Zertrümmerer',
    'headbutt': 'Kopfnuss',
    'dark-grass': 'Dunkles Gras',
    'grass-spots': 'Raschelndes Gras',
    'cave-spots': 'Staubwolke',
    'bridge-spots': 'Brückenschatten',
    'super-rod-spots': 'Angelstelle',
  };
  return language.value === 'de' ? germanMethods[method] || formatName(method) : formatName(method);
};

const loadLocations = async () => {
  loading.value = true;
  hasError.value = false;

  try {
    const response = await PokeAPI.getLocations();
    locations.value = response.data.results
      .map((location) => ({ ...location, id: getResourceId(location.url) }))
      .filter((location) => location.id !== null);
  } catch (requestError) {
    console.error('Failed to load locations:', requestError);
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
    console.error('Failed to load route regions:', requestError);
  } finally {
    loadingRegions.value = false;
  }
};

const loadRegion = async () => {
  const requestId = ++activeRegionRequestId;
  allowedLocationNames.value = null;
  page.value = 1;

  if (!selectedRegion.value) {
    return;
  }

  try {
    const response = await PokeAPI.getRegionDetails(selectedRegion.value);

    if (requestId !== activeRegionRequestId) {
      return;
    }

    allowedLocationNames.value = new Set((response.data.locations || []).map((location) => location.name));
  } catch (requestError) {
    console.error('Failed to load route region:', requestError);
    allowedLocationNames.value = new Set();
  }
};

const selectLocation = async (location) => {
  selectedLocation.value = location;
  selectedVersion.value = '';
  await loadLocationDetails();
  await nextTick();

  if (window.matchMedia('(max-width: 760px)').matches) {
    detailPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    detailPanel.value?.focus({ preventScroll: true });
  }
};

const loadLocationDetails = async () => {
  const requestId = ++activeDetailRequestId;
  detailLoading.value = true;
  detailError.value = '';
  locationDetails.value = null;
  locationAreas.value = [];

  try {
    const locationResponse = await PokeAPI.getLocationDetails(selectedLocation.value.name);
    const areas = locationResponse.data.areas || [];
    const results = new Array(areas.length);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < areas.length) {
        const index = nextIndex;
        nextIndex += 1;

        try {
          const response = await PokeAPI.getLocationAreaDetails(areas[index].name);
          results[index] = response.data;
        } catch (requestError) {
          console.error(`Failed to load location area ${areas[index].name}:`, requestError);
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_REQUESTS, areas.length) }, worker));

    if (requestId !== activeDetailRequestId) {
      return;
    }

    locationDetails.value = locationResponse.data;
    locationAreas.value = results.filter(Boolean);
  } catch (requestError) {
    if (requestId !== activeDetailRequestId) {
      return;
    }

    console.error('Failed to load location details:', requestError);
    detailError.value = language.value === 'de'
      ? 'Die Routendetails konnten nicht geladen werden.'
      : 'The route details could not be loaded.';
  } finally {
    if (requestId === activeDetailRequestId) {
      detailLoading.value = false;
    }
  }
};

watch(selectedRegion, loadRegion);
watch([sortMode, () => props.searchQuery], () => {
  page.value = 1;
});
watch(pageCount, (count) => {
  if (page.value > count) {
    page.value = count;
  }
});

onMounted(() => {
  void Promise.all([loadLocations(), loadRegions()]);
});
</script>

<style scoped>
.route-layout {
  display: grid;
  grid-template-columns: minmax(330px, 430px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.route-directory {
  position: sticky;
  top: 86px;
  max-height: calc(100vh - 104px);
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.route-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  padding: 16px 14px 10px;
  background: var(--legacy-page);
}

.route-heading p {
  margin: 0 0 4px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.route-heading h1 {
  margin: 0;
  font-size: 1.35rem;
}

.route-heading > span {
  color: var(--legacy-muted);
  font-size: 0.72rem;
}

.route-description {
  margin: 0;
  padding: 0 14px 12px;
  border-bottom: 1px solid var(--legacy-border);
  color: var(--legacy-muted);
  font-size: 0.76rem;
  line-height: 1.5;
  background: var(--legacy-page);
}

.route-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  padding: 9px;
  border-bottom: 1px solid var(--legacy-border);
}

.route-filters label,
.game-filter-section label {
  display: grid;
  gap: 3px;
  color: var(--legacy-muted);
  font-size: 0.64rem;
  font-weight: 850;
}

.route-filters select,
.game-filter-section select {
  min-height: 34px;
  padding: 5px 7px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: var(--legacy-page);
}

.status-message,
.error-message,
.detail-status {
  margin: 0;
  padding: 20px 14px;
  color: var(--legacy-muted);
}

.error-message {
  color: #b91c1c;
}

.error-message button {
  margin-top: 7px;
  padding: 7px 10px;
  border: 1px solid #b91c1c;
  color: #b91c1c;
  background: var(--legacy-page);
}

.route-list {
  max-height: calc(100vh - 300px);
  padding: 6px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.route-button {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 46px;
  padding: 6px 9px;
  border: 1px solid transparent;
  color: var(--legacy-text);
  text-align: left;
  background: transparent;
}

.route-button:hover,
.route-button.selected {
  border-color: var(--legacy-border-strong);
  background: var(--legacy-surface-active);
}

.route-button.selected {
  box-shadow: inset 4px 0 0 #888888;
}

.route-number {
  color: var(--legacy-muted);
  font-size: 0.7rem;
}

.route-button strong {
  overflow: hidden;
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.pagination span {
  color: var(--legacy-muted);
  font-size: 0.7rem;
  text-align: center;
}

.route-detail {
  min-width: 0;
  outline: none;
}

.empty-detail {
  display: flex;
  gap: 18px;
  align-items: center;
  min-height: 320px;
  padding: 30px;
  border: 1px dashed var(--legacy-border-strong);
  color: var(--legacy-muted);
  background: var(--legacy-surface);
}

.empty-detail > span {
  display: grid;
  width: 70px;
  height: 70px;
  place-items: center;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  font-size: 1.7rem;
  background: var(--legacy-page);
}

.empty-detail h2 {
  margin: 0;
  color: var(--legacy-text);
}

.empty-detail p {
  margin: 7px 0 0;
}

.location-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  padding: 22px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.location-header p {
  margin: 0 0 5px;
  color: var(--legacy-muted);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.location-header h2 {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: clamp(2rem, 4vw, 3.5rem);
}

.location-header > div > span {
  display: block;
  margin-top: 8px;
  color: var(--legacy-muted);
}

.location-indexes {
  display: grid;
  align-content: start;
  gap: 4px;
  min-width: 180px;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.location-indexes span {
  color: var(--legacy-muted);
  font-size: 0.7rem;
}

.availability-note {
  margin-top: 12px;
  padding: 16px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.availability-note h3 {
  margin: 0;
}

.availability-note p {
  margin: 7px 0 0;
  color: var(--legacy-muted);
  line-height: 1.5;
}

.availability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin-top: 12px;
}

.availability-grid span {
  padding: 8px;
  border: 1px solid var(--legacy-border);
  font-size: 0.72rem;
}

.game-filter-section {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: end;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.game-filter-section label {
  min-width: min(100%, 260px);
}

.game-filter-section > span {
  color: var(--legacy-muted);
  font-size: 0.75rem;
}

.areas-section {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.area-card {
  padding: 14px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.area-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
}

.area-heading p {
  margin: 0 0 4px;
  color: var(--legacy-muted);
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
}

.area-heading h3 {
  margin: 0;
}

.area-heading > span {
  color: var(--legacy-muted);
  font-size: 0.7rem;
}

.area-empty {
  color: var(--legacy-muted);
}

.encounter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.encounter-card {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  min-width: 0;
  padding: 9px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.encounter-card img {
  width: 78px;
  height: 78px;
  object-fit: contain;
  image-rendering: pixelated;
}

.encounter-copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.encounter-copy span {
  color: var(--legacy-muted);
  font-size: 0.66rem;
  line-height: 1.35;
}

@media (max-width: 900px) {
  .route-layout {
    grid-template-columns: 1fr;
  }

  .route-directory {
    position: static;
    max-height: none;
  }

  .route-list {
    max-height: 440px;
  }
}

@media (max-width: 760px) {
  .location-header {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .location-indexes {
    min-width: 0;
  }

  .availability-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 460px) {
  .route-filters {
    grid-template-columns: 1fr;
  }

  .empty-detail {
    align-items: flex-start;
    flex-direction: column;
  }

  .game-filter-section {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
