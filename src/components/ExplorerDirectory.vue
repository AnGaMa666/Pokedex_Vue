<template>
  <section class="directory-layout" :class="{ 'has-selection': selectedResource }">
    <aside class="directory-panel">
      <div class="directory-heading">
        <div>
          <p>{{ config.kicker }}</p>
          <h1>{{ config.title }}</h1>
        </div>
        <span v-if="!loading && !hasError">{{ filteredResources.length }}</span>
      </div>

      <p class="directory-description">{{ config.description }}</p>

      <div v-if="kind === 'moves'" class="directory-filters">
        <label>
          <span>{{ labels.damageClass }}</span>
          <select v-model="selectedDamageClass" :disabled="loadingFilter">
            <option value="">{{ labels.all }}</option>
            <option value="physical">{{ labels.physical }}</option>
            <option value="special">{{ labels.special }}</option>
            <option value="status">{{ labels.status }}</option>
          </select>
        </label>
        <label>
          <span>{{ labels.type }}</span>
          <select v-model="selectedType" :disabled="loadingFilter">
            <option value="">{{ labels.all }}</option>
            <option v-for="type in typeOptions" :key="type" :value="type">
              {{ getLocalizedTypeName(type, language) }}
            </option>
          </select>
        </label>
        <label>
          <span>{{ labels.sort }}</span>
          <select v-model="sortMode">
            <option value="number">{{ labels.number }}</option>
            <option value="name">{{ labels.name }}</option>
            <option value="type">{{ labels.type }}</option>
            <option value="damage-class">{{ labels.damageClass }}</option>
          </select>
        </label>
      </div>

      <div v-else class="directory-filters compact">
        <label>
          <span>{{ labels.sort }}</span>
          <select v-model="sortMode">
            <option value="number">{{ labels.number }}</option>
            <option value="name">{{ labels.name }}</option>
            <option value="category">{{ labels.category }}</option>
            <option value="price-asc">{{ labels.priceAscending }}</option>
            <option value="price-desc">{{ labels.priceDescending }}</option>
          </select>
        </label>
      </div>

      <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>
      <div v-else-if="hasError" class="error-message" role="alert">
        <p>{{ labels.loadError }}</p>
        <button type="button" @click="loadResources">{{ labels.tryAgain }}</button>
      </div>
      <p v-else-if="filteredResources.length === 0" class="status-message">
        {{ labels.noMatches }}
      </p>

      <template v-else>
        <ul class="resource-list" :aria-busy="enrichingResources">
          <li v-for="resource in pagedResources" :key="resource.id">
            <button
              type="button"
              class="resource-button"
              :class="{
                selected: selectedResource?.id === resource.id,
                move: kind === 'moves',
              }"
              :style="getResourceStyle(resource)"
              @click="selectResource(resource)"
            >
              <span v-if="kind !== 'moves'" class="resource-sprite" aria-hidden="true">
                <img
                  :src="getResourceSprite(resource)"
                  alt=""
                  width="52"
                  height="52"
                  loading="lazy"
                  @error="$event.currentTarget.hidden = true"
                >
              </span>
              <span v-else class="resource-number">#{{ formatResourceId(resource.id) }}</span>

              <span class="resource-copy">
                <strong>{{ getResourceLabel(resource) }}</strong>
                <small v-if="kind === 'moves' && getResourceType(resource)">
                  {{ getLocalizedTypeName(getResourceType(resource), language) }} ·
                  {{ getDamageClassLabel(getResourceDamageClass(resource)) }}
                </small>
                <template v-else>
                  <small v-if="getResourceCategory(resource)">
                    {{ getResourceCategory(resource) }}
                  </small>
                  <small class="purchase-price">
                    {{ labels.purchasePrice }}: {{ formatResourceCost(resource) }}
                  </small>
                </template>
              </span>

              <span class="resource-arrow" aria-hidden="true">›</span>
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
    </aside>

    <div ref="detailPanel" class="detail-panel" tabindex="-1" aria-live="polite">
      <component
        :is="config.detailComponent"
        v-if="selectedResource"
        :key="`${kind}-${selectedResource.id}`"
        :resource="selectedResource"
      />
      <div v-else class="empty-detail">
        <span class="empty-symbol" aria-hidden="true">{{ config.symbol }}</span>
        <div>
          <h2>{{ labels.choose }} {{ config.singular }}</h2>
          <p>{{ config.emptyDescription }}</p>
        </div>
      </div>
    </div>
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
  getLocalizedDamageClassName,
  getLocalizedTypeName,
  getTypeTextColor,
} from '@/utils/localization';
import {
  formatResourceId,
  formatResourceName,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';
import { getTypeColor } from '@/utils/typeColors';
import BerryDetails from './BerryDetails.vue';
import ItemDetails from './ItemDetails.vue';
import MoveDetails from './MoveDetails.vue';

const props = defineProps({
  kind: {
    type: String,
    required: true,
    validator: (value) => ['moves', 'items', 'berries', 'balls', 'special-items'].includes(value),
  },
  searchQuery: {
    type: String,
    default: '',
  },
  requestedResource: {
    type: String,
    default: '',
  },
});

const { language } = useI18n();
const PAGE_SIZE = 50;
const MAX_PARALLEL_REQUESTS = 8;
const MAIN_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

const resources = ref([]);
const resourceDetailsByName = ref({});
const selectedResource = ref(null);
const detailPanel = ref(null);
const loading = ref(false);
const enrichingResources = ref(false);
const loadingFilter = ref(false);
const hasError = ref(false);
const selectedDamageClass = ref('');
const selectedType = ref('');
const allowedDamageClassNames = ref(null);
const allowedTypeNames = ref(null);
const sortMode = ref('number');
const page = ref(1);
let activeEnrichmentId = 0;
let activeFilterId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      damageClass: 'Schadensart',
      type: 'Typ',
      sort: 'Sortierung',
      all: 'Alle',
      physical: 'Physisch',
      special: 'Spezial',
      status: 'Status',
      number: 'Nummer',
      name: 'Name A–Z',
      category: 'Kategorie',
      purchasePrice: 'Einkaufspreis',
      notPurchasable: 'Nicht käuflich',
      priceAscending: 'Einkaufspreis aufsteigend',
      priceDescending: 'Einkaufspreis absteigend',
      loading: 'Verzeichnis wird geladen…',
      loadError: 'Das Verzeichnis konnte nicht geladen werden.',
      tryAgain: 'Erneut versuchen',
      noMatches: 'Keine Einträge entsprechen der Suche und den Filtern.',
      choose: 'Bitte auswählen:',
      pages: 'Verzeichnisseiten',
      previous: 'Zurück',
      next: 'Weiter',
      page: 'Seite',
    }
  : {
      damageClass: 'Damage class',
      type: 'Type',
      sort: 'Sort',
      all: 'All',
      physical: 'Physical',
      special: 'Special',
      status: 'Status',
      number: 'Number',
      name: 'Name A–Z',
      category: 'Category',
      purchasePrice: 'Purchase price',
      notPurchasable: 'Not purchasable',
      priceAscending: 'Purchase price ascending',
      priceDescending: 'Purchase price descending',
      loading: 'Loading directory…',
      loadError: 'The directory could not be loaded.',
      tryAgain: 'Try again',
      noMatches: 'No entries match the search and filters.',
      choose: 'Select:',
      pages: 'Directory pages',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
    });

const configs = computed(() => ({
  moves: {
    title: language.value === 'de' ? 'Attacken' : 'Moves',
    singular: language.value === 'de' ? 'Attacke' : 'move',
    kicker: language.value === 'de' ? 'Kampftechniken' : 'Battle techniques',
    description: language.value === 'de'
      ? 'Attacken können nach Typ und Schadensart gefiltert und unabhängig von ihrer Nummer sortiert werden.'
      : 'Moves can be filtered by type and damage class and sorted without changing their IDs.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt Kampfwerte, Ziel, Effekt und Spieltexte.'
      : 'The detail view shows battle values, target, effect and game text.',
    symbol: '⚡',
    listMethod: () => PokeAPI.getMoves(),
    detailMethod: (name) => PokeAPI.getMoveDetails(name),
    detailComponent: MoveDetails,
  },
  items: {
    title: 'Items',
    singular: language.value === 'de' ? 'Item' : 'item',
    kicker: language.value === 'de' ? 'Beutel- und Trageitems' : 'Bag and held items',
    description: language.value === 'de'
      ? 'Pokébälle, Beeren, Maschinen und einzigartige Spezialitems sind aus diesem allgemeinen Verzeichnis entfernt. Einkaufspreise stehen direkt in der Liste.'
      : 'Poké Balls, berries, machines and unique special items are removed from this general directory. Purchase prices are shown directly in the list.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt Sprite, Einkaufspreis, Kategorie, Effekt, Spiele und wilde Träger.'
      : 'The detail view shows sprite, purchase price, category, effect, games and wild holders.',
    symbol: '◆',
    listMethod: () => PokeAPI.getStandardItems(),
    detailMethod: (name) => PokeAPI.getItemDetails(name),
    detailComponent: ItemDetails,
  },
  berries: {
    title: language.value === 'de' ? 'Beeren' : 'Berries',
    singular: language.value === 'de' ? 'Beere' : 'berry',
    kicker: language.value === 'de' ? 'Wachstum und Aromen' : 'Growth and flavors',
    description: language.value === 'de'
      ? 'Beeren bleiben als eigene Kategorie mit Wachstum, Ernte, Aromawerten und verfügbaren Einkaufspreisen erhalten.'
      : 'Berries remain a dedicated category with growth, harvest, flavor values and available purchase prices.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt Wachstumszeit, Ertrag, Härte und Natur-Kraft-Werte.'
      : 'The detail view shows growth time, yield, firmness and Natural Gift values.',
    symbol: '●',
    listMethod: () => PokeAPI.getBerries(),
    detailMethod: (name) => PokeAPI.getItemDetails(`${name}-berry`),
    detailComponent: BerryDetails,
  },
  balls: {
    title: language.value === 'de' ? 'Pokébälle' : 'Poké Balls',
    singular: language.value === 'de' ? 'Pokéball' : 'Poké Ball',
    kicker: language.value === 'de' ? 'Fangitems' : 'Capture items',
    description: language.value === 'de'
      ? 'Alle Pokéball-Kategorien werden zusammengeführt. Sprite und Einkaufspreis werden direkt angezeigt.'
      : 'All Poké Ball categories are combined. Sprite and purchase price are shown directly.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt Einkaufspreis, Effekt, Spielauftritte und weitere Itemdaten.'
      : 'The detail view shows purchase price, effect, game appearances and further item data.',
    symbol: '◉',
    listMethod: () => PokeAPI.getBallItems(),
    detailMethod: (name) => PokeAPI.getItemDetails(name),
    detailComponent: ItemDetails,
  },
  'special-items': {
    title: language.value === 'de' ? 'Einzigartige Items' : 'Unique items',
    singular: language.value === 'de' ? 'Spezialitem' : 'special item',
    kicker: language.value === 'de' ? 'Mega-, Z- und Storyitems' : 'Mega, Z and story items',
    description: language.value === 'de'
      ? 'Mega-Steine, Z-Kristalle, artspezifische, Story- und weitere einzigartige Items werden getrennt gesammelt. Verfügbare Einkaufspreise stehen in der Liste.'
      : 'Mega Stones, Z-Crystals, species-specific, story and other unique items are collected separately. Available purchase prices are shown in the list.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt das offizielle Sprite, den Einkaufspreis und alle verfügbaren PokéAPI-Daten.'
      : 'The detail view shows the official sprite, purchase price and all available PokéAPI data.',
    symbol: '✦',
    listMethod: () => PokeAPI.getSpecialItems(),
    detailMethod: (name) => PokeAPI.getItemDetails(name),
    detailComponent: ItemDetails,
  },
}));

const config = computed(() => configs.value[props.kind]);
const typeOptions = MAIN_TYPES;
const getResourceDetails = (resource) => resourceDetailsByName.value[resource.name] || null;
const getResourceLabel = (resource) => getLocalizedName(
  getResourceDetails(resource)?.names,
  resource.name,
  language.value,
);
const getResourceType = (resource) => getResourceDetails(resource)?.type?.name || '';
const getResourceDamageClass = (resource) => getResourceDetails(resource)?.damage_class?.name || '';
const getDamageClassLabel = (damageClass) => getLocalizedDamageClassName(
  damageClass,
  language.value,
);
const getResourceCategory = (resource) => {
  const category = getResourceDetails(resource)?.category?.name;
  return category ? formatResourceName(category) : '';
};
const getResourceCost = (resource) => Number(getResourceDetails(resource)?.cost) || 0;
const formatResourceCost = (resource) => {
  const cost = getResourceCost(resource);

  if (cost <= 0) {
    return labels.value.notPurchasable;
  }

  return `${new Intl.NumberFormat(language.value === 'de' ? 'de-DE' : 'en-US').format(cost)} ₽`;
};
const getResourceSprite = (resource) => {
  const details = getResourceDetails(resource);
  return details?.sprites?.default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${props.kind === 'berries' ? `${resource.name}-berry` : resource.name}.png`;
};
const getResourceStyle = (resource) => {
  if (props.kind !== 'moves') {
    return {};
  }

  const type = getResourceType(resource);
  return {
    '--move-color': getTypeColor(type),
    '--move-text': getTypeTextColor(type),
  };
};

const filteredResources = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase(language.value);
  let entries = resources.value.filter((resource) => {
    const matchesQuery = !query
      || resource.name.includes(query)
      || getResourceLabel(resource).toLocaleLowerCase(language.value).includes(query)
      || String(resource.id).includes(query);
    const matchesDamageClass = !selectedDamageClass.value
      || allowedDamageClassNames.value?.has(resource.name);
    const matchesType = !selectedType.value || allowedTypeNames.value?.has(resource.name);
    return matchesQuery && matchesDamageClass && matchesType;
  });

  entries = [...entries].sort((firstResource, secondResource) => {
    if (sortMode.value === 'name') {
      return getResourceLabel(firstResource).localeCompare(
        getResourceLabel(secondResource),
        language.value,
      );
    }

    if (sortMode.value === 'type') {
      return getLocalizedTypeName(getResourceType(firstResource), language.value).localeCompare(
        getLocalizedTypeName(getResourceType(secondResource), language.value),
        language.value,
      ) || firstResource.id - secondResource.id;
    }

    if (sortMode.value === 'damage-class') {
      return getResourceDamageClass(firstResource).localeCompare(
        getResourceDamageClass(secondResource),
      ) || firstResource.id - secondResource.id;
    }

    if (sortMode.value === 'category') {
      return getResourceCategory(firstResource).localeCompare(
        getResourceCategory(secondResource),
        language.value,
      ) || firstResource.id - secondResource.id;
    }

    if (sortMode.value === 'price-asc') {
      const firstCost = getResourceCost(firstResource) || Number.MAX_SAFE_INTEGER;
      const secondCost = getResourceCost(secondResource) || Number.MAX_SAFE_INTEGER;
      return firstCost - secondCost || firstResource.id - secondResource.id;
    }

    if (sortMode.value === 'price-desc') {
      return getResourceCost(secondResource) - getResourceCost(firstResource)
        || firstResource.id - secondResource.id;
    }

    return firstResource.id - secondResource.id;
  });

  return entries;
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredResources.value.length / PAGE_SIZE)));
const pagedResources = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredResources.value.slice(start, start + PAGE_SIZE);
});

const enrichResources = async () => {
  const enrichmentId = ++activeEnrichmentId;
  const missing = pagedResources.value.filter((resource) => !getResourceDetails(resource));

  if (!missing.length) {
    enrichingResources.value = false;
    return;
  }

  enrichingResources.value = true;
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < missing.length) {
      const index = nextIndex;
      nextIndex += 1;
      const resource = missing[index];

      try {
        const response = await config.value.detailMethod(resource.name);

        if (enrichmentId !== activeEnrichmentId) {
          return;
        }

        resourceDetailsByName.value = {
          ...resourceDetailsByName.value,
          [resource.name]: response.data,
        };
      } catch (requestError) {
        console.error(`Failed to enrich ${props.kind} ${resource.name}:`, requestError);
      }
    }
  };

  const workers = Math.min(MAX_PARALLEL_REQUESTS, missing.length);
  await Promise.all(Array.from({ length: workers }, worker));

  if (enrichmentId === activeEnrichmentId) {
    enrichingResources.value = false;
  }
};

const loadMoveFilter = async () => {
  const filterId = ++activeFilterId;
  allowedDamageClassNames.value = null;
  allowedTypeNames.value = null;

  if (props.kind !== 'moves') {
    return;
  }

  loadingFilter.value = true;

  try {
    const [damageResult, typeResult] = await Promise.all([
      selectedDamageClass.value
        ? PokeAPI.getMoveDamageClass(selectedDamageClass.value)
        : Promise.resolve(null),
      selectedType.value
        ? PokeAPI.getTypeDetails(selectedType.value)
        : Promise.resolve(null),
    ]);

    if (filterId !== activeFilterId) {
      return;
    }

    allowedDamageClassNames.value = damageResult
      ? new Set((damageResult.data.moves || []).map((move) => move.name))
      : null;
    allowedTypeNames.value = typeResult
      ? new Set((typeResult.data.moves || []).map((move) => move.name))
      : null;
  } catch (requestError) {
    console.error('Failed to load move directory filters:', requestError);
  } finally {
    if (filterId === activeFilterId) {
      loadingFilter.value = false;
    }
  }
};

const scrollToDetails = async () => {
  await nextTick();

  if (window.matchMedia('(max-width: 760px)').matches) {
    detailPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    detailPanel.value?.focus({ preventScroll: true });
  }
};

const selectResource = async (resource) => {
  selectedResource.value = resource;
  await scrollToDetails();
};

const openRequestedResource = async () => {
  const requested = props.requestedResource.trim().toLowerCase();

  if (!requested || !resources.value.length) {
    return;
  }

  const index = resources.value.findIndex((resource) => {
    return resource.name === requested || String(resource.id) === requested;
  });

  if (index < 0) {
    return;
  }

  page.value = Math.floor(index / PAGE_SIZE) + 1;
  await nextTick();
  selectedResource.value = resources.value[index];
  void enrichResources();
  await scrollToDetails();
};

const loadResources = async () => {
  loading.value = true;
  hasError.value = false;
  resources.value = [];
  selectedResource.value = null;
  resourceDetailsByName.value = {};
  page.value = 1;

  try {
    const response = await config.value.listMethod();
    resources.value = response.data.results
      .map((resource) => ({
        ...resource,
        id: getResourceId(resource.url),
      }))
      .filter((resource) => resource.id !== null)
      .sort((firstResource, secondResource) => firstResource.id - secondResource.id);
    await openRequestedResource();
    void enrichResources();
  } catch (requestError) {
    console.error(`Failed to load ${props.kind} directory:`, requestError);
    hasError.value = true;
  } finally {
    loading.value = false;
  }
};

watch([selectedDamageClass, selectedType], () => {
  page.value = 1;
  void loadMoveFilter();
});

watch(sortMode, () => {
  page.value = 1;
});

watch(
  () => props.searchQuery,
  () => {
    page.value = 1;
  },
);

watch(
  () => props.requestedResource,
  () => {
    void openRequestedResource();
  },
);

watch(
  () => `${props.kind}:${page.value}:${pagedResources.value.map((resource) => resource.name).join('|')}`,
  () => {
    void enrichResources();
  },
);

watch(pageCount, (count) => {
  if (page.value > count) {
    page.value = count;
  }
});

onMounted(loadResources);
</script>

<style scoped>
.directory-layout {
  display: grid;
  grid-template-columns: minmax(330px, 430px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.directory-panel {
  position: sticky;
  top: 86px;
  max-height: calc(100vh - 104px);
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.directory-heading {
  display: flex;
  gap: 14px;
  justify-content: space-between;
  align-items: end;
  padding: 16px 14px 10px;
  background: var(--legacy-page);
}

.directory-heading p {
  margin: 0 0 4px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.directory-heading h1 {
  margin: 0;
  color: var(--legacy-text);
  font-size: 1.35rem;
}

.directory-heading > span {
  color: var(--legacy-muted);
  font-size: 0.72rem;
}

.directory-description {
  margin: 0;
  padding: 0 14px 12px;
  border-bottom: 1px solid var(--legacy-border);
  color: var(--legacy-muted);
  font-size: 0.76rem;
  line-height: 1.5;
  background: var(--legacy-page);
}

.directory-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  padding: 9px;
  border-bottom: 1px solid var(--legacy-border);
}

.directory-filters.compact {
  grid-template-columns: 1fr;
}

.directory-filters label {
  display: grid;
  gap: 3px;
  color: var(--legacy-muted);
  font-size: 0.62rem;
  font-weight: 850;
}

.directory-filters label:last-child {
  grid-column: 1 / -1;
}

.directory-filters select {
  width: 100%;
  min-width: 0;
  min-height: 33px;
  padding: 5px 7px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-page);
  font-size: 0.72rem;
}

.status-message,
.error-message {
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
  border-radius: 4px;
  color: #b91c1c;
  background: var(--legacy-page);
}

.resource-list {
  max-height: calc(100vh - 330px);
  padding: 6px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.resource-button {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  width: 100%;
  min-height: 70px;
  padding: 5px 8px 5px 5px;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--legacy-text);
  text-align: left;
  cursor: pointer;
  background: transparent;
}

.resource-button.move {
  min-height: 54px;
  color: var(--move-text);
  background: var(--move-color);
}

.resource-button:hover {
  border-color: var(--legacy-border-strong);
  filter: brightness(0.97);
}

.resource-button.selected {
  border-color: var(--legacy-border-strong);
  box-shadow: inset 4px 0 0 #888888;
}

.resource-sprite {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.resource-sprite img {
  width: 52px;
  height: 52px;
  object-fit: contain;
  image-rendering: pixelated;
}

.resource-number {
  color: inherit;
  font-size: 0.72rem;
  font-weight: 900;
}

.resource-copy {
  display: grid;
  min-width: 0;
}

.resource-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-copy small {
  margin-top: 3px;
  overflow: hidden;
  color: inherit;
  font-size: 0.66rem;
  opacity: 0.78;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-copy .purchase-price {
  color: var(--legacy-text);
  font-weight: 800;
  opacity: 0.9;
}

.resource-arrow {
  color: inherit;
  font-size: 1.35rem;
  opacity: 0.68;
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

.detail-panel {
  min-width: 0;
  scroll-margin-top: 100px;
  outline: none;
}

.empty-detail {
  display: flex;
  gap: 18px;
  align-items: center;
  min-height: 300px;
  padding: 28px;
  border: 1px dashed var(--legacy-border-strong);
  color: var(--legacy-muted);
  background: var(--legacy-surface);
}

.empty-symbol {
  display: grid;
  flex: 0 0 auto;
  width: 72px;
  height: 72px;
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
  line-height: 1.5;
}

@media (max-width: 900px) {
  .directory-layout {
    grid-template-columns: 1fr;
  }

  .directory-panel {
    position: static;
    max-height: none;
  }

  .resource-list {
    max-height: 520px;
  }
}

@media (max-width: 460px) {
  .directory-filters {
    grid-template-columns: 1fr;
  }

  .directory-filters label:last-child {
    grid-column: auto;
  }

  .empty-detail {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
