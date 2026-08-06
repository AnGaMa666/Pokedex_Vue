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
          <span>{{ labels.generation }}</span>
          <select v-model="selectedGeneration">
            <option value="">{{ labels.allGenerations }}</option>
            <option v-for="generation in generationOptions" :key="generation" :value="String(generation)">
              {{ getGenerationLabel(generation, language) }}
            </option>
          </select>
        </label>
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
          <span>{{ labels.locationType }}</span>
          <select v-model="selectedKind">
            <option value="">{{ labels.allLocationTypes }}</option>
            <option value="route">{{ labels.routes }}</option>
            <option value="city">{{ labels.cities }}</option>
            <option value="other">{{ labels.otherLocations }}</option>
          </select>
        </label>
        <label>
          <span>{{ labels.sort }}</span>
          <select v-model="sortMode">
            <option value="generation">{{ labels.sortGeneration }}</option>
            <option value="name">{{ labels.sortName }}</option>
            <option value="number">{{ labels.sortNumber }}</option>
            <option value="kind">{{ labels.sortKind }}</option>
          </select>
        </label>
      </div>

      <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>
      <div v-else-if="hasError" class="error-message" role="alert">
        <p>{{ labels.loadError }}</p>
        <button type="button" @click="loadLocations">{{ labels.tryAgain }}</button>
      </div>
      <p v-else-if="filteredLocations.length === 0" class="status-message">{{ labels.noMatches }}</p>

      <template v-else>
        <div class="route-list" role="list">
          <section v-for="section in pagedLocationSections" :key="section.key" class="generation-section">
            <h2>{{ section.label }}</h2>
            <ul>
              <li v-for="location in section.locations" :key="location.id">
                <button
                  type="button"
                  class="route-button"
                  :class="{ selected: selectedLocation?.id === location.id }"
                  @click="selectLocation(location)"
                >
                  <span class="route-number">#{{ formatResourceId(location.id) }}</span>
                  <span class="route-copy">
                    <strong>{{ getLocationLabel(location) }}</strong>
                    <small>{{ getLocationKindLabel(location) }}</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              </li>
            </ul>
          </section>
        </div>

        <nav v-if="pageCount > 1" class="pagination" :aria-label="labels.pages">
          <button type="button" :disabled="page === 1" @click="page -= 1">{{ labels.previous }}</button>
          <label>
            <span class="visually-hidden">{{ labels.page }}</span>
            <select v-model.number="page">
              <option v-for="pageNumber in pageCount" :key="pageNumber" :value="pageNumber">
                {{ labels.page }} {{ pageNumber }} / {{ pageCount }}
              </option>
            </select>
          </label>
          <button type="button" :disabled="page === pageCount" @click="page += 1">{{ labels.next }}</button>
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

      <p v-else-if="detailLoading" class="detail-status" role="status">{{ labels.detailLoading }}</p>
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
            <strong>{{ labels.generations }}</strong>
            <span
              v-for="index in locationDetails.game_indices"
              :key="`${index.generation.name}-${index.game_index}`"
            >
              {{ getLocalizedGenerationName(index.generation.name, language) }} · {{ labels.index }} {{ index.game_index }}
            </span>
          </div>
        </header>

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

            <p v-if="area.encounters.length === 0" class="area-empty">{{ labels.noEncountersForGame }}</p>

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
import {
  getLocationKind,
  getPrimaryLocationGeneration,
  groupLocationsByGeneration,
} from '@/utils/locationGrouping';
import { getLocalizedGenerationName } from '@/utils/localization';
import {
  formatResourceId,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';
import { getGenerationLabel } from '@/utils/versionGroups';

const props = defineProps({
  searchQuery: { type: String, default: '' },
});

const { language } = useI18n();
const PAGE_SIZE = 80;
const MAX_PARALLEL_REQUESTS = 6;
const REGION_NAMES_DE = Object.freeze({
  kanto: 'Kanto', johto: 'Johto', hoenn: 'Hoenn', sinnoh: 'Sinnoh', unova: 'Einall',
  kalos: 'Kalos', alola: 'Alola', galar: 'Galar', hisui: 'Hisui', paldea: 'Paldea',
});

const locations = ref([]);
const regions = ref([]);
const locationCatalog = ref(new Map());
const locationGameIndices = ref(new Map());
const pokemonCatalog = ref(new Map());
const allowedLocationNames = ref(null);
const selectedRegion = ref('');
const selectedGeneration = ref('');
const selectedKind = ref('');
const sortMode = ref('generation');
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
      kicker: 'Spielwelt', title: 'Routen & Orte',
      description: 'Alle Orte werden standardmäßig generationenweise mit klaren Abschnittstrennern angezeigt. Filtere zusätzlich nach Region und Ortsart.',
      generation: 'Generation', generations: 'Generationen', allGenerations: 'Alle Generationen',
      region: 'Region', allRegions: 'Alle Regionen', locationType: 'Ortsart',
      allLocationTypes: 'Alle Ortsarten', routes: 'Routen und Wege', cities: 'Städte und Dörfer',
      otherLocations: 'Weitere Orte', sort: 'Sortierung', sortGeneration: 'Generation',
      sortName: 'Name A–Z', sortNumber: 'Nummer', sortKind: 'Ortsart',
      route: 'Route / Weg', city: 'Stadt / Dorf', other: 'Weiterer Ort',
      loading: 'Routen und Orte werden geladen…', loadError: 'Das Routenverzeichnis konnte nicht geladen werden.',
      tryAgain: 'Erneut versuchen', noMatches: 'Keine Route oder kein Ort entspricht der Suche und den Filtern.',
      previous: 'Zurück', next: 'Weiter', page: 'Seite', pages: 'Routenseiten',
      chooseTitle: 'Route oder Ort auswählen', chooseText: 'Wähle links einen Eintrag, um alle verfügbaren Gebiete und wilden Begegnungen nach Spiel zu sehen.',
      detailLoading: 'Routen- und Begegnungsdaten werden geladen…', unknown: 'Unbekannt', index: 'Index',
      game: 'Spielversion', allGames: 'Alle Spiele', encounters: 'Begegnungen', area: 'Gebiet',
      pokemon: 'Pokémon', noEncountersForGame: 'In der gewählten Spielversion sind für dieses Gebiet keine Begegnungen hinterlegt.',
      levelShort: 'Lv.', noAreaData: 'Für diesen Ort sind keine Untergebiete mit Begegnungsdaten hinterlegt.',
      detailLoadError: 'Die Routendetails konnten nicht geladen werden.', sortedLocations: 'Sortierte Orte',
    }
  : {
      kicker: 'Game world', title: 'Routes & locations',
      description: 'All locations are grouped by generation by default. Filter by region and location type.',
      generation: 'Generation', generations: 'Generations', allGenerations: 'All generations', region: 'Region',
      allRegions: 'All regions', locationType: 'Location type', allLocationTypes: 'All location types',
      routes: 'Routes and paths', cities: 'Cities and villages', otherLocations: 'Other locations',
      sort: 'Sort', sortGeneration: 'Generation', sortName: 'Name A–Z', sortNumber: 'Number',
      sortKind: 'Location type', route: 'Route / path', city: 'City / village', other: 'Other location',
      loading: 'Loading routes and locations…', loadError: 'The route directory could not be loaded.',
      tryAgain: 'Try again', noMatches: 'No route or location matches the search and filters.',
      previous: 'Previous', next: 'Next', page: 'Page', pages: 'Route pages',
      chooseTitle: 'Choose a route or location', chooseText: 'Select an entry to inspect areas and wild encounters by game.',
      detailLoading: 'Loading route and encounter data…', unknown: 'Unknown', index: 'Index',
      game: 'Game version', allGames: 'All games', encounters: 'encounters', area: 'Area', pokemon: 'Pokémon',
      noEncountersForGame: 'No encounters are listed for this area in the selected game.', levelShort: 'Lv.',
      noAreaData: 'No sub-areas with encounter data are listed for this location.',
      detailLoadError: 'The route details could not be loaded.', sortedLocations: 'Sorted locations',
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
const getLocationKindLabel = (location) => labels.value[getLocationKind(location.name)] || labels.value.other;
const getLocationGeneration = (location) => getPrimaryLocationGeneration(
  locationGameIndices.value.get(Number(location.id)) || [],
);

const generationOptions = computed(() => [...new Set(locations.value
  .map(getLocationGeneration)
  .filter((generation) => generation !== 99))]
  .sort((first, second) => first - second));

const filteredLocations = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase(language.value);
  const entries = locations.value.filter((location) => {
    const localizedName = getLocationLabel(location).toLocaleLowerCase(language.value);
    const matchesSearch = !query
      || location.name.includes(query)
      || localizedName.includes(query)
      || String(location.id).includes(query);
    const matchesRegion = !selectedRegion.value || allowedLocationNames.value?.has(location.name);
    const matchesGeneration = !selectedGeneration.value
      || getLocationGeneration(location) === Number(selectedGeneration.value);
    const matchesKind = !selectedKind.value || getLocationKind(location.name) === selectedKind.value;
    return matchesSearch && matchesRegion && matchesGeneration && matchesKind;
  });

  return [...entries].sort((first, second) => {
    if (sortMode.value === 'name') return getLocationLabel(first).localeCompare(getLocationLabel(second), language.value);
    if (sortMode.value === 'number') return first.id - second.id;
    if (sortMode.value === 'kind') return getLocationKind(first.name).localeCompare(getLocationKind(second.name))
      || getLocationLabel(first).localeCompare(getLocationLabel(second), language.value);
    return getLocationGeneration(first) - getLocationGeneration(second)
      || getLocationLabel(first).localeCompare(getLocationLabel(second), language.value)
      || first.id - second.id;
  });
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredLocations.value.length / PAGE_SIZE)));
const pagedLocations = computed(() => filteredLocations.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
const pagedLocationSections = computed(() => {
  if (sortMode.value === 'generation') {
    return groupLocationsByGeneration({
      locations: pagedLocations.value,
      locationGameIndices: locationGameIndices.value,
      getLabel: getLocationLabel,
      language: language.value,
    }).map((section) => ({ ...section, key: `generation-${section.generation}` }));
  }
  return [{ key: 'sorted', label: labels.value.sortedLocations, locations: pagedLocations.value }];
});

const localizedLocationName = computed(() => {
  if (!locationDetails.value) return '';
  const apiName = getLocalizedName(locationDetails.value.names, locationDetails.value.name, language.value);
  return language.value === 'de'
    ? getCatalogLabel(locationCatalog.value, locationDetails.value.id, apiName)
    : apiName;
});
const availableVersions = computed(() => [...new Set(
  locationAreas.value.flatMap((area) => (area.pokemon_encounters || []).flatMap((encounter) => (
    (encounter.version_details || []).map((detail) => detail.version?.name).filter(Boolean)
  ))),
)].sort((first, second) => getLocalizedVersionName(first, language.value).localeCompare(
  getLocalizedVersionName(second, language.value), language.value,
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
        .sort((first, second) => first.version.localeCompare(second.version)
          || first.method.localeCompare(second.method)
          || first.minLevel - second.minLevel);
      return {
        name: encounter.pokemon?.name || '',
        id: getResourceId(encounter.pokemon?.url),
        details,
      };
    })
    .filter((encounter) => encounter.details.length > 0)
    .sort((first, second) => getEncounterName(first).localeCompare(getEncounterName(second), language.value));
  return {
    id: area.id,
    gameIndex: area.game_index,
    name: getLocalizedName(area.names, area.name, language.value),
    encounters,
  };
}));
const filteredEncounterCount = computed(() => areaRows.value.reduce((total, area) => total + area.encounters.length, 0));
const getEncounterSprite = (encounter) => encounter.id
  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${encounter.id}.png`
  : '';

const loadCatalogs = async () => {
  if (language.value !== 'de') return;
  const results = await Promise.allSettled([
    loadGermanCatalog('locations'),
    loadGermanCatalog('locationGameIndices'),
    loadGermanPokemonCatalog(),
  ]);
  if (results[0].status === 'fulfilled') locationCatalog.value = results[0].value;
  if (results[1].status === 'fulfilled') locationGameIndices.value = results[1].value;
  if (results[2].status === 'fulfilled') pokemonCatalog.value = results[2].value;
};

const loadLocations = async () => {
  loading.value = true;
  hasError.value = false;
  try {
    const [response] = await Promise.all([PokeAPI.getLocations(), loadCatalogs()]);
    locations.value = response.data.results
      .map((location) => ({ ...location, id: getResourceId(location.url) }))
      .filter((location) => location.id !== null);
  } catch (error) {
    console.error('Failed to load locations:', error);
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
  } catch (error) {
    console.error('Failed to load route regions:', error);
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
  } catch (error) {
    console.error('Failed to load route region:', error);
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
        } catch (error) {
          console.error(`Failed to load location area ${areas[index].name}:`, error);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_REQUESTS, Math.max(1, areas.length)) }, worker));
    if (requestId !== activeDetailRequestId) return;
    locationDetails.value = locationResponse.data;
    locationAreas.value = results.filter(Boolean);
  } catch (error) {
    if (requestId !== activeDetailRequestId) return;
    console.error('Failed to load location details:', error);
    detailError.value = labels.value.detailLoadError;
  } finally {
    if (requestId === activeDetailRequestId) detailLoading.value = false;
  }
};

watch(selectedRegion, loadRegion);
watch([selectedGeneration, selectedKind, sortMode, () => props.searchQuery], () => { page.value = 1; });
watch(pageCount, (count) => { if (page.value > count) page.value = count; });
watch(language, () => { void loadCatalogs(); });
onMounted(() => { void Promise.all([loadLocations(), loadRegions()]); });
</script>

<style scoped>
.route-layout { display: grid; grid-template-columns: minmax(360px, 470px) minmax(0, 1fr); gap: 18px; align-items: start; }
.route-directory { position: sticky; top: 86px; max-height: calc(100vh - 104px); overflow: hidden; border: 1px solid var(--legacy-border); background: var(--legacy-surface); box-shadow: 0 2px 5px var(--legacy-shadow); }
.route-heading { display: flex; justify-content: space-between; align-items: end; padding: 16px 14px 10px; background: var(--legacy-page); }
.route-heading p { margin: 0 0 4px; color: var(--legacy-muted); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
.route-heading h1 { margin: 0; font-size: 1.35rem; }
.route-heading > span { color: var(--legacy-muted); font-size: 0.72rem; }
.route-description { margin: 0; padding: 0 14px 12px; border-bottom: 1px solid var(--legacy-border); color: var(--legacy-muted); font-size: 0.76rem; line-height: 1.5; background: var(--legacy-page); }
.route-filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 9px; border-bottom: 1px solid var(--legacy-border); }
.route-filters label, .game-filter-section label { display: grid; gap: 3px; color: var(--legacy-muted); font-size: 0.64rem; font-weight: 850; }
.route-filters select, .game-filter-section select, .pagination select { min-height: 34px; min-width: 0; padding: 5px 7px; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-page); }
.status-message, .error-message, .detail-status { margin: 0; padding: 20px 14px; color: var(--legacy-muted); }
.error-message { color: #ef4444; }
.error-message button { margin-top: 7px; padding: 7px 10px; border: 1px solid #ef4444; color: #ef4444; background: var(--legacy-page); }
.route-list { max-height: calc(100vh - 374px); padding: 6px; overflow-y: auto; }
.generation-section h2 { position: sticky; top: 0; z-index: 1; margin: 0; padding: 8px 10px; border-top: 1px solid var(--legacy-border); border-bottom: 1px solid var(--legacy-border); color: var(--legacy-muted); font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; background: var(--legacy-surface); }
.generation-section:first-child h2 { border-top: 0; }
.generation-section ul { padding: 0; margin: 0; list-style: none; }
.route-button { display: grid; grid-template-columns: 58px minmax(0, 1fr) auto; gap: 8px; align-items: center; width: 100%; min-height: 58px; padding: 7px 9px; border: 1px solid transparent; color: var(--legacy-text); text-align: left; background: transparent; }
.route-button:hover, .route-button.selected { border-color: var(--legacy-border-strong); background: var(--legacy-surface-active); }
.route-button.selected { box-shadow: inset 4px 0 0 #888; }
.route-number { color: var(--legacy-muted); font-size: 0.7rem; }
.route-copy { display: grid; min-width: 0; }
.route-copy strong { overflow: hidden; font-size: 0.82rem; text-overflow: ellipsis; white-space: nowrap; }
.route-copy small { color: var(--legacy-muted); font-size: 0.62rem; }
.pagination { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 8px; border-top: 1px solid var(--legacy-border); background: var(--legacy-page); }
.pagination button { min-height: 34px; padding: 5px 9px; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-surface); }
.pagination select { width: 100%; }
.route-detail { min-width: 0; outline: none; }
.empty-detail { display: flex; gap: 18px; align-items: center; min-height: 320px; padding: 30px; border: 1px dashed var(--legacy-border-strong); color: var(--legacy-muted); background: var(--legacy-surface); }
.empty-detail > span { display: grid; width: 70px; height: 70px; place-items: center; border: 1px solid var(--legacy-border); color: var(--legacy-text); font-size: 1.7rem; background: var(--legacy-page); }
.empty-detail h2 { margin: 0; color: var(--legacy-text); }
.location-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; padding: 22px; border: 1px solid var(--legacy-border); background: var(--legacy-surface); }
.location-header p { margin: 0 0 5px; color: var(--legacy-muted); font-weight: 900; letter-spacing: 0.08em; }
.location-header h2 { margin: 0; overflow-wrap: anywhere; font-size: clamp(2rem, 4vw, 3.5rem); }
.location-header > div > span { display: block; margin-top: 8px; color: var(--legacy-muted); }
.location-indexes { display: grid; align-content: start; gap: 4px; min-width: 180px; padding: 10px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.location-indexes strong { margin-bottom: 3px; font-size: 0.7rem; text-transform: uppercase; }
.location-indexes span { color: var(--legacy-muted); font-size: 0.7rem; }
.game-filter-section, .area-card { margin-top: 12px; border: 1px solid var(--legacy-border); background: var(--legacy-surface); }
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
.encounter-details { display: grid; padding: 0; margin: 0; list-style: none; }
.encounter-details li { display: grid; grid-template-columns: minmax(100px, 1fr) minmax(110px, 1fr) auto auto; gap: 7px; align-items: center; padding: 7px 9px; border-bottom: 1px solid var(--legacy-border); font-size: 0.68rem; }
.encounter-details li:last-child { border-bottom: 0; }
.encounter-details span { color: var(--legacy-muted); }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 1000px) { .route-layout { grid-template-columns: minmax(330px, 410px) minmax(0, 1fr); } }
@media (max-width: 760px) { .route-layout { grid-template-columns: 1fr; } .route-directory { position: static; max-height: none; } .route-list { max-height: 65vh; } .route-filters { grid-template-columns: 1fr; } .location-header { grid-template-columns: 1fr; } .encounter-details li { grid-template-columns: 1fr 1fr; } }
</style>
