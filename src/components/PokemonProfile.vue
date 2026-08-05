<template>
  <article class="pokemon-profile" :aria-busy="loading">
    <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>
    <p v-else-if="hasError" class="error-message" role="alert">{{ labels.loadError }}</p>

    <template v-else-if="pokemonDetails && species">
      <header class="profile-header" :style="profileStyle">
        <div class="profile-copy">
          <p class="profile-number">#{{ formatResourceId(species.id) }}</p>
          <h2>{{ displayName }}</h2>
          <div class="type-list">
            <span
              v-for="typeEntry in pokemonDetails.types"
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

      <section class="description-card">
        <p :lang="language">{{ flavorText }}</p>
      </section>

      <dl class="facts-grid">
        <div>
          <dt>{{ labels.height }}</dt>
          <dd>{{ formatNumber(pokemonDetails.height / 10) }} m</dd>
        </div>
        <div>
          <dt>{{ labels.weight }}</dt>
          <dd>{{ formatNumber(pokemonDetails.weight / 10) }} kg</dd>
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
          <dd>{{ pokemonDetails.base_experience ?? labels.unknown }}</dd>
        </div>
        <div>
          <dt>{{ labels.generation }}</dt>
          <dd>{{ getLocalizedGenerationName(species.generation?.name, language) }}</dd>
        </div>
        <div>
          <dt>{{ labels.abilities }}</dt>
          <dd>{{ formatAbilities(pokemonDetails.abilities) }}</dd>
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
          :pokemon-details="pokemonDetails"
          :is-ultra-beast="classifications.includes('ultra-beast')"
        />
        <StatCalculator :pokemon-details="pokemonDetails" />
      </section>
    </template>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import { getEvolutionItem } from '@/utils/evolution';
import { getFinalEvolutionSpeciesNames } from '@/utils/evolutionChain';
import {
  getLocalizedGenerationName,
  getLocalizedSpecialFormName,
  getLocalizedTypeName,
} from '@/utils/localization';
import { getPokemonClassifications } from '@/utils/pokemonClassification';
import { getSpecialBattleForms, isSpecialBattleForm } from '@/utils/pokemonForms';
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

const emptyDamageRelations = () => ({
  immunities: [],
  weaknesses: [],
  resistances: [],
  effectiveAgainst: [],
});

const pokemonDetails = ref(null);
const species = ref(null);
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

const displayName = computed(() => getLocalizedName(
  species.value?.names,
  pokemonDetails.value?.name,
  language.value,
));
const mainSprite = computed(() => getPokemonSprite(
  pokemonDetails.value,
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
  '--pokemon-gradient': getTypeGradient(pokemonDetails.value?.types || []),
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
const regularVariants = computed(() => {
  return (species.value?.varieties || [])
    .filter((variety) => !variety.is_default && !isSpecialBattleForm(variety.pokemon?.name))
    .map((variety) => ({
      name: variety.pokemon.name,
      id: getResourceId(variety.pokemon.url),
      details: variantDetailsByName.value[variety.pokemon.name] || null,
    }));
});

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
const getVariantLabel = (variant) => getLocalizedName(
  variant.details?.forms?.[0]?.names,
  variant.name,
  language.value,
);
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

const formatEvolutionMethod = (details = []) => {
  const detail = details[0];

  if (!detail) {
    return '';
  }

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

const loadProfile = async (name) => {
  const requestId = ++activeRequestId;
  loading.value = true;
  hasError.value = false;
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
    const [detailsResponse, speciesResponse] = await Promise.all([
      PokeAPI.getPokemonDetails(name),
      PokeAPI.getPokemonSpecies(name),
    ]);
    const details = detailsResponse.data;
    const resolvedSpecies = speciesResponse.data;
    const [damageResult, evolutionResult] = await Promise.allSettled([
      PokeAPI.getPokemonDamageRelations(details.types),
      resolvedSpecies.evolution_chain?.url
        ? PokeAPI.getEvolutionChain(resolvedSpecies.evolution_chain.url)
        : Promise.resolve({ data: { chain: null } }),
    ]);

    if (requestId !== activeRequestId) {
      return;
    }

    pokemonDetails.value = details;
    species.value = resolvedSpecies;
    damageRelations.value = damageResult.status === 'fulfilled'
      ? damageResult.value
      : emptyDamageRelations();
    rawEvolutionChain.value = evolutionResult.status === 'fulfilled'
      ? evolutionResult.value.data.chain
      : null;
    emit('detailsLoaded', details);

    const evolutionNames = rawEvolutionChain.value
      ? resolveEvolutionNode(rawEvolutionChain.value).map((entry) => entry.name)
      : [resolvedSpecies.name];
    const finalNames = rawEvolutionChain.value
      ? getFinalEvolutionSpeciesNames(rawEvolutionChain.value)
      : [resolvedSpecies.name];
    const variantNames = (resolvedSpecies.varieties || [])
      .filter((variety) => !variety.is_default)
      .map((variety) => variety.pokemon.name);

    const [variantResults, evolutionSpeciesResults, finalSpeciesResults] = await Promise.all([
      Promise.allSettled(variantNames.map((variantName) => PokeAPI.getPokemonDetails(variantName))),
      Promise.allSettled([...new Set(evolutionNames)].map((speciesName) => PokeAPI.getPokemonSpecies(speciesName))),
      Promise.allSettled([...new Set(finalNames)].map((speciesName) => PokeAPI.getPokemonSpecies(speciesName))),
    ]);

    if (requestId !== activeRequestId) {
      return;
    }

    variantDetailsByName.value = Object.fromEntries(
      variantResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => [result.value.data.name, result.value.data]),
    );
    evolutionSpeciesByName.value = Object.fromEntries(
      evolutionSpeciesResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => [result.value.data.name, result.value.data]),
    );
    finalSpecies.value = finalSpeciesResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value.data);

    const specialForms = finalSpecies.value.flatMap((entry) => {
      return getSpecialBattleForms(entry.varieties || []);
    });
    const itemNames = [...new Set([
      ...collectEvolutionItemNames(rawEvolutionChain.value),
      ...specialForms.map((form) => form.megaStone?.name).filter(Boolean),
    ])];

    const [sourceResults, specialResults, itemResults] = await Promise.all([
      Promise.allSettled(finalSpecies.value.map((entry) => PokeAPI.getPokemonDetails(entry.name))),
      Promise.allSettled(specialForms.map((form) => PokeAPI.getPokemonDetails(form.name))),
      Promise.allSettled(itemNames.map((itemName) => PokeAPI.getItemDetails(itemName))),
    ]);

    if (requestId !== activeRequestId) {
      return;
    }

    finalPokemonDetailsByName.value = Object.fromEntries(
      sourceResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => [result.value.data.name, result.value.data]),
    );
    specialFormDetailsByName.value = Object.fromEntries(
      specialResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => [result.value.data.name, result.value.data]),
    );
    itemDetailsByName.value = Object.fromEntries(
      itemResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => [result.value.data.name, result.value.data]),
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
