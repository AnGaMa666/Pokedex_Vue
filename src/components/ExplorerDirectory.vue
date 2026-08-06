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
      <p v-else-if="filteredResources.length === 0" class="status-message">{{ labels.noMatches }}</p>

      <template v-else>
        <ul class="resource-list" :aria-busy="enrichingResources">
          <li v-for="resource in pagedResources" :key="resource.id">
            <button
              type="button"
              class="resource-button"
              :class="{ selected: selectedResource?.id === resource.id, move: kind === 'moves' }"
              :style="getResourceStyle(resource)"
              @click="selectResource(resource)"
            >
              <span class="resource-sprite" aria-hidden="true">
                <img
                  :src="getResourceSprite(resource)"
                  alt=""
                  width="52"
                  height="52"
                  loading="lazy"
                  @error="$event.currentTarget.hidden = true"
                >
              </span>

              <span class="resource-copy">
                <span v-if="kind === 'moves'" class="resource-number">#{{ formatResourceId(resource.id) }}</span>
                <strong>{{ getResourceLabel(resource) }}</strong>
                <small v-if="kind === 'moves' && getResourceType(resource)">
                  {{ getLocalizedTypeName(getResourceType(resource), language) }} ·
                  {{ getDamageClassLabel(getResourceDamageClass(resource)) }} ·
                  {{ labels.accuracy }} {{ formatAccuracy(resource) }}
                </small>
                <template v-else>
                  <small v-if="getResourceCategory(resource)">{{ getResourceCategory(resource) }}</small>
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
          <button type="button" :disabled="page === 1" @click="page -= 1">{{ labels.previous }}</button>
          <span>{{ labels.page }} {{ page }} / {{ pageCount }}</span>
          <button type="button" :disabled="page === pageCount" @click="page += 1">{{ labels.next }}</button>
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
import { getLocalizedItemMetadataName } from '@/utils/itemDetails';
import {
  formatItemPrice,
  getRepresentativeItemPrice,
} from '@/utils/itemPrices';
import {
  formatResourceId,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';
import { getTypeColor } from '@/utils/typeColors';
import { getTypeIconDataUri } from '@/utils/typeIcons';
import BerryDetails from './BerryDetails.vue';
import ItemDetails from './ItemDetails.vue';
import MoveDetails from './MoveDetails.vue';

const props = defineProps({
  kind: {
    type: String,
    required: true,
    validator: (value) => ['moves', 'items', 'berries', 'balls', 'special-items'].includes(value),
  },
  searchQuery: { type: String, default: '' },
  requestedResource: { type: String, default: '' },
});

const { language } = useI18n();
const PAGE_SIZE = 50;
const MAX_PARALLEL_REQUESTS = 8;
const MAIN_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

const resources = ref([]);
const resourceDetailsByName = ref({});
const categoryDetailsByName = ref({});
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
      damageClass: 'Schadensart', type: 'Typ', sort: 'Sortierung', all: 'Alle',
      physical: 'Physisch', special: 'Spezial', status: 'Status', number: 'Nummer',
      name: 'Name A–Z', category: 'Kategorie', purchasePrice: 'Einkaufspreis',
      notPurchasable: 'Nicht verfügbar', priceAscending: 'Einkaufspreis aufsteigend',
      priceDescending: 'Einkaufspreis absteigend', accuracy: 'Genauigkeit',
      loading: 'Verzeichnis wird geladen…', loadError: 'Das Verzeichnis konnte nicht geladen werden.',
      tryAgain: 'Erneut versuchen', noMatches: 'Keine Einträge entsprechen der Suche und den Filtern.',
      choose: 'Bitte auswählen:', pages: 'Verzeichnisseiten', previous: 'Zurück', next: 'Weiter', page: 'Seite',
    }
  : {
      damageClass: 'Damage class', type: 'Type', sort: 'Sort', all: 'All', physical: 'Physical',
      special: 'Special', status: 'Status', number: 'Number', name: 'Name A–Z', category: 'Category',
      purchasePrice: 'Purchase price', notPurchasable: 'Unavailable',
      priceAscending: 'Purchase price ascending', priceDescending: 'Purchase price descending',
      accuracy: 'Accuracy', loading: 'Loading directory…', loadError: 'The directory could not be loaded.',
      tryAgain: 'Try again', noMatches: 'No entries match the search and filters.', choose: 'Select:',
      pages: 'Directory pages', previous: 'Previous', next: 'Next', page: 'Page',
    });

const configs = computed(() => ({
  moves: {
    title: language.value === 'de' ? 'Attacken' : 'Moves',
    singular: language.value === 'de' ? 'Attacke' : 'move',
    kicker: language.value === 'de' ? 'Kampftechniken' : 'Battle techniques',
    description: language.value === 'de'
      ? 'Attacken mit Typ, Schadensart, Genauigkeit und vollständiger Detailansicht.'
      : 'Moves with type, damage class, accuracy and a complete detail view.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt Kampfwerte, Ziel, Effekt und alle erlernenden Pokémon.'
      : 'The detail view shows battle values, target, effect and every Pokémon that can learn it.',
    symbol: '⚡', listMethod: () => PokeAPI.getMoves(), detailMethod: (name) => PokeAPI.getMoveDetails(name), detailComponent: MoveDetails,
  },
  items: {
    title: 'Items', singular: language.value === 'de' ? 'Item' : 'item',
    kicker: language.value === 'de' ? 'Beutel- und Trageitems' : 'Bag and held items',
    description: language.value === 'de'
      ? 'Reguläre Items ohne Beeren, Pokébälle, Maschinen und einzigartige Spezialitems. Kategorien sowie aktuelle Einkaufspreise sind übersetzt.'
      : 'Regular items without berries, Poké Balls, machines and unique special items. Categories and current prices are shown.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt Kauf- und Verkaufspreise nach Generation, Effekt, Spiele und wilde Träger.'
      : 'The detail view shows purchase and sale prices by generation, effect, games and wild holders.',
    symbol: '◆', listMethod: () => PokeAPI.getStandardItems(), detailMethod: (name) => PokeAPI.getItemDetails(name), detailComponent: ItemDetails,
  },
  berries: {
    title: language.value === 'de' ? 'Beeren' : 'Berries', singular: language.value === 'de' ? 'Beere' : 'berry',
    kicker: language.value === 'de' ? 'Wachstum und Aromen' : 'Growth and flavors',
    description: language.value === 'de'
      ? 'Beeren mit Wachstum, Aromen sowie Kauf- und Verkaufspreisen nach Spielgruppe.'
      : 'Berries with growth, flavors and purchase and sale prices by game group.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt Preise, Wachstumszeit, Ertrag, Härte und Beerenkräfte.'
      : 'The detail view shows prices, growth time, yield, firmness and Natural Gift values.',
    symbol: '●', listMethod: () => PokeAPI.getBerries(), detailMethod: (name) => PokeAPI.getItemDetails(`${name}-berry`), detailComponent: BerryDetails,
  },
  balls: {
    title: language.value === 'de' ? 'Pokébälle' : 'Poké Balls', singular: language.value === 'de' ? 'Pokéball' : 'Poké Ball',
    kicker: language.value === 'de' ? 'Fangitems' : 'Capture items',
    description: language.value === 'de'
      ? 'Alle Pokéball-Kategorien mit übersetzten Kategorien und generationenspezifischen Preisen.'
      : 'All Poké Ball categories with translated categories and generation-specific prices.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt Kauf- und Verkaufspreise, Effekt und Spielauftritte.'
      : 'The detail view shows purchase and sale prices, effect and game appearances.',
    symbol: '◉', listMethod: () => PokeAPI.getBallItems(), detailMethod: (name) => PokeAPI.getItemDetails(name), detailComponent: ItemDetails,
  },
  'special-items': {
    title: language.value === 'de' ? 'Einzigartige Items' : 'Unique items', singular: language.value === 'de' ? 'Spezialitem' : 'special item',
    kicker: language.value === 'de' ? 'Mega-, Z- und Storyitems' : 'Mega, Z and story items',
    description: language.value === 'de'
      ? 'Mega-Steine, Z-Kristalle, artspezifische, Story- und weitere einzigartige Items mit übersetzten Kategorien und Preisen.'
      : 'Mega Stones, Z-Crystals, species-specific, story and other unique items with translated categories and prices.',
    emptyDescription: language.value === 'de'
      ? 'Die Detailansicht zeigt Sprite, Beschreibung, Kauf- und Verkaufspreise sowie Spielauftritte.'
      : 'The detail view shows the sprite, description, purchase and sale prices and game appearances.',
    symbol: '✦', listMethod: () => PokeAPI.getSpecialItems(), detailMethod: (name) => PokeAPI.getItemDetails(name), detailComponent: ItemDetails,
  },
}));

const config = computed(() => configs.value[props.kind]);
const typeOptions = MAIN_TYPES;
const getResourceDetails = (resource) => resourceDetailsByName.value[resource.name] || null;
const getResourceLabel = (resource) => getLocalizedName(getResourceDetails(resource)?.names, resource.name, language.value);
const getResourceType = (resource) => getResourceDetails(resource)?.type?.name || '';
const getResourceDamageClass = (resource) => getResourceDetails(resource)?.damage_class?.name || '';
const getDamageClassLabel = (damageClass) => getLocalizedDamageClassName(damageClass, language.value);
const getResourceCategory = (resource) => {
  const details = getResourceDetails(resource);
  const categoryName = details?.category?.name;
  if (!categoryName) return '';
  return getLocalizedItemMetadataName({
    details: categoryDetailsByName.value[categoryName],
    fallback: categoryName,
    language: language.value,
    kind: 'category',
  });
};
const getRepresentativePrice = (resource) => getRepresentativeItemPrice(getResourceDetails(resource) || {});
const getResourceCost = (resource) => getRepresentativePrice(resource)?.purchasePrice ?? null;
const formatResourceCost = (resource) => {
  const price = getRepresentativePrice(resource);
  return price
    ? formatItemPrice(price.purchasePrice, price.currency, language.value)
    : labels.value.notPurchasable;
};
const formatAccuracy = (resource) => {
  const accuracy = getResourceDetails(resource)?.accuracy;
  return accuracy === null || accuracy === undefined ? '—' : `${accuracy}%`;
};
const getResourceSprite = (resource) => {
  const details = getResourceDetails(resource);
  if (props.kind === 'moves') return getTypeIconDataUri(details?.type?.name || 'normal');
  return details?.sprites?.default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${props.kind === 'berries' ? `${resource.name}-berry` : resource.name}.png`;
};
const getResourceStyle = (resource) => props.kind === 'moves'
  ? { '--move-color': getTypeColor(getResourceType(resource)), '--move-text': getTypeTextColor(getResourceType(resource)) }
  : {};

const filteredResources = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase(language.value);
  let entries = resources.value.filter((resource) => {
    const matchesQuery = !query
      || resource.name.includes(query)
      || getResourceLabel(resource).toLocaleLowerCase(language.value).includes(query)
      || String(resource.id).includes(query);
    const matchesDamageClass = !selectedDamageClass.value || allowedDamageClassNames.value?.has(resource.name);
    const matchesType = !selectedType.value || allowedTypeNames.value?.has(resource.name);
    return matchesQuery && matchesDamageClass && matchesType;
  });

  entries = [...entries].sort((first, second) => {
    if (sortMode.value === 'name') return getResourceLabel(first).localeCompare(getResourceLabel(second), language.value);
    if (sortMode.value === 'type') return getLocalizedTypeName(getResourceType(first), language.value).localeCompare(getLocalizedTypeName(getResourceType(second), language.value), language.value) || first.id - second.id;
    if (sortMode.value === 'damage-class') return getResourceDamageClass(first).localeCompare(getResourceDamageClass(second)) || first.id - second.id;
    if (sortMode.value === 'category') return getResourceCategory(first).localeCompare(getResourceCategory(second), language.value) || first.id - second.id;
    if (sortMode.value === 'price-asc') {
      const firstCost = getResourceCost(first) ?? Number.MAX_SAFE_INTEGER;
      const secondCost = getResourceCost(second) ?? Number.MAX_SAFE_INTEGER;
      return firstCost - secondCost || first.id - second.id;
    }
    if (sortMode.value === 'price-desc') return (getResourceCost(second) ?? -1) - (getResourceCost(first) ?? -1) || first.id - second.id;
    return first.id - second.id;
  });
  return entries;
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredResources.value.length / PAGE_SIZE)));
const pagedResources = computed(() => filteredResources.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));

const enrichResources = async () => {
  const enrichmentId = ++activeEnrichmentId;
  const missing = pagedResources.value.filter((resource) => !getResourceDetails(resource));
  if (!missing.length) { enrichingResources.value = false; return; }
  enrichingResources.value = true;
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < missing.length) {
      const resource = missing[nextIndex];
      nextIndex += 1;
      try {
        const response = await config.value.detailMethod(resource.name);
        if (enrichmentId !== activeEnrichmentId) return;
        resourceDetailsByName.value = { ...resourceDetailsByName.value, [resource.name]: response.data };
        const categoryName = response.data.category?.name;
        if (categoryName && !categoryDetailsByName.value[categoryName]) {
          const categoryResponse = await PokeAPI.getItemCategory(categoryName).catch(() => null);
          if (categoryResponse && enrichmentId === activeEnrichmentId) {
            categoryDetailsByName.value = { ...categoryDetailsByName.value, [categoryName]: categoryResponse.data };
          }
        }
      } catch (error) {
        console.error(`Failed to enrich ${props.kind} ${resource.name}:`, error);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_REQUESTS, missing.length) }, worker));
  if (enrichmentId === activeEnrichmentId) enrichingResources.value = false;
};

const loadMoveFilter = async () => {
  const filterId = ++activeFilterId;
  allowedDamageClassNames.value = null;
  allowedTypeNames.value = null;
  if (props.kind !== 'moves') return;
  loadingFilter.value = true;
  try {
    const [damageResult, typeResult] = await Promise.all([
      selectedDamageClass.value ? PokeAPI.getMoveDamageClass(selectedDamageClass.value) : Promise.resolve(null),
      selectedType.value ? PokeAPI.getTypeDetails(selectedType.value) : Promise.resolve(null),
    ]);
    if (filterId !== activeFilterId) return;
    allowedDamageClassNames.value = damageResult ? new Set((damageResult.data.moves || []).map((move) => move.name)) : null;
    allowedTypeNames.value = typeResult ? new Set((typeResult.data.moves || []).map((move) => move.name)) : null;
  } catch (error) {
    console.error('Failed to load move directory filters:', error);
  } finally {
    if (filterId === activeFilterId) loadingFilter.value = false;
  }
};

const scrollToDetails = async () => {
  await nextTick();
  if (window.matchMedia('(max-width: 760px)').matches) {
    detailPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    detailPanel.value?.focus({ preventScroll: true });
  }
};
const selectResource = async (resource) => { selectedResource.value = resource; await scrollToDetails(); };
const openRequestedResource = async () => {
  const requested = props.requestedResource.trim().toLowerCase();
  if (!requested || !resources.value.length) return;
  const index = resources.value.findIndex((resource) => resource.name === requested || String(resource.id) === requested);
  if (index < 0) return;
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
  categoryDetailsByName.value = {};
  page.value = 1;
  try {
    const response = await config.value.listMethod();
    resources.value = response.data.results
      .map((resource) => ({ ...resource, id: getResourceId(resource.url) }))
      .filter((resource) => resource.id !== null)
      .sort((first, second) => first.id - second.id);
    await openRequestedResource();
    void enrichResources();
  } catch (error) {
    console.error(`Failed to load ${props.kind} directory:`, error);
    hasError.value = true;
  } finally {
    loading.value = false;
  }
};

watch([selectedDamageClass, selectedType], () => { page.value = 1; void loadMoveFilter(); });
watch([sortMode, () => props.searchQuery], () => { page.value = 1; });
watch(() => props.requestedResource, () => { void openRequestedResource(); });
watch(() => `${props.kind}:${page.value}:${pagedResources.value.map((resource) => resource.name).join('|')}`, () => { void enrichResources(); });
watch(pageCount, (count) => { if (page.value > count) page.value = count; });
onMounted(loadResources);
</script>

<style scoped>
.directory-layout { display: grid; grid-template-columns: minmax(330px, 430px) minmax(0, 1fr); gap: 18px; align-items: start; }
.directory-panel { position: sticky; top: 86px; max-height: calc(100vh - 104px); overflow: hidden; border: 1px solid var(--legacy-border); border-radius: 4px; background: var(--legacy-surface); box-shadow: 0 2px 5px var(--legacy-shadow); }
.directory-heading { display: flex; gap: 14px; justify-content: space-between; align-items: end; padding: 16px 14px 10px; background: var(--legacy-page); }
.directory-heading p { margin: 0 0 4px; color: var(--legacy-muted); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
.directory-heading h1 { margin: 0; font-size: 1.35rem; }
.directory-heading > span { color: var(--legacy-muted); font-size: 0.72rem; }
.directory-description { margin: 0; padding: 0 14px 12px; border-bottom: 1px solid var(--legacy-border); color: var(--legacy-muted); font-size: 0.76rem; line-height: 1.5; background: var(--legacy-page); }
.directory-filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 9px; border-bottom: 1px solid var(--legacy-border); }
.directory-filters.compact { grid-template-columns: 1fr; }
.directory-filters label { display: grid; gap: 3px; color: var(--legacy-muted); font-size: 0.62rem; font-weight: 850; }
.directory-filters label:last-child { grid-column: 1 / -1; }
.directory-filters select { width: 100%; min-width: 0; min-height: 33px; padding: 5px 7px; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-page); }
.status-message, .error-message { margin: 0; padding: 20px 14px; color: var(--legacy-muted); }
.error-message { color: #ef4444; }
.error-message button { margin-top: 7px; padding: 7px 10px; border: 1px solid #ef4444; color: #ef4444; background: var(--legacy-page); }
.resource-list { max-height: calc(100vh - 330px); padding: 6px; margin: 0; overflow-y: auto; list-style: none; }
.resource-button { display: grid; grid-template-columns: 58px minmax(0, 1fr) auto; gap: 9px; align-items: center; width: 100%; min-height: 76px; padding: 6px; border: 1px solid transparent; color: var(--legacy-text); text-align: left; background: transparent; }
.resource-button:hover, .resource-button.selected { border-color: var(--legacy-border-strong); background: var(--legacy-surface-active); }
.resource-button.selected { box-shadow: inset 4px 0 0 #888; }
.resource-sprite { display: grid; width: 56px; height: 56px; place-items: center; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.resource-sprite img { width: 52px; height: 52px; object-fit: contain; image-rendering: pixelated; }
.resource-copy { display: grid; min-width: 0; gap: 2px; }
.resource-copy strong { overflow: hidden; font-size: 0.86rem; text-overflow: ellipsis; white-space: nowrap; }
.resource-copy small, .resource-number { overflow: hidden; color: var(--legacy-muted); font-size: 0.64rem; text-overflow: ellipsis; white-space: nowrap; }
.purchase-price { color: var(--legacy-text) !important; font-weight: 750; }
.resource-arrow { color: var(--legacy-muted); font-size: 1.2rem; }
.resource-button.move { background: color-mix(in srgb, var(--move-color) 72%, var(--legacy-surface)); color: var(--move-text); }
.resource-button.move .resource-copy small, .resource-button.move .resource-number, .resource-button.move .resource-arrow { color: currentColor; opacity: 0.78; }
.pagination { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; padding: 8px; border-top: 1px solid var(--legacy-border); background: var(--legacy-page); }
.pagination button { min-height: 34px; padding: 5px 9px; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-surface); }
.pagination span { color: var(--legacy-muted); text-align: center; font-size: 0.7rem; }
.detail-panel { min-width: 0; outline: none; }
.empty-detail { display: flex; gap: 18px; align-items: center; min-height: 320px; padding: 30px; border: 1px dashed var(--legacy-border-strong); color: var(--legacy-muted); background: var(--legacy-surface); }
.empty-symbol { display: grid; width: 70px; height: 70px; place-items: center; border: 1px solid var(--legacy-border); color: var(--legacy-text); font-size: 1.7rem; background: var(--legacy-page); }
.empty-detail h2 { margin: 0; color: var(--legacy-text); }
.empty-detail p { margin: 7px 0 0; }
@media (max-width: 1000px) { .directory-layout { grid-template-columns: minmax(300px, 380px) minmax(0, 1fr); } }
@media (max-width: 760px) { .directory-layout { grid-template-columns: 1fr; gap: 12px; } .directory-panel { position: static; max-height: none; } .resource-list { max-height: 65vh; } .detail-panel { scroll-margin-top: 105px; } }
</style>
