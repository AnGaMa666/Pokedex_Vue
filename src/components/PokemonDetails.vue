<template>
  <article
    class="pokemon-details"
    :style="detailsStyle"
    :aria-busy="loading"
  >
    <p v-if="loading" class="status-message" role="status">
      {{ t('pokemon.loading') }}
    </p>

    <p v-else-if="hasError" class="error-message" role="alert">
      {{ t('pokemon.loadError') }}
    </p>

    <template v-else-if="pokemonDetails">
      <header class="details-header">
        <div>
          <p class="eyebrow">#{{ formatResourceId(pokemonDetails.id) }}</p>
          <h2>{{ displayName }}</h2>
          <div class="type-list" aria-label="Pokémon types">
            <span
              v-for="typeEntry in pokemonDetails.types"
              :key="typeEntry.type.name"
              class="type-badge"
              :style="{ backgroundColor: getTypeColor(typeEntry.type.name) }"
            >
              {{ formatResourceName(typeEntry.type.name) }}
            </span>
          </div>
        </div>

        <div class="sprite-frame">
          <img
            v-if="spriteUrl"
            :src="spriteUrl"
            :alt="`${displayName} ${isShiny ? 'shiny' : 'normal'} sprite`"
            width="180"
            height="180"
          >
        </div>
      </header>

      <div v-if="species" class="descriptions">
        <p :lang="language">{{ getFlavorText(species.flavor_text_entries) }}</p>
      </div>

      <dl class="facts-grid">
        <div>
          <dt>{{ t('pokemon.height') }}</dt>
          <dd>{{ pokemonDetails.height / 10 }} m</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.weight') }}</dt>
          <dd>{{ pokemonDetails.weight / 10 }} kg</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.baseExperience') }}</dt>
          <dd>{{ pokemonDetails.base_experience ?? t('common.unknown') }}</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.abilities') }}</dt>
          <dd>{{ formatAbilities(pokemonDetails.abilities) }}</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.weaknesses') }}</dt>
          <dd>{{ formatList(damageRelations.weaknesses) }}</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.resistances') }}</dt>
          <dd>{{ formatList(damageRelations.resistances) }}</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.immunities') }}</dt>
          <dd>{{ formatList(damageRelations.immunities) }}</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.effectiveAgainst') }}</dt>
          <dd>{{ formatList(damageRelations.effectiveAgainst) }}</dd>
        </div>
      </dl>

      <section v-if="evolutionStages.length || specialForms.length" class="evolution-section">
        <div class="section-heading">
          <h3>{{ t('pokemon.evolutionChain') }}</h3>
        </div>

        <div v-if="evolutionStages.length" class="evolution-stages">
          <section
            v-for="(stage, stageIndex) in evolutionStages"
            :key="stageIndex"
            class="evolution-stage-group"
          >
            <span class="stage-label">
              {{ t('pokemon.stage', { stage: stageIndex + 1 }) }}
            </span>

            <ul class="evolution-stage-list">
              <li
                v-for="evolution in stage"
                :key="`${evolution.stage}-${evolution.name}`"
                class="evolution-entry"
              >
                <div
                  v-if="evolution.stage > 0"
                  class="evolution-transition"
                  :aria-label="evolution.method"
                >
                  <div class="transition-line">
                    <span class="transition-arrow" aria-hidden="true">↓</span>
                    <button
                      v-if="evolution.item"
                      type="button"
                      class="transition-item"
                      @click="openItem(evolution.item.name)"
                    >
                      <img
                        :src="evolution.item.sprite"
                        :alt="formatResourceName(evolution.item.name)"
                        class="transition-item-sprite"
                        width="40"
                        height="40"
                        loading="lazy"
                      >
                      <strong>{{ formatResourceName(evolution.item.name) }}</strong>
                    </button>
                  </div>
                  <span v-if="evolution.method" class="transition-method">
                    {{ evolution.method }}
                  </span>
                </div>

                <article class="evolution-item">
                  <img
                    v-if="evolution.sprite"
                    :src="evolution.sprite"
                    :alt="`${formatResourceName(evolution.name)} sprite`"
                    width="96"
                    height="96"
                    loading="lazy"
                  >
                  <strong>{{ formatResourceName(evolution.name) }}</strong>
                </article>
              </li>
            </ul>
          </section>
        </div>

        <div v-if="specialForms.length" class="special-forms">
          <div class="special-forms-heading">
            <h4>{{ t('pokemon.specialForms') }}</h4>
          </div>

          <ul class="special-form-list">
            <li v-for="form in specialForms" :key="form.id" class="special-form-entry">
              <div
                class="evolution-transition special-transition"
                :aria-label="getSpecialFormMethod(form)"
              >
                <div class="transition-line">
                  <span class="transition-arrow" aria-hidden="true">↓</span>
                  <button
                    v-if="form.megaStone"
                    type="button"
                    class="transition-item"
                    :aria-label="`${getMegaStoneLabel(form.megaStone)} öffnen`"
                    @click="openItem(form.megaStone.name)"
                  >
                    <img
                      :src="form.megaStone.sprite"
                      :alt="getMegaStoneLabel(form.megaStone)"
                      class="transition-item-sprite"
                      width="40"
                      height="40"
                      loading="lazy"
                    >
                    <strong>{{ getMegaStoneLabel(form.megaStone) }}</strong>
                  </button>
                </div>
                <span class="transition-method">{{ getSpecialFormMethod(form) }}</span>
              </div>

              <article class="special-form-item">
                <span class="form-kind">{{ getSpecialFormMethod(form) }}</span>
                <img
                  :src="getSpecialFormSprite(form)"
                  :alt="`${formatResourceName(form.name)} sprite`"
                  width="112"
                  height="112"
                  loading="lazy"
                >
                <strong>{{ formatResourceName(form.name) }}</strong>
              </article>
            </li>
          </ul>
        </div>
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
import { getSpecialBattleForms } from '@/utils/pokemonForms';
import {
  formatResourceId,
  formatResourceName,
  getLocalizedName,
  getResourceId,
} from '@/utils/resource';
import { getTypeColor, getTypeGradient } from '@/utils/typeColors';

const props = defineProps({
  pokemon: {
    type: Object,
    required: true,
  },
  isShiny: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['detailsLoaded', 'openResource']);
const { language, t } = useI18n();

const emptyDamageRelations = () => ({
  immunities: [],
  weaknesses: [],
  resistances: [],
  effectiveAgainst: [],
});

const pokemonDetails = ref(null);
const species = ref(null);
const rawEvolutionChain = ref(null);
const finalEvolutionSpecies = ref([]);
const itemDetailsByName = ref({});
const damageRelations = ref(emptyDamageRelations());
const loading = ref(false);
const hasError = ref(false);
let activeRequestId = 0;

const displayName = computed(() => {
  return getLocalizedName(
    species.value?.names,
    pokemonDetails.value?.name,
    language.value,
  );
});

const spriteUrl = computed(() => {
  if (!pokemonDetails.value) {
    return '';
  }

  if (props.isShiny && pokemonDetails.value.sprites.front_shiny) {
    return pokemonDetails.value.sprites.front_shiny;
  }

  return pokemonDetails.value.sprites.front_default || '';
});

const detailsStyle = computed(() => {
  if (!pokemonDetails.value?.types?.length) {
    return {};
  }

  return {
    '--pokemon-gradient': getTypeGradient(pokemonDetails.value.types),
    '--pokemon-primary': getTypeColor(pokemonDetails.value.types[0]?.type?.name),
  };
});

const formatList = (values) => {
  if (!values.length) {
    return t('common.none');
  }

  return values.map(formatResourceName).join(', ');
};

const formatAbilities = (abilities) => {
  return abilities
    .map((abilityEntry) => {
      const abilityName = formatResourceName(abilityEntry.ability.name);
      return abilityEntry.is_hidden
        ? `${abilityName} (${t('pokemon.hidden')})`
        : abilityName;
    })
    .join(', ');
};

const getFlavorText = (entries) => {
  const entry = entries.find((candidate) => candidate.language.name === language.value)
    || entries.find((candidate) => candidate.language.name === 'en');

  return entry?.flavor_text?.replace(/[\n\f]+/g, ' ')
    || t('pokemon.noDescription');
};

const formatEvolutionMethod = (evolutionDetails = []) => {
  const detail = evolutionDetails[0];

  if (!detail) {
    return '';
  }

  const parts = [];
  const trigger = detail.trigger?.name;

  if (trigger === 'level-up') {
    parts.push(detail.min_level ? `Level ${detail.min_level}` : t('pokemon.levelUp'));
  } else if (trigger === 'use-item') {
    parts.push(t('pokemon.useItem', {
      item: formatResourceName(detail.item?.name || 'item'),
    }));
  } else if (trigger === 'trade') {
    parts.push(t('pokemon.trade'));
  } else if (trigger) {
    parts.push(formatResourceName(trigger));
  }

  if (detail.held_item) {
    parts.push(t('pokemon.holding', {
      item: formatResourceName(detail.held_item.name),
    }));
  }

  if (detail.min_happiness) {
    parts.push(t('pokemon.happiness', { value: detail.min_happiness }));
  }

  if (detail.min_affection) {
    parts.push(t('pokemon.affection', { value: detail.min_affection }));
  }

  if (detail.min_beauty) {
    parts.push(t('pokemon.beauty', { value: detail.min_beauty }));
  }

  if (detail.time_of_day) {
    parts.push(t('pokemon.during', { value: detail.time_of_day }));
  }

  if (detail.known_move) {
    parts.push(t('pokemon.knowingMove', {
      move: formatResourceName(detail.known_move.name),
    }));
  }

  if (detail.known_move_type) {
    parts.push(t('pokemon.knowingType', {
      type: formatResourceName(detail.known_move_type.name),
    }));
  }

  if (detail.location) {
    parts.push(t('pokemon.atLocation', {
      location: formatResourceName(detail.location.name),
    }));
  }

  if (detail.needs_overworld_rain) {
    parts.push(t('pokemon.raining'));
  }

  if (detail.turn_upside_down) {
    parts.push(t('pokemon.upsideDown'));
  }

  if (detail.party_species) {
    parts.push(t('pokemon.partySpecies', {
      species: formatResourceName(detail.party_species.name),
    }));
  }

  if (detail.party_type) {
    parts.push(t('pokemon.partyType', {
      type: formatResourceName(detail.party_type.name),
    }));
  }

  if (detail.trade_species) {
    parts.push(t('pokemon.tradeSpecies', {
      species: formatResourceName(detail.trade_species.name),
    }));
  }

  return parts.join(' · ');
};

const resolveEvolutionNode = (node, stage) => {
  const speciesId = getResourceId(node.species?.url);
  const sprite = speciesId
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`
    : '';

  const currentEvolution = {
    name: node.species.name,
    sprite,
    stage,
    method: formatEvolutionMethod(node.evolution_details),
    item: getEvolutionItem(node.evolution_details),
  };

  const descendants = (node.evolves_to || []).flatMap((childNode) => {
    return resolveEvolutionNode(childNode, stage + 1);
  });

  return [currentEvolution, ...descendants];
};

const evolutionChain = computed(() => {
  if (!rawEvolutionChain.value?.species) {
    return [];
  }

  return resolveEvolutionNode(rawEvolutionChain.value, 0);
});

const evolutionStages = computed(() => {
  const groupedStages = [];

  for (const evolution of evolutionChain.value) {
    groupedStages[evolution.stage] ||= [];
    groupedStages[evolution.stage].push(evolution);
  }

  return groupedStages.filter(Boolean);
});

const specialForms = computed(() => {
  const formsById = new Map();

  for (const finalSpecies of finalEvolutionSpecies.value) {
    for (const form of getSpecialBattleForms(finalSpecies.varieties || [])) {
      formsById.set(form.id, {
        ...form,
        sourceSpecies: finalSpecies.name,
      });
    }
  }

  return [...formsById.values()];
});

const getSpecialFormSprite = (form) => {
  return props.isShiny ? form.shinySprite : form.sprite;
};

const getSpecialFormMethod = (form) => {
  return form.kind === 'mega' ? t('pokemon.megaForm') : t('pokemon.gmaxForm');
};

const getMegaStoneLabel = (stone) => {
  const details = itemDetailsByName.value[stone.name];
  return getLocalizedName(details?.names, stone.name, language.value);
};

const openItem = (name) => {
  emit('openResource', {
    kind: 'items',
    name,
  });
};

const loadFinalEvolutionForms = async (resolvedSpecies, resolvedChain, requestId) => {
  const finalNames = getFinalEvolutionSpeciesNames(resolvedChain);
  const namesToLoad = finalNames.length ? finalNames : [resolvedSpecies.name];
  const uniqueNames = [...new Set(namesToLoad)];

  const speciesResults = await Promise.allSettled(
    uniqueNames.map((name) => {
      if (name === resolvedSpecies.name) {
        return Promise.resolve({ data: resolvedSpecies });
      }

      return PokeAPI.getPokemonSpecies(name);
    }),
  );

  if (requestId !== activeRequestId) {
    return;
  }

  const resolvedFinalSpecies = speciesResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value.data);

  finalEvolutionSpecies.value = resolvedFinalSpecies;

  const stoneNames = [...new Set(
    resolvedFinalSpecies
      .flatMap((entry) => getSpecialBattleForms(entry.varieties || []))
      .map((form) => form.megaStone?.name)
      .filter(Boolean),
  )];

  const stoneResults = await Promise.allSettled(
    stoneNames.map((name) => PokeAPI.getItemDetails(name)),
  );

  if (requestId !== activeRequestId) {
    return;
  }

  itemDetailsByName.value = Object.fromEntries(
    stoneResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => [result.value.data.name, result.value.data]),
  );
};

const fetchPokemonDetails = async (name) => {
  const requestId = ++activeRequestId;

  if (!name) {
    pokemonDetails.value = null;
    emit('detailsLoaded', null);
    return;
  }

  loading.value = true;
  hasError.value = false;
  pokemonDetails.value = null;
  species.value = null;
  rawEvolutionChain.value = null;
  finalEvolutionSpecies.value = [];
  itemDetailsByName.value = {};
  damageRelations.value = emptyDamageRelations();
  emit('detailsLoaded', null);

  try {
    const detailsResponse = await PokeAPI.getPokemonDetails(name);
    const details = detailsResponse.data;
    const [damageResult, speciesResult] = await Promise.allSettled([
      PokeAPI.getPokemonDamageRelations(details.types),
      PokeAPI.getPokemonSpecies(name),
    ]);

    let resolvedDamageRelations = emptyDamageRelations();
    let resolvedSpecies = null;
    let resolvedEvolutionChain = null;

    if (damageResult.status === 'fulfilled') {
      resolvedDamageRelations = damageResult.value;
    }

    if (speciesResult.status === 'fulfilled') {
      resolvedSpecies = speciesResult.value.data;

      if (resolvedSpecies.evolution_chain?.url) {
        try {
          const evolutionResponse = await PokeAPI.getEvolutionChain(
            resolvedSpecies.evolution_chain.url,
          );
          resolvedEvolutionChain = evolutionResponse.data.chain;
        } catch (requestError) {
          console.error('Failed to load the evolution chain:', requestError);
        }
      }
    }

    if (requestId !== activeRequestId) {
      return;
    }

    pokemonDetails.value = details;
    species.value = resolvedSpecies;
    rawEvolutionChain.value = resolvedEvolutionChain;
    damageRelations.value = resolvedDamageRelations;
    emit('detailsLoaded', details);

    if (resolvedSpecies) {
      void loadFinalEvolutionForms(resolvedSpecies, resolvedEvolutionChain, requestId);
    }
  } catch (requestError) {
    if (requestId !== activeRequestId) {
      return;
    }

    console.error('Failed to load Pokémon details:', requestError);
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
    fetchPokemonDetails(name);
  },
  { immediate: true },
);
</script>

<style scoped>
.pokemon-details {
  min-width: 0;
  padding: clamp(20px, 4vw, 32px);
  border: 1px solid #cccccc;
  border-radius: 4px;
  background: #f8f8f8;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.18);
}

.status-message,
.error-message {
  margin: 0;
  padding: 24px 0;
}

.error-message {
  color: #b00020;
}

.details-header {
  position: relative;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  padding: clamp(20px, 4vw, 32px);
  border: 1px solid #cccccc;
  border-radius: 4px;
  color: #333333;
  background: var(--pokemon-gradient, linear-gradient(135deg, lightgray, #ffffff));
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.18);
}

.details-header::after {
  position: absolute;
  right: -72px;
  bottom: -104px;
  width: 240px;
  height: 240px;
  border: 42px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  content: '';
}

.details-header > * {
  position: relative;
  z-index: 1;
}

.details-header h2 {
  margin: 0;
  color: #333333;
  font-size: clamp(2.2rem, 6vw, 4.5rem);
  line-height: 0.95;
  letter-spacing: -0.045em;
}

.eyebrow {
  margin: 0 0 10px;
  color: rgba(51, 51, 51, 0.76);
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.sprite-frame {
  display: grid;
  flex: 0 0 auto;
  width: clamp(140px, 18vw, 210px);
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgba(51, 51, 51, 0.18);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.52);
}

.sprite-frame img {
  width: 90%;
  height: 90%;
  object-fit: contain;
  image-rendering: pixelated;
}

.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.type-badge {
  padding: 7px 12px;
  border: 1px solid rgba(51, 51, 51, 0.22);
  border-radius: 4px;
  color: #333333;
  font-size: 0.82rem;
  font-weight: 900;
}

.descriptions {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid #cccccc;
  border-left: 5px solid var(--pokemon-primary, lightgray);
  border-radius: 4px;
  background: #ffffff;
}

.descriptions p {
  margin: 0;
  line-height: 1.6;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 20px 0 0;
}

.facts-grid div {
  min-width: 0;
  padding: 14px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  background: #ffffff;
}

.facts-grid dt {
  margin-bottom: 5px;
  color: #666666;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.facts-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #333333;
  font-weight: 700;
  line-height: 1.45;
}

.evolution-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #cccccc;
}

.section-heading h3,
.special-forms-heading h4 {
  margin: 0;
  color: #333333;
}

.section-heading h3 {
  font-size: 1.2rem;
}

.evolution-stages {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.evolution-stage-group {
  display: grid;
  justify-items: center;
}

.stage-label {
  margin-bottom: 8px;
  color: #666666;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.evolution-stage-list,
.special-form-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
}

.evolution-entry,
.special-form-entry {
  display: grid;
  flex: 1 1 190px;
  max-width: 280px;
  justify-items: center;
}

.evolution-transition {
  display: grid;
  width: 100%;
  min-height: 58px;
  justify-items: center;
  align-content: center;
  margin-bottom: 8px;
  padding: 0;
  border: 0;
  color: #333333;
  background: transparent;
}

.transition-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  width: 100%;
  min-height: 40px;
}

.transition-arrow {
  grid-column: 2;
  justify-self: center;
  color: #333333;
  font-size: 1.85rem;
  font-weight: 900;
  line-height: 1;
}

.transition-item {
  display: inline-flex;
  grid-column: 3;
  gap: 4px;
  justify-self: start;
  align-items: center;
  min-width: 0;
  margin-left: 8px;
  padding: 2px;
  border: 0;
  color: #333333;
  cursor: pointer;
  background: transparent;
}

.transition-item:hover strong,
.transition-item:focus-visible strong {
  text-decoration: underline;
}

.transition-item:focus-visible {
  outline: 2px solid #333333;
  outline-offset: 2px;
}

.transition-item-sprite {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  object-fit: contain;
  image-rendering: pixelated;
}

.transition-item strong {
  overflow-wrap: anywhere;
  color: #333333;
  font-size: 0.72rem;
  line-height: 1.25;
}

.transition-method {
  max-width: 100%;
  color: #666666;
  font-size: 0.72rem;
  line-height: 1.35;
  text-align: center;
}

.evolution-item,
.special-form-item {
  display: grid;
  width: 100%;
  justify-items: center;
  padding: 14px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  text-align: center;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.evolution-item img,
.special-form-item img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  image-rendering: pixelated;
}

.special-form-item img {
  width: 112px;
  height: 112px;
}

.evolution-item strong,
.special-form-item strong {
  color: #333333;
}

.special-forms {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px dashed #aaaaaa;
}

.special-forms-heading {
  margin-bottom: 14px;
}

.form-kind {
  padding: 5px 9px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  color: #333333;
  font-size: 0.7rem;
  font-weight: 900;
  background: #e0e0e0;
}

@media (max-width: 760px) {
  .pokemon-details {
    padding: 12px;
  }

  .details-header {
    gap: 12px;
    padding: 14px;
  }

  .details-header h2 {
    font-size: clamp(1.8rem, 10vw, 2.8rem);
  }

  .sprite-frame {
    width: 96px;
  }

  .descriptions {
    margin-top: 12px;
    padding: 12px;
  }

  .facts-grid {
    gap: 8px;
    margin-top: 12px;
  }

  .facts-grid div {
    padding: 10px;
  }

  .evolution-section {
    margin-top: 16px;
    padding-top: 14px;
  }

  .evolution-entry,
  .special-form-entry {
    flex-basis: 100%;
    max-width: 100%;
  }

  .evolution-item,
  .special-form-item {
    padding: 10px;
  }
}

@media (max-width: 420px) {
  .details-header {
    align-items: center;
  }

  .sprite-frame {
    width: 76px;
  }

  .facts-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .transition-item {
    gap: 2px;
    margin-left: 4px;
  }

  .transition-item-sprite {
    width: 34px;
    height: 34px;
  }

  .transition-item strong {
    max-width: 88px;
    font-size: 0.66rem;
  }
}
</style>
