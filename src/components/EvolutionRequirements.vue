<template>
  <section
    v-if="loading || hasError || transitions.length || formConditionGroups.length"
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

    <div v-else class="requirements-content">
      <section
        v-if="formConditionGroups.length"
        class="form-condition-section"
        aria-labelledby="form-condition-title"
      >
        <div class="subsection-heading">
          <h4 id="form-condition-title">{{ labels.formConditionsTitle }}</h4>
          <p>{{ labels.formConditionsHint }}</p>
        </div>
        <div class="form-condition-grid">
          <article
            v-for="form in formConditionGroups"
            :key="form.name"
            class="form-condition-card"
          >
            <div class="form-condition-identity">
              <img
                :src="getFormSprite(form)"
                :alt="getPokemonFormLabel(form)"
                width="64"
                height="64"
                loading="lazy"
                decoding="async"
              >
              <div>
                <small>{{ form.isBattleOnly ? labels.battleForm : labels.triggeredForm }}</small>
                <strong>{{ getPokemonFormLabel(form) }}</strong>
              </div>
            </div>
            <div class="condition-list">
              <template
                v-for="condition in form.conditions"
                :key="`${condition.trigger}-${condition.name}-${condition.baseForm}`"
              >
                <span v-if="condition.baseForm" class="condition-chip">
                  {{ labels.fromForm }} {{ getReferencedFormLabel(condition.baseForm) }}
                </span>
                <button
                  v-if="getFormConditionResourceKind(condition)"
                  type="button"
                  class="condition-chip item-condition"
                  @click="openFormConditionResource(condition)"
                >
                  {{ getFormConditionText(condition) }}
                </button>
                <span v-else class="condition-chip">{{ getFormConditionText(condition) }}</span>
              </template>
            </div>
          </article>
        </div>
      </section>

      <div v-if="transitions.length" class="transition-list">
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
            <div v-if="detail.baseForm || detail.evolvedForm" class="form-transition-path">
              <span>
                <small>{{ labels.sourceForm }}</small>
                <strong>{{ getEvolutionFormLabel(detail.baseForm, detail.baseFormUrl, transition.sourceName) }}</strong>
              </span>
              <span aria-hidden="true">→</span>
              <span>
                <small>{{ labels.targetForm }}</small>
                <strong>{{ getEvolutionFormLabel(detail.evolvedForm, detail.evolvedFormUrl, transition.targetName) }}</strong>
              </span>
            </div>
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
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import { loadGermanPokemonCatalog } from '@/services/localizationCatalog';
import PokeAPI from '@/services/pokeapi';
import {
  collectPokemonFormConditionResources,
  collectEvolutionResourceNames,
  collectEvolutionTransitions,
  normalizePokemonFormConditions,
} from '@/utils/evolutionRequirements';
import { getLocalizedTypeName } from '@/utils/localization';
import {
  formatResourceName,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';
import { getPokemonListSprite } from '@/utils/sprites';
import { getVersionGroupLabel } from '@/utils/versionGroups';

const props = defineProps({
  pokemon: {
    type: Object,
    required: true,
  },
  activePokemon: {
    type: Object,
    default: null,
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
const abilitiesByName = ref({});
const formDetailsByName = ref({});
const formConditionGroups = ref([]);
const pokemonCatalog = ref(new Map());
const loading = ref(false);
const hasError = ref(false);
let requestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      kicker: 'Formen und Verzweigungen',
      title: 'Vollständige Entwicklungsvoraussetzungen',
      note: 'Alle verfügbaren Alternativen werden einzeln angezeigt. Dadurch bleiben abweichende Voraussetzungen für Formen, Geschlechter und verzweigte Entwicklungen sichtbar.',
      formConditionsTitle: 'Formwechselbedingungen',
      formConditionsHint: 'Kampf- und Sonderformen zeigen ihre konkrete Auslösebedingung und gegebenenfalls die erforderliche Ausgangsform.',
      battleForm: 'Kampfform',
      triggeredForm: 'Ausgelöste Form',
      fromForm: 'Ausgangsform:',
      sourceForm: 'Ausgangsform',
      targetForm: 'Zielform',
      triggerHeldItem: '{resource} tragen',
      triggerAbility: 'Fähigkeit {resource}',
      triggerMove: 'Attacke {resource} einsetzen',
      triggerGigantamax: 'Gigadynamax-Faktor',
      triggerOther: 'Auslöser: {trigger}{resource}',
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
      versionGroup: 'Seit {version}',
      versionGroupNumber: 'Versionsgruppe #{value}',
      defaultEvolution: 'Standardentwicklung',
      alternateEvolution: 'Alternative Entwicklung',
      nearSpecialRock: 'In der Nähe eines Moos- oder Eisfelsens',
      multiplayer: 'Mehrspieler-Verbindung erforderlich',
      region: 'In der Region {region}',
      usedMove: 'Attacke {move} einsetzen',
      moveCount: 'Mindestens {value}× einsetzen',
      steps: 'Mindestens {value} Schritte zurücklegen',
      damageTaken: 'Mindestens {value} Schadenspunkte erleiden',
      female: 'Nur weiblich',
      male: 'Nur männlich',
      attackHigher: 'Angriff höher als Verteidigung',
      defenseHigher: 'Verteidigung höher als Angriff',
      statsEqual: 'Angriff und Verteidigung gleich hoch',
    }
  : {
      kicker: 'Forms and branches',
      title: 'Complete evolution requirements',
      note: 'Every available alternative is shown separately so form-, gender- and branch-specific requirements remain visible.',
      formConditionsTitle: 'Form-change requirements',
      formConditionsHint: 'Battle and special forms show their concrete trigger and required source form where applicable.',
      battleForm: 'Battle form',
      triggeredForm: 'Triggered form',
      fromForm: 'Source form:',
      sourceForm: 'Source form',
      targetForm: 'Target form',
      triggerHeldItem: 'Hold {resource}',
      triggerAbility: 'Ability {resource}',
      triggerMove: 'Use {resource}',
      triggerGigantamax: 'Gigantamax Factor',
      triggerOther: 'Trigger: {trigger}{resource}',
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
      versionGroup: 'Since {version}',
      versionGroupNumber: 'Version group #{value}',
      defaultEvolution: 'Default evolution',
      alternateEvolution: 'Alternate evolution',
      nearSpecialRock: 'Near a Moss Rock or Ice Rock',
      multiplayer: 'Multiplayer connection required',
      region: 'In the {region} region',
      usedMove: 'Use {move}',
      moveCount: 'Use at least {value} times',
      steps: 'Walk at least {value} steps',
      damageTaken: 'Take at least {value} damage',
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
const getAbilityLabel = (name) => getLocalizedName(
  abilitiesByName.value[name]?.names,
  name,
  language.value,
);
const getPokemonFormLabel = (form) => getLocalizedName(
  form.names,
  form.name,
  language.value,
);
const getEvolutionFormLabel = (name, url, speciesName) => {
  const pokemonId = getResourceId(url);
  const catalogLabel = pokemonId === null ? '' : pokemonCatalog.value.get(pokemonId);
  return catalogLabel || formatResourceName(name || speciesName);
};
const getReferencedFormLabel = (name) => {
  const form = formDetailsByName.value[name];
  const pokemonId = getResourceId(form?.pokemon?.url);
  return getLocalizedName(
    form?.names,
    pokemonId === null ? name : pokemonCatalog.value.get(pokemonId) || name,
    language.value,
  );
};
const getFormSprite = (form) => getPokemonListSprite(
  getResourceId(form.pokemonUrl),
  props.spriteMode,
  props.isShiny,
);
const getFormConditionResourceKind = (condition) => ({
  item: 'items',
  move: 'moves',
})[condition.resourceKind] || '';
const getFormConditionText = (condition) => {
  const resourceLabel = condition.resourceKind === 'item'
    ? getItemLabel(condition.name)
    : condition.resourceKind === 'move'
      ? getMoveLabel(condition.name)
      : condition.resourceKind === 'ability'
        ? getAbilityLabel(condition.name)
        : formatResourceName(condition.name);

  if (condition.trigger === 'held-item') {
    return replace(labels.value.triggerHeldItem, { resource: resourceLabel });
  }
  if (condition.trigger === 'ability') {
    return replace(labels.value.triggerAbility, { resource: resourceLabel });
  }
  if (condition.trigger === 'move' || condition.resourceKind === 'move') {
    return replace(labels.value.triggerMove, { resource: resourceLabel });
  }
  if (condition.trigger === 'gigantamax-factor') return labels.value.triggerGigantamax;
  return replace(labels.value.triggerOther, {
    trigger: formatResourceName(condition.trigger),
    resource: resourceLabel ? ` · ${resourceLabel}` : '',
  });
};
const openFormConditionResource = (condition) => {
  const kind = getFormConditionResourceKind(condition);
  if (kind && condition.name) emit('openResource', { kind, name: condition.name });
};
const getSpeciesSprite = (url) => getPokemonListSprite(
  getResourceId(url),
  props.spriteMode,
  props.isShiny,
);
const getItemSprite = (name) => itemsByName.value[name]?.sprites?.default
  || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(name)}.png`;

const formatConditions = (detail) => {
  const result = [];

  if (detail.versionGroup) {
    result.push({
      kind: 'text',
      text: replace(labels.value.versionGroup, {
        version: getVersionGroupLabel(detail.versionGroup, language.value),
      }),
    });
  } else if (detail.versionGroupId !== null) {
    result.push({
      kind: 'text',
      text: replace(labels.value.versionGroupNumber, { value: detail.versionGroupId }),
    });
  }

  if (detail.isDefault !== null) {
    result.push({
      kind: 'text',
      text: detail.isDefault ? labels.value.defaultEvolution : labels.value.alternateEvolution,
    });
  }

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
  if (detail.nearSpecialRock) result.push({ kind: 'text', text: labels.value.nearSpecialRock });
  if (detail.needsMultiplayer) result.push({ kind: 'text', text: labels.value.multiplayer });
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
  if (detail.region) {
    result.push({
      kind: 'text',
      text: replace(labels.value.region, { region: formatResourceName(detail.region) }),
    });
  }
  if (detail.usedMove) {
    result.push({
      kind: 'text',
      text: replace(labels.value.usedMove, { move: getMoveLabel(detail.usedMove) }),
    });
  }
  if (detail.minMoveCount !== null) {
    result.push({
      kind: 'text',
      text: replace(labels.value.moveCount, { value: detail.minMoveCount }),
    });
  }
  if (detail.minSteps !== null) {
    result.push({
      kind: 'text',
      text: replace(labels.value.steps, { value: detail.minSteps }),
    });
  }
  if (detail.minDamageTaken !== null) {
    result.push({
      kind: 'text',
      text: replace(labels.value.damageTaken, { value: detail.minDamageTaken }),
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

const loadRequirements = async (name, activePokemonName = '') => {
  const activeId = ++requestId;
  loading.value = true;
  hasError.value = false;
  transitions.value = [];
  currentSpecies.value = null;
  speciesByName.value = {};
  itemsByName.value = {};
  movesByName.value = {};
  locationsByName.value = {};
  abilitiesByName.value = {};
  formDetailsByName.value = {};
  formConditionGroups.value = [];

  try {
    const [speciesResponse, activeDetailsResponse, resolvedPokemonCatalog] = await Promise.all([
      PokeAPI.getPokemonSpecies(name),
      props.activePokemon?.name === activePokemonName
        ? Promise.resolve({ data: props.activePokemon })
        : activePokemonName
          ? PokeAPI.getPokemonDetails(activePokemonName)
          : Promise.resolve({ data: null }),
      loadGermanPokemonCatalog().catch(() => new Map()),
    ]);
    const species = speciesResponse.data;
    const activeDetails = activeDetailsResponse.data;
    const [evolutionResponse, formResults] = await Promise.all([
      species.evolution_chain?.url
        ? PokeAPI.getEvolutionChain(species.evolution_chain.url)
        : Promise.resolve({ data: { chain: null } }),
      Promise.allSettled((activeDetails?.forms || []).map((form) => (
        PokeAPI.getPokemonFormDetails(form.name)
      ))),
    ]);
    const resolvedTransitions = collectEvolutionTransitions(evolutionResponse.data.chain);
    const evolutionResources = collectEvolutionResourceNames(resolvedTransitions);
    const resolvedFormDetails = mapSettledByName(formResults);
    const resolvedFormConditions = normalizePokemonFormConditions(
      Object.values(resolvedFormDetails),
    );
    const formResources = collectPokemonFormConditionResources(resolvedFormConditions);
    const itemNames = [...new Set([...evolutionResources.items, ...formResources.items])];
    const moveNames = [...new Set([...evolutionResources.moves, ...formResources.moves])];

    const baseFormResultsPromise = Promise.allSettled(
      formResources.baseForms.map((formName) => PokeAPI.getPokemonFormDetails(formName)),
    );

    const [
      speciesResults,
      itemResults,
      moveResults,
      locationResults,
      abilityResults,
      baseFormResults,
    ] = await Promise.all([
      Promise.allSettled(evolutionResources.species.map((resourceName) => PokeAPI.getPokemonSpecies(resourceName))),
      Promise.allSettled(itemNames.map((resourceName) => PokeAPI.getItemDetails(resourceName))),
      Promise.allSettled(moveNames.map((resourceName) => PokeAPI.getMoveDetails(resourceName))),
      Promise.allSettled(evolutionResources.locations.map((resourceName) => PokeAPI.getLocationDetails(resourceName))),
      Promise.allSettled(formResources.abilities.map((resourceName) => PokeAPI.getAbilityDetails(resourceName))),
      baseFormResultsPromise,
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
    abilitiesByName.value = mapSettledByName(abilityResults);
    formDetailsByName.value = {
      ...resolvedFormDetails,
      ...mapSettledByName(baseFormResults),
    };
    formConditionGroups.value = resolvedFormConditions;
    pokemonCatalog.value = resolvedPokemonCatalog;
  } catch (error) {
    if (activeId !== requestId) return;
    console.error('Failed to load complete evolution requirements:', error);
    hasError.value = true;
  } finally {
    if (activeId === requestId) loading.value = false;
  }
};

watch(
  () => [props.pokemon?.name, props.activePokemon?.name],
  ([name, activePokemonName]) => {
    if (name) void loadRequirements(name, activePokemonName);
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

.requirements-content {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.form-condition-section {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.subsection-heading h4,
.subsection-heading p {
  margin: 0;
}

.subsection-heading h4 {
  font-size: 0.9rem;
}

.subsection-heading p {
  margin-top: 4px;
  color: var(--legacy-muted);
  font-size: 0.72rem;
  line-height: 1.45;
}

.form-condition-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.form-condition-card {
  display: grid;
  gap: 9px;
  min-width: 0;
  padding: 9px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.form-condition-identity {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
}

.form-condition-identity img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  image-rendering: pixelated;
}

.form-condition-identity div {
  display: grid;
  min-width: 0;
}

.form-condition-identity small {
  color: var(--legacy-muted);
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
}

.form-condition-identity strong {
  margin-top: 3px;
  overflow-wrap: anywhere;
  font-size: 0.82rem;
}

.transition-list {
  display: grid;
  gap: 10px;
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

.form-transition-path {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  padding: 7px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-muted);
  background: var(--legacy-page);
}

.form-transition-path > span:not([aria-hidden]) {
  display: grid;
  min-width: 0;
}

.form-transition-path small {
  font-size: 0.58rem;
  font-weight: 800;
  text-transform: uppercase;
}

.form-transition-path strong {
  margin-top: 2px;
  color: var(--legacy-text);
  font-size: 0.72rem;
  overflow-wrap: anywhere;
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
  .form-condition-grid {
    grid-template-columns: 1fr;
  }

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

  .form-transition-path {
    grid-template-columns: 1fr;
  }
}
</style>
