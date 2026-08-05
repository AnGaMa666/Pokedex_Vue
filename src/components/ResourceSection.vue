<template>
  <section class="resource-section" :aria-labelledby="`${kind}-title`">
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
        <ul class="resource-list">
          <li v-for="resource in pagedResources" :key="resource.id">
            <button
              type="button"
              class="resource-button"
              :class="{ 'is-selected': selectedResource?.id === resource.id }"
              :aria-current="selectedResource?.id === resource.id ? 'true' : undefined"
              :aria-controls="`${kind}-details`"
              @click="selectResource(resource)"
            >
              <span class="resource-number">#{{ formatResourceId(resource.id) }}</span>
              <span class="resource-name">{{ formatResourceName(resource.name) }}</span>
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
import { formatResourceId, formatResourceName, getResourceId } from '@/utils/resource';
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
});

const { t } = useI18n();

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
const MACHINE_ITEM_PATTERN = /^(?:tm|hm|tr)\d+$/;
const resources = ref([]);
const selectedResource = ref(null);
const detailPanel = ref(null);
const loading = ref(false);
const hasError = ref(false);
const page = ref(1);

const config = computed(() => sectionConfigs.value[props.kind]);
const filteredResources = computed(() => {
  const query = props.searchQuery.trim().toLowerCase();

  if (!query) {
    return resources.value;
  }

  return resources.value.filter((resource) => {
    return resource.name.includes(query) || String(resource.id).includes(query);
  });
});
const pageCount = computed(() => {
  return Math.max(1, Math.ceil(filteredResources.value.length / PAGE_SIZE));
});
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

const loadResources = async () => {
  loading.value = true;
  hasError.value = false;
  selectedResource.value = null;

  try {
    const response = await config.value.listMethod();
    resources.value = response.data.results
      .map((resource) => ({
        ...resource,
        id: getResourceId(resource.url),
      }))
      .filter((resource) => resource.id !== null && isVisibleItem(resource))
      .sort((firstResource, secondResource) => firstResource.id - secondResource.id);
  } catch (requestError) {
    console.error(`Failed to load ${props.kind}:`, requestError);
    hasError.value = true;
  } finally {
    loading.value = false;
  }
};

const selectResource = async (resource) => {
  selectedResource.value = resource;
  await nextTick();

  if (window.matchMedia('(max-width: 760px)').matches) {
    detailPanel.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    detailPanel.value?.focus({ preventScroll: true });
  }
};

watch(
  () => props.searchQuery,
  () => {
    page.value = 1;
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
  transition:
    border-color 150ms ease,
    color 150ms ease,
    background 150ms ease;
}

.resource-button:hover {
  background: #f3f6fa;
}

.resource-button:focus-visible {
  outline: 3px solid rgba(220, 38, 38, 0.22);
  outline-offset: -2px;
}

.resource-button.is-selected {
  border-color: rgba(220, 38, 38, 0.24);
  color: #991b1b;
  background: #fff1f1;
}

.resource-number {
  color: #7a8494;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

.resource-name {
  overflow: hidden;
  font-weight: 780;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  scroll-margin-top: 176px;
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
  backdrop-filter: blur(10px);
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
  box-shadow: 0 16px 30px rgba(23, 32, 51, 0.14);
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
  }

  .resource-directory {
    position: static;
  }

  .resource-list {
    max-height: 430px;
  }
}

@media (max-width: 460px) {
  .empty-detail {
    align-items: flex-start;
    flex-direction: column;
  }

  .empty-symbol {
    width: 62px;
    height: 62px;
    border-radius: 18px;
    font-size: 1.45rem;
  }
}
</style>
