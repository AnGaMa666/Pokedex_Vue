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
              {{ getRegionLabel(region.name) }}
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
              <strong>{{ getLocationLabel(location) }}</strong>
              <span aria-hidden="true">›</span>
            </button>
          </li>
        </ul>

        <nav v-if="pageCount > 1" class="pagination" :aria-label="labels.pages">
          <button type="button" :disabled="page === 1" @click="page -= 1">
            {{ labels.previous }}
          </button>
          <label>
            <span class="visually-hidden">{{ labels.page }}</span>
            <select v-model.number="page">
              <option v-for="pageNumber in pageCount" :key="pageNumber" :value="pageNumber">
                {{ labels.page }} {{ pageNumber }} / {{ pageCount }}
              </option>
            </select>
          </label>
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
            <span>{{ labels.region }}: {{ getRegionLabel(locationDetails.region?.name || '') }}</span>
          </div>
          <div v-if="locationDetails.game_indices?.length" class="location-indexes">
            <strong>{{ labels.gameIndexes }}</strong>
            <span v-for="index in locationDetails.game_indices" :key="`${index.generation.name}-${index.game_index}`">
              {{ getLocalizedGenerationName(index.generation.name, language) }} · {{ index.game_index }}
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
                {{ getLocalizedVersionName(version, language) }}
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
              <article
                v-for="encounter in area.encounters"
                :key="`${area.id}-${encounter.name}`"
                class="encounter-card"
              >
                <div class="encounter-pokemon">
                  <img
                    :src="getEncounterSprite(encounter)"
                    :alt="getEncounterName(encounter)"
                    width="78"
                    height="78"
                    loading="lazy"
                    decoding="async"
                  >
                  <strong>{{ getEncounterName(encounter) }}</strong>
                  <small>#{{ formatResourceId(encounter.id) }}</small>
                </div>
                <ul class="encounter-details">
                  <li
                    v-for="detail in encounter.details"
                    :key="`${detail.version}-${detail.method}-${detail.minLevel}-${detail.maxLevel}-${detail.chance}`"
                  >
                    <b>{{ getLocalizedVersionName(detail.version, language) }}</b>
                    <span>{{ getLocalizedEncounterMethodName(detail.method, language) }}</span>
                    <span>{{ labels.levelShort }} {{ detail.minLevel }}–{{ detail.maxLevel }}</span>
                    <strong>{{ detail.chance }} %</strong>
                  </li>
                </ul>
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
  getCatalogLabel,
  getLocalizedEncounterMethodName,
  getLocalizedVersionName,
  loadGermanCatalog,
  loadGermanPokemonCatalog,
} from '@/services/localizationCatalog';
import { getLocalizedGenerationName } from '@/utils/localization';
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
const PAGE_SIZE = 40;
const MAX_PARALLEL_REQUESTS = 6;
const REGION_NAMES_DE = Object.freeze({
  kanto: 'Kanto',
  johto: 'Johto',
  hoenn: 'Hoenn',
  sinnoh: 'Sinnoh',
  unova: 'Einall',
  kalos: 'Kalos',
  alola: 'Alola',
  galar: 'Galar',
  hisui: 'Hisui',
  paldea: 'Paldea',
});

const locations = ref([]);
const regions = ref([]);
const locationCatalog = ref(new Map());
const pokemonCatalog = ref(new Map());
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
      description: 'Orte, Pokémon, Spielversionen und Begegnungsmethoden werden auf Deutsch angezeigt. Filtere nach Region und öffne einen Ort für alle verfügbaren Begegnungsdaten.',
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
      pages: 'Routenseiten',
      chooseTitle: 'Route oder Ort auswählen',
      chooseText: 'Wähle links einen Eintrag, um Gebiete und wilde Begegnungen nach Spiel zu sehen.',
      detailLoading: 'Routen- und Begegnungsdaten werden geladen…',
      unknown: 'Unbekannt',
      gameIndexes: 'Spielindizes',
      dataAvailability: 'Verfügbare Routendaten',
      dataAvailabilityText: 'PokéAPI stellt Orte, Untergebiete und wilde Begegnungen bereit. Trainer, Trainer-Sprites, auf der Karte liegende Items und Kartenbilder sind nicht mit den Routen verknüpft und werden deshalb nicht erfunden.',
      encountersAvailable: 'Wilde Pokémon und Fangchancen',
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
      detailLoadError: 'Die Routendetails konnten nicht geladen werden.',
    }
  : {
      kicker: 'Game world',
      title: 'Routes & locations',
      description: 'Filter locations by region and inspect every available encounter grouped by game, area, method and level.',
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
      pages: 'Route pages',
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
      detailLoadError: 'The route details could not be loaded.',
    });

const formatName = (name = '') => name
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');
const getRegionLabel = (name = '') => language.value === 'de'
  ? REGION_NAMES_DE[name] || formatName(name || labels.value.unknown)
  : formatName(name || labels.value.unknown);
const getLocationLabel = (location) => language.value === 'de'
  ? getCatalogLabel(locationCatalog.value, location.id, location.name)
  : formatName(location.name);
const getEncounterName = (encounter) => language.value === 'de'
  ? getCatalogLabel(pokemonCatalog.value, encounter.id, encounter.name)
  : formatName(encounter.name);

const filteredLocations = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase(language.value);
  let entries = locations.value.filter((location) => {
    const localizedName = getLocationLabel(location).toLocaleLowerCase(language.value);
    const matchesSearch = !query
      || location.name.includes(query)
      || localizedName.includes(query)
      || String(location.id).includes(query);
    const matchesRegion = !selectedRegion.value
      || allowedLocationNames.value?.has(location.name);
    return matchesSearch && matchesRegion;
  });

  entries = [...entries].sort((firstLocation, secondLocation) => {
    if (sortMode.value === 'number') return firstLocation.id - secondLocation.id;
    return getLocationLabel(firstLocation).localeCompare(
      getLocationLabel(secondLocation),
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
const localizedLocationName = computed(() => {
  if (!locationDetails.value) return '';
  const apiName = getLocalizedName(
    locationDetails.value.names,
    locationDetails.value.name,
    language.value,
  );
  if (language.value !== 'de') return apiName;
  return getCatalogLabel(locationCatalog.value, locationDetails.value.id, apiName);
});
const availableVersions = computed(() => [...new Set(
  locationAreas.value.flatMap((area) => (area.pokemon_encounters || []).flatMap((encounter) => (
    (encounter.version_details || []).map((detail) => detail.version?.name).filter(Boolean)
  ))),
)].sort((firstVersion, secondVersion) => (
  getLocalizedVersionName(firstVersion, language.value).localeCompare(
    getLocalizedVersionName(secondVersion, language.value),
    language.value,
  )
)));

const areaRows = computed(() => locationAreas.value.map((area) => {
  const encounters = (area.pokemon_encounters || [])
    .map((encounter) => {
      const details = (encounter.version_details || [])
        .filter((versionDetail) => !selectedVersion.value || versionDetail.version?.name === selectedVersion.value)
        .flatMap((versionDetail) => (versionDetail.encounter_details || []).map((detail) => ({
          version: versionDetail.version?.name || '',
          chance: detail.chance ?? versionDetail.max_chance ?? 0,
          minLevel: detail.min_level ?? 0,
          maxLevel: detail.max_level ?? 0,
          method: detail.method?.name || '',
        })))
        .sort((first, second) => (
          first.version.localeCompare(second.version)
          || first.method.localeCompare(second.method)
          || first.minLevel - second.minLevel
        ));
      return {
        name: encounter.pokemon?.name || '',
        id: getResourceId(encounter.pokemon?.url),
        details,
      };
    })
    .filter((encounter) => encounter.details.length > 0)
    .sort((firstEncounter, secondEncounter) => (
      getEncounterName(firstEncounter).localeCompare(getEncounterName(secondEncounter), language.value)
    ));
  return {
    id: area.id,
    gameIndex: area.game_index,
    name: getLocalizedName(area.names, area.name, language.value),
    encounters,
  };
}));
const filteredEncounterCount = computed(() => areaRows.value.reduce(
  (total, area) => total + area.encounters.length,
  0,
));

const getEncounterSprite = (encounter) => encounter.id
  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${encounter.id}.png`
  : '';

const loadCatalogs = async () => {
  if (language.value !== 'de') return;
  const results = await Promise.allSettled([
    loadGermanCatalog('locations'),
    loadGermanPokemonCatalog(),
  ]);
  if (results[0].status === 'fulfilled') locationCatalog.value = results[0].value;
  if (results[1].status === 'fulfilled') pokemonCatalog.value = results[1].value;
};

const loadLocations = async () => {
  loading.value = true;
  hasError.value = false;
  try {
    const response = await PokeAPI.getLocations();
    locations.value = response.data.results
      .map((location) => ({ ...location, id: getResourceId(location.url) }))
      .filter((location) => location.id !== null);
    await loadCatalogs();
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
  if (!selectedRegion.value) return;
  try {
    const response = await PokeAPI.getRegionDetails(selectedRegion.value);
    if (requestId !== activeRegionRequestId) return;
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
    if (requestId !== activeDetailRequestId) return;
    locationDetails.value = locationResponse.data;
    locationAreas.value = results.filter(Boolean);
    await loadCatalogs();
  } catch (requestError) {
    if (requestId !== activeDetailRequestId) return;
    console.error('Failed to load location details:', requestError);
    detailError.value = labels.value.detailLoadError;
  } finally {
    if (requestId === activeDetailRequestId) detailLoading.value = false;
  }
};

watch(selectedRegion, loadRegion);
watch([sortMode, () => props.searchQuery], () => { page.value = 1; });
watch(pageCount, (count) => { if (page.value > count) page.value = count; });
watch(language, () => { void loadCatalogs(); });

onMounted(() => { void Promise.all([loadLocations(), loadRegions()]); });
</script>

<style scoped>
.route-layout { display: grid; grid-template-columns: minmax(330px, 430px) minmax(0, 1fr); gap: 18px; align-items: start; }
.route-directory { position: sticky; top: 86px; max-height: calc(100vh - 104px); overflow: hidden; border: 1px solid var(--legacy-border); background: var(--legacy-surface); box-shadow: 0 2px 5px var(--legacy-shadow); }
.route-heading { display: flex; justify-content: space-between; align-items: end; padding: 16px 14px 10px; background: var(--legacy-page); }
.route-heading p { margin: 0 0 4px; color: var(--legacy-muted); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
.route-heading h1 { margin: 0; font-size: 1.35rem; }
.route-heading > span { color: var(--legacy-muted); font-size: 0.72rem; }
.route-description { margin: 0; padding: 0 14px 12px; border-bottom: 1px solid var(--legacy-border); color: var(--legacy-muted); font-size: 0.76rem; line-height: 1.5; background: var(--legacy-page); }
.route-filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 9px; border-bottom: 1px solid var(--legacy-border); }
.route-filters label, .game-filter-section label { display: grid; gap: 3px; color: var(--legacy-muted); font-size: 0.64rem; font-weight: 850; }
.route-filters select, .game-filter-section select, .pagination select { min-height: 34px; padding: 5px 7px; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-page); }
.status-message, .error-message, .detail-status { margin: 0; padding: 20px 14px; color: var(--legacy-muted); }
.error-message { color: #b91c1c; }
.error-message button { margin-top: 7px; padding: 7px 10px; border: 1px solid #b91c1c; color: #b91c1c; background: var(--legacy-page); }
.route-list { max-height: calc(100vh - 315px); padding: 6px; margin: 0; overflow-y: auto; list-style: none; }
.route-button { display: grid; grid-template-columns: 58px minmax(0, 1fr) auto; gap: 8px; align-items: center; width: 100%; min-height: 46px; padding: 6px 9px; border: 1px solid transparent; color: var(--legacy-text); text-align: left; background: transparent; }
.route-button:hover, .route-button.selected { border-color: var(--legacy-border-strong); background: var(--legacy-surface-active); }
.route-button.selected { box-shadow: inset 4px 0 0 #888888; }
.route-number { color: var(--legacy-muted); font-size: 0.7rem; }
.route-button strong { overflow: hidden; font-size: 0.82rem; text-overflow: ellipsis; white-space: nowrap; }
.pagination { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 8px; border-top: 1px solid var(--legacy-border); background: var(--legacy-page); }
.pagination button { min-height: 34px; padding: 5px 9px; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-surface); }
.pagination select { width: 100%; }
.route-detail { min-width: 0; outline: none; }
.empty-detail { display: flex; gap: 18px; align-items: center; min-height: 320px; padding: 30px; border: 1px dashed var(--legacy-border-strong); color: var(--legacy-muted); background: var(--legacy-surface); }
.empty-detail > span { display: grid; width: 70px; height: 70px; place-items: center; border: 1px solid var(--legacy-border); color: var(--legacy-text); font-size: 1.7rem; background: var(--legacy-page); }
.empty-detail h2 { margin: 0; color: var(--legacy-text); }
.empty-detail p { margin: 7px 0 0; }
.location-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; padding: 22px; border: 1px solid var(--legacy-border); background: var(--legacy-surface); }
.location-header p { margin: 0 0 5px; color: var(--legacy-muted); font-weight: 900; letter-spacing: 0.08em; }
.location-header h2 { margin: 0; overflow-wrap: anywhere; font-size: clamp(2rem, 4vw, 3.5rem); }
.location-header > div > span { display: block; margin-top: 8px; color: var(--legacy-muted); }
.location-indexes { display: grid; align-content: start; gap: 4px; min-width: 180px; padding: 10px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.location-indexes strong { margin-bottom: 3px; font-size: 0.7rem; text-transform: uppercase; }
.location-indexes span { color: var(--legacy-muted); font-size: 0.7rem; }
.availability-note, .game-filter-section, .area-card { margin-top: 12px; border: 1px solid var(--legacy-border); background: var(--legacy-surface); }
.availability-note { padding: 14px; }
.availability-note h3 { margin: 0; }
.availability-note p { margin: 7px 0 0; color: var(--legacy-muted); line-height: 1.5; }
.availability-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin-top: 12px; }
.availability-grid span { padding: 8px; border: 1px solid var(--legacy-border); color: var(--legacy-muted); font-size: 0.7rem; background: var(--legacy-page); }
.game-filter-section { display: flex; gap: 14px; justify-content: space-between; align-items: end; padding: 12px; }
.game-filter-section label { min-width: min(300px, 100%); }
.game-filter-section > span { color: var(--legacy-muted); font-size: 0.72rem; }
.area-card { padding: 14px; }
.area-heading { display: flex; gap: 12px; justify-content: space-between; align-items: end; }
.area-heading p { margin: 0 0 3px; color: var(--legacy-muted); font-size: 0.65rem; font-weight: 900; text-transform: uppercase; }
.area-heading h3 { margin: 0; }
.area-heading > span { color: var(--legacy-muted); font-size: 0.72rem; }
.area-empty { color: var(--legacy-muted); }
.encounter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 8px; margin-top: 12px; }
.encounter-card { display: grid; grid-template-columns: 100px minmax(0, 1fr); min-width: 0; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.encounter-pokemon { display: grid; justify-items: center; align-content: center; gap: 2px; padding: 8px; border-right: 1px solid var(--legacy-border); text-align: center; }
.encounter-pokemon img { width: 78px; height: 78px; object-fit: contain; image-rendering: pixelated; }
.encounter-pokemon strong { max-width: 100%; overflow: hidden; font-size: 0.78rem; text-overflow: ellipsis; white-space: nowrap; }
.encounter-pokemon small { color: var(--legacy-muted); font-size: 0.6rem; }
.encounter-details { display: grid; gap: 0; padding: 0; margin: 0; list-style: none; }
.encounter-details li { display: grid; grid-template-columns: minmax(100px, 1fr) minmax(110px, 1fr) auto auto; gap: 7px; align-items: center; padding: 7px 9px; border-bottom: 1px solid var(--legacy-border); font-size: 0.68rem; }
.encounter-details li:last-child { border-bottom: 0; }
.encounter-details span { color: var(--legacy-muted); }
.encounter-details strong { text-align: right; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 1000px) { .route-layout { grid-template-columns: 1fr; } .route-directory { position: static; max-height: none; } .route-list { max-height: 520px; } }
@media (max-width: 700px) { .location-header { grid-template-columns: 1fr; } .availability-grid { grid-template-columns: 1fr; } .game-filter-section { align-items: stretch; flex-direction: column; } .encounter-grid { grid-template-columns: 1fr; } .encounter-card { grid-template-columns: 86px minmax(0, 1fr); } .encounter-details li { grid-template-columns: 1fr auto; } .encounter-details li span { grid-column: 1 / -1; } }
</style>
