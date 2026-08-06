<template>
  <article class="pokemon-profile" :aria-busy="loading">
    <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>
    <p v-else-if="hasError" class="error-message" role="alert">{{ labels.loadError }}</p>

    <template v-else-if="activeConcreteDetails && species">
      <header class="profile-header" :style="profileStyle">
        <div class="profile-copy">
          <p class="profile-number">#{{ formatResourceId(species.id) }}</p>
          <h2>{{ displayName }}</h2>
          <div class="type-list">
            <span
              v-for="typeEntry in activeConcreteDetails.types"
              :key="typeEntry.type.name"
              class="type-badge"
              :style="{ backgroundColor: getTypeColor(typeEntry.type.name) }"
            >
              {{ getLocalizedTypeName(typeEntry.type.name, language) }}
            </span>
          </div>
          <div class="classification-list">
            <span v-for="classification in classifications" :key="classification">
              {{ getClassificationLabel(classification) }}
            </span>
          </div>
        </div>

        <div class="profile-sprite-frame">
          <img
            v-if="mainSprite"
            :src="mainSprite"
            :alt="`${displayName} ${spriteDescription}`"
            width="240"
            height="240"
            @error="useSpriteFallback"
          >
        </div>
      </header>

      <section v-if="profileFormOptions.length > 1" class="active-form-selector">
        <label>
          <span>{{ labels.activeForm }}</span>
          <select :value="activeConcreteDetails.name" @change="selectProfileForm">
            <option v-for="option in profileFormOptions" :key="option.name" :value="option.name">
              {{ option.label }} · {{ option.isDefault ? labels.standardForm : labels.variantForm }}
            </option>
          </select>
          <small>{{ labels.activeFormHint }}</small>
        </label>
      </section>

      <section class="description-card">
        <p :lang="language">{{ flavorText }}</p>
      </section>

      <dl class="facts-grid">
        <div>
          <dt>{{ labels.height }}</dt>
          <dd>{{ formatNumber(activeConcreteDetails.height / 10) }} m</dd>
        </div>
        <div>
          <dt>{{ labels.weight }}</dt>
          <dd>{{ formatNumber(activeConcreteDetails.weight / 10) }} kg</dd>
        </div>
        <div>
          <dt>{{ labels.captureRate }}</dt>
          <dd>{{ species.capture_rate }} / 255</dd>
        </div>
        <div>
          <dt>{{ labels.baseHappiness }}</dt>
          <dd>{{ species.base_happiness ?? labels.unknown }}</dd>
        </div>
        <div>
          <dt>{{ labels.baseExperience }}</dt>
          <dd>{{ activeConcreteDetails.base_experience ?? labels.unknown }}</dd>
        </div>
        <div>
          <dt>{{ labels.generation }}</dt>
          <dd>{{ getLocalizedGenerationName(species.generation?.name, language) }}</dd>
        </div>
        <div>
          <dt>{{ labels.abilities }}</dt>
          <dd>{{ formatAbilities(activeConcreteDetails.abilities) }}</dd>
        </div>
        <div>
          <dt>{{ labels.regionalNumbers }}</dt>
          <dd>{{ regionalNumberSummary }}</dd>
        </div>
        <div>
          <dt>{{ labels.weaknesses }}</dt>
          <dd>{{ formatTypeList(damageRelations.weaknesses) }}</dd>
        </div>
        <div>
          <dt>{{ labels.resistances }}</dt>
          <dd>{{ formatTypeList(damageRelations.resistances) }}</dd>
        </div>
        <div>
          <dt>{{ labels.immunities }}</dt>
          <dd>{{ formatTypeList(damageRelations.immunities) }}</dd>
        </div>
        <div>
          <dt>{{ labels.effectiveAgainst }}</dt>
          <dd>{{ formatTypeList(damageRelations.effectiveAgainst) }}</dd>
        </div>
      </dl>

      <section v-if="regularVariants.length" class="content-section variants-section">
        <div class="section-heading">
          <div>
            <p>{{ labels.variantsKicker }}</p>
            <h3>{{ labels.variantsTitle }}</h3>
          </div>
          <span>{{ regularVariants.length }}</span>
        </div>
        <p class="section-note">{{ labels.variantsNote }}</p>

        <div class="variant-grid">
          <article
            v-for="variant in regularVariants"
            :key="variant.name"
            class="variant-card"
            :style="getTypedCardStyle(variant.details?.types)"
          >
            <img
              :src="getVariantSprite(variant)"
              :alt="`${getVariantLabel(variant)} sprite`"
              width="126"
              height="126"
              loading="lazy"
            >
            <strong>{{ getVariantLabel(variant) }}</strong>
            <div class="compact-type-list">
              <span
                v-for="typeEntry in variant.details?.types || []"
                :key="typeEntry.type.name"
                :style="{ backgroundColor: getTypeColor(typeEntry.type.name) }"
              >
                {{ getLocalizedTypeName(typeEntry.type.name, language) }}
              </span>
            </div>
          </article>
        </div>
      </section>

      <section v-if="evolutionStages.length" class="content-section evolution-section">
        <div class="section-heading">
          <div>
            <p>{{ labels.evolutionKicker }}</p>
            <h3>{{ labels.evolutionTitle }}</h3>
          </div>
        </div>
        <p class="section-note">{{ labels.evolutionNote }}</p>

        <div class="evolution-stages">
          <section
            v-for="(stage, stageIndex) in evolutionStages"
            :key="stageIndex"
            class="evolution-stage"
          >
            <span class="stage-label">{{ labels.stage }} {{ stageIndex + 1 }}</span>
            <div class="evolution-stage-grid">
              <article v-for="entry in stage" :key="entry.name" class="evolution-node">
                <div v-if="entry.stage > 0" class="evolution-method">
                  <span class="down-arrow" aria-hidden="true">↓</span>
                  <button
                    v-if="entry.item"
                    type="button"
                    class="method-item"
                    @click="openItem(entry.item.name)"
                  >
                    <img
                      :src="entry.item.sprite"
                      :alt="getItemLabel(entry.item.name)"
                      width="38"
                      height="38"
                    >
                    <strong>{{ getItemLabel(entry.item.name) }}</strong>
                  </button>
                  <span>{{ entry.method }}</span>
                </div>

                <div class="evolution-card">
                  <img
                    :src="getPokemonListSprite(entry.id, spriteMode, isShiny)"
                    :alt="`${getEvolutionLabel(entry)} sprite`"
                    width="116"
                    height="116"
                    loading="lazy"
                  >
                  <strong>{{ getEvolutionLabel(entry) }}</strong>
                  <small>#{{ formatResourceId(entry.id) }}</small>
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>

      <section v-if="specialFormGroups.length" class="content-section special-section">
        <div class="section-heading">
          <div>
            <p>{{ labels.specialKicker }}</p>
            <h3>{{ labels.specialTitle }}</h3>
          </div>
        </div>
        <p class="section-note">{{ labels.specialNote }}</p>

        <section
          v-for="group in specialFormGroups"
          :key="group.sourceSpecies.name"
          class="special-group"
        >
          <article class="special-origin" :style="getTypedCardStyle(group.sourceDetails?.types)">
            <img
              :src="getPokemonSprite(group.sourceDetails, spriteMode, isShiny)"
              :alt="`${getSourceLabel(group)} sprite`"
              width="106"
              height="106"
            >
            <div>
              <span>{{ labels.normalOrigin }}</span>
              <strong>{{ getSourceLabel(group) }}</strong>
              <div class="compact-type-list">
                <span
                  v-for="typeEntry in group.sourceDetails?.types || []"
                  :key="typeEntry.type.name"
                  :style="{ backgroundColor: getTypeColor(typeEntry.type.name) }"
                >
                  {{ getLocalizedTypeName(typeEntry.type.name, language) }}
                </span>
              </div>
            </div>
          </article>

          <div class="sibling-connector" aria-hidden="true"></div>

          <div
            class="special-sibling-grid"
            :style="{ '--sibling-count': Math.max(1, group.forms.length) }"
          >
            <article v-for="form in group.forms" :key="form.name" class="special-sibling">
              <div class="special-method">
                <span class="down-arrow" aria-hidden="true">↓</span>
                <button
                  v-if="form.megaStone"
                  type="button"
                  class="method-item"
                  @click="openItem(form.megaStone.name)"
                >
                  <img
                    :src="form.megaStone.sprite"
                    :alt="getItemLabel(form.megaStone.name)"
                    width="38"
                    height="38"
                  >
                  <strong>{{ getItemLabel(form.megaStone.name) }}</strong>
                </button>
                <span>{{ getSpecialMethod(form) }}</span>
              </div>

              <div class="special-card" :style="getTypedCardStyle(form.details?.types)">
                <span class="form-kind">{{ getSpecialMethod(form) }}</span>
                <img
                  :src="getPokemonSprite(form.details, spriteMode, isShiny)"
                  :alt="`${getSpecialLabel(form, group)} sprite`"
                  width="150"
                  height="150"
                  loading="lazy"
                >
                <strong>{{ getSpecialLabel(form, group) }}</strong>
                <div class="compact-type-list">
                  <span
                    v-for="typeEntry in form.details?.types || []"
                    :key="typeEntry.type.name"
                    :style="{ backgroundColor: getTypeColor(typeEntry.type.name) }"
                  >
                    {{ getLocalizedTypeName(typeEntry.type.name, language) }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>

      <section class="tools-grid">
        <CaptureCalculator
          :capture-rate="species.capture_rate"
          :pokemon-details="activeConcreteDetails"
          :is-ultra-beast="classifications.includes('ultra-beast')"
        />
        <StatCalculator :pokemon-details="pokemonDetails" />
      </section>
    </template>
  </article>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import { loadGermanPokemonCatalog } from '@/services/localizationCatalog';
import { useActivePokemonForm } from '@/state/activePokemonForm';
import { getEvolutionItem } from '@/utils/evolution';
import { getFinalEvolutionSpeciesNames } from '@/utils/evolutionChain';
import {
  getLocalizedGenerationName,
  getLocalizedSpecialFormName,
  getLocalizedTypeName,
} from '@/utils/localization';
import { getPokemonClassifications } from '@/utils/pokemonClassification';
import {
  createPokemonVarietyOptions,
  getDefaultPokemonVariety,
  getPokemonFormLabel,
  isPokemonForSpecies,
  mapWithConcurrency,
  matchesPokemonReference,
  getSpecialBattleForms,
  isSpecialBattleForm,
} from '@/utils/pokemonForms';
import {
  formatResourceId,
  formatResourceName,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';
import { getPokemonListSprite, getPokemonSprite, getSpriteModeLabel } from '@/utils/sprites';
import { getTypeColor, getTypeGradient } from '@/utils/typeColors';
import CaptureCalculator from './CaptureCalculator.vue';
import StatCalculator from './StatCalculator.vue';

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

const emit = defineEmits(['detailsLoaded', 'openResource']);
const { language } = useI18n();
const {
  activePokemonForm,
  clearActivePokemonForm,
  initializeActivePokemonForm,
  setActivePokemonForm,
  setDefaultPokemonForm,
} = useActivePokemonForm();
const MAX_PARALLEL_REQUESTS = 6;

const emptyDamageRelations = () => ({
  immunities: [],
  weaknesses: [],
  resistances: [],
  effectiveAgainst: [],
});

const pokemonDetails = ref(null);
const species = ref(null);
const pokemonCatalog = ref(new Map());
const rawEvolutionChain = ref(null);
const damageRelations = ref(emptyDamageRelations());
const variantDetailsByName = ref({});
const evolutionSpeciesByName = ref({});
const finalSpecies = ref([]);
const finalPokemonDetailsByName = ref({});
const specialFormDetailsByName = ref({});
const itemDetailsByName = ref({});
const loading = ref(false);
const hasError = ref(false);
let activeRequestId = 0;
let activeDamageRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      loading: 'Pokémon-Profil wird geladen…',
      loadError: 'Das Pokémon-Profil konnte nicht geladen werden.',
      height: 'Größe',
      weight: 'Gewicht',
      captureRate: 'Basis-Fangrate',
      baseHappiness: 'Basis-Zuneigung',
      baseExperience: 'Basis-Erfahrung',
      generation: 'Generation',
      abilities: 'Fähigkeiten',
      activeForm: 'Aktive Pokémon-Form',
      activeFormHint: 'Sprite, Typen, Fähigkeiten, Werte, Rechner und Attacken verwenden gemeinsam diese konkrete Form.',
      standardForm: 'Standardform',
      variantForm: 'Form',
      regionalNumbers: 'Regionale Nummern',
      weaknesses: 'Schwächen',
      resistances: 'Resistenzen',
      immunities: 'Immunitäten',
      effectiveAgainst: 'Effektiv gegen',
      unknown: 'Unbekannt',
      none: 'Keine',
      hidden: 'versteckt',
      variantsKicker: 'Artenzugehörige Formen',
      variantsTitle: 'Varianten',
      variantsNote: 'Varianten teilen sich die nationale Pokédex-Nummer der Art und werden nicht als eigene Pokédex-Einträge geführt.',
      evolutionKicker: 'Entwicklungslogik',
      evolutionTitle: 'Entwicklungsreihe',
      evolutionNote: 'Jede Verzweigung gehört direkt zur vorherigen Entwicklungsstufe. Items und Bedingungen stehen am jeweiligen Übergang.',
      stage: 'Stufe',
      specialKicker: 'Kampfformen',
      specialTitle: 'Mega- und Gigadynamax-Formen',
      specialNote: 'Alle Spezialformen zweigen parallel von der normalen Endentwicklung ab. Eine Gigadynamax-Form entsteht niemals aus einer Mega-Form.',
      normalOrigin: 'Normale Endentwicklung',
      mega: 'Mega-Entwicklung',
      gmax: 'Gigadynamax-Form',
      levelUp: 'Levelaufstieg',
      trade: 'Tausch',
      useItem: '{item} verwenden',
      holding: 'mit {item}',
      happiness: 'mindestens {value} Freundschaft',
      affection: 'mindestens {value} Zutrauen',
      beauty: 'mindestens {value} Schönheit',
      during: 'bei {value}',
      knowingMove: 'mit {move}',
      knowingType: 'mit einer {type}-Attacke',
      atLocation: 'bei {location}',
      raining: 'bei Regen',
      upsideDown: 'Gerät auf den Kopf drehen',
      partySpecies: 'mit {species} im Team',
      partyType: 'mit einem {type}-Pokémon im Team',
      tradeSpecies: 'gegen {species}',
    }
  : {
      loading: 'Loading Pokémon profile…',
      loadError: 'The Pokémon profile could not be loaded.',
      height: 'Height',
      weight: 'Weight',
      captureRate: 'Base capture rate',
      baseHappiness: 'Base happiness',
      baseExperience: 'Base experience',
      generation: 'Generation',
      abilities: 'Abilities',
      activeForm: 'Active Pokémon form',
      activeFormHint: 'Sprite, types, abilities, stats, calculator and moves all use this concrete form.',
      standardForm: 'Default form',
      variantForm: 'Form',
      regionalNumbers: 'Regional numbers',
      weaknesses: 'Weaknesses',
      resistances: 'Resistances',
      immunities: 'Immunities',
      effectiveAgainst: 'Effective against',
      unknown: 'Unknown',
      none: 'None',
      hidden: 'hidden',
      variantsKicker: 'Species varieties',
      variantsTitle: 'Variants',
      variantsNote: 'Variants share the species National Pokédex number and are not separate numbered Pokédex entries.',
      evolutionKicker: 'Evolution logic',
      evolutionTitle: 'Evolution chain',
      evolutionNote: 'Every branch belongs directly to the preceding evolution stage. Items and conditions are attached to the corresponding transition.',
      stage: 'Stage',
      specialKicker: 'Battle forms',
      specialTitle: 'Mega and Gigantamax forms',
      specialNote: 'All special forms branch in parallel from the normal final evolution. A Gigantamax form never evolves from a Mega form.',
      normalOrigin: 'Normal final evolution',
      mega: 'Mega Evolution',
      gmax: 'Gigantamax form',
      levelUp: 'Level up',
      trade: 'Trade',
      useItem: 'Use {item}',
      holding: 'holding {item}',
      happiness: '{value}+ happiness',
      affection: '{value}+ affection',
      beauty: '{value}+ beauty',
      during: 'during {value}',
      knowingMove: 'knowing {move}',
      knowingType: 'knowing a {type} move',
      atLocation: 'at {location}',
      raining: 'while raining',
      upsideDown: 'with the device upside down',
      partySpecies: 'with {species} in the party',
      partyType: 'with a {type} Pokémon in the party',
      tradeSpecies: 'for {species}',
    });

const classificationLabels = computed(() => language.value === 'de'
  ? {
      legendary: 'Legendär',
      mythical: 'Mysteriös',
      starter: 'Starter',
      fossil: 'Fossil',
      'ultra-beast': 'Ultrabestie',
      paradox: 'Paradox',
      baby: 'Baby-Pokémon',
      regular: 'Regulär',
    }
  : {
      legendary: 'Legendary',
      mythical: 'Mythical',
      starter: 'Starter',
      fossil: 'Fossil',
      'ultra-beast': 'Ultra Beast',
      paradox: 'Paradox',
      baby: 'Baby Pokémon',
      regular: 'Regular',
    });

const activeConcreteDetails = computed(() => (
  activePokemonForm.value
  && species.value
  && isPokemonForSpecies(activePokemonForm.value, species.value)
    ? activePokemonForm.value
    : pokemonDetails.value
));
const profileFormOptions = computed(() => createPokemonVarietyOptions({
  species: species.value || {},
  detailsByName: variantDetailsByName.value,
  catalog: pokemonCatalog.value,
  language: language.value,
}));
const displayName = computed(() => activeConcreteDetails.value
  ? getPokemonFormLabel({
      details: activeConcreteDetails.value,
      species: species.value || {},
      catalog: pokemonCatalog.value,
      language: language.value,
    })
  : '');
const mainSprite = computed(() => getPokemonSprite(
  activeConcreteDetails.value,
  props.spriteMode,
  props.isShiny,
));
const spriteDescription = computed(() => {
  const shinyLabel = props.isShiny
    ? (language.value === 'de' ? 'Shiny' : 'shiny')
    : (language.value === 'de' ? 'normal' : 'normal');
  return `${shinyLabel} ${getSpriteModeLabel(props.spriteMode, language.value)}`;
});
const profileStyle = computed(() => ({
  '--pokemon-gradient': getTypeGradient(activeConcreteDetails.value?.types || []),
}));
const classifications = computed(() => getPokemonClassifications(
  species.value?.id,
  species.value,
));
const flavorText = computed(() => {
  const entries = species.value?.flavor_text_entries || [];
  const localized = entries.find((entry) => entry.language?.name === language.value)
    || entries.find((entry) => entry.language?.name === 'en');
  return localized?.flavor_text?.replace(/[\n\f]+/g, ' ') || labels.value.unknown;
});
const regionalNumberSummary = computed(() => {
  const entries = species.value?.pokedex_numbers || [];

  if (!entries.length) {
    return labels.value.none;
  }

  return entries
    .slice(0, 8)
    .map((entry) => `${formatResourceName(entry.pokedex.name)} #${entry.entry_number}`)
    .join(' · ');
});
const regularVariants = computed(() => profileFormOptions.value.filter((option) => (
  !option.isDefault && !isSpecialBattleForm(option.name)
)));

const resolveEvolutionNode = (node, stage = 0) => {
  const currentEntry = {
    id: getResourceId(node.species?.url),
    name: node.species?.name || '',
    stage,
    method: formatEvolutionMethod(node.evolution_details || []),
    item: getEvolutionItem(node.evolution_details || []),
  };
  const descendants = (node.evolves_to || []).flatMap((child) => {
    return resolveEvolutionNode(child, stage + 1);
  });
  return [currentEntry, ...descendants];
};
const evolutionEntries = computed(() => {
  return rawEvolutionChain.value ? resolveEvolutionNode(rawEvolutionChain.value) : [];
});
const evolutionStages = computed(() => {
  const stages = [];

  for (const entry of evolutionEntries.value) {
    stages[entry.stage] ||= [];
    stages[entry.stage].push(entry);
  }

  return stages.filter(Boolean);
});
const specialFormGroups = computed(() => {
  return finalSpecies.value
    .map((sourceSpecies) => {
      const forms = getSpecialBattleForms(sourceSpecies.varieties || [])
        .map((form) => ({
          ...form,
          details: specialFormDetailsByName.value[form.name] || null,
        }));

      if (!forms.length) {
        return null;
      }

      return {
        sourceSpecies,
        sourceDetails: finalPokemonDetailsByName.value[sourceSpecies.name] || null,
        forms,
      };
    })
    .filter(Boolean);
});

const getClassificationLabel = (classification) => {
  return classificationLabels.value[classification] || classification;
};
const formatNumber = (value) => new Intl.NumberFormat(
  language.value === 'de' ? 'de-DE' : 'en-US',
  { maximumFractionDigits: 1 },
).format(value);
const formatAbilities = (abilities = []) => abilities
  .map((entry) => {
    const abilityName = formatResourceName(entry.ability?.name);
    return entry.is_hidden ? `${abilityName} (${labels.value.hidden})` : abilityName;
  })
  .join(', ') || labels.value.none;
const formatTypeList = (types = []) => types.length
  ? types.map((type) => getLocalizedTypeName(type, language.value)).join(', ')
  : labels.value.none;
const getItemLabel = (name) => getLocalizedName(
  itemDetailsByName.value[name]?.names,
  name,
  language.value,
);
const getVariantLabel = (variant) => getPokemonFormLabel({
  details: variant.details,
  species: species.value || {},
  catalog: pokemonCatalog.value,
  language: language.value,
});
const getVariantSprite = (variant) => getPokemonSprite(
  variant.details,
  props.spriteMode,
  props.isShiny,
) || getPokemonListSprite(variant.id, props.spriteMode, props.isShiny);
const getEvolutionLabel = (entry) => getLocalizedName(
  evolutionSpeciesByName.value[entry.name]?.names,
  entry.name,
  language.value,
);
const getSourceLabel = (group) => getLocalizedName(
  group.sourceSpecies.names,
  group.sourceSpecies.name,
  language.value,
);
const getSpecialMethod = (form) => form.kind === 'mega'
  ? labels.value.mega
  : labels.value.gmax;
const getSpecialLabel = (form, group) => getLocalizedSpecialFormName({
  formName: form.name,
  sourceName: getSourceLabel(group),
  kind: form.kind,
  language: language.value,
});
const getTypedCardStyle = (types = []) => types?.length
  ? { background: getTypeGradient(types) }
  : {};
const selectProfileForm = (event) => {
  const option = profileFormOptions.value.find((entry) => entry.name === event.target.value);
  if (option) setActivePokemonForm(option.details);
};
const openItem = (name) => emit('openResource', { kind: 'items', name });
const useSpriteFallback = (event) => {
  const fallback = getPokemonListSprite(species.value?.id, 'pixel', props.isShiny);

  if (event.currentTarget.src !== fallback) {
    event.currentTarget.src = fallback;
  }
};

const replaceLabel = (template, replacements) => {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replace(`{${key}}`, value);
  }, template);
};

const formatEvolutionDetail = (detail) => {
  const parts = [];
  const trigger = detail.trigger?.name;

  if (trigger === 'level-up') {
    parts.push(detail.min_level ? `Level ${detail.min_level}` : labels.value.levelUp);
  } else if (trigger === 'use-item') {
    parts.push(replaceLabel(labels.value.useItem, {
      item: getItemLabel(detail.item?.name || 'item'),
    }));
  } else if (trigger === 'trade') {
    parts.push(labels.value.trade);
  } else if (trigger) {
    parts.push(formatResourceName(trigger));
  }

  if (detail.held_item) {
    parts.push(replaceLabel(labels.value.holding, { item: getItemLabel(detail.held_item.name) }));
  }

  if (detail.min_happiness) {
    parts.push(replaceLabel(labels.value.happiness, { value: detail.min_happiness }));
  }

  if (detail.min_affection) {
    parts.push(replaceLabel(labels.value.affection, { value: detail.min_affection }));
  }

  if (detail.min_beauty) {
    parts.push(replaceLabel(labels.value.beauty, { value: detail.min_beauty }));
  }

  if (detail.time_of_day) {
    parts.push(replaceLabel(labels.value.during, { value: detail.time_of_day }));
  }

  if (detail.known_move) {
    parts.push(replaceLabel(labels.value.knowingMove, {
      move: formatResourceName(detail.known_move.name),
    }));
  }

  if (detail.known_move_type) {
    parts.push(replaceLabel(labels.value.knowingType, {
      type: getLocalizedTypeName(detail.known_move_type.name, language.value),
    }));
  }

  if (detail.location) {
    parts.push(replaceLabel(labels.value.atLocation, {
      location: formatResourceName(detail.location.name),
    }));
  }

  if (detail.needs_overworld_rain) {
    parts.push(labels.value.raining);
  }

  if (detail.turn_upside_down) {
    parts.push(labels.value.upsideDown);
  }

  if (detail.party_species) {
    parts.push(replaceLabel(labels.value.partySpecies, {
      species: formatResourceName(detail.party_species.name),
    }));
  }

  if (detail.party_type) {
    parts.push(replaceLabel(labels.value.partyType, {
      type: getLocalizedTypeName(detail.party_type.name, language.value),
    }));
  }

  if (detail.trade_species) {
    parts.push(replaceLabel(labels.value.tradeSpecies, {
      species: formatResourceName(detail.trade_species.name),
    }));
  }

  return parts.join(' · ');
};

const formatEvolutionMethod = (details = []) => details
  .map(formatEvolutionDetail)
  .filter(Boolean)
  .join(' / ');

const collectEvolutionItemNames = (node) => {
  if (!node) {
    return [];
  }

  return [
    ...(node.evolution_details || [])
      .flatMap((detail) => [detail.item?.name, detail.held_item?.name])
      .filter(Boolean),
    ...(node.evolves_to || []).flatMap(collectEvolutionItemNames),
  ];
};

const loadResources = (resources, loader, resourceKind) => mapWithConcurrency(
  [...resources],
  async (resource) => {
    try {
      const response = await loader(resource);
      return response.data;
    } catch (error) {
      const name = resource?.name || resource;
      console.error(`Failed to load ${resourceKind} ${name}:`, error);
      return null;
    }
  },
  MAX_PARALLEL_REQUESTS,
);

const loadActiveDamageRelations = async (details) => {
  const requestId = ++activeDamageRequestId;
  damageRelations.value = emptyDamageRelations();
  if (!details?.types?.length) return;

  try {
    const relations = await PokeAPI.getPokemonDamageRelations(details.types);
    if (
      requestId === activeDamageRequestId
      && activeConcreteDetails.value?.name === details.name
    ) {
      damageRelations.value = relations;
    }
  } catch (error) {
    if (requestId === activeDamageRequestId) {
      console.error(`Failed to load damage relations for ${details.name}:`, error);
    }
  }
};

const loadProfile = async (name) => {
  const requestId = ++activeRequestId;
  activeDamageRequestId += 1;
  loading.value = true;
  hasError.value = false;
  clearActivePokemonForm();
  pokemonDetails.value = null;
  species.value = null;
  rawEvolutionChain.value = null;
  damageRelations.value = emptyDamageRelations();
  variantDetailsByName.value = {};
  evolutionSpeciesByName.value = {};
  finalSpecies.value = [];
  finalPokemonDetailsByName.value = {};
  specialFormDetailsByName.value = {};
  itemDetailsByName.value = {};
  emit('detailsLoaded', null);

  try {
    const detailsResponse = await PokeAPI.getPokemonDetails(name);
    const details = detailsResponse.data;
    if (!matchesPokemonReference(details, props.pokemon)) {
      throw new Error(`Pokémon response did not match requested variety ${name}.`);
    }

    const speciesName = details.species?.name;
    if (!speciesName) throw new Error(`Pokémon ${details.name} has no species reference.`);

    const speciesResponse = await PokeAPI.getPokemonSpecies(speciesName);
    const resolvedSpecies = speciesResponse.data;
    if (!isPokemonForSpecies(details, resolvedSpecies)) {
      throw new Error(`Pokémon ${details.name} does not belong to species ${resolvedSpecies.name}.`);
    }

    const [evolutionResult, catalogResult] = await Promise.allSettled([
      resolvedSpecies.evolution_chain?.url
        ? PokeAPI.getEvolutionChain(resolvedSpecies.evolution_chain.url)
        : Promise.resolve({ data: { chain: null } }),
      language.value === 'de' ? loadGermanPokemonCatalog() : Promise.resolve(new Map()),
    ]);

    if (requestId !== activeRequestId) {
      return;
    }

    pokemonDetails.value = details;
    species.value = resolvedSpecies;
    pokemonCatalog.value = catalogResult.status === 'fulfilled'
      ? catalogResult.value
      : new Map();
    variantDetailsByName.value = { [details.name]: details };
    rawEvolutionChain.value = evolutionResult.status === 'fulfilled'
      ? evolutionResult.value.data.chain
      : null;
    if (!initializeActivePokemonForm(details, resolvedSpecies)) {
      throw new Error(`Unable to initialize the active form for ${details.name}.`);
    }

    const evolutionNames = rawEvolutionChain.value
      ? resolveEvolutionNode(rawEvolutionChain.value).map((entry) => entry.name)
      : [resolvedSpecies.name];
    const finalNames = rawEvolutionChain.value
      ? getFinalEvolutionSpeciesNames(rawEvolutionChain.value)
      : [resolvedSpecies.name];
    const varietyReferences = (resolvedSpecies.varieties || [])
      .map((variety) => variety.pokemon)
      .filter((reference) => reference?.name && reference.name !== details.name);

    const [variantResults, evolutionSpeciesResults, finalSpeciesResults] = await Promise.all([
      loadResources(varietyReferences, (reference) => PokeAPI.getPokemonDetails(reference.name), 'Pokémon variety'),
      loadResources([...new Set(evolutionNames)], PokeAPI.getPokemonSpecies, 'Pokémon species'),
      loadResources([...new Set(finalNames)], PokeAPI.getPokemonSpecies, 'final Pokémon species'),
    ]);

    if (requestId !== activeRequestId) {
      return;
    }

    variantDetailsByName.value = Object.fromEntries(
      [details, ...variantResults.filter(Boolean)].map((entry) => [entry.name, entry]),
    );
    evolutionSpeciesByName.value = Object.fromEntries(
      evolutionSpeciesResults.filter(Boolean).map((entry) => [entry.name, entry]),
    );
    finalSpecies.value = finalSpeciesResults.filter(Boolean);

    const verifiedOptions = createPokemonVarietyOptions({
      species: resolvedSpecies,
      detailsByName: variantDetailsByName.value,
      catalog: pokemonCatalog.value,
      language: language.value,
    });
    const defaultOption = getDefaultPokemonVariety(verifiedOptions);
    if (defaultOption) setDefaultPokemonForm(defaultOption.details);

    const specialForms = finalSpecies.value.flatMap((entry) => {
      return getSpecialBattleForms(entry.varieties || []);
    });
    const itemNames = [...new Set([
      ...collectEvolutionItemNames(rawEvolutionChain.value),
      ...specialForms.map((form) => form.megaStone?.name).filter(Boolean),
    ])];

    const [sourceResults, specialResults, itemResults] = await Promise.all([
      loadResources(finalSpecies.value, (entry) => {
        const defaultName = entry.varieties?.find((variety) => variety.is_default)?.pokemon?.name
          || entry.name;
        return PokeAPI.getPokemonDetails(defaultName);
      }, 'default Pokémon variety'),
      loadResources(specialForms, (form) => PokeAPI.getPokemonDetails(form.name), 'special Pokémon form'),
      loadResources(itemNames, PokeAPI.getItemDetails, 'item'),
    ]);

    if (requestId !== activeRequestId) {
      return;
    }

    finalPokemonDetailsByName.value = Object.fromEntries(
      sourceResults.filter(Boolean).map((entry) => [entry.species?.name || entry.name, entry]),
    );
    specialFormDetailsByName.value = Object.fromEntries(
      specialResults.filter(Boolean).map((entry) => [entry.name, entry]),
    );
    itemDetailsByName.value = Object.fromEntries(
      itemResults.filter(Boolean).map((entry) => [entry.name, entry]),
    );
  } catch (requestError) {
    if (requestId !== activeRequestId) {
      return;
    }

    console.error('Failed to load Pokémon profile:', requestError);
    hasError.value = true;
    emit('detailsLoaded', null);
  } finally {
    if (requestId === activeRequestId) {
      loading.value = false;
    }
  }
};

watch(
  () => props.pokemon?.name,
  (name) => {
    if (name) {
      void loadProfile(name);
    }
  },
  { immediate: true },
);

watch(activePokemonForm, (details) => {
  if (!details || !species.value || !isPokemonForSpecies(details, species.value)) return;
  emit('detailsLoaded', details);
  void loadActiveDamageRelations(details);
});

watch(language, async (nextLanguage) => {
  if (nextLanguage !== 'de') {
    pokemonCatalog.value = new Map();
    return;
  }

  try {
    pokemonCatalog.value = await loadGermanPokemonCatalog();
  } catch (error) {
    console.error('Failed to load German Pokémon form names:', error);
  }
});

onBeforeUnmount(() => {
  activeRequestId += 1;
  activeDamageRequestId += 1;
  clearActivePokemonForm(species.value || undefined);
});
</script>

<style scoped>
.pokemon-profile {
  min-width: 0;
  padding: clamp(18px, 2vw, 28px);
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
}

.error-message {
  color: #b91c1c;
}

.profile-header {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, 260px);
  gap: 22px;
  align-items: center;
  min-height: 270px;
  overflow: hidden;
  padding: clamp(20px, 3vw, 34px);
  border: 1px solid var(--legacy-border);
  background: var(--pokemon-gradient, var(--legacy-page));
}

.profile-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.profile-number {
  margin: 0 0 8px;
  color: rgba(51, 51, 51, 0.72);
  font-weight: 900;
  letter-spacing: 0.12em;
}

.profile-header h2 {
  max-width: 100%;
  margin: 0;
  overflow-wrap: anywhere;
  color: #333333;
  font-size: clamp(2.2rem, 5vw, 4.8rem);
  line-height: 0.95;
  letter-spacing: -0.045em;
}

.profile-sprite-frame {
  position: relative;
  z-index: 1;
  display: grid;
  width: 100%;
  max-width: 260px;
  aspect-ratio: 1;
  justify-self: end;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(51, 51, 51, 0.2);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.profile-sprite-frame img {
  width: 92%;
  height: 92%;
  object-fit: contain;
  image-rendering: pixelated;
}

.active-form-selector {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.active-form-selector label {
  display: grid;
  gap: 6px;
  color: var(--legacy-muted);
  font-size: 0.75rem;
  font-weight: 850;
}

.active-form-selector select {
  width: 100%;
  min-height: 40px;
  padding: 7px 9px;
  border: 1px solid var(--legacy-border-strong);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-surface);
}

.active-form-selector small {
  font-size: 0.68rem;
  font-weight: 500;
  line-height: 1.45;
}

.type-list,
.classification-list,
.compact-type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-list {
  margin-top: 18px;
}

.type-badge,
.compact-type-list span {
  padding: 5px 9px;
  border: 1px solid rgba(51, 51, 51, 0.2);
  border-radius: 4px;
  color: #333333;
  font-size: 0.72rem;
  font-weight: 900;
}

.classification-list {
  margin-top: 8px;
}

.classification-list span {
  padding: 4px 8px;
  border: 1px solid rgba(51, 51, 51, 0.24);
  border-radius: 999px;
  color: #333333;
  font-size: 0.66rem;
  font-weight: 850;
  background: rgba(255, 255, 255, 0.64);
}

.description-card {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.description-card p {
  margin: 0;
  line-height: 1.6;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
  margin: 16px 0 0;
}

.facts-grid div {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.facts-grid dt {
  margin-bottom: 5px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.facts-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 0.86rem;
  font-weight: 750;
  line-height: 1.45;
}

.content-section {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--legacy-border);
}

.section-heading {
  display: flex;
  gap: 14px;
  justify-content: space-between;
  align-items: end;
}

.section-heading p {
  margin: 0 0 4px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.section-heading h3 {
  margin: 0;
  font-size: 1.2rem;
}

.section-heading > span {
  color: var(--legacy-muted);
  font-size: 0.75rem;
}

.section-note {
  margin: 8px 0 0;
  color: var(--legacy-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}

.variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.variant-card,
.special-card {
  display: grid;
  min-width: 0;
  justify-items: center;
  align-content: center;
  padding: 14px;
  border: 1px solid var(--legacy-border-strong);
  color: #333333;
  text-align: center;
}

.variant-card img,
.special-card img,
.special-origin img,
.evolution-card img,
.method-item img {
  object-fit: contain;
  image-rendering: pixelated;
}

.variant-card img {
  width: 126px;
  height: 126px;
}

.variant-card strong,
.special-card strong {
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.compact-type-list {
  justify-content: center;
  margin-top: 7px;
}

.evolution-stages {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.evolution-stage {
  display: grid;
  justify-items: center;
}

.stage-label {
  margin-bottom: 7px;
  color: var(--legacy-muted);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.evolution-stage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
  width: 100%;
}

.evolution-node {
  display: grid;
  min-width: 0;
  justify-items: center;
}

.evolution-method,
.special-method {
  display: grid;
  min-height: 72px;
  justify-items: center;
  align-content: center;
  margin-bottom: 6px;
  color: var(--legacy-muted);
  font-size: 0.7rem;
  line-height: 1.35;
  text-align: center;
}

.down-arrow {
  color: var(--legacy-text);
  font-size: 1.6rem;
  line-height: 1;
}

.method-item {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 2px 4px;
  border: 0;
  color: var(--legacy-text);
  cursor: pointer;
  background: transparent;
}

.method-item:hover strong,
.method-item:focus-visible strong {
  text-decoration: underline;
}

.method-item img {
  width: 38px;
  height: 38px;
}

.method-item strong {
  max-width: 100px;
  overflow-wrap: anywhere;
  font-size: 0.68rem;
}

.evolution-card {
  display: grid;
  width: 100%;
  min-height: 170px;
  justify-items: center;
  align-content: center;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.evolution-card img {
  width: 116px;
  height: 116px;
}

.evolution-card small {
  margin-top: 3px;
  color: var(--legacy-muted);
}

.special-group {
  display: grid;
  justify-items: center;
  margin-top: 18px;
}

.special-origin {
  display: grid;
  grid-template-columns: 106px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  width: min(100%, 440px);
  padding: 12px;
  border: 1px solid var(--legacy-border-strong);
  color: #333333;
}

.special-origin img {
  width: 106px;
  height: 106px;
}

.special-origin > div {
  display: grid;
  min-width: 0;
}

.special-origin > div > span {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.special-origin > div > strong {
  margin-top: 3px;
  font-size: 1.08rem;
}

.sibling-connector {
  position: relative;
  width: min(92%, 1040px);
  height: 34px;
}

.sibling-connector::before {
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 18px;
  content: '';
  background: var(--legacy-border-strong);
}

.sibling-connector::after {
  position: absolute;
  top: 17px;
  right: 0;
  left: 0;
  height: 2px;
  content: '';
  background: var(--legacy-border-strong);
}

.special-sibling-grid {
  display: grid;
  grid-template-columns: repeat(var(--sibling-count), minmax(180px, 1fr));
  gap: 10px;
  width: 100%;
  overflow-x: auto;
}

.special-sibling {
  position: relative;
  display: grid;
  min-width: 180px;
}

.special-sibling::before {
  position: absolute;
  top: -17px;
  left: 50%;
  width: 2px;
  height: 20px;
  content: '';
  background: var(--legacy-border-strong);
}

.special-card {
  min-height: 250px;
}

.special-card img {
  width: 150px;
  height: 150px;
}

.form-kind {
  padding: 4px 8px;
  border: 1px solid rgba(51, 51, 51, 0.25);
  border-radius: 4px;
  font-size: 0.66rem;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.7);
}

.tools-grid {
  display: grid;
  gap: 14px;
  margin-top: 22px;
}

@media (max-width: 1280px) {
  .facts-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .pokemon-profile {
    padding: 12px;
  }

  .profile-header {
    grid-template-columns: minmax(0, 1fr) 110px;
    gap: 10px;
    min-height: 190px;
    padding: 14px;
  }

  .profile-header h2 {
    font-size: clamp(1.7rem, 9vw, 2.8rem);
  }

  .profile-sprite-frame {
    width: 110px;
  }

  .facts-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .special-sibling-grid {
    grid-template-columns: repeat(var(--sibling-count), minmax(155px, 1fr));
  }

  .special-card {
    min-height: 220px;
  }

  .special-card img {
    width: 125px;
    height: 125px;
  }
}

@media (max-width: 420px) {
  .profile-header {
    grid-template-columns: minmax(0, 1fr) 82px;
  }

  .profile-sprite-frame {
    width: 82px;
  }

  .facts-grid {
    grid-template-columns: 1fr;
  }

  .special-origin {
    grid-template-columns: 78px minmax(0, 1fr);
  }

  .special-origin img {
    width: 78px;
    height: 78px;
  }
}
</style>
