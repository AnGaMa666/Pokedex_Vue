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
            :alt="`${displayName} sprite`"
            width="96"
            height="96"
          >
          <span v-else aria-hidden="true">◆</span>
        </div>
      </header>

      <p class="description">{{ effectDescription }}</p>

      <section class="facts-grid" :aria-label="labels.factsLabel">
        <div class="fact-card">
          <span class="fact-label">{{ labels.storePrice }}</span>
          <strong class="fact-value">{{ formatCost(details.cost) }}</strong>
        </div>
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
            <strong class="fact-value">{{ details.held_by_pokemon?.length ?? 0 }} Pokémon</strong>
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
        <template v-if="expandedPanel === 'holders'">
          <header class="panel-header">
            <div>
              <p class="panel-eyebrow">{{ labels.heldBy }}</p>
              <h3>{{ labels.wildHoldersTitle }}</h3>
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
                    :alt="`${holder.name} sprite`"
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
          <header class="panel-header">
            <div>
              <p class="panel-eyebrow">{{ labels.gameAppearances }}</p>
              <h3>{{ labels.gameAppearancesTitle }}</h3>
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

          <p class="panel-intro">{{ labels.gameAppearancesIntro }}</p>
          <p v-if="gamesLoading" class="panel-status" role="status">
            {{ labels.detailLoading }}
          </p>
          <div v-else-if="gamesError" class="panel-error" role="alert">
            <p>{{ gamesError }}</p>
            <button type="button" @click="loadGameAppearances">{{ labels.tryAgain }}</button>
          </div>
          <p v-else-if="gameAppearanceRows.length === 0" class="panel-empty">
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
          </div>

          <aside class="availability-note">
            <strong>{{ labels.locationDataTitle }}</strong>
            <p>{{ labels.locationDataNote }}</p>
            <button
              v-if="hasWildHolders"
              class="secondary-button"
              type="button"
              @click="togglePanel('holders')"
            >
              {{ labels.showWildHolders }}
            </button>
          </aside>
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
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  createGameAppearanceRows,
  createHeldPokemonRows,
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
const speciesByName = ref({});
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
      storePrice: 'Ladenpreis',
      flingPower: 'Schleuderstärke',
      heldBy: 'Getragen von',
      gameAppearances: 'Spielauftritte',
      gameDescription: 'Spielbeschreibung',
      notSold: 'Nicht verkäuflich',
      loadError: 'Die Itemdetails konnten nicht geladen werden.',
      factsLabel: 'Item-Fakten',
      openHeldBy: 'Details zu wilden Pokémon öffnen, die dieses Item tragen können',
      openGameAppearances: 'Details zu den Spielen öffnen, in denen dieses Item vorkommt',
      closeDetails: 'Detailansicht schließen',
      detailLoading: 'Zusätzliche Details werden geladen…',
      holderLoadError: 'Die wilden Träger dieses Items konnten nicht vollständig geladen werden.',
      gamesLoadError: 'Die Spielauftritte dieses Items konnten nicht vollständig geladen werden.',
      noWildHolders: 'Für dieses Item sind keine wilden Pokémon als Träger hinterlegt.',
      noGameData: 'Für dieses Item sind keine einzelnen Spielversionen hinterlegt.',
      wildHoldersTitle: 'Wilde Pokémon mit diesem Item',
      wildHoldersIntro: 'Die Tragechance gilt für ein wild angetroffenes Pokémon in der jeweiligen Spielversion.',
      gameAppearancesTitle: 'Spiele mit diesem Item',
      gameAppearancesIntro: 'Die Spiele sind nach Versionsgruppe und Generation geordnet.',
      rarity: 'Tragechance',
      locationDataTitle: 'Fundorte und Fundmöglichkeiten',
      locationDataNote: 'Die PokéAPI enthält bei Items keine konkreten Kartenfundorte wie Routen, Gebäude oder versteckte Fundstellen. Verfügbare Fundmöglichkeiten über wilde Pokémon werden mit Spielversion und Tragechance angezeigt.',
      showWildHolders: 'Wilde Träger anzeigen',
      generation: 'Generation',
      generations: 'Generationen',
    }
  : {
      loading: 'Loading item details…',
      tryAgain: 'Try again',
      item: 'Item',
      storePrice: 'Store price',
      flingPower: 'Fling power',
      heldBy: 'Held by',
      gameAppearances: 'Game appearances',
      gameDescription: 'Game description',
      notSold: 'Not sold',
      loadError: 'The item details could not be loaded.',
      factsLabel: 'Item facts',
      openHeldBy: 'Open details about wild Pokémon that can hold this item',
      openGameAppearances: 'Open details about the games in which this item appears',
      closeDetails: 'Close detail view',
      detailLoading: 'Loading additional details…',
      holderLoadError: 'The wild holders of this item could not be loaded completely.',
      gamesLoadError: 'The game appearances of this item could not be loaded completely.',
      noWildHolders: 'No wild Pokémon are listed as holders of this item.',
      noGameData: 'No individual game versions are listed for this item.',
      wildHoldersTitle: 'Wild Pokémon holding this item',
      wildHoldersIntro: 'The hold chance applies to a wild encounter in the specified game version.',
      gameAppearancesTitle: 'Games containing this item',
      gameAppearancesIntro: 'Games are grouped by version group and generation.',
      rarity: 'Hold chance',
      locationDataTitle: 'Locations and acquisition methods',
      locationDataNote: 'PokéAPI does not provide concrete item map locations such as routes, buildings, or hidden spots. Available acquisition data from wild Pokémon is shown with the game version and hold chance.',
      showWildHolders: 'Show wild holders',
      generation: 'generation',
      generations: 'generations',
    });

const displayName = computed(() => {
  return getLocalizedName(details.value?.names, details.value?.name, language.value);
});
const spriteUrl = computed(() => {
  return details.value?.sprites?.default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${details.value?.name}.png`;
});
const categoryLabel = computed(() => {
  return getLocalizedItemMetadataName({
    details: categoryDetails.value,
    fallback: details.value?.category?.name,
    language: language.value,
    kind: 'category',
  });
});
const attributeLabels = computed(() => {
  return (details.value?.attributes || []).map((attribute) => {
    return getLocalizedItemMetadataName({
      details: attributeDetailsByName.value[attribute.name],
      fallback: attribute.name,
      language: language.value,
      kind: 'attribute',
    });
  });
});
const effectDescription = computed(() => {
  return getLocalizedItemDescription({
    effectEntries: details.value?.effect_entries,
    flavorTextEntries: details.value?.flavor_text_entries,
    language: language.value,
  });
});
const flavorText = computed(() => {
  return getLocalizedFlavorText(details.value?.flavor_text_entries, language.value);
});
const showFlavorText = computed(() => {
  return Boolean(flavorText.value && flavorText.value !== effectDescription.value);
});
const gameAppearanceSummary = computed(() => {
  const count = details.value?.game_indices?.length ?? 0;
  const unit = count === 1 ? labels.value.generation : labels.value.generations;
  return `${count} ${unit}`;
});
const hasWildHolders = computed(() => {
  return (details.value?.held_by_pokemon?.length ?? 0) > 0;
});
const gameAppearanceRows = computed(() => {
  return createGameAppearanceRows({
    versionGroups: versionGroups.value,
    versionsByName: versionsByName.value,
    language: language.value,
  });
});
const heldPokemonRows = computed(() => {
  return createHeldPokemonRows({
    heldByPokemon: details.value?.held_by_pokemon,
    speciesByName: speciesByName.value,
    versionsByName: versionsByName.value,
    language: language.value,
  });
});

const formatCost = (cost) => {
  if (!cost) {
    return labels.value.notSold;
  }

  const locale = language.value === 'de' ? 'de-DE' : 'en-US';
  return `${new Intl.NumberFormat(locale).format(cost)} ₽`;
};

const mapWithConcurrency = async (items, mapper, concurrency = 6) => {
  if (items.length === 0) {
    return [];
  }

  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);
  const workers = Array.from({ length: workerCount }, async () => {
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
  speciesByName.value = {};
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
  if (gamesLoaded.value || gamesLoading.value || !details.value) {
    return;
  }

  const itemName = details.value.name;
  gamesLoading.value = true;
  gamesError.value = '';

  try {
    const versionGroupResources = getItemVersionGroupResources(details.value);
    const loadedGroupsByName = await loadNamedResourceMap(
      versionGroupResources,
      (name) => PokeAPI.getVersionGroup(name),
    );
    const loadedGroups = versionGroupResources
      .map((resource) => loadedGroupsByName[resource.name])
      .filter(Boolean);
    const versionResources = getVersionResourcesFromGroups(loadedGroups);
    const loadedVersions = await loadNamedResourceMap(
      versionResources,
      (name) => PokeAPI.getVersion(name),
    );

    if (details.value?.name === itemName) {
      versionGroups.value = loadedGroups;
      versionsByName.value = {
        ...versionsByName.value,
        ...loadedVersions,
      };
      gamesLoaded.value = true;
    }
  } catch (requestError) {
    if (details.value?.name === itemName) {
      console.error('Failed to load item game appearances:', requestError);
      gamesError.value = labels.value.gamesLoadError;
    }
  } finally {
    if (details.value?.name === itemName) {
      gamesLoading.value = false;
    }
  }
};

const loadWildHolders = async () => {
  if (holdersLoaded.value || holdersLoading.value || !details.value) {
    return;
  }

  const itemName = details.value.name;
  holdersLoading.value = true;
  holdersError.value = '';

  try {
    const holders = details.value.held_by_pokemon || [];
    const pokemonResources = [...new Map(
      holders
        .filter((holder) => holder.pokemon?.name)
        .map((holder) => [holder.pokemon.name, holder.pokemon]),
    ).values()];
    const versionResources = getHolderVersionResources(holders);
    const [loadedSpecies, loadedVersions] = await Promise.all([
      loadNamedResourceMap(
        pokemonResources,
        (name) => PokeAPI.getPokemonSpecies(name),
      ),
      loadNamedResourceMap(
        versionResources,
        (name) => PokeAPI.getVersion(name),
      ),
    ]);

    if (details.value?.name === itemName) {
      speciesByName.value = loadedSpecies;
      versionsByName.value = {
        ...versionsByName.value,
        ...loadedVersions,
      };
      holdersLoaded.value = true;
    }
  } catch (requestError) {
    if (details.value?.name === itemName) {
      console.error('Failed to load wild item holders:', requestError);
      holdersError.value = labels.value.holderLoadError;
    }
  } finally {
    if (details.value?.name === itemName) {
      holdersLoading.value = false;
    }
  }
};

const togglePanel = async (panel) => {
  if (expandedPanel.value === panel) {
    expandedPanel.value = '';
    return;
  }

  expandedPanel.value = panel;

  if (panel === 'holders') {
    await loadWildHolders();
  } else {
    await loadGameAppearances();
  }

  await nextTick();

  if (
    expandedPanel.value === panel
    && window.matchMedia('(max-width: 760px)').matches
  ) {
    availabilityPanel.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
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

    if (requestId === activeRequestId) {
      details.value = response.data;
      await loadMetadata(response.data, requestId);
    }
  } catch (requestError) {
    if (requestId === activeRequestId) {
      console.error('Failed to load item details:', requestError);
      errorMessage.value = labels.value.loadError;
    }
  } finally {
    if (requestId === activeRequestId) {
      loading.value = false;
    }
  }
};

watch(
  () => props.resource.name,
  loadDetails,
  { immediate: true },
);
</script>

<style scoped>
.detail-card {
  min-width: 0;
  min-height: 420px;
  padding: clamp(22px, 4vw, 34px);
  border: 1px solid #cfd8e8;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 16px 42px rgba(23, 32, 51, 0.08);
}

.status-message,
.error-message {
  margin: 0;
  padding: 28px 0;
  color: #596579;
}

.error-message,
.panel-error {
  color: #991b1b;
}

.error-message button,
.panel-error button {
  margin-top: 10px;
  padding: 8px 12px;
  border: 1px solid #b91c1c;
  border-radius: 9px;
  color: #991b1b;
  cursor: pointer;
  background: #fff7f7;
}

.detail-header {
  display: flex;
  gap: 24px;
  justify-content: space-between;
  align-items: flex-start;
}

.eyebrow,
.panel-eyebrow,
.holder-number {
  margin: 0 0 8px;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.detail-header h2 {
  margin: 0;
  color: #172033;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
  letter-spacing: -0.04em;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.badge-row span {
  padding: 6px 11px;
  border-radius: 999px;
  color: #344054;
  font-size: 0.78rem;
  font-weight: 850;
  background: #eef4ff;
}

.sprite-frame {
  display: grid;
  flex: 0 0 auto;
  width: 112px;
  height: 112px;
  place-items: center;
  border: 1px solid #cfd8e8;
  border-radius: 28px;
  color: #2563eb;
  font-size: 2rem;
  background: linear-gradient(145deg, #ffffff, #edf4ff);
}

.sprite-frame img {
  width: 88px;
  height: 88px;
  object-fit: contain;
  image-rendering: pixelated;
}

.description {
  margin: 28px 0 0;
  padding: 18px;
  border-left: 4px solid #2563eb;
  border-radius: 10px;
  color: #344054;
  line-height: 1.65;
  background: #f8fafc;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0 0;
}

.fact-card {
  display: flex;
  min-width: 0;
  min-height: 92px;
  padding: 15px;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
  justify-content: center;
  border: 1px solid #e3e6eb;
  border-radius: 12px;
  color: inherit;
  text-align: left;
  background: rgba(255, 255, 255, 0.84);
}

.fact-label {
  color: #7a8494;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fact-value {
  min-width: 0;
  color: #172033;
  font-size: 1.05rem;
  font-weight: 800;
}

.fact-button {
  width: 100%;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.fact-button:hover,
.fact-button:focus-visible,
.fact-button.active {
  border-color: #2563eb;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
  outline: none;
}

.fact-button:hover {
  transform: translateY(-1px);
}

.fact-button-value {
  display: flex;
  width: 100%;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.fact-chevron {
  color: #2563eb;
  font-size: 1.8rem;
  font-weight: 500;
  line-height: 0.8;
  transform: rotate(0deg);
  transition: transform 160ms ease;
}

.fact-button.active .fact-chevron {
  transform: rotate(90deg);
}

.availability-panel {
  margin-top: 18px;
  padding: 20px;
  border: 1px solid #cfd8e8;
  border-radius: 16px;
  background: #f8fafc;
  scroll-margin-top: 116px;
}

.availability-panel:focus {
  outline: none;
}

.panel-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.panel-header h3 {
  margin: 0;
  color: #172033;
  font-size: 1.25rem;
}

.panel-eyebrow {
  margin-bottom: 4px;
  font-size: 0.7rem;
}

.close-button {
  display: grid;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  padding: 0;
  place-items: center;
  border: 1px solid #cfd8e8;
  border-radius: 9px;
  color: #344054;
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;
  background: #ffffff;
}

.close-button:hover,
.close-button:focus-visible {
  border-color: #2563eb;
  color: #1d4ed8;
  outline: none;
}

.panel-intro,
.panel-status,
.panel-empty,
.panel-error p {
  margin: 12px 0 0;
  color: #596579;
  line-height: 1.55;
}

.holder-list,
.game-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.holder-card {
  display: grid;
  grid-template-columns: minmax(170px, 0.8fr) minmax(0, 1.2fr);
  gap: 16px;
  padding: 14px;
  border: 1px solid #e3e6eb;
  border-radius: 14px;
  background: #ffffff;
}

.holder-summary {
  display: flex;
  min-width: 0;
  gap: 12px;
  align-items: center;
}

.holder-sprite {
  display: grid;
  flex: 0 0 auto;
  width: 68px;
  height: 68px;
  place-items: center;
  border-radius: 12px;
  background: #f1f5f9;
}

.holder-sprite img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
}

.holder-number {
  margin-bottom: 3px;
  font-size: 0.66rem;
}

.holder-card h4,
.game-group h4 {
  margin: 0;
  color: #172033;
  font-size: 1rem;
}

.version-list {
  display: grid;
  gap: 7px;
  align-content: center;
}

.version-row {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 9px;
  color: #344054;
  font-size: 0.86rem;
  background: #f8fafc;
}

.version-row strong {
  flex: 0 0 auto;
  color: #172033;
}

.game-group {
  display: grid;
  grid-template-columns: minmax(150px, 0.45fr) minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid #e3e6eb;
  border-radius: 14px;
  background: #ffffff;
}

.game-group-heading span {
  display: block;
  margin-bottom: 3px;
  color: #1d4ed8;
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
}

.game-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.game-badges li {
  padding: 6px 9px;
  border-radius: 999px;
  color: #344054;
  font-size: 0.8rem;
  font-weight: 750;
  background: #eef4ff;
}

.availability-note {
  margin-top: 18px;
  padding: 14px;
  border-left: 4px solid #64748b;
  border-radius: 10px;
  color: #475569;
  background: #ffffff;
}

.availability-note strong {
  color: #172033;
}

.availability-note p {
  margin: 5px 0 0;
  line-height: 1.55;
}

.secondary-button {
  margin-top: 12px;
  padding: 8px 11px;
  border: 1px solid #2563eb;
  border-radius: 9px;
  color: #1d4ed8;
  font-weight: 800;
  cursor: pointer;
  background: #eef4ff;
}

.secondary-button:hover,
.secondary-button:focus-visible {
  background: #dbeafe;
  outline: none;
}

.secondary-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e3e6eb;
}

.secondary-section h3 {
  margin: 0 0 8px;
  color: #172033;
  font-size: 1rem;
}

.secondary-section p {
  margin: 0;
  color: #596579;
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
    padding: 14px;
  }

  .detail-header {
    gap: 12px;
  }

  .detail-header h2 {
    font-size: clamp(1.65rem, 9vw, 2.5rem);
  }

  .badge-row {
    gap: 6px;
    margin-top: 12px;
  }

  .badge-row span {
    padding: 5px 9px;
    font-size: 0.72rem;
  }

  .sprite-frame {
    width: 76px;
    height: 76px;
    border-radius: 14px;
  }

  .sprite-frame img {
    width: 60px;
    height: 60px;
  }

  .description {
    margin-top: 16px;
    padding: 12px;
  }

  .facts-grid {
    gap: 8px;
    margin-top: 14px;
  }

  .fact-card {
    min-height: 82px;
    padding: 10px;
  }

  .fact-value {
    font-size: 0.95rem;
  }

  .availability-panel {
    margin-top: 12px;
    padding: 14px;
  }

  .holder-card,
  .game-group {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .version-row {
    align-items: flex-start;
  }
}

@media (max-width: 420px) {
  .version-row {
    flex-direction: column;
    gap: 2px;
  }
}

@media (max-width: 340px) {
  .facts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
