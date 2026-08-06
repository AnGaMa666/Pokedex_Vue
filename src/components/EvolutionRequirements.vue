<template>
  <section
    v-if="loading || transitions.length"
    class="requirements-card"
    aria-labelledby="evolution-requirements-title"
  >
    <div class="requirements-heading">
      <div>
        <p>{{ labels.kicker }}</p>
        <h3 id="evolution-requirements-title">{{ labels.title }}</h3>
      </div>
      <span v-if="speciesVarietyCount > 1" class="variety-count">
        {{ speciesVarietyCount }} {{ labels.varieties }}
      </span>
    </div>

    <p class="requirements-note">{{ labels.note }}</p>
    <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>
    <p v-else-if="hasError" class="error-message" role="alert">{{ labels.error }}</p>

    <div v-else class="transition-list">
      <article
        v-for="transition in transitions"
        :key="`${transition.sourceName}-${transition.targetName}-${transition.stage}`"
        class="transition-card"
      >
        <div class="transition-path">
          <div class="species-node">
            <img
              :src="getSpeciesSprite(transition.sourceUrl)"
              :alt="getSpeciesLabel(transition.sourceName)"
              width="72"
              height="72"
              loading="lazy"
            >
            <div>
              <small>{{ labels.from }}</small>
              <strong>{{ getSpeciesLabel(transition.sourceName) }}</strong>
            </div>
          </div>

          <span class="path-arrow" aria-hidden="true">→</span>

          <div class="species-node">
            <img
              :src="getSpeciesSprite(transition.targetUrl)"
              :alt="getSpeciesLabel(transition.targetName)"
              width="72"
              height="72"
              loading="lazy"
            >
            <div>
              <small>{{ labels.to }}</small>
              <strong>{{ getSpeciesLabel(transition.targetName) }}</strong>
            </div>
          </div>
        </div>

        <div class="method-list">
          <section
            v-for="(detail, detailIndex) in transition.details"
            :key="detailIndex"
            class="method-card"
          >
            <strong v-if="transition.details.length > 1" class="method-title">
              {{ labels.alternative }} {{ detailIndex + 1 }}
            </strong>
            <div class="condition-list">
              <template
                v-for="condition in formatConditions(detail)"
                :key="`${condition.kind}-${condition.name || condition.text}`"
              >
                <button
                  v-if="condition.kind === 'item'"
                  type="button"
                  class="condition-chip item-condition"
                  @click="emit('openResource', { kind: 'items', name: condition.name })"
                >
                  <img
                    :src="getItemSprite(condition.name)"
                    :alt="condition.text"
                    width="28"
                    height="28"
                  >
                  {{ condition.text }}
                </button>
                <span v-else class="condition-chip">{{ condition.text }}</span>
              </template>
            </div>
          </section>

          <p v-if="!transition.details.length" class="unknown-method">
            {{ labels.noDetails }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  collectEvolutionResourceNames,
  collectEvolutionTransitions,
} from '@/utils/evolutionRequirements';
import { getLocalizedTypeName } from '@/utils/localization';
import {
  formatResourceName,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';
import { getPokemonListSprite } from '@/utils/sprites';

const props = defineProps({
  pokemon: {
    type: Object,
    required: true,
  },
  isShiny: {
    type: Boolean,
    default: false,
  },
  spriteMode: {
    type: String,
    default: 'pixel',
  },
});

const emit = defineEmits(['openResource']);
const { language } = useI18n();
const transitions = ref([]);
const currentSpecies = ref(null);
const speciesByName = ref({});
const itemsByName = ref({});
const movesByName = ref({});
const locationsByName = ref({});
const loading = ref(false);
const hasError = ref(false);
let requestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      kicker: 'Formen und Verzweigungen',
      title: 'Vollständige Entwicklungsvoraussetzungen',
      note: 'Alle von der PokéAPI gelieferten Alternativen werden einzeln angezeigt. Dadurch bleiben abweichende Voraussetzungen für Formen, Geschlechter und verzweigte Entwicklungen sichtbar.',
      varieties: 'Formen/Varianten',
      loading: 'Entwicklungsvoraussetzungen werden geladen…',
      error: 'Die vollständigen Entwicklungsvoraussetzungen konnten nicht geladen werden.',
      from: 'Ausgangsart',
      to: 'Entwicklung',
      alternative: 'Alternative',
      noDetails: 'Für diesen Übergang sind keine weiteren Bedingungen hinterlegt.',
      levelUp: 'Levelaufstieg',
      level: 'Ab Level {value}',
      useItem: 'Item verwenden',
      trade: 'Tausch',
      shed: 'Zusätzlicher Platz im Team und ein Pokéball',
      holding: '{item} tragen',
      happiness: 'Mindestens {value} Freundschaft',
      affection: 'Mindestens {value} Zutrauen',
      beauty: 'Mindestens {value} Schönheit',
      day: 'Tagsüber',
      night: 'Nachts',
      knownMove: 'Attacke {move} beherrschen',
      knownMoveType: 'Eine {type}-Attacke beherrschen',
      location: 'Am Ort {location}',
      rain: 'Regen in der Oberwelt',
      upsideDown: 'Gerät beim Levelaufstieg auf den Kopf drehen',
      partySpecies: '{species} im Team',
      partyType: 'Ein {type}-Pokémon im Team',
      tradeSpecies: 'Tausch gegen {species}',
      female: 'Nur weiblich',
      male: 'Nur männlich',
      attackHigher: 'Angriff höher als Verteidigung',
      defenseHigher: 'Verteidigung höher als Angriff',
      statsEqual: 'Angriff und Verteidigung gleich hoch',
    }
  : {
      kicker: 'Forms and branches',
      title: 'Complete evolution requirements',
      note: 'Every alternative supplied by PokéAPI is shown separately so form-, gender- and branch-specific requirements remain visible.',
      varieties: 'forms/variants',
      loading: 'Loading evolution requirements…',
      error: 'The complete evolution requirements could not be loaded.',
      from: 'Source species',
      to: 'Evolution',
      alternative: 'Alternative',
      noDetails: 'No additional conditions are stored for this transition.',
      levelUp: 'Level up',
      level: 'Level {value} or higher',
      useItem: 'Use an item',
      trade: 'Trade',
      shed: 'Free party slot and a Poké Ball',
      holding: 'Hold {item}',
      happiness: '{value}+ friendship',
      affection: '{value}+ affection',
      beauty: '{value}+ beauty',
      day: 'During the day',
      night: 'At night',
      knownMove: 'Know {move}',
      knownMoveType: 'Know a {type}-type move',
      location: 'At {location}',
      rain: 'Rain in the overworld',
      upsideDown: 'Turn the device upside down while leveling',
      partySpecies: '{species} in the party',
      partyType: 'A {type}-type Pokémon in the party',
      tradeSpecies: 'Trade for {species}',
      female: 'Female only',
      male: 'Male only',
      attackHigher: 'Attack higher than Defense',
      defenseHigher: 'Defense higher than Attack',
      statsEqual: 'Attack and Defense are equal',
    });

const speciesVarietyCount = computed(() => currentSpecies.value?.varieties?.length || 1);
const replace = (template, values) => Object.entries(values).reduce(
  (result, [key, value]) => result.replace(`{${key}}`, value),
  template,
);

const getSpeciesLabel = (name) => getLocalizedName(
  speciesByName.value[name]?.names,
  name,
  language.value,
);
const getItemLabel = (name) => getLocalizedName(
  itemsByName.value[name]?.names,
  name,
  language.value,
);
const getMoveLabel = (name) => getLocalizedName(
  movesByName.value[name]?.names,
  name,
  language.value,
);
const getLocationLabel = (name) => getLocalizedName(
  locationsByName.value[name]?.names,
  name,
  language.value,
);
const getSpeciesSprite = (url) => getPokemonListSprite(
  getResourceId(url),
  props.spriteMode,
  props.isShiny,
);
const getItemSprite = (name) => itemsByName.value[name]?.sprites?.default
  || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(name)}.png`;

const formatConditions = (detail) => {
  const result = [];

  if (detail.trigger === 'level-up') {
    result.push({
      kind: 'text',
      text: detail.minLevel === null
        ? labels.value.levelUp
        : replace(labels.value.level, { value: detail.minLevel }),
    });
  } else if (detail.trigger === 'use-item') {
    result.push({ kind: 'text', text: labels.value.useItem });
  } else if (detail.trigger === 'trade') {
    result.push({ kind: 'text', text: labels.value.trade });
  } else if (detail.trigger === 'shed') {
    result.push({ kind: 'text', text: labels.value.shed });
  } else if (detail.trigger) {
    result.push({ kind: 'text', text: formatResourceName(detail.trigger) });
  }

  if (detail.item) {
    result.push({ kind: 'item', name: detail.item, text: getItemLabel(detail.item) });
  }
  if (detail.heldItem) {
    result.push({
      kind: 'item',
      name: detail.heldItem,
      text: replace(labels.value.holding, { item: getItemLabel(detail.heldItem) }),
    });
  }
  if (detail.minHappiness !== null) {
    result.push({ kind: 'text', text: replace(labels.value.happiness, { value: detail.minHappiness }) });
  }
  if (detail.minAffection !== null) {
    result.push({ kind: 'text', text: replace(labels.value.affection, { value: detail.minAffection }) });
  }
  if (detail.minBeauty !== null) {
    result.push({ kind: 'text', text: replace(labels.value.beauty, { value: detail.minBeauty }) });
  }
  if (detail.timeOfDay === 'day') result.push({ kind: 'text', text: labels.value.day });
  else if (detail.timeOfDay === 'night') result.push({ kind: 'text', text: labels.value.night });
  else if (detail.timeOfDay) result.push({ kind: 'text', text: formatResourceName(detail.timeOfDay) });

  if (detail.knownMove) {
    result.push({
      kind: 'text',
      text: replace(labels.value.knownMove, { move: getMoveLabel(detail.knownMove) }),
    });
  }
  if (detail.knownMoveType) {
    result.push({
      kind: 'text',
      text: replace(labels.value.knownMoveType, {
        type: getLocalizedTypeName(detail.knownMoveType, language.value),
      }),
    });
  }
  if (detail.location) {
    result.push({
      kind: 'text',
      text: replace(labels.value.location, { location: getLocationLabel(detail.location) }),
    });
  }
  if (detail.needsOverworldRain) result.push({ kind: 'text', text: labels.value.rain });
  if (detail.turnUpsideDown) result.push({ kind: 'text', text: labels.value.upsideDown });
  if (detail.partySpecies) {
    result.push({
      kind: 'text',
      text: replace(labels.value.partySpecies, { species: getSpeciesLabel(detail.partySpecies) }),
    });
  }
  if (detail.partyType) {
    result.push({
      kind: 'text',
      text: replace(labels.value.partyType, {
        type: getLocalizedTypeName(detail.partyType, language.value),
      }),
    });
  }
  if (detail.tradeSpecies) {
    result.push({
      kind: 'text',
      text: replace(labels.value.tradeSpecies, { species: getSpeciesLabel(detail.tradeSpecies) }),
    });
  }
  if (detail.gender === 1) result.push({ kind: 'text', text: labels.value.female });
  if (detail.gender === 2) result.push({ kind: 'text', text: labels.value.male });
  if (detail.relativePhysicalStats === 1) result.push({ kind: 'text', text: labels.value.attackHigher });
  if (detail.relativePhysicalStats === -1) result.push({ kind: 'text', text: labels.value.defenseHigher });
  if (detail.relativePhysicalStats === 0) result.push({ kind: 'text', text: labels.value.statsEqual });

  return result.length ? result : [{ kind: 'text', text: labels.value.noDetails }];
};

const mapSettledByName = (results) => Object.fromEntries(
  results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => [result.value.data.name, result.value.data]),
);

const loadRequirements = async (name) => {
  const activeId = ++requestId;
  loading.value = true;
  hasError.value = false;
  transitions.value = [];
  currentSpecies.value = null;
  speciesByName.value = {};
  itemsByName.value = {};
  movesByName.value = {};
  locationsByName.value = {};

  try {
    const speciesResponse = await PokeAPI.getPokemonSpecies(name);
    const species = speciesResponse.data;
    const evolutionResponse = species.evolution_chain?.url
      ? await PokeAPI.getEvolutionChain(species.evolution_chain.url)
      : { data: { chain: null } };
    const resolvedTransitions = collectEvolutionTransitions(evolutionResponse.data.chain);
    const resources = collectEvolutionResourceNames(resolvedTransitions);

    const [speciesResults, itemResults, moveResults, locationResults] = await Promise.all([
      Promise.allSettled(resources.species.map((resourceName) => PokeAPI.getPokemonSpecies(resourceName))),
      Promise.allSettled(resources.items.map((resourceName) => PokeAPI.getItemDetails(resourceName))),
      Promise.allSettled(resources.moves.map((resourceName) => PokeAPI.getMoveDetails(resourceName))),
      Promise.allSettled(resources.locations.map((resourceName) => PokeAPI.getLocationDetails(resourceName))),
    ]);

    if (activeId !== requestId) return;
    currentSpecies.value = species;
    transitions.value = resolvedTransitions;
    speciesByName.value = {
      [species.name]: species,
      ...mapSettledByName(speciesResults),
    };
    itemsByName.value = mapSettledByName(itemResults);
    movesByName.value = mapSettledByName(moveResults);
    locationsByName.value = mapSettledByName(locationResults);
  } catch (error) {
    if (activeId !== requestId) return;
    console.error('Failed to load complete evolution requirements:', error);
    hasError.value = true;
  } finally {
    if (activeId === requestId) loading.value = false;
  }
};

watch(
  () => props.pokemon?.name,
  (name) => {
    if (name) void loadRequirements(name);
  },
  { immediate: true },
);
</script>

<style scoped>
.requirements-card {
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.requirements-heading {
  display: flex;
  gap: 16px;
  align-items: end;
  justify-content: space-between;
}

.requirements-heading p {
  margin: 0 0 4px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.requirements-heading h3 {
  margin: 0;
  font-size: 1.2rem;
}

.variety-count {
  padding: 5px 8px;
  border: 1px solid var(--legacy-border);
  border-radius: 999px;
  color: var(--legacy-muted);
  font-size: 0.7rem;
  font-weight: 850;
  background: var(--legacy-page);
}

.requirements-note,
.status-message,
.error-message {
  margin: 10px 0 0;
  color: var(--legacy-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}

.error-message {
  color: #b91c1c;
}

.transition-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.transition-card {
  display: grid;
  grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.4fr);
  gap: 14px;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.transition-path {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.species-node {
  display: grid;
  grid-template-columns: 66px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.species-node img {
  width: 66px;
  height: 66px;
  object-fit: contain;
  image-rendering: pixelated;
}

.species-node div {
  display: grid;
  min-width: 0;
}

.species-node small {
  color: var(--legacy-muted);
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
}

.species-node strong {
  margin-top: 3px;
  overflow-wrap: anywhere;
  font-size: 0.82rem;
}

.path-arrow {
  color: var(--legacy-muted);
  font-size: 1.25rem;
}

.method-list {
  display: grid;
  gap: 8px;
}

.method-card {
  padding: 9px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.method-title {
  display: block;
  margin-bottom: 7px;
  color: var(--legacy-muted);
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.condition-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.condition-chip {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  min-height: 29px;
  padding: 4px 7px;
  border: 1px solid var(--legacy-border);
  border-radius: 999px;
  color: var(--legacy-text);
  font: inherit;
  font-size: 0.7rem;
  line-height: 1.25;
  background: var(--legacy-page);
}

.item-condition {
  cursor: pointer;
}

.item-condition:hover {
  border-color: var(--legacy-border-strong);
  background: var(--legacy-surface-hover);
}

.item-condition img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  image-rendering: pixelated;
}

.unknown-method {
  margin: 0;
  color: var(--legacy-muted);
  font-size: 0.75rem;
}

@media (max-width: 900px) {
  .transition-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .requirements-card {
    padding: 14px;
  }

  .transition-path {
    grid-template-columns: 1fr;
  }

  .path-arrow {
    transform: rotate(90deg);
    justify-self: center;
  }
}
</style>
