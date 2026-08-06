<template>
  <Teleport to="body">
    <div v-if="open" class="picker-backdrop" role="presentation" @mousedown.self="closePicker">
      <section
        ref="dialog"
        class="picker-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @keydown.esc.prevent="closePicker"
      >
        <header class="picker-header">
          <div>
            <p>{{ eyebrow }}</p>
            <h2 :id="titleId">{{ title }}</h2>
            <span>{{ resultText }}</span>
          </div>
          <button type="button" class="picker-close" :aria-label="closeLabel" @click="closePicker">×</button>
        </header>

        <div class="picker-tools">
          <label class="picker-search">
            <span class="visually-hidden">{{ searchLabel }}</span>
            <span aria-hidden="true">⌕</span>
            <input
              ref="searchInput"
              v-model="query"
              type="search"
              :placeholder="placeholder"
              autocomplete="off"
            >
          </label>

          <label v-if="categories.length" class="picker-category">
            <span>{{ categoryLabel }}</span>
            <select :value="selectedCategory" @change="updateCategory($event.target.value)">
              <option v-if="allowAllCategories" value="">{{ allCategoriesLabel }}</option>
              <option v-for="category in categories" :key="category.value" :value="category.value">
                {{ category.label }} ({{ category.count }})
              </option>
            </select>
          </label>

          <div v-if="filters.length" class="picker-filters">
            <label v-for="filter in filters" :key="filter.key">
              <span>{{ filter.label }}</span>
              <select v-model="filterValues[filter.key]">
                <option value="">{{ filter.allLabel }}</option>
                <option v-for="option in filter.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <div v-if="loading" class="picker-status" role="status">{{ loadingLabel }}</div>
        <div v-else-if="filteredOptions.length === 0" class="picker-status">{{ emptyLabel }}</div>

        <ul v-else class="picker-list">
          <li v-for="option in visibleOptions" :key="option.value">
            <button
              type="button"
              class="picker-option"
              :class="{ selected: option.value === selectedValue }"
              @click="selectOption(option)"
            >
              <span v-if="option.image" class="picker-image" aria-hidden="true">
                <img
                  :src="option.image"
                  alt=""
                  width="64"
                  height="64"
                  loading="lazy"
                  decoding="async"
                  @error="$event.currentTarget.hidden = true"
                >
              </span>
              <span v-else class="picker-symbol" aria-hidden="true">{{ option.symbol || '◆' }}</span>

              <span class="picker-copy">
                <span v-if="option.number" class="picker-number">#{{ option.number }}</span>
                <strong :title="option.label">{{ option.label }}</strong>
                <small v-if="option.description" :title="option.description">{{ option.description }}</small>
                <span v-if="option.chips?.length" class="picker-chips">
                  <span v-for="chip in option.chips" :key="chip">{{ chip }}</span>
                </span>
              </span>

              <span class="picker-check" aria-hidden="true">{{ option.value === selectedValue ? '✓' : '›' }}</span>
            </button>
          </li>
        </ul>

        <footer v-if="filteredOptions.length > visibleLimit" class="picker-footer">
          <span>{{ visibleOptions.length }} / {{ filteredOptions.length }}</span>
          <button type="button" @click="visibleLimit += PAGE_SIZE">{{ moreLabel }}</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
  watch,
} from 'vue';
import { filterTeamBuilderOptions } from '@/utils/teamBuilder';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  selectedValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  searchLabel: { type: String, default: 'Search' },
  closeLabel: { type: String, default: 'Close' },
  emptyLabel: { type: String, default: 'No results' },
  loadingLabel: { type: String, default: 'Loading…' },
  moreLabel: { type: String, default: 'Show more' },
  resultLabel: { type: String, default: '{count} results' },
  loading: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  selectedCategory: { type: String, default: '' },
  categoryLabel: { type: String, default: 'Category' },
  allCategoriesLabel: { type: String, default: 'All categories' },
  allowAllCategories: { type: Boolean, default: true },
  filters: { type: Array, default: () => [] },
});

const emit = defineEmits([
  'close',
  'select',
  'update:selectedCategory',
  'visible-options',
  'filters-changed',
]);
const PAGE_SIZE = 80;
const query = ref('');
const visibleLimit = ref(PAGE_SIZE);
const filterValues = reactive({});
const searchInput = ref(null);
const dialog = ref(null);
const titleId = `team-picker-${Math.random().toString(36).slice(2)}`;

const filteredOptions = computed(() => filterTeamBuilderOptions(props.options, {
  query: query.value,
  categoriesEnabled: props.categories.length > 0,
  selectedCategory: props.selectedCategory,
  filters: props.filters,
  filterValues,
}));

const visibleOptions = computed(() => filteredOptions.value.slice(0, visibleLimit.value));
const resultText = computed(() => props.resultLabel.replace('{count}', filteredOptions.value.length));
const closePicker = () => emit('close');
const selectOption = (option) => emit('select', option);
const updateCategory = (value) => emit('update:selectedCategory', value);
const lockBody = () => {
  if (typeof document !== 'undefined') document.documentElement.classList.add('team-picker-open');
};
const unlockBody = () => {
  if (typeof document !== 'undefined') document.documentElement.classList.remove('team-picker-open');
};

const resetFilters = () => {
  for (const key of Object.keys(filterValues)) delete filterValues[key];
  for (const filter of props.filters) filterValues[filter.key] = filter.defaultValue || '';
};

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) { unlockBody(); return; }
    query.value = '';
    visibleLimit.value = PAGE_SIZE;
    resetFilters();
    lockBody();
    await nextTick();
    searchInput.value?.focus();
  },
  { immediate: true },
);
watch([query, () => props.selectedCategory], () => { visibleLimit.value = PAGE_SIZE; });
watch(filterValues, () => {
  visibleLimit.value = PAGE_SIZE;
  emit('filters-changed', { ...filterValues });
}, { deep: true });
watch(
  () => [props.open, visibleOptions.value.map((option) => option.value).join('\u0000')],
  ([isOpen]) => {
    if (isOpen) emit('visible-options', visibleOptions.value);
  },
  { flush: 'post' },
);
onBeforeUnmount(unlockBody);
</script>

<style>
html.team-picker-open { overflow: hidden; }
</style>

<style scoped>
.picker-backdrop { position: fixed; z-index: 10000; inset: 0; display: grid; place-items: center; padding: 22px; background: rgba(0, 0, 0, 0.72); backdrop-filter: blur(4px); }
.picker-dialog { display: grid; grid-template-rows: auto auto minmax(0, 1fr) auto; width: min(1040px, 100%); max-height: min(860px, calc(100vh - 44px)); overflow: hidden; border: 1px solid var(--legacy-border-strong); border-radius: 8px; color: var(--legacy-text); background: var(--legacy-surface); box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45); }
.picker-header { display: flex; gap: 18px; justify-content: space-between; align-items: flex-start; padding: 18px 20px; border-bottom: 1px solid var(--legacy-border); background: var(--legacy-page); }
.picker-header p { margin: 0 0 4px; color: var(--legacy-muted); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
.picker-header h2 { margin: 0; font-size: clamp(1.35rem, 3vw, 2rem); }
.picker-header span { display: block; margin-top: 4px; color: var(--legacy-muted); font-size: 0.75rem; }
.picker-close { display: grid; flex: 0 0 auto; width: 42px; height: 42px; place-items: center; border: 1px solid var(--legacy-border); border-radius: 4px; color: var(--legacy-text); cursor: pointer; font-size: 1.6rem; background: var(--legacy-surface); }
.picker-tools { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, 300px); gap: 10px; padding: 12px; }
.picker-search { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: center; padding: 0 12px; border: 1px solid var(--legacy-border-strong); border-radius: 4px; background: var(--legacy-page); }
.picker-search > span:not(.visually-hidden) { color: var(--legacy-muted); font-size: 1.4rem; }
.picker-search input { width: 100%; min-height: 46px; border: 0; outline: 0; color: var(--legacy-text); background: transparent; font: inherit; }
.picker-category { display: grid; gap: 3px; color: var(--legacy-muted); font-size: 0.64rem; font-weight: 850; }
.picker-category select { min-height: 46px; padding: 7px 9px; border: 1px solid var(--legacy-border-strong); color: var(--legacy-text); background: var(--legacy-page); }
.picker-filters { display: grid; grid-column: 1 / -1; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; }
.picker-filters label { display: grid; gap: 3px; min-width: 0; color: var(--legacy-muted); font-size: 0.64rem; font-weight: 850; }
.picker-filters select { width: 100%; min-height: 42px; padding: 7px 9px; border: 1px solid var(--legacy-border-strong); color: var(--legacy-text); background: var(--legacy-page); }
.picker-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 1fr; gap: 7px; min-height: 0; padding: 0 12px 12px; margin: 0; overflow-y: auto; list-style: none; }
.picker-list li { height: 100%; }
.picker-option { display: grid; grid-template-columns: 68px minmax(0, 1fr) auto; gap: 10px; align-items: center; width: 100%; height: 100%; min-height: 112px; padding: 8px; border: 1px solid var(--legacy-border); border-radius: 4px; color: var(--legacy-text); text-align: left; cursor: pointer; background: var(--legacy-page); }
.picker-option:hover, .picker-option:focus-visible, .picker-option.selected { border-color: var(--focus-color); outline: none; background: var(--legacy-surface-active); }
.picker-image, .picker-symbol { display: grid; width: 64px; height: 64px; place-items: center; overflow: hidden; border: 1px solid var(--legacy-border); border-radius: 4px; background: var(--legacy-surface); }
.picker-image img { width: 60px; height: 60px; object-fit: contain; image-rendering: pixelated; }
.picker-symbol { color: var(--legacy-muted); font-size: 1.25rem; }
.picker-copy { display: grid; min-width: 0; align-content: center; }
.picker-number { color: var(--legacy-muted); font-size: 0.62rem; font-weight: 900; font-variant-numeric: tabular-nums; }
.picker-copy strong { margin-top: 2px; overflow: hidden; font-size: 0.9rem; text-overflow: ellipsis; white-space: nowrap; }
.picker-copy small { margin-top: 3px; overflow: hidden; color: var(--legacy-muted); font-size: 0.68rem; text-overflow: ellipsis; white-space: nowrap; }
.picker-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.picker-chips span { padding: 2px 5px; border: 1px solid var(--legacy-border); border-radius: 999px; color: var(--legacy-muted); font-size: 0.56rem; font-weight: 850; }
.picker-check { color: var(--legacy-muted); font-size: 1.35rem; }
.picker-status { min-height: 240px; padding: 40px 20px; color: var(--legacy-muted); text-align: center; }
.picker-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-top: 1px solid var(--legacy-border); color: var(--legacy-muted); background: var(--legacy-page); font-size: 0.72rem; }
.picker-footer button { min-height: 34px; padding: 6px 12px; border: 1px solid var(--legacy-border-strong); border-radius: 4px; color: var(--legacy-text); cursor: pointer; background: var(--legacy-surface); }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 720px) { .picker-backdrop { padding: 0; } .picker-dialog { width: 100%; height: 100dvh; max-height: none; border-radius: 0; } .picker-tools, .picker-list, .picker-filters { grid-template-columns: 1fr; } }
</style>
