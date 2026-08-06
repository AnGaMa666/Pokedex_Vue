<template>
  <article class="detail-card item-detail" :aria-busy="loading">
    <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>

    <div v-else-if="errorMessage" class="error-message" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadDetails">{{ labels.tryAgain }}</button>
    </div>

    <template v-else-if="details">
      <header class="detail-header">
        <div>
          <p class="eyebrow">{{ labels.item }} #{{ formatResourceId(details.id) }}</p>
          <h2>{{ displayName }}</h2>
          <div class="badge-row">
            <span v-if="categoryLabel">{{ categoryLabel }}</span>
            <span v-for="attribute in attributeLabels" :key="attribute">{{ attribute }}</span>
          </div>
        </div>
        <div class="sprite-frame">
          <img v-if="spriteUrl" :src="spriteUrl" :alt="displayName" width="96" height="96">
          <span v-else aria-hidden="true">◆</span>
        </div>
      </header>

      <p class="description">{{ effectDescription }}</p>

      <ItemPriceOverview :item-details="details" />

      <section class="facts-grid" :aria-label="labels.factsLabel">
        <div class="fact-card">
          <span class="fact-label">{{ labels.flingPower }}</span>
          <strong class="fact-value">{{ details.fling_power ?? '—' }}</strong>
        </div>
        <button
          class="fact-card fact-button"
          :class="{ active: expandedPanel === 'holders' }"
          type="button"
          :aria-expanded="expandedPanel === 'holders'"
          @click="togglePanel('holders')"
        >
          <span class="fact-label">{{ labels.heldBy }}</span>
          <span class="fact-button-value">
            <strong class="fact-value">{{ holderRows.length }} Pokémon</strong>
            <span aria-hidden="true">›</span>
          </span>
        </button>
        <button
          class="fact-card fact-button"
          :class="{ active: expandedPanel === 'games' }"
          type="button"
          :aria-expanded="expandedPanel === 'games'"
          @click="togglePanel('games')"
        >
          <span class="fact-label">{{ labels.gameAppearances }}</span>
          <span class="fact-button-value">
            <strong class="fact-value">{{ gameRows.length }} {{ labels.gameGroups }}</strong>
            <span aria-hidden="true">›</span>
          </span>
        </button>
      </section>

      <section v-if="expandedPanel" class="availability-panel">
        <header class="panel-header">
          <div>
            <p>{{ expandedPanel === 'holders' ? labels.heldBy : labels.gameAppearances }}</p>
            <h3>{{ expandedPanel === 'holders' ? labels.wildHoldersTitle : labels.gameAppearancesTitle }}</h3>
          </div>
          <button type="button" :aria-label="labels.closeDetails" @click="expandedPanel = ''">×</button>
        </header>

        <template v-if="expandedPanel === 'holders'">
          <p class="panel-intro">{{ labels.wildHoldersIntro }}</p>
          <p v-if="holderRows.length === 0" class="panel-empty">{{ labels.noWildHolders }}</p>
          <div v-else class="holder-list">
            <article v-for="holder in holderRows" :key="holder.name" class="holder-card">
              <div class="holder-summary">
                <img :src="holder.sprite" :alt="holder.label" width="68" height="68" loading="lazy">
                <div>
                  <small v-if="holder.id">#{{ formatResourceId(holder.id) }}</small>
                  <h4>{{ holder.label }}</h4>
                </div>
              </div>
              <ul>
                <li v-for="version in holder.versions" :key="version.name">
                  <span>{{ getLocalizedVersionName(version.name, language) }}</span>
                  <strong>{{ version.rarity }} %</strong>
                </li>
              </ul>
            </article>
          </div>
        </template>

        <template v-else>
          <p class="panel-intro">{{ labels.gameAppearancesIntro }}</p>
          <p v-if="gameRows.length === 0" class="panel-empty">{{ labels.noGameData }}</p>
          <div v-else class="game-list">
            <article v-for="row in gameRows" :key="row.name" class="game-group">
              <div>
                <span>{{ row.generation }}</span>
                <h4>{{ row.label }}</h4>
              </div>
              <ul>
                <li v-for="version in row.versions" :key="version.name">
                  {{ getLocalizedVersionName(version.name, language) }}
                </li>
              </ul>
            </article>
          </div>
        </template>
      </section>

      <section v-if="showFlavorText" class="secondary-section">
        <h3>{{ labels.gameDescription }}</h3>
        <p>{{ flavorText }}</p>
      </section>
    </template>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  getCatalogLabel,
  getLocalizedVersionName,
  loadGermanPokemonCatalog,
} from '@/services/localizationCatalog';
import { getLocalizedItemMetadataName } from '@/utils/itemDetails';
import {
  formatResourceId,
  getLocalizedFlavorText,
  getLocalizedItemDescription,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';
import {
  getGenerationLabel,
  getVersionGroupLabel,
  getVersionGroupMetadata,
} from '@/utils/versionGroups';
import ItemPriceOverview from './ItemPriceOverview.vue';

const props = defineProps({
  resource: {
    type: Object,
    required: true,
  },
});

const { language } = useI18n();
const details = ref(null);
const categoryDetails = ref(null);
const attributeDetailsByName = ref({});
const pokemonCatalog = ref(new Map());
const versionGroupsByName = ref({});
const loading = ref(false);
const errorMessage = ref('');
const expandedPanel = ref('');
let activeRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      loading: 'Itemdetails werden geladen…', tryAgain: 'Erneut versuchen', item: 'Item',
      flingPower: 'Schleuderstärke', heldBy: 'Getragen von', gameAppearances: 'Spielauftritte',
      gameGroups: 'Spielgruppen', gameDescription: 'Spielbeschreibung',
      loadError: 'Die Itemdetails konnten nicht geladen werden.', factsLabel: 'Item-Fakten',
      closeDetails: 'Detailansicht schließen', noWildHolders: 'Für dieses Item sind keine wilden Pokémon als Träger hinterlegt.',
      noGameData: 'Für dieses Item sind keine Spielgruppen hinterlegt.',
      wildHoldersTitle: 'Wilde Pokémon mit diesem Item',
      wildHoldersIntro: 'Die Tragechance gilt für ein wild angetroffenes Pokémon in der jeweiligen Spielversion.',
      gameAppearancesTitle: 'Spiele mit diesem Item',
      gameAppearancesIntro: 'Spielgruppen sind chronologisch nach Generation geordnet.',
    }
  : {
      loading: 'Loading item details…', tryAgain: 'Try again', item: 'Item', flingPower: 'Fling power',
      heldBy: 'Held by', gameAppearances: 'Game appearances', gameGroups: 'game groups',
      gameDescription: 'Game description', loadError: 'The item details could not be loaded.',
      factsLabel: 'Item facts', closeDetails: 'Close detail view',
      noWildHolders: 'No wild Pokémon are listed as holders of this item.',
      noGameData: 'No game groups are listed for this item.', wildHoldersTitle: 'Wild Pokémon holding this item',
      wildHoldersIntro: 'The hold chance applies to a wild encounter in the specified game version.',
      gameAppearancesTitle: 'Games containing this item',
      gameAppearancesIntro: 'Game groups are ordered chronologically by generation.',
    });

const displayName = computed(() => getLocalizedName(details.value?.names, details.value?.name, language.value));
const spriteUrl = computed(() => details.value?.sprites?.default
  || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${details.value?.name}.png`);
const categoryLabel = computed(() => getLocalizedItemMetadataName({
  details: categoryDetails.value,
  fallback: details.value?.category?.name,
  language: language.value,
  kind: 'category',
}));
const attributeLabels = computed(() => (details.value?.attributes || []).map((attribute) => (
  getLocalizedItemMetadataName({
    details: attributeDetailsByName.value[attribute.name],
    fallback: attribute.name,
    language: language.value,
    kind: 'attribute',
  })
)));
const effectDescription = computed(() => getLocalizedItemDescription({
  effectEntries: details.value?.effect_entries,
  flavorTextEntries: details.value?.flavor_text_entries,
  language: language.value,
}));
const flavorText = computed(() => getLocalizedFlavorText(details.value?.flavor_text_entries, language.value));
const showFlavorText = computed(() => Boolean(flavorText.value && flavorText.value !== effectDescription.value));

const holderRows = computed(() => (details.value?.held_by_pokemon || [])
  .map((holder) => {
    const id = getResourceId(holder.pokemon?.url);
    return {
      id,
      name: holder.pokemon?.name || '',
      label: language.value === 'de'
        ? getCatalogLabel(pokemonCatalog.value, id, holder.pokemon?.name)
        : holder.pokemon?.name,
      sprite: id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png` : '',
      versions: (holder.version_details || []).map((entry) => ({
        name: entry.version?.name || '',
        rarity: entry.rarity ?? 0,
      })),
    };
  })
  .sort((first, second) => first.label.localeCompare(second.label, language.value)));

const referencedVersionGroupNames = computed(() => [...new Set([
  ...(details.value?.prices || []).map((price) => price.version_group?.name),
  ...(details.value?.flavor_text_entries || []).map((entry) => entry.version_group?.name),
  ...(details.value?.machines || []).map((entry) => entry.version_group?.name),
].filter(Boolean))]);

const gameRows = computed(() => referencedVersionGroupNames.value
  .map((name) => {
    const group = versionGroupsByName.value[name];
    const metadata = getVersionGroupMetadata(name, getResourceId(group?.url));
    return {
      name,
      order: metadata.order,
      label: getVersionGroupLabel(name, language.value),
      generation: getGenerationLabel(metadata.generation, language.value),
      versions: group?.versions || [],
    };
  })
  .sort((first, second) => first.order - second.order));

const togglePanel = (panel) => {
  expandedPanel.value = expandedPanel.value === panel ? '' : panel;
};

const loadVersionGroups = async (names) => {
  const results = await Promise.allSettled(names.map((name) => PokeAPI.getVersionGroupDetails(name)));
  versionGroupsByName.value = Object.fromEntries(results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => [result.value.data.name, result.value.data]));
};

const loadDetails = async () => {
  const requestId = ++activeRequestId;
  loading.value = true;
  errorMessage.value = '';
  details.value = null;
  categoryDetails.value = null;
  attributeDetailsByName.value = {};
  versionGroupsByName.value = {};
  expandedPanel.value = '';

  try {
    const response = await PokeAPI.getItemDetails(props.resource.name);
    if (requestId !== activeRequestId) return;
    details.value = response.data;

    const [categoryResult, attributeResults, catalogResult] = await Promise.all([
      response.data.category?.name
        ? PokeAPI.getItemCategory(response.data.category.name).catch(() => null)
        : Promise.resolve(null),
      Promise.allSettled((response.data.attributes || []).map((attribute) => (
        PokeAPI.getItemAttribute(attribute.name)
      ))),
      language.value === 'de' ? loadGermanPokemonCatalog().catch(() => new Map()) : Promise.resolve(new Map()),
    ]);

    if (requestId !== activeRequestId) return;
    categoryDetails.value = categoryResult?.data || null;
    attributeDetailsByName.value = Object.fromEntries(attributeResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => [result.value.data.name, result.value.data]));
    pokemonCatalog.value = catalogResult;
    await loadVersionGroups(referencedVersionGroupNames.value);
  } catch (requestError) {
    if (requestId === activeRequestId) {
      console.error('Failed to load item details:', requestError);
      errorMessage.value = labels.value.loadError;
    }
  } finally {
    if (requestId === activeRequestId) loading.value = false;
  }
};

watch(() => props.resource.name, loadDetails, { immediate: true });
watch(language, loadDetails);
</script>

<style scoped>
.detail-card { min-width: 0; min-height: 420px; padding: clamp(20px, 3vw, 32px); border: 1px solid var(--legacy-border); border-radius: 4px; color: var(--legacy-text); background: var(--legacy-surface); box-shadow: 0 2px 5px var(--legacy-shadow); }
.status-message, .error-message { margin: 0; padding: 28px 0; color: var(--legacy-muted); }
.error-message { color: #ef4444; }
.error-message button { margin-top: 10px; padding: 8px 12px; border: 1px solid #ef4444; color: #ef4444; background: var(--legacy-page); }
.detail-header { display: flex; gap: 20px; justify-content: space-between; align-items: flex-start; padding: 18px; background: var(--legacy-page); }
.eyebrow { margin: 0 0 8px; color: var(--legacy-muted); font-size: 0.76rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
.detail-header h2 { margin: 0; overflow-wrap: anywhere; font-size: clamp(2rem, 5vw, 3.6rem); line-height: 1; }
.badge-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 16px; }
.badge-row span { padding: 5px 9px; border: 1px solid var(--legacy-border); border-radius: 999px; font-size: 0.72rem; font-weight: 850; background: var(--legacy-surface); }
.sprite-frame { display: grid; flex: 0 0 auto; width: 112px; height: 112px; place-items: center; border: 1px solid var(--legacy-border); border-radius: 22px; background: var(--legacy-surface); }
.sprite-frame img { width: 96px; height: 96px; object-fit: contain; image-rendering: pixelated; }
.description { margin: 18px 0 0; padding: 18px; border-left: 4px solid var(--focus-color); line-height: 1.65; background: var(--legacy-page); }
.facts-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
.fact-card { display: grid; gap: 6px; min-height: 96px; align-content: center; padding: 14px; border: 1px solid var(--legacy-border); color: var(--legacy-text); text-align: left; background: var(--legacy-page); }
.fact-button { cursor: pointer; }
.fact-button:hover, .fact-button.active { border-color: var(--focus-color); background: var(--legacy-surface-hover); }
.fact-label { color: var(--legacy-muted); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.07em; text-transform: uppercase; }
.fact-value { font-size: 1rem; }
.fact-button-value { display: flex; justify-content: space-between; align-items: center; }
.availability-panel { margin-top: 12px; padding: 16px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.panel-header { display: flex; justify-content: space-between; align-items: start; }
.panel-header p { margin: 0 0 4px; color: var(--legacy-muted); font-size: 0.65rem; font-weight: 900; text-transform: uppercase; }
.panel-header h3 { margin: 0; }
.panel-header button { width: 36px; height: 36px; border: 1px solid var(--legacy-border); color: var(--legacy-text); cursor: pointer; background: var(--legacy-surface); }
.panel-intro, .panel-empty { color: var(--legacy-muted); line-height: 1.5; }
.holder-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
.holder-card { border: 1px solid var(--legacy-border); background: var(--legacy-surface); }
.holder-summary { display: grid; grid-template-columns: 68px minmax(0, 1fr); gap: 9px; align-items: center; padding: 8px; }
.holder-summary img { width: 68px; height: 68px; object-fit: contain; image-rendering: pixelated; }
.holder-summary small { color: var(--legacy-muted); }
.holder-summary h4 { margin: 2px 0 0; }
.holder-card ul, .game-group ul { padding: 0; margin: 0; list-style: none; }
.holder-card li { display: flex; justify-content: space-between; gap: 8px; padding: 7px 9px; border-top: 1px solid var(--legacy-border); font-size: 0.7rem; }
.game-list { display: grid; gap: 8px; }
.game-group { display: grid; grid-template-columns: minmax(190px, 0.8fr) minmax(0, 1.2fr); gap: 10px; padding: 12px; border: 1px solid var(--legacy-border); background: var(--legacy-surface); }
.game-group span { color: var(--legacy-muted); font-size: 0.65rem; }
.game-group h4 { margin: 4px 0 0; }
.game-group ul { display: flex; flex-wrap: wrap; gap: 5px; align-content: start; }
.game-group li { padding: 4px 7px; border: 1px solid var(--legacy-border); font-size: 0.68rem; background: var(--legacy-page); }
.secondary-section { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--legacy-border); }
.secondary-section h3 { margin: 0 0 8px; }
.secondary-section p { margin: 0; color: var(--legacy-muted); line-height: 1.6; }
@media (max-width: 760px) { .detail-card { min-height: 0; padding: 12px; } .detail-header { padding: 12px; } .sprite-frame { width: 76px; height: 76px; } .sprite-frame img { width: 64px; height: 64px; } .facts-grid { grid-template-columns: 1fr; } .game-group { grid-template-columns: 1fr; } }
</style>
