<template>
  <section
    class="resource-section"
    :class="{ 'has-selection': selectedResource }"
    :aria-labelledby="`${kind}-title`"
  >
    <aside class="resource-directory">
      <div class="directory-heading">
        <div>
          <p class="eyebrow">{{ config.kicker }}</p>
          <h1 :id="`${kind}-title`">{{ config.title }}</h1>
        </div>
        <span v-if="!loading && !hasError" class="result-count">
          {{ t('common.entries', { count: filteredResources.length }) }}
        </span>
      </div>

      <p class="directory-description">{{ config.description }}</p>

      <p v-if="loading" class="status-message" role="status">
        {{ t('resource.loading', { title: config.title }) }}
      </p>

      <div v-else-if="hasError" class="error-message" role="alert">
        <p>{{ t('resource.loadError', { title: config.title }) }}</p>
        <button type="button" @click="loadResources">{{ t('common.tryAgain') }}</button>
      </div>

      <p v-else-if="!filteredResources.length" class="status-message">
        {{ t('resource.noMatches', { singular: config.singular }) }}
      </p>

      <template v-else>
        <ul class="resource-list" :aria-busy="enrichingResources">
          <li v-for="resource in pagedResources" :key="resource.id">
            <button
              type="button"
              class="resource-button"
              :class="{
                'is-selected': selectedResource?.id === resource.id,
                'is-move': kind === 'moves' && getResourceType(resource),
              }"
              :style="getResourceStyle(resource)"
              :aria-current="selectedResource?.id === resource.id ? 'true' : undefined"
              :aria-controls="`${kind}-details`"
              @click="selectResource(resource)"
            >
              <span class="resource-number">#{{ formatResourceId(resource.id) }}</span>
              <span class="resource-copy">
                <strong class="resource-name">{{ getResourceLabel(resource) }}</strong>
                <small v-if="kind === 'moves' && getResourceType(resource)">
                  {{ getLocalizedTypeName(getResourceType(resource), language) }}
                </small>
              </span>
              <span class="resource-arrow" aria-hidden="true">›</span>
            </button>
          </li>
        </ul>

        <nav v-if="pageCount > 1" class="pagination" :aria-label="t('resource.pagesAria')">
          <button type="button" :disabled="page === 1" @click="page -= 1">
            {{ t('common.previous') }}
          </button>
          <span>{{ t('common.page', { page, pages: pageCount }) }}</span>
          <button type="button" :disabled="page === pageCount" @click="page += 1">
            {{ t('common.next') }}
          </button>
        </nav>
      </template>
    </aside>

    <div
      :id="`${kind}-details`"
      ref="detailPanel"
      class="resource-detail"
      aria-live="polite"
      tabindex="-1"
    >
      <component
        :is="config.detailComponent"
        v-if="selectedResource"
        :key="`${kind}-${selectedResource.id}`"
        :resource="selectedResource"
      />
      <div v-else class="empty-detail">
        <span class="empty-symbol" :data-kind="kind" aria-hidden="true">{{ config.symbol }}</span>
        <div>
          <h2>{{ t('resource.choose', { singular: config.singular }) }}</h2>
          <p>{{ config.emptyDescription }}</p>
          <small>{{ t('resource.cacheNote') }}</small>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import { getLocalizedTypeName, getTypeTextColor } from '@/utils/localization';
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
    validator: (value) => ['moves', 'items', 'berries'].includes(value),
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

const { language, t } = useI18n();

const sectionConfigs = computed(() => ({
  moves: {
    title: t('resource.moves.title'),
    singular: t('resource.moves.singular'),
    kicker: t('resource.moves.kicker'),
    symbol: '⚡',
    description: t('resource.moves.description'),
    emptyDescription: t('resource.moves.empty'),
    listMethod: () => PokeAPI.getMoves(),
    detailComponent: MoveDetails,
  },
  items: {
    title: t('resource.items.title'),
    singular: t('resource.items.singular'),
    kicker: t('resource.items.kicker'),
    symbol: '◆',
    description: t('resource.items.description'),
    emptyDescription: t('resource.items.empty'),
    listMethod: () => PokeAPI.getItems(),
    detailComponent: ItemDetails,
  },
  berries: {
    title: t('resource.berries.title'),
    singular: t('resource.berries.singular'),
    kicker: t('resource.berries.kicker'),
    symbol: '●',
    description: t('resource.berries.description'),
    emptyDescription: t('resource.berries.empty'),
    listMethod: () => PokeAPI.getBerries(),
    detailComponent: BerryDetails,
  },
}));

const PAGE_SIZE = 60;
const MAX_PARALLEL_DETAIL_REQUESTS = 8;
const MACHINE_ITEM_PATTERN = /^(?:tm|hm|tr)\d+$/;
const resources = ref([]);
const resourceDetailsByName = ref({});
const selectedResource = ref(null);
const detailPanel = ref(null);
const loading = ref(false);
const enrichingResources = ref(false);
const hasError = ref(false);
const page = ref(1);
let activeEnrichmentId = 0;

const config = computed(() => sectionConfigs.value[props.kind]);

const getResourceDetails = (resource) => resourceDetailsByName.value[resource.name] || null;
const getResourceLabel = (resource) => {
  const details = getResourceDetails(resource);
  return getLocalizedName(details?.names, resource.name, language.value);
};
const getResourceType = (resource) => getResourceDetails(resource)?.type?.name || '';
const getResourceStyle = (resource) => {
  const type = getResourceType(resource);

  if (props.kind !== 'moves' || !type) {
    return {};
  }

  return {
    '--move-color': getTypeColor(type),
    '--move-text': getTypeTextColor(type),
  };
};

const filteredResources = computed(() => {
  const query = props.searchQuery.trim().toLocaleLowerCase(language.value);

  if (!query) {
    return resources.value;
  }

  return resources.value.filter((resource) => {
    const localizedLabel = getResourceLabel(resource).toLocaleLowerCase(language.value);
    return resource.name.includes(query)
      || localizedLabel.includes(query)
      || String(resource.id).includes(query);
  });
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredResources.value.length / PAGE_SIZE)));
const pagedResources = computed(() => {
  const startIndex = (page.value - 1) * PAGE_SIZE;
  return filteredResources.value.slice(startIndex, startIndex + PAGE_SIZE);
});

const isVisibleItem = (resource) => {
  if (props.kind !== 'items') {
    return true;
  }

  return !resource.name.endsWith('-berry') && !MACHINE_ITEM_PATTERN.test(resource.name);
};

const getDetailRequest = (resource) => {
  if (props.kind === 'moves') {
    return PokeAPI.getMoveDetails(resource.name);
  }

  if (props.kind === 'items') {
    return PokeAPI.getItemDetails(resource.name);
  }

  return PokeAPI.getItemDetails(`${resource.name}-berry`);
};

const enrichPagedResources = async () => {
  const enrichmentId = ++activeEnrichmentId;
  const entries = pagedResources.value.filter((resource) => !getResourceDetails(resource));

  if (!entries.length) {
    enrichingResources.value = false;
    return;
  }

  enrichingResources.value = true;
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < entries.length) {
      const index = nextIndex;
      nextIndex += 1;
      const resource = entries[index];

      try {
        const response = await getDetailRequest(resource);

        if (enrichmentId !== activeEnrichmentId) {
          return;
        }

        resourceDetailsByName.value = {
          ...resourceDetailsByName.value,
          [resource.name]: response.data,
        };
      } catch (requestError) {
        console.error(`Failed to localize ${props.kind} resource ${resource.name}:`, requestError);
      }
    }
  };

  const workerCount = Math.min(MAX_PARALLEL_DETAIL_REQUESTS, entries.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  if (enrichmentId === activeEnrichmentId) {
    enrichingResources.value = false;
  }
};

const scrollToDetails = async () => {
  await nextTick();

  if (window.matchMedia('(max-width: 760px)').matches) {
    detailPanel.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    detailPanel.value?.focus({ preventScroll: true });
  }
};

const selectResource = async (resource, { scroll = true } = {}) => {
  selectedResource.value = resource;

  if (scroll) {
    await scrollToDetails();
  }
};

const openRequestedResource = async () => {
  const requested = props.requestedResource.trim().toLowerCase();

  if (!requested || !resources.value.length) {
    return;
  }

  const resourceIndex = resources.value.findIndex((resource) => {
    return resource.name === requested || String(resource.id) === requested;
  });

  if (resourceIndex < 0) {
    return;
  }

  const resource = resources.value[resourceIndex];
  page.value = Math.floor(resourceIndex / PAGE_SIZE) + 1;
  await nextTick();
  void enrichPagedResources();
  await selectResource(resource);
};

const loadResources = async () => {
  loading.value = true;
  hasError.value = false;
  selectedResource.value = null;
  resourceDetailsByName.value = {};

  try {
    const response = await config.value.listMethod();
    resources.value = response.data.results
      .map((resource) => ({
        ...resource,
        id: getResourceId(resource.url),
      }))
      .filter((resource) => resource.id !== null && isVisibleItem(resource))
      .sort((firstResource, secondResource) => firstResource.id - secondResource.id);

    await openRequestedResource();
    void enrichPagedResources();
  } catch (requestError) {
    console.error(`Failed to load ${props.kind}:`, requestError);
    hasError.value = true;
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.searchQuery,
  () => {
    page.value = 1;
  },
);

watch(
  () => props.requestedResource,
  openRequestedResource,
);

watch(
  () => `${props.kind}:${page.value}:${pagedResources.value.map((resource) => resource.name).join('|')}`,
  () => {
    void enrichPagedResources();
  },
);

watch(pageCount, (newPageCount) => {
  if (page.value > newPageCount) {
    page.value = newPageCount;
  }
});

onMounted(loadResources);
</script>

<style scoped>
.resource-section {
  display: grid;
  grid-template-columns: minmax(300px, 390px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.resource-directory {
  position: sticky;
  top: 96px;
  overflow: hidden;
  border: 1px solid #d5d9e1;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 32px rgba(23, 32, 51, 0.07);
}

.directory-heading {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: flex-end;
  padding: 20px 20px 12px;
}

.eyebrow {
  margin: 0 0 5px;
  color: #b91c1c;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.directory-heading h1 {
  margin: 0;
  color: #172033;
  font-size: 1.55rem;
}

.result-count {
  flex: 0 0 auto;
  color: #7a8494;
  font-size: 0.78rem;
  font-weight: 750;
}

.directory-description {
  margin: 0;
  padding: 0 20px 16px;
  border-bottom: 1px solid #e3e6eb;
  color: #687386;
  font-size: 0.84rem;
  line-height: 1.55;
}

.status-message,
.error-message {
  margin: 0;
  padding: 24px 20px;
  color: #596579;
}

.error-message {
  color: #991b1b;
}

.error-message button {
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid #b91c1c;
  border-radius: 8px;
  color: #991b1b;
  cursor: pointer;
  background: #fff7f7;
}

.resource-list {
  max-height: calc(100vh - 300px);
  padding: 8px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.resource-button {
  display: grid;
  grid-template-columns: 66px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  background: transparent;
}

.resource-button.is-move {
  color: var(--move-text) !important;
  background: var(--move-color) !important;
}

.resource-button.is-move .resource-number,
.resource-button.is-move .resource-arrow {
  color: inherit !important;
  opacity: 0.8;
}

.resource-button:hover {
  background: #f3f6fa;
}

.resource-button.is-move:hover {
  filter: brightness(0.96);
}

.resource-button:focus-visible {
  outline: 3px solid rgba(51, 51, 51, 0.34);
  outline-offset: -2px;
}

.resource-button.is-selected:not(.is-move) {
  border-color: rgba(220, 38, 38, 0.24);
  color: #991b1b;
  background: #fff1f1;
}

.resource-button.is-selected.is-move {
  border-color: #333333 !important;
  box-shadow: inset 4px 0 0 #333333 !important;
}

.resource-number {
  color: #7a8494;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

.resource-copy {
  display: grid;
  min-width: 0;
}

.resource-name {
  overflow: hidden;
  font-weight: 780;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-copy small {
  margin-top: 2px;
  font-size: 0.68rem;
  font-weight: 750;
  opacity: 0.82;
}

.resource-arrow {
  color: #98a2b3;
  font-size: 1.3rem;
}

.pagination {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border-top: 1px solid #e3e6eb;
  background: #fbfcfe;
}

.pagination button {
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid #c8ced8;
  border-radius: 8px;
  color: #344054;
  font-weight: 750;
  cursor: pointer;
  background: #ffffff;
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination span {
  color: #687386;
  font-size: 0.78rem;
  text-align: center;
}

.resource-detail {
  min-width: 0;
  scroll-margin-top: 120px;
  outline: none;
}

.empty-detail {
  display: flex;
  gap: 22px;
  align-items: center;
  min-height: 360px;
  padding: clamp(26px, 5vw, 48px);
  border: 1px dashed #aeb6c3;
  border-radius: 22px;
  color: #596579;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 14px 38px rgba(23, 32, 51, 0.06);
}

.empty-symbol {
  display: grid;
  flex: 0 0 auto;
  width: 84px;
  height: 84px;
  place-items: center;
  border-radius: 24px;
  color: #172033;
  font-size: 2rem;
  font-weight: 900;
  background: lightyellow;
}

.empty-symbol[data-kind='items'] {
  background: lightblue;
}

.empty-symbol[data-kind='berries'] {
  background: lightpink;
}

.empty-detail h2 {
  margin: 0;
  color: #172033;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
}

.empty-detail p {
  max-width: 600px;
  margin: 8px 0 0;
  line-height: 1.6;
}

.empty-detail small {
  display: block;
  margin-top: 12px;
  color: #7a8494;
  line-height: 1.5;
}

@media (max-width: 1100px) {
  .resource-section {
    grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .resource-section {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .resource-directory {
    position: static;
  }

  .directory-heading {
    padding: 14px 14px 8px;
  }

  .directory-heading h1 {
    font-size: 1.25rem;
  }

  .directory-description {
    padding: 0 14px 10px;
    font-size: 0.78rem;
  }

  .resource-list {
    max-height: 300px;
    padding: 5px;
  }

  .resource-button {
    grid-template-columns: 56px minmax(0, 1fr) auto;
    min-height: 44px;
    padding: 5px 8px;
  }

  .pagination {
    padding: 8px;
  }

  .resource-detail {
    scroll-margin-top: 112px;
  }

  .empty-detail {
    min-height: 0;
    padding: 18px;
  }
}

@media (max-width: 460px) {
  .empty-detail {
    align-items: flex-start;
    flex-direction: column;
  }

  .empty-symbol {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    font-size: 1.35rem;
  }
}
</style>
