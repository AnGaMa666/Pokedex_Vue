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
            <span v-for="attribute in attributeLabels" :key="attribute">
              {{ attribute }}
            </span>
          </div>
        </div>
        <div class="sprite-frame">
          <img
            v-if="spriteUrl"
            :src="spriteUrl"
            :alt="`${displayName} ${labels.sprite}`"
            width="96"
            height="96"
          >
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
          aria-controls="item-holder-details"
          @click="togglePanel('holders')"
        >
          <span class="fact-label">{{ labels.heldBy }}</span>
          <span class="fact-button-value">
            <strong class="fact-value">{{ holderCountLabel }}</strong>
            <span class="fact-chevron" aria-hidden="true">›</span>
          </span>
          <span class="sr-only">{{ labels.openHeldBy }}</span>
        </button>
        <button
          class="fact-card fact-button"
          :class="{ active: expandedPanel === 'games' }"
          type="button"
          :aria-expanded="expandedPanel === 'games'"
          aria-controls="item-game-details"
          @click="togglePanel('games')"
        >
          <span class="fact-label">{{ labels.gameAppearances }}</span>
          <span class="fact-button-value">
            <strong class="fact-value">{{ gameAppearanceSummary }}</strong>
            <span class="fact-chevron" aria-hidden="true">›</span>
          </span>
          <span class="sr-only">{{ labels.openGameAppearances }}</span>
        </button>
      </section>

      <section
        v-if="expandedPanel"
        :id="expandedPanel === 'holders' ? 'item-holder-details' : 'item-game-details'"
        ref="availabilityPanel"
        class="availability-panel"
        tabindex="-1"
      >
        <header class="panel-header">
          <div>
            <p class="panel-eyebrow">
              {{ expandedPanel === 'holders' ? labels.heldBy : labels.gameAppearances }}
            </p>
            <h3>
              {{ expandedPanel === 'holders' ? labels.wildHoldersTitle : labels.gameAppearancesTitle }}
            </h3>
          </div>
          <button
            class="close-button"
            type="button"
            :aria-label="labels.closeDetails"
            @click="expandedPanel = ''"
          >
            ×
          </button>
        </header>

        <template v-if="expandedPanel === 'holders'">
          <p class="panel-intro">{{ labels.wildHoldersIntro }}</p>
          <p v-if="holdersLoading" class="panel-status" role="status">
            {{ labels.detailLoading }}
          </p>
          <div v-else-if="holdersError" class="panel-error" role="alert">
            <p>{{ holdersError }}</p>
            <button type="button" @click="loadWildHolders">{{ labels.tryAgain }}</button>
          </div>
          <p v-else-if="heldPokemonRows.length === 0" class="panel-empty">
            {{ labels.noWildHolders }}
          </p>
          <div v-else class="holder-list">
            <article
              v-for="holder in heldPokemonRows"
              :key="holder.slug"
              class="holder-card"
            >
              <div class="holder-summary">
                <div class="holder-sprite">
                  <img
                    v-if="holder.spriteUrl"
                    :src="holder.spriteUrl"
                    :alt="`${holder.name} ${labels.sprite}`"
                    width="72"
                    height="72"
                    loading="lazy"
                  >
                  <span v-else aria-hidden="true">◆</span>
                </div>
                <div>
                  <p v-if="holder.id" class="holder-number">
                    #{{ formatResourceId(holder.id) }}
                  </p>
                  <h4>{{ holder.name }}</h4>
                </div>
              </div>

              <div class="version-list">
                <div
                  v-for="version in holder.versions"
                  :key="`${holder.slug}-${version.slug}`"
                  class="version-row"
                >
                  <span>{{ version.name }}</span>
                  <strong>{{ labels.rarity }}: {{ version.rarity }} %</strong>
                </div>
              </div>
            </article>
          </div>
        </template>

        <template v-else>
          <p class="panel-intro">{{ labels.gameAppearancesIntro }}</p>
          <p v-if="gamesLoading" class="panel-status" role="status">
            {{ labels.detailLoading }}
          </p>
          <div v-else-if="gamesError" class="panel-error" role="alert">
            <p>{{ gamesError }}</p>
            <button type="button" @click="loadGameAppearances">{{ labels.tryAgain }}</button>
          </div>
          <p
            v-else-if="gameAppearanceRows.length === 0 && generationAppearanceRows.length === 0"
            class="panel-empty"
          >
            {{ labels.noGameData }}
          </p>
          <div v-else class="game-list">
            <article
              v-for="appearance in gameAppearanceRows"
              :key="appearance.id"
              class="game-group"
            >
              <div class="game-group-heading">
                <span>{{ appearance.generation }}</span>
                <h4>{{ appearance.groupName }}</h4>
              </div>
              <ul class="game-badges" :aria-label="appearance.groupName">
                <li v-for="game in appearance.games" :key="game.slug">
                  {{ game.name }}
                </li>
              </ul>
            </article>

            <article
              v-for="appearance in generationAppearanceRows"
              :key="appearance.id"
              class="game-group generation-only"
            >
              <div class="game-group-heading">
                <span>{{ labels.generation }}</span>
                <h4>{{ appearance.name }}</h4>
              </div>
              <p>{{ labels.availableInGeneration }}</p>
            </article>
          </div>

          <button
            v-if="hasWildHolders"
            class="secondary-button"
            type="button"
            @click="togglePanel('holders')"
          >
            {{ labels.showWildHolders }}
          </button>
        </template>
      </section>

      <section v-if="showDetailedEffect" class="secondary-section">
        <h3>{{ labels.effect }}</h3>
        <p>{{ detailedEffect }}</p>
      </section>

      <section v-if="showFlavorText" class="secondary-section">
        <h3>{{ labels.gameDescription }}</h3>
        <p>{{ flavorText }}</p>
      </section>
    </template>
  </article>
</template>

<script setup>
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import { loadGermanPokemonCatalog } from '@/services/localizationCatalog';
import {
  createGameAppearanceRows,
  createHeldPokemonRows,
  formatGenerationName,
  getHolderVersionResources,
  getItemVersionGroupResources,
  getLocalizedItemMetadataName,
  getVersionResourcesFromGroups,
} from '@/utils/itemDetails';
import {
  formatResourceId,
  getLocalizedFlavorText,
  getLocalizedItemDescription,
  getLocalizedName,
} from '@/utils/resource';
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
const versionGroups = ref([]);
const versionsByName = ref({});
const pokemonCatalog = ref(new Map());
const loading = ref(false);
const errorMessage = ref('');
const expandedPanel = ref('');
const availabilityPanel = ref(null);
const gamesLoading = ref(false);
const gamesLoaded = ref(false);
const gamesError = ref('');
const holdersLoading = ref(false);
const holdersLoaded = ref(false);
const holdersError = ref('');
let activeRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      loading: 'Itemdetails werden geladen…',
      tryAgain: 'Erneut versuchen',
      item: 'Item',
      sprite: 'Sprite',
      flingPower: 'Schleuderstärke',
      heldBy: 'Getragen von',
      gameAppearances: 'Spielauftritte',
      gameDescription: 'Spielbeschreibung',
      effect: 'Effekt',
      loadError: 'Die Itemdetails konnten nicht geladen werden.',
      factsLabel: 'Item-Fakten',
      openHeldBy: 'Details zu wilden Pokémon öffnen, die dieses Item tragen können',
      openGameAppearances: 'Details zu den Spielen öffnen, in denen dieses Item vorkommt',
      closeDetails: 'Detailansicht schließen',
      detailLoading: 'Zusätzliche Details werden geladen…',
      holderLoadError: 'Die wilden Träger dieses Items konnten nicht vollständig geladen werden.',
      gamesLoadError: 'Die Spielauftritte dieses Items konnten nicht vollständig geladen werden.',
      noWildHolders: 'Für dieses Item sind keine wilden Pokémon als Träger hinterlegt.',
      noGameData: 'Für dieses Item sind keine Spielauftritte hinterlegt.',
      wildHoldersTitle: 'Wilde Pokémon mit diesem Item',
      wildHoldersIntro: 'Die Tragechance gilt für ein wild angetroffenes Pokémon in der jeweiligen Spielversion.',
      gameAppearancesTitle: 'Spiele mit diesem Item',
      gameAppearancesIntro: 'Die Spiele sind nach Versionsgruppe und Generation geordnet.',
      rarity: 'Tragechance',
      showWildHolders: 'Wilde Träger anzeigen',
      generation: 'Generation',
      generations: 'Generationen',
      gameGroup: 'Spielgruppe',
      gameGroups: 'Spielgruppen',
      availableInGeneration: 'In dieser Generation vorhanden.',
    }
  : {
      loading: 'Loading item details…',
      tryAgain: 'Try again',
      item: 'Item',
      sprite: 'sprite',
      flingPower: 'Fling power',
      heldBy: 'Held by',
      gameAppearances: 'Game appearances',
      gameDescription: 'Game description',
      effect: 'Effect',
      loadError: 'The item details could not be loaded.',
      factsLabel: 'Item facts',
      openHeldBy: 'Open details about wild Pokémon that can hold this item',
      openGameAppearances: 'Open details about the games in which this item appears',
      closeDetails: 'Close detail view',
      detailLoading: 'Loading additional details…',
      holderLoadError: 'The wild holders of this item could not be loaded completely.',
      gamesLoadError: 'The game appearances of this item could not be loaded completely.',
      noWildHolders: 'No wild Pokémon are listed as holders of this item.',
      noGameData: 'No game appearances are listed for this item.',
      wildHoldersTitle: 'Wild Pokémon holding this item',
      wildHoldersIntro: 'The hold chance applies to a wild encounter in the specified game version.',
      gameAppearancesTitle: 'Games containing this item',
      gameAppearancesIntro: 'Games are grouped by version group and generation.',
      rarity: 'Hold chance',
      showWildHolders: 'Show wild holders',
      generation: 'generation',
      generations: 'generations',
      gameGroup: 'game group',
      gameGroups: 'game groups',
      availableInGeneration: 'Available in this generation.',
    });

const displayName = computed(() => getLocalizedName(
  details.value?.names,
  details.value?.name,
  language.value,
));
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
const detailedEffect = computed(() => {
  const entries = details.value?.effect_entries || [];
  const entry = entries.find((candidate) => candidate.language?.name === language.value)
    || (language.value === 'en'
      ? entries.find((candidate) => candidate.language?.name === 'en')
      : null);
  return (entry?.effect || '').replace(/[\n\f]+/g, ' ').trim();
});
const showDetailedEffect = computed(() => Boolean(
  detailedEffect.value && detailedEffect.value !== effectDescription.value,
));
const flavorText = computed(() => getLocalizedFlavorText(
  details.value?.flavor_text_entries,
  language.value,
));
const showFlavorText = computed(() => Boolean(
  flavorText.value
    && flavorText.value !== effectDescription.value
    && flavorText.value !== detailedEffect.value,
));
const hasWildHolders = computed(() => (details.value?.held_by_pokemon?.length ?? 0) > 0);
const holderCountLabel = computed(() => (
  `${details.value?.held_by_pokemon?.length ?? 0} Pokémon`
));
const versionGroupResourceCount = computed(() => getItemVersionGroupResources(details.value || {}).length);
const generationCount = computed(() => new Set(
  (details.value?.game_indices || []).map((entry) => entry.generation?.name).filter(Boolean),
).size);
const gameAppearanceSummary = computed(() => {
  if (versionGroupResourceCount.value) {
    const unit = versionGroupResourceCount.value === 1 ? labels.value.gameGroup : labels.value.gameGroups;
    return `${versionGroupResourceCount.value} ${unit}`;
  }

  const unit = generationCount.value === 1 ? labels.value.generation : labels.value.generations;
  return `${generationCount.value} ${unit}`;
});
const gameAppearanceRows = computed(() => createGameAppearanceRows({
  versionGroups: versionGroups.value,
  versionsByName: versionsByName.value,
  language: language.value,
}));
const generationAppearanceRows = computed(() => {
  if (gameAppearanceRows.value.length) return [];

  const rows = new Map();
  for (const gameIndex of details.value?.game_indices || []) {
    const generationName = gameIndex.generation?.name || '';
    if (!generationName || rows.has(generationName)) continue;
    rows.set(generationName, {
      id: generationName,
      name: formatGenerationName(generationName),
    });
  }
  return [...rows.values()];
});
const heldPokemonRows = computed(() => createHeldPokemonRows({
  heldByPokemon: details.value?.held_by_pokemon || [],
  localizedNamesById: pokemonCatalog.value,
  versionsByName: versionsByName.value,
  language: language.value,
}));

const mapWithConcurrency = async (items, mapper, concurrency = 6) => {
  if (!items.length) return [];

  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
};

const loadNamedResourceMap = async (resources, loader) => {
  const entries = await mapWithConcurrency(resources, async (resource) => {
    try {
      const response = await loader(resource.name);
      return [resource.name, response.data];
    } catch (requestError) {
      console.error(`Failed to load ${resource.name}:`, requestError);
      return [resource.name, null];
    }
  });
  return Object.fromEntries(entries.filter(([, value]) => value));
};

const resetSupplementaryDetails = () => {
  categoryDetails.value = null;
  attributeDetailsByName.value = {};
  versionGroups.value = [];
  versionsByName.value = {};
  pokemonCatalog.value = new Map();
  expandedPanel.value = '';
  gamesLoading.value = false;
  gamesLoaded.value = false;
  gamesError.value = '';
  holdersLoading.value = false;
  holdersLoaded.value = false;
  holdersError.value = '';
};

const loadMetadata = async (itemDetails, requestId) => {
  const categoryPromise = itemDetails.category?.name
    ? PokeAPI.getItemCategory(itemDetails.category.name)
      .then((response) => response.data)
      .catch((requestError) => {
        console.error('Failed to load item category:', requestError);
        return null;
      })
    : Promise.resolve(null);
  const attributesPromise = loadNamedResourceMap(
    itemDetails.attributes || [],
    (name) => PokeAPI.getItemAttribute(name),
  );
  const [loadedCategory, loadedAttributes] = await Promise.all([
    categoryPromise,
    attributesPromise,
  ]);

  if (requestId === activeRequestId) {
    categoryDetails.value = loadedCategory;
    attributeDetailsByName.value = loadedAttributes;
  }
};

const loadGameAppearances = async () => {
  if (gamesLoaded.value || gamesLoading.value || !details.value) return;

  const itemName = details.value.name;
  gamesLoading.value = true;
  gamesError.value = '';

  try {
    const versionGroupResources = getItemVersionGroupResources(details.value);
    const loadedGroupsByName = await loadNamedResourceMap(
      versionGroupResources,
      (name) => PokeAPI.getVersionGroupDetails(name),
    );
    const loadedGroups = versionGroupResources
      .map((resource) => loadedGroupsByName[resource.name])
      .filter(Boolean);
    const versionResources = getVersionResourcesFromGroups(loadedGroups);
    const loadedVersions = await loadNamedResourceMap(
      versionResources,
      (name) => PokeAPI.getVersionDetails(name),
    );

    if (details.value?.name !== itemName) return;
    if (versionGroupResources.length && !loadedGroups.length) {
      throw new Error('No referenced version group could be loaded.');
    }

    versionGroups.value = loadedGroups;
    versionsByName.value = { ...versionsByName.value, ...loadedVersions };
    gamesLoaded.value = true;
  } catch (requestError) {
    if (details.value?.name === itemName) {
      console.error('Failed to load item game appearances:', requestError);
      gamesError.value = labels.value.gamesLoadError;
    }
  } finally {
    if (details.value?.name === itemName) gamesLoading.value = false;
  }
};

const loadWildHolders = async () => {
  if (holdersLoaded.value || holdersLoading.value || !details.value) return;

  const itemName = details.value.name;
  holdersLoading.value = true;
  holdersError.value = '';

  try {
    const holders = details.value.held_by_pokemon || [];
    if (!holders.length) {
      holdersLoaded.value = true;
      return;
    }

    const versionResources = getHolderVersionResources(holders);
    const [loadedVersions, loadedCatalog] = await Promise.all([
      loadNamedResourceMap(versionResources, (name) => PokeAPI.getVersionDetails(name)),
      language.value === 'de'
        ? loadGermanPokemonCatalog().catch((requestError) => {
            console.error('Failed to load localized Pokémon holder names:', requestError);
            return new Map();
          })
        : Promise.resolve(new Map()),
    ]);

    if (details.value?.name !== itemName) return;
    versionsByName.value = { ...versionsByName.value, ...loadedVersions };
    pokemonCatalog.value = loadedCatalog;
    holdersLoaded.value = true;
  } catch (requestError) {
    if (details.value?.name === itemName) {
      console.error('Failed to load wild item holders:', requestError);
      holdersError.value = labels.value.holderLoadError;
    }
  } finally {
    if (details.value?.name === itemName) holdersLoading.value = false;
  }
};

const togglePanel = async (panel) => {
  if (expandedPanel.value === panel) {
    expandedPanel.value = '';
    return;
  }

  expandedPanel.value = panel;
  if (panel === 'holders') await loadWildHolders();
  else await loadGameAppearances();

  await nextTick();
  if (expandedPanel.value !== panel) return;

  availabilityPanel.value?.focus({ preventScroll: true });
  if (window.matchMedia('(max-width: 760px)').matches) {
    availabilityPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const loadDetails = async () => {
  const requestId = ++activeRequestId;
  loading.value = true;
  errorMessage.value = '';
  details.value = null;
  resetSupplementaryDetails();

  try {
    const response = await PokeAPI.getItemDetails(props.resource.name);
    if (requestId !== activeRequestId) return;

    details.value = response.data;
    await loadMetadata(response.data, requestId);
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
watch(language, async () => {
  if (language.value === 'de' && holdersLoaded.value && pokemonCatalog.value.size === 0) {
    holdersLoaded.value = false;
    await loadWildHolders();
  }
});
</script>

<style scoped>
.detail-card {
  min-width: 0;
  min-height: 420px;
  padding: clamp(20px, 3vw, 32px);
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.status-message,
.error-message {
  margin: 0;
  padding: 28px 0;
  color: var(--legacy-muted);
}

.error-message,
.panel-error {
  color: #ef4444;
}

.error-message button,
.panel-error button {
  margin-top: 10px;
  padding: 8px 12px;
  border: 1px solid #ef4444;
  color: #ef4444;
  cursor: pointer;
  background: var(--legacy-page);
}

.detail-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px;
  background: var(--legacy-page);
}

.eyebrow,
.panel-eyebrow,
.holder-number {
  margin: 0 0 8px;
  color: var(--legacy-muted);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.detail-header h2 {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: clamp(2rem, 5vw, 3.6rem);
  line-height: 1;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 16px;
}

.badge-row span {
  padding: 5px 9px;
  border: 1px solid var(--legacy-border);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 850;
  background: var(--legacy-surface);
}

.sprite-frame {
  display: grid;
  flex: 0 0 auto;
  width: 112px;
  height: 112px;
  place-items: center;
  border: 1px solid var(--legacy-border);
  border-radius: 22px;
  background: var(--legacy-surface);
}

.sprite-frame img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  image-rendering: pixelated;
}

.description {
  margin: 18px 0 0;
  padding: 18px;
  border-left: 4px solid var(--focus-color);
  line-height: 1.65;
  background: var(--legacy-page);
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.fact-card {
  display: grid;
  min-width: 0;
  min-height: 96px;
  gap: 6px;
  align-content: center;
  padding: 14px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  text-align: left;
  background: var(--legacy-page);
}

.fact-button {
  width: 100%;
  cursor: pointer;
}

.fact-button:hover,
.fact-button:focus-visible,
.fact-button.active {
  border-color: var(--focus-color);
  outline: none;
  background: var(--legacy-surface-hover);
}

.fact-label {
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.fact-value {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 1rem;
}

.fact-button-value {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.fact-chevron {
  color: var(--legacy-muted);
  font-size: 1.6rem;
  line-height: 0.8;
  transition: transform 160ms ease;
}

.fact-button.active .fact-chevron {
  transform: rotate(90deg);
}

.availability-panel {
  margin-top: 12px;
  padding: 16px;
  border: 1px solid var(--legacy-border);
  outline: none;
  background: var(--legacy-page);
  scroll-margin-top: 116px;
}

.panel-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.panel-header h3 {
  margin: 0;
}

.panel-eyebrow {
  margin-bottom: 4px;
  font-size: 0.65rem;
}

.close-button {
  display: grid;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  cursor: pointer;
  font-size: 1.35rem;
  background: var(--legacy-surface);
}

.close-button:hover,
.close-button:focus-visible {
  border-color: var(--focus-color);
  outline: none;
}

.panel-intro,
.panel-status,
.panel-empty,
.panel-error p {
  margin: 12px 0 0;
  color: var(--legacy-muted);
  line-height: 1.55;
}

.holder-list,
.game-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.holder-card {
  display: grid;
  grid-template-columns: minmax(170px, 0.8fr) minmax(0, 1.2fr);
  gap: 14px;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.holder-summary {
  display: flex;
  min-width: 0;
  gap: 10px;
  align-items: center;
}

.holder-sprite {
  display: grid;
  flex: 0 0 auto;
  width: 68px;
  height: 68px;
  place-items: center;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.holder-sprite img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
}

.holder-number {
  margin-bottom: 3px;
  font-size: 0.62rem;
}

.holder-card h4,
.game-group h4 {
  margin: 0;
  overflow-wrap: anywhere;
}

.version-list {
  display: grid;
  gap: 6px;
  align-content: center;
}

.version-row {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 7px 9px;
  border: 1px solid var(--legacy-border);
  font-size: 0.72rem;
  background: var(--legacy-page);
}

.version-row strong {
  flex: 0 0 auto;
}

.game-group {
  display: grid;
  grid-template-columns: minmax(170px, 0.7fr) minmax(0, 1.3fr);
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.game-group-heading span {
  display: block;
  margin-bottom: 3px;
  color: var(--legacy-muted);
  font-size: 0.65rem;
  font-weight: 850;
  text-transform: uppercase;
}

.game-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.game-badges li {
  padding: 5px 8px;
  border: 1px solid var(--legacy-border);
  font-size: 0.7rem;
  background: var(--legacy-page);
}

.generation-only p {
  margin: 0;
  color: var(--legacy-muted);
  font-size: 0.78rem;
}

.secondary-button {
  margin-top: 14px;
  padding: 8px 11px;
  border: 1px solid var(--legacy-border-strong);
  color: var(--legacy-text);
  font-weight: 800;
  cursor: pointer;
  background: var(--legacy-surface);
}

.secondary-button:hover,
.secondary-button:focus-visible {
  border-color: var(--focus-color);
  outline: none;
  background: var(--legacy-surface-hover);
}

.secondary-section {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--legacy-border);
}

.secondary-section h3 {
  margin: 0 0 8px;
}

.secondary-section p {
  margin: 0;
  color: var(--legacy-muted);
  line-height: 1.6;
}

.sr-only {
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

@media (max-width: 760px) {
  .detail-card {
    min-height: 0;
    padding: 12px;
  }

  .detail-header {
    gap: 12px;
    padding: 12px;
  }

  .detail-header h2 {
    font-size: clamp(1.65rem, 9vw, 2.5rem);
  }

  .sprite-frame {
    width: 76px;
    height: 76px;
    border-radius: 14px;
  }

  .sprite-frame img {
    width: 64px;
    height: 64px;
  }

  .description {
    padding: 12px;
  }

  .facts-grid,
  .holder-card,
  .game-group {
    grid-template-columns: 1fr;
  }

  .availability-panel {
    padding: 12px;
  }
}

@media (max-width: 420px) {
  .detail-header {
    align-items: center;
  }

  .version-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
}
</style>
