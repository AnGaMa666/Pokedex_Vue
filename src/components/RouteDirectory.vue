<template>
  <section class="route-layout">
    <aside
      ref="directoryPanel"
      class="route-directory"
      tabindex="-1"
      :aria-busy="directoryLoading"
    >
      <div class="route-heading">
        <div>
          <p>{{ labels.kicker }}</p>
          <h1>{{ labels.title }}</h1>
        </div>
        <span v-if="!directoryLoading">{{ filteredLocations.length }}</span>
      </div>

      <p class="route-description">{{ labels.description }}</p>

      <div class="route-filters">
        <label>
          <span>{{ labels.generation }}</span>
          <select v-model="selectedGeneration">
            <option value="">{{ labels.allGenerations }}</option>
            <option
              v-for="generation in generationOptions"
              :key="generation"
              :value="String(generation)"
            >
              {{ getGenerationDisplayLabel(generation) }}
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
            <option v-for="kind in locationKindOptions" :key="kind.value" :value="kind.value">
              {{ kind.label }}
            </option>
          </select>
        </label>

        <label>
          <span>{{ labels.sort }}</span>
          <select v-model="sortMode">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="directoryLoading" class="status-message" role="status">{{ labels.loading }}</p>
      <div v-else-if="hasError" class="error-message" role="alert">
        <p>{{ labels.loadError }}</p>
        <button type="button" @click="loadDirectory">{{ labels.tryAgain }}</button>
      </div>
      <p v-else-if="loadingSelectedRegion" class="status-message" role="status">
        {{ labels.loadingRegion }}
      </p>
      <p v-else-if="filteredLocations.length === 0" class="status-message">
        {{ labels.noMatches }}
      </p>

      <template v-else>
        <div class="route-list">
          <section
            v-for="section in pagedLocationSections"
            :key="section.key"
            class="generation-section"
            :aria-labelledby="`${section.key}-heading`"
          >
            <h2 :id="`${section.key}-heading`">
              <span>{{ section.label }}</span>
              <small>{{ section.locations.length }}</small>
            </h2>
            <ul>
              <li v-for="location in section.locations" :key="location.id">
                <button
                  type="button"
                  class="route-button"
                  :class="{ selected: selectedLocation?.id === location.id }"
                  :aria-current="selectedLocation?.id === location.id ? 'true' : undefined"
                  @click="selectLocation(location)"
                >
                  <span class="route-number">#{{ formatResourceId(location.id) }}</span>
                  <span class="route-copy">
                    <strong>{{ getLocationLabel(location) }}</strong>
                    <span class="route-meta">
                      <small>{{ getLocationKindLabel(location) }}</small>
                      <small v-if="getLocationRegionSummary(location)">
                        {{ getLocationRegionSummary(location) }}
                      </small>
                    </span>
                    <small v-if="getAdditionalGenerationsLabel(location)" class="generation-note">
                      {{ labels.alsoIn }} {{ getAdditionalGenerationsLabel(location) }}
                    </small>
                  </span>
                  <span class="route-arrow" aria-hidden="true">›</span>
                </button>
              </li>
            </ul>
          </section>
        </div>

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

    <main
      ref="detailPanel"
      class="route-detail"
      tabindex="-1"
      aria-live="polite"
      :aria-busy="detailLoading"
    >
      <div v-if="!selectedLocation" class="empty-detail">
        <span aria-hidden="true">⌖</span>
        <div>
          <h2>{{ labels.chooseTitle }}</h2>
          <p>{{ labels.chooseText }}</p>
        </div>
      </div>

      <p v-else-if="detailLoading && !locationDetails" class="detail-status" role="status">
        {{ labels.detailLoading }}
      </p>

      <div v-else-if="detailError && !locationDetails" class="error-message detail-error" role="alert">
        <p>{{ detailError }}</p>
        <button type="button" @click="loadLocationDetails">{{ labels.tryAgain }}</button>
      </div>

      <template v-else-if="locationDetails">
        <nav class="detail-navigation" :aria-label="labels.locationNavigation">
          <button
            type="button"
            :disabled="!previousLocation"
            @click="navigateLocation(previousLocation)"
          >
            <span aria-hidden="true">←</span> {{ labels.previousLocation }}
          </button>
          <span>{{ selectedLocationPosition }}</span>
          <button
            type="button"
            :disabled="!nextLocation"
            @click="navigateLocation(nextLocation)"
          >
            {{ labels.nextLocation }} <span aria-hidden="true">→</span>
          </button>
        </nav>

        <header class="location-header">
          <div>
            <p>#{{ formatResourceId(locationDetails.id) }}</p>
            <h2>{{ localizedLocationName }}</h2>
            <span>{{ labels.region }}: {{ detailedRegionLabel }}</span>
          </div>
          <div v-if="locationIndexRows.length" class="location-indexes">
            <strong>{{ labels.gameIndexes }}</strong>
            <span v-for="index in locationIndexRows" :key="index.key">
              {{ index.generation }} · {{ labels.index }} {{ index.gameIndex }}
            </span>
          </div>
        </header>

        <section class="game-filter-section">
          <label>
            <span>{{ labels.game }}</span>
            <select v-model="selectedVersion" :disabled="detailLoading || availableVersionSections.length === 0">
              <option value="">{{ labels.allGames }}</option>
              <optgroup
                v-for="section in availableVersionSections"
                :key="section.generation"
                :label="section.label"
              >
                <option v-for="version in section.versions" :key="version" :value="version">
                  {{ getGameLabel(version) }}
                </option>
              </optgroup>
            </select>
          </label>
          <span>{{ filteredEncounterCount }} {{ labels.encounters }}</span>
        </section>

        <p v-if="detailLoading" class="detail-status" role="status">
          {{ labels.encountersLoading }}
        </p>

        <p v-if="failedAreaCount > 0" class="area-warning" role="status">
          {{ getAreaWarningText(failedAreaCount) }}
        </p>

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
                    v-if="getEncounterSprite(encounter)"
                    :src="getEncounterSprite(encounter)"
                    :alt="getEncounterName(encounter)"
                    width="78"
                    height="78"
                    loading="lazy"
                    decoding="async"
                  >
                  <span v-else class="sprite-placeholder" aria-hidden="true">?</span>
                  <strong>{{ getEncounterName(encounter) }}</strong>
                  <small>#{{ formatResourceId(encounter.id) }}</small>
                </div>
                <ul class="encounter-details">
                  <li v-for="detail in encounter.details" :key="detail.key">
                    <b>
                      <small>{{ labels.game }}</small>
                      {{ getGameLabel(detail.version) }}
                    </b>
                    <span>
                      <small>{{ labels.method }}</small>
                      {{ getMethodLabel(detail.method) }}
                    </span>
                    <span>
                      <small>{{ labels.level }}</small>
                      {{ formatEncounterLevel(detail) }}
                    </span>
                    <strong>
                      <small>{{ labels.chance }}</small>
                      {{ detail.chance }} %
                    </strong>
                  </li>
                </ul>
              </article>
            </div>
          </article>
        </section>

        <p v-else-if="!detailLoading" class="detail-status">{{ labels.noAreaData }}</p>
      </template>
    </main>
  </section>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
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
  buildLocationRegionIndex,
  getAdditionalLocationGenerations,
  getGameMetadata,
  getLocationKind,
  getLocationRegions,
  getPrimaryLocationGeneration,
  getRegionOrder,
  getSafeDisplayText,
  groupGameVersionsByGeneration,
  groupLocationsByGeneration,
  LOCATION_GENERATIONS,
  LOCATION_KINDS,
  locationMatchesFilters,
  mapWithConcurrencySettled,
  sortGameVersions,
  sortLocations,
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
const MAX_PARALLEL_AREA_REQUESTS = 6;
const MAX_PARALLEL_REGION_REQUESTS = 4;
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
const regionDetails = ref(new Map());
const locationRegions = ref(new Map());
const regionLocations = ref(new Map());
const locationCatalog = ref(new Map());
const locationGameIndices = ref(new Map());
const pokemonCatalog = ref(new Map());
const selectedRegion = ref('');
const selectedGeneration = ref('');
const selectedKind = ref('');
const sortMode = ref('generation-game');
const page = ref(1);
const loading = ref(false);
const loadingRegions = ref(false);
const loadingSelectedRegion = ref(false);
const hasError = ref(false);
const selectedLocation = ref(null);
const locationDetails = ref(null);
const locationAreas = ref([]);
const selectedVersion = ref('');
const directoryPanel = ref(null);
const detailPanel = ref(null);
const detailLoading = ref(false);
const detailError = ref('');
const failedAreaCount = ref(0);
let activeDetailRequestId = 0;
let activeRegionRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      kicker: 'Spielwelt',
      title: 'Routen & Orte',
      description: 'Alle Orte sind nach ihrer frühesten Generation geordnet. Filtere nach Generation, Region und Ortsart und öffne einen Ort für die Begegnungsdaten.',
      generation: 'Generation',
      allGenerations: 'Alle Generationen',
      region: 'Region',
      allRegions: 'Alle Regionen',
      locationType: 'Ortsart',
      allLocationTypes: 'Alle Ortsarten',
      city: 'Stadt / Dorf',
      route: 'Route / Weg',
      cave: 'Höhle / Tunnel',
      building: 'Gebäude',
      island: 'Insel',
      forest: 'Wald',
      mountain: 'Berg',
      water: 'Gewässer',
      other: 'Sonstiger Ort',
      sort: 'Sortierung',
      sortGenerationGame: 'Generation und Spielreihenfolge',
      sortName: 'Name A–Z',
      sortNumber: 'Nummer',
      sortRegion: 'Region',
      sortCitiesFirst: 'Städte zuerst',
      sortRoutesFirst: 'Routen zuerst',
      sortedLocations: 'Sortierte Orte',
      loading: 'Routen, Orte und Regionsdaten werden geladen…',
      loadingRegion: 'Die Orte der ausgewählten Region werden geladen…',
      loadError: 'Das Routenverzeichnis konnte nicht geladen werden.',
      tryAgain: 'Erneut versuchen',
      noMatches: 'Keine Route oder kein Ort entspricht der Suche und den Filtern.',
      previous: 'Zurück',
      next: 'Weiter',
      page: 'Seite',
      pages: 'Routenseiten',
      alsoIn: 'Auch in',
      chooseTitle: 'Route oder Ort auswählen',
      chooseText: 'Wähle links einen Eintrag, um Gebiete und wilde Begegnungen nach Spiel, Methode, Level und Chance zu sehen.',
      detailLoading: 'Die Ortsdaten werden geladen…',
      encountersLoading: 'Gebiete und Begegnungen werden geladen…',
      detailLoadError: 'Die Routendetails konnten nicht geladen werden.',
      unknown: 'Unbekannt',
      unknownRegion: 'Nicht zugeordnet',
      gameIndexes: 'Spielindizes',
      index: 'Index',
      game: 'Spiel',
      allGames: 'Alle Spiele',
      encounters: 'Begegnungen',
      area: 'Gebiet',
      pokemon: 'Pokémon',
      method: 'Methode',
      level: 'Level',
      chance: 'Chance',
      noEncountersForGame: 'In der gewählten Spielversion sind für dieses Gebiet keine Begegnungen hinterlegt.',
      noAreaData: 'Für diesen Ort sind keine Untergebiete mit Begegnungsdaten hinterlegt.',
      areaWarning: 'Ein Gebiet konnte nicht geladen werden.',
      areaWarnings: '{count} Gebiete konnten nicht geladen werden. Die übrigen Daten werden weiterhin angezeigt.',
      locationNavigation: 'Navigation zwischen Orten',
      previousLocation: 'Vorheriger Ort',
      nextLocation: 'Nächster Ort',
      levelShort: 'Lv.',
    }
  : {
      kicker: 'Game world',
      title: 'Routes & locations',
      description: 'Every location is ordered by its earliest generation. Filter by generation, region and location type, then open a location for encounter data.',
      generation: 'Generation',
      allGenerations: 'All generations',
      region: 'Region',
      allRegions: 'All regions',
      locationType: 'Location type',
      allLocationTypes: 'All location types',
      city: 'City / village',
      route: 'Route / path',
      cave: 'Cave / tunnel',
      building: 'Building',
      island: 'Island',
      forest: 'Forest',
      mountain: 'Mountain',
      water: 'Body of water',
      other: 'Other location',
      sort: 'Sort',
      sortGenerationGame: 'Generation and game order',
      sortName: 'Name A–Z',
      sortNumber: 'Number',
      sortRegion: 'Region',
      sortCitiesFirst: 'Cities first',
      sortRoutesFirst: 'Routes first',
      sortedLocations: 'Sorted locations',
      loading: 'Loading routes, locations and region data…',
      loadingRegion: 'Loading locations for the selected region…',
      loadError: 'The route directory could not be loaded.',
      tryAgain: 'Try again',
      noMatches: 'No route or location matches the search and filters.',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      pages: 'Route pages',
      alsoIn: 'Also in',
      chooseTitle: 'Choose a route or location',
      chooseText: 'Select an entry to inspect areas and wild encounters by game, method, level and chance.',
      detailLoading: 'Loading location data…',
      encountersLoading: 'Loading areas and encounters…',
      detailLoadError: 'The route details could not be loaded.',
      unknown: 'Unknown',
      unknownRegion: 'Not assigned',
      gameIndexes: 'Game indexes',
      index: 'Index',
      game: 'Game',
      allGames: 'All games',
      encounters: 'encounters',
      area: 'Area',
      pokemon: 'Pokémon',
      method: 'Method',
      level: 'Level',
      chance: 'Chance',
      noEncountersForGame: 'No encounters are listed for this area in the selected game.',
      noAreaData: 'No sub-areas with encounter data are listed for this location.',
      areaWarning: 'One area could not be loaded.',
      areaWarnings: '{count} areas could not be loaded. The remaining data is still shown.',
      locationNavigation: 'Location navigation',
      previousLocation: 'Previous location',
      nextLocation: 'Next location',
      levelShort: 'Lv.',
    });

const directoryLoading = computed(() => loading.value || loadingRegions.value);
const generationOptions = LOCATION_GENERATIONS;
const locationKindOptions = computed(() => LOCATION_KINDS.map((kind) => ({
  value: kind,
  label: labels.value[kind],
})));
const sortOptions = computed(() => [
  { value: 'generation-game', label: labels.value.sortGenerationGame },
  { value: 'name', label: labels.value.sortName },
  { value: 'number', label: labels.value.sortNumber },
  { value: 'region', label: labels.value.sortRegion },
  { value: 'city-first', label: labels.value.sortCitiesFirst },
  { value: 'route-first', label: labels.value.sortRoutesFirst },
]);

const formatName = (value = '') => getSafeDisplayText(value)
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const getCatalogDisplayLabel = (catalog, id, fallback = '') => {
  const fallbackLabel = formatName(fallback);
  try {
    return getSafeDisplayText(getCatalogLabel(catalog, id, fallback), fallbackLabel) || fallbackLabel;
  } catch {
    return fallbackLabel;
  }
};

const getGenerationDisplayLabel = (generation) => getSafeDisplayText(
  getGenerationLabel(generation, language.value),
  `${labels.value.generation} ${generation}`,
);
const getRegionLabel = (name = '') => language.value === 'de'
  ? REGION_NAMES_DE[name] || formatName(name || labels.value.unknown)
  : formatName(name || labels.value.unknown);
const getLocationLabel = (location) => language.value === 'de'
  ? getCatalogDisplayLabel(locationCatalog.value, location?.id, location?.name)
  : formatName(location?.name);
const getEncounterName = (encounter) => language.value === 'de'
  ? getCatalogDisplayLabel(pokemonCatalog.value, encounter?.id, encounter?.name)
  : formatName(encounter?.name);
const getGameLabel = (version) => getSafeDisplayText(
  getLocalizedVersionName(version, language.value),
  formatName(version),
);
const getMethodLabel = (method) => getSafeDisplayText(
  getLocalizedEncounterMethodName(method, language.value),
  formatName(method || labels.value.unknown),
);
const getLocationGameEntries = (location) => locationGameIndices.value.get(Number(location?.id)) || [];
const getLocationRegionNames = (location) => getLocationRegions(location?.name, locationRegions.value);
const getLocationKindLabel = (location) => labels.value[
  getLocationKind(location?.name, getLocationLabel(location))
] || labels.value.other;
const getLocationRegionSummary = (location) => getLocationRegionNames(location)
  .map(getRegionLabel)
  .join(' / ');
const getLocationGeneration = (location) => getPrimaryLocationGeneration(
  getLocationGameEntries(location),
  getLocationRegionNames(location),
);
const getAdditionalGenerationsLabel = (location) => getAdditionalLocationGenerations(
  getLocationGameEntries(location),
  getLocationRegionNames(location),
).map(getGenerationDisplayLabel).join(', ');

const filteredLocations = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase(language.value === 'de' ? 'de-DE' : 'en-US');
  const entries = locations.value.filter((location) => {
    const localizedName = getLocationLabel(location);
    const matchesSearch = !query
      || getSafeDisplayText(location?.name).toLocaleLowerCase('en-US').includes(query)
      || localizedName.toLocaleLowerCase(language.value === 'de' ? 'de-DE' : 'en-US').includes(query)
      || String(location?.id ?? '').includes(query);
    return matchesSearch && locationMatchesFilters({
      location,
      locationGameIndices: locationGameIndices.value,
      locationRegions: locationRegions.value,
      generation: selectedGeneration.value,
      region: selectedRegion.value,
      kind: selectedKind.value,
      localizedLabel: localizedName,
    });
  });

  return sortLocations({
    locations: entries,
    locationGameIndices: locationGameIndices.value,
    locationRegions: locationRegions.value,
    getLabel: getLocationLabel,
    language: language.value,
    mode: sortMode.value,
  });
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredLocations.value.length / PAGE_SIZE)));
const pagedLocations = computed(() => filteredLocations.value.slice(
  (page.value - 1) * PAGE_SIZE,
  page.value * PAGE_SIZE,
));
const pagedLocationSections = computed(() => {
  if (sortMode.value === 'generation-game') {
    return groupLocationsByGeneration({
      locations: pagedLocations.value,
      locationGameIndices: locationGameIndices.value,
      locationRegions: locationRegions.value,
      getLabel: getLocationLabel,
      language: language.value,
      sortMode: sortMode.value,
    }).map((section) => ({ ...section, key: `generation-${section.generation}` }));
  }
  return [{
    key: `sort-${sortMode.value}`,
    label: sortOptions.value.find((option) => option.value === sortMode.value)?.label
      || labels.value.sortedLocations,
    locations: pagedLocations.value,
  }];
});

const selectedLocationIndex = computed(() => filteredLocations.value.findIndex((location) => (
  location.id === selectedLocation.value?.id
)));
const previousLocation = computed(() => selectedLocationIndex.value > 0
  ? filteredLocations.value[selectedLocationIndex.value - 1]
  : null);
const nextLocation = computed(() => selectedLocationIndex.value >= 0
  && selectedLocationIndex.value < filteredLocations.value.length - 1
  ? filteredLocations.value[selectedLocationIndex.value + 1]
  : null);
const selectedLocationPosition = computed(() => selectedLocationIndex.value >= 0
  ? `${selectedLocationIndex.value + 1} / ${filteredLocations.value.length}`
  : `– / ${filteredLocations.value.length}`);

const localizedLocationName = computed(() => {
  if (!locationDetails.value) return '';
  const apiName = getSafeDisplayText(
    getLocalizedName(locationDetails.value.names, locationDetails.value.name, language.value),
    formatName(locationDetails.value.name),
  );
  return language.value === 'de'
    ? getCatalogDisplayLabel(locationCatalog.value, locationDetails.value.id, apiName)
    : apiName;
});
const detailedRegionLabel = computed(() => {
  const apiRegionName = getSafeDisplayText(locationDetails.value?.region?.name);
  if (apiRegionName) return getRegionLabel(apiRegionName);
  const fallbackRegions = getLocationRegionNames(selectedLocation.value);
  return fallbackRegions.length > 0
    ? fallbackRegions.map(getRegionLabel).join(' / ')
    : labels.value.unknownRegion;
});
const locationIndexRows = computed(() => (locationDetails.value?.game_indices || [])
  .map((entry, index) => ({
    key: `${getSafeDisplayText(entry?.generation?.name)}-${entry?.game_index ?? 'unknown'}-${index}`,
    generation: getSafeDisplayText(
      getLocalizedGenerationName(entry?.generation?.name, language.value),
      getGenerationDisplayLabel(getLocationGeneration(selectedLocation.value)),
    ),
    gameIndex: Number.isFinite(Number(entry?.game_index)) ? Number(entry.game_index) : labels.value.unknown,
  }))
  .sort((first, second) => Number(first.gameIndex) - Number(second.gameIndex)
    || first.generation.localeCompare(second.generation, language.value)));

const availableVersions = computed(() => sortGameVersions(
  locationAreas.value.flatMap((area) => (area.pokemon_encounters || []).flatMap((encounter) => (
    (encounter.version_details || []).map((detail) => detail.version?.name).filter(Boolean)
  ))),
));
const availableVersionSections = computed(() => groupGameVersionsByGeneration(
  availableVersions.value,
  language.value,
));

const areaRows = computed(() => locationAreas.value.map((area) => {
  const areaName = getSafeDisplayText(
    getLocalizedName(area.names, area.name, language.value),
    formatName(area.name),
  );
  const encounters = (area.pokemon_encounters || [])
    .map((encounter) => {
      const details = (encounter.version_details || [])
        .filter((versionDetail) => !selectedVersion.value
          || versionDetail.version?.name === selectedVersion.value)
        .flatMap((versionDetail) => (versionDetail.encounter_details || []).map((detail, detailIndex) => {
          const minLevel = Math.max(0, Number(detail.min_level) || 0);
          const maxLevel = Math.max(minLevel, Number(detail.max_level) || minLevel);
          const chance = Math.max(0, Number(detail.chance ?? versionDetail.max_chance) || 0);
          const method = getSafeDisplayText(detail.method?.name);
          const version = getSafeDisplayText(versionDetail.version?.name);
          return {
            key: `${version}-${method}-${minLevel}-${maxLevel}-${chance}-${detailIndex}`,
            version,
            chance,
            minLevel,
            maxLevel,
            method,
          };
        }))
        .sort((first, second) => getGameMetadata(first.version).order - getGameMetadata(second.version).order
          || first.method.localeCompare(second.method, 'en-US')
          || first.minLevel - second.minLevel
          || first.maxLevel - second.maxLevel
          || first.chance - second.chance);
      return {
        name: getSafeDisplayText(encounter.pokemon?.name),
        id: getResourceId(encounter.pokemon?.url),
        details,
      };
    })
    .filter((encounter) => encounter.details.length > 0)
    .sort((first, second) => getEncounterName(first).localeCompare(
      getEncounterName(second),
      language.value === 'de' ? 'de-DE' : 'en-US',
      { numeric: true, sensitivity: 'base' },
    ));
  return {
    id: area.id ?? area.name,
    gameIndex: Number.isFinite(Number(area.game_index)) ? Number(area.game_index) : labels.value.unknown,
    name: areaName,
    encounters,
  };
}).sort((first, second) => Number(first.gameIndex) - Number(second.gameIndex)
  || first.name.localeCompare(second.name, language.value)));
const filteredEncounterCount = computed(() => areaRows.value.reduce(
  (total, area) => total + area.encounters.length,
  0,
));

const getEncounterSprite = (encounter) => encounter?.id
  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${encounter.id}.png`
  : '';
const formatEncounterLevel = (detail) => {
  if (!detail.minLevel && !detail.maxLevel) return labels.value.unknown;
  if (detail.minLevel === detail.maxLevel) return `${labels.value.levelShort} ${detail.minLevel}`;
  return `${labels.value.levelShort} ${detail.minLevel}–${detail.maxLevel}`;
};
const getAreaWarningText = (count) => count === 1
  ? labels.value.areaWarning
  : labels.value.areaWarnings.replace('{count}', String(count));

const loadCatalogs = async () => {
  const structuralResult = await Promise.allSettled([
    loadGermanCatalog('locationGameIndices'),
  ]);
  if (structuralResult[0].status === 'fulfilled') {
    locationGameIndices.value = structuralResult[0].value;
  }

  if (language.value !== 'de') return;
  const localizedResults = await Promise.allSettled([
    loadGermanCatalog('locations'),
    loadGermanPokemonCatalog(),
  ]);
  if (localizedResults[0].status === 'fulfilled') locationCatalog.value = localizedResults[0].value;
  if (localizedResults[1].status === 'fulfilled') pokemonCatalog.value = localizedResults[1].value;
};

const mergeRegionDetails = (details = []) => {
  const nextDetails = new Map(regionDetails.value);
  for (const detail of details) {
    const name = getSafeDisplayText(detail?.name);
    if (name) nextDetails.set(name, detail);
  }
  regionDetails.value = nextDetails;
  const indexes = buildLocationRegionIndex([...nextDetails.values()]);
  locationRegions.value = indexes.locationRegions;
  regionLocations.value = indexes.regionLocations;
};

const loadLocations = async () => {
  loading.value = true;
  hasError.value = false;
  try {
    const [response] = await Promise.all([PokeAPI.getLocations(), loadCatalogs()]);
    locations.value = (response.data.results || [])
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
    regions.value = [...(response.data.results || [])].sort((first, second) => (
      getRegionOrder(first.name) - getRegionOrder(second.name)
        || first.name.localeCompare(second.name, 'en-US')
    ));
    const results = await mapWithConcurrencySettled(
      regions.value,
      MAX_PARALLEL_REGION_REQUESTS,
      async (region) => (await PokeAPI.getRegionDetails(region.name)).data,
    );
    const loadedDetails = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);
    mergeRegionDetails(loadedDetails);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to load route region ${regions.value[index]?.name || index}:`, result.reason);
      }
    });
  } catch (error) {
    console.error('Failed to load route regions:', error);
  } finally {
    loadingRegions.value = false;
  }
};

const loadDirectory = async () => {
  await Promise.all([loadLocations(), loadRegions()]);
};

const loadSelectedRegion = async () => {
  const requestId = ++activeRegionRequestId;
  page.value = 1;
  if (!selectedRegion.value || regionLocations.value.has(selectedRegion.value)) {
    loadingSelectedRegion.value = false;
    return;
  }

  loadingSelectedRegion.value = true;
  const regionName = selectedRegion.value;
  try {
    const response = await PokeAPI.getRegionDetails(regionName);
    mergeRegionDetails([response.data]);
  } catch (error) {
    console.error(`Failed to load route region ${regionName}:`, error);
  } finally {
    if (requestId === activeRegionRequestId) loadingSelectedRegion.value = false;
  }
};

const focusDetailsOnSmallScreen = async () => {
  await nextTick();
  if (typeof window === 'undefined' || !window.matchMedia('(max-width: 1120px)').matches) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  detailPanel.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  detailPanel.value?.focus({ preventScroll: true });
};

const selectLocation = async (location) => {
  const alreadySelected = selectedLocation.value?.id === location?.id && locationDetails.value;
  selectedLocation.value = location;
  selectedVersion.value = '';
  if (!alreadySelected) await loadLocationDetails();
  await focusDetailsOnSmallScreen();
};

const navigateLocation = async (location) => {
  if (location) await selectLocation(location);
};

const loadLocationDetails = async () => {
  const requestedLocation = selectedLocation.value;
  if (!requestedLocation?.name) return;
  const requestId = ++activeDetailRequestId;
  detailLoading.value = true;
  detailError.value = '';
  failedAreaCount.value = 0;
  locationDetails.value = null;
  locationAreas.value = [];

  try {
    const locationResponse = await PokeAPI.getLocationDetails(requestedLocation.name);
    if (requestId !== activeDetailRequestId) return;
    locationDetails.value = locationResponse.data;
    const areas = Array.isArray(locationResponse.data.areas) ? locationResponse.data.areas : [];
    const results = await mapWithConcurrencySettled(
      areas,
      MAX_PARALLEL_AREA_REQUESTS,
      async (area) => (await PokeAPI.getLocationAreaDetails(area.name)).data,
    );
    if (requestId !== activeDetailRequestId) return;
    locationAreas.value = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);
    failedAreaCount.value = results.filter((result) => result.status === 'rejected').length;
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to load location area ${areas[index]?.name || index}:`, result.reason);
      }
    });
  } catch (error) {
    if (requestId !== activeDetailRequestId) return;
    console.error('Failed to load location details:', error);
    detailError.value = labels.value.detailLoadError;
  } finally {
    if (requestId === activeDetailRequestId) detailLoading.value = false;
  }
};

watch(selectedRegion, () => { void loadSelectedRegion(); });
watch([selectedGeneration, selectedKind, sortMode, () => props.searchQuery], () => { page.value = 1; });
watch(pageCount, (count) => { if (page.value > count) page.value = count; });
watch(language, () => { void loadCatalogs(); });
onMounted(() => { void loadDirectory(); });
onBeforeUnmount(() => {
  activeDetailRequestId += 1;
  activeRegionRequestId += 1;
});
</script>

<style scoped>
.route-layout {
  display: grid;
  grid-template-columns: minmax(350px, 455px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.route-directory {
  position: sticky;
  top: 86px;
  max-height: calc(100vh - 104px);
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  outline: none;
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
  font-variant-numeric: tabular-nums;
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
  min-width: 0;
  color: var(--legacy-muted);
  font-size: 0.64rem;
  font-weight: 850;
}

.route-filters select,
.game-filter-section select,
.pagination select {
  width: 100%;
  min-width: 0;
  min-height: 36px;
  padding: 5px 7px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: var(--legacy-page);
}

.status-message,
.error-message,
.detail-status,
.area-warning {
  margin: 0;
  padding: 20px 14px;
  color: var(--legacy-muted);
}

.error-message {
  color: var(--danger-color);
}

.error-message button,
.detail-navigation button {
  min-height: 36px;
  padding: 7px 10px;
  border: 1px solid var(--legacy-border-strong);
  color: var(--legacy-text);
  background: var(--legacy-page);
}

.error-message button {
  margin-top: 7px;
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.route-list {
  max-height: calc(100vh - 374px);
  padding: 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.generation-section h2 {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 8px 10px;
  border-top: 1px solid var(--legacy-border);
  border-bottom: 1px solid var(--legacy-border);
  color: var(--legacy-muted);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--legacy-surface);
}

.generation-section h2 small {
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
}

.generation-section:first-child h2 {
  border-top: 0;
}

.generation-section ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

.route-button {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 66px;
  padding: 8px 9px;
  border: 1px solid transparent;
  color: var(--legacy-text);
  text-align: left;
  background: transparent;
}

.route-button:hover,
.route-button:focus-visible,
.route-button.selected {
  border-color: var(--legacy-border-strong);
  outline: none;
  background: var(--legacy-surface-active);
}

.route-button.selected {
  box-shadow: inset 4px 0 0 var(--focus-color);
}

.route-number {
  color: var(--legacy-muted);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}

.route-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.route-copy strong {
  overflow: hidden;
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 8px;
}

.route-copy small {
  color: var(--legacy-muted);
  font-size: 0.62rem;
}

.generation-note {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-arrow {
  color: var(--legacy-muted);
  font-size: 1.2rem;
}

.pagination {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-top: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.pagination button {
  min-height: 36px;
  padding: 5px 9px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: var(--legacy-surface);
}

.route-detail {
  min-width: 0;
  color: var(--legacy-text);
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
  flex: 0 0 auto;
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

.detail-error {
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.detail-navigation {
  display: grid;
  grid-template-columns: minmax(130px, auto) minmax(70px, 1fr) minmax(130px, auto);
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.detail-navigation button:hover:not(:disabled),
.detail-navigation button:focus-visible {
  border-color: var(--focus-color);
  outline: none;
  background: var(--legacy-surface-hover);
}

.detail-navigation button:disabled {
  opacity: 0.5;
}

.detail-navigation > span {
  color: var(--legacy-muted);
  text-align: center;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
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
  min-width: 190px;
  max-height: 190px;
  padding: 10px;
  overflow-y: auto;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.location-indexes strong {
  margin-bottom: 3px;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.location-indexes span {
  color: var(--legacy-muted);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}

.game-filter-section,
.area-card {
  margin-top: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.game-filter-section {
  display: flex;
  gap: 14px;
  justify-content: space-between;
  align-items: end;
  padding: 12px;
}

.game-filter-section label {
  width: min(360px, 100%);
}

.game-filter-section > span {
  color: var(--legacy-muted);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

.area-warning {
  margin-top: 12px;
  border: 1px solid color-mix(in srgb, var(--danger-color) 55%, var(--legacy-border));
  color: var(--danger-color);
  background: var(--legacy-surface);
}

.area-card {
  padding: 14px;
}

.area-heading {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: end;
}

.area-heading p {
  margin: 0 0 3px;
  color: var(--legacy-muted);
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
}

.area-heading h3 {
  margin: 0;
  overflow-wrap: anywhere;
}

.area-heading > span {
  color: var(--legacy-muted);
  font-size: 0.72rem;
}

.area-empty {
  color: var(--legacy-muted);
}

.encounter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));
  gap: 8px;
  margin-top: 12px;
}

.encounter-card {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.encounter-pokemon {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 2px;
  min-width: 0;
  padding: 8px;
  border-right: 1px solid var(--legacy-border);
  text-align: center;
}

.encounter-pokemon img,
.sprite-placeholder {
  width: 78px;
  height: 78px;
}

.encounter-pokemon img {
  object-fit: contain;
  image-rendering: pixelated;
}

.sprite-placeholder {
  display: grid;
  place-items: center;
  color: var(--legacy-muted);
  font-size: 1.4rem;
}

.encounter-pokemon strong {
  max-width: 100%;
  overflow: hidden;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.encounter-pokemon small {
  color: var(--legacy-muted);
  font-size: 0.6rem;
}

.encounter-details {
  display: grid;
  padding: 0;
  margin: 0;
  list-style: none;
}

.encounter-details li {
  display: grid;
  grid-template-columns: minmax(95px, 1fr) minmax(105px, 1fr) minmax(68px, auto) minmax(54px, auto);
  gap: 7px;
  align-items: center;
  padding: 8px 9px;
  border-bottom: 1px solid var(--legacy-border);
  font-size: 0.68rem;
}

.encounter-details li:last-child {
  border-bottom: 0;
}

.encounter-details b,
.encounter-details span,
.encounter-details strong {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.encounter-details span {
  color: var(--legacy-muted);
}

.encounter-details strong {
  text-align: right;
}

.encounter-details small {
  color: var(--legacy-muted);
  font-size: 0.54rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.visually-hidden {
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

@media (max-width: 1120px) {
  .route-layout {
    grid-template-columns: 1fr;
  }

  .route-directory {
    position: static;
    max-height: none;
  }

  .route-list {
    max-height: 520px;
  }
}

@media (max-width: 700px) {
  .route-filters {
    grid-template-columns: 1fr;
  }

  .route-list {
    max-height: 58vh;
  }

  .detail-navigation {
    grid-template-columns: 1fr 1fr;
  }

  .detail-navigation > span {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .location-header {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .location-indexes {
    min-width: 0;
  }

  .game-filter-section {
    align-items: stretch;
    flex-direction: column;
  }

  .encounter-grid {
    grid-template-columns: 1fr;
  }

  .encounter-details li {
    grid-template-columns: 1fr 1fr;
  }

  .encounter-details strong {
    text-align: left;
  }
}

@media (max-width: 460px) {
  .route-heading,
  .route-description {
    padding-right: 10px;
    padding-left: 10px;
  }

  .route-button {
    grid-template-columns: 48px minmax(0, 1fr) auto;
  }

  .pagination {
    grid-template-columns: 1fr 1fr;
  }

  .pagination label {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .empty-detail {
    align-items: flex-start;
    padding: 20px;
  }

  .empty-detail > span {
    width: 48px;
    height: 48px;
  }

  .encounter-card {
    grid-template-columns: 1fr;
  }

  .encounter-pokemon {
    grid-template-columns: 78px minmax(0, 1fr) auto;
    justify-items: start;
    align-items: center;
    border-right: 0;
    border-bottom: 1px solid var(--legacy-border);
    text-align: left;
  }

  .encounter-pokemon img,
  .sprite-placeholder {
    grid-row: 1 / 3;
  }

  .encounter-pokemon strong {
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-button,
  .detail-navigation button {
    scroll-behavior: auto;
  }
}
</style>
