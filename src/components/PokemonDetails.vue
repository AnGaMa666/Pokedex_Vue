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
              {{ getLocalizedTypeName(typeEntry.type.name, language) }}
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
          <dd>{{ formatTypeList(damageRelations.weaknesses) }}</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.resistances') }}</dt>
          <dd>{{ formatTypeList(damageRelations.resistances) }}</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.immunities') }}</dt>
          <dd>{{ formatTypeList(damageRelations.immunities) }}</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.effectiveAgainst') }}</dt>
          <dd>{{ formatTypeList(damageRelations.effectiveAgainst) }}</dd>
        </div>
      </dl>

      <section
        v-if="evolutionStages.length || specialFormGroups.length"
        class="evolution-section"
      >
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
                      :aria-label="specialLabels.openItem.replace('{name}', getItemLabel(evolution.item.name))"
                      @click="openItem(evolution.item.name)"
                    >
                      <img
                        :src="evolution.item.sprite"
                        :alt="getItemLabel(evolution.item.name)"
                        class="transition-item-sprite"
                        width="40"
                        height="40"
                        loading="lazy"
                      >
                      <strong>{{ getItemLabel(evolution.item.name) }}</strong>
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

        <div v-if="specialFormGroups.length" class="special-forms">
          <div class="special-forms-heading">
            <h4>{{ t('pokemon.specialForms') }}</h4>
          </div>

          <section
            v-for="group in specialFormGroups"
            :key="group.sourceSpecies.name"
            class="special-form-group"
          >
            <article
              class="special-origin"
              :style="getTypedCardStyle(group.sourceDetails?.types)"
            >
              <img
                v-if="getSourceSprite(group)"
                :src="getSourceSprite(group)"
                :alt="`${getSourceSpeciesLabel(group)} sprite`"
                width="78"
                height="78"
                loading="lazy"
              >
              <div class="special-origin-copy">
                <span>{{ specialLabels.normalFinalEvolution }}</span>
                <strong>{{ getSourceSpeciesLabel(group) }}</strong>
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

            <div
              class="branch-connector"
              :class="{ 'is-single': group.forms.length === 1 }"
              aria-hidden="true"
            ></div>

            <ul
              class="special-form-list"
              :class="{
                'is-single': group.forms.length === 1,
                'is-pair': group.forms.length === 2,
              }"
            >
              <li
                v-for="form in group.forms"
                :key="form.id"
                class="special-form-entry"
              >
                <div
                  class="special-branch-transition"
                  :aria-label="getSpecialFormMethod(form)"
                >
                  <div class="transition-line">
                    <span class="transition-arrow" aria-hidden="true">↓</span>
                    <button
                      v-if="form.megaStone"
                      type="button"
                      class="transition-item"
                      :aria-label="specialLabels.openItem.replace('{name}', getItemLabel(form.megaStone.name))"
                      @click="openItem(form.megaStone.name)"
                    >
                      <img
                        :src="form.megaStone.sprite"
                        :alt="getItemLabel(form.megaStone.name)"
                        class="transition-item-sprite"
                        width="40"
                        height="40"
                        loading="lazy"
                      >
                      <strong>{{ getItemLabel(form.megaStone.name) }}</strong>
                    </button>
                  </div>
                  <span class="transition-method">{{ getSpecialFormMethod(form) }}</span>
                </div>

                <article
                  class="special-form-item"
                  :style="getTypedCardStyle(form.details?.types)"
                >
                  <span class="form-kind">{{ getSpecialFormMethod(form) }}</span>
                  <img
                    :src="getSpecialFormSprite(form)"
                    :alt="`${getSpecialFormLabel(form, group)} sprite`"
                    width="112"
                    height="112"
                    loading="lazy"
                  >
                  <strong>{{ getSpecialFormLabel(form, group) }}</strong>
                  <div class="compact-type-list form-types">
                    <span
                      v-for="typeEntry in form.details?.types || []"
                      :key="typeEntry.type.name"
                      :style="{ backgroundColor: getTypeColor(typeEntry.type.name) }"
                    >
                      {{ getLocalizedTypeName(typeEntry.type.name, language) }}
                    </span>
                  </div>
                </article>
              </li>
            </ul>
          </section>
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
import {
  getLocalizedSpecialFormName,
  getLocalizedTypeName,
} from '@/utils/localization';
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
const finalPokemonDetailsByName = ref({});
const specialFormDetailsByName = ref({});
const itemDetailsByName = ref({});
const damageRelations = ref(emptyDamageRelations());
const loading = ref(false);
const hasError = ref(false);
let activeRequestId = 0;

const specialLabels = computed(() => language.value === 'de'
  ? {
      normalFinalEvolution: 'Normale Endentwicklung',
      openItem: '{name} im Itemverzeichnis öffnen',
    }
  : {
      normalFinalEvolution: 'Normal final evolution',
      openItem: 'Open {name} in the item directory',
    });

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

const formatTypeList = (values) => {
  if (!values.length) {
    return t('common.none');
  }

  return values
    .map((value) => getLocalizedTypeName(value, language.value))
    .join(', ');
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

const getItemLabel = (name) => {
  const details = itemDetailsByName.value[name];
  return getLocalizedName(details?.names, name, language.value);
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
      item: getItemLabel(detail.item?.name || 'item'),
    }));
  } else if (trigger === 'trade') {
    parts.push(t('pokemon.trade'));
  } else if (trigger) {
    parts.push(formatResourceName(trigger));
  }

  if (detail.held_item) {
    parts.push(t('pokemon.holding', {
      item: getItemLabel(detail.held_item.name),
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
      type: getLocalizedTypeName(detail.known_move_type.name, language.value),
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
      type: getLocalizedTypeName(detail.party_type.name, language.value),
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

const specialFormGroups = computed(() => {
  return finalEvolutionSpecies.value
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

const getSpecialFormSprite = (form) => {
  if (props.isShiny && form.details?.sprites?.front_shiny) {
    return form.details.sprites.front_shiny;
  }

  return form.details?.sprites?.front_default
    || (props.isShiny ? form.shinySprite : form.sprite);
};

const getSpecialFormMethod = (form) => {
  return form.kind === 'mega' ? t('pokemon.megaForm') : t('pokemon.gmaxForm');
};

const getSourceSpeciesLabel = (group) => {
  return getLocalizedName(
    group.sourceSpecies.names,
    group.sourceSpecies.name,
    language.value,
  );
};

const getSpecialFormLabel = (form, group) => {
  return getLocalizedSpecialFormName({
    formName: form.name,
    sourceName: getSourceSpeciesLabel(group),
    kind: form.kind,
    language: language.value,
  });
};

const getSourceSprite = (group) => {
  if (props.isShiny && group.sourceDetails?.sprites?.front_shiny) {
    return group.sourceDetails.sprites.front_shiny;
  }

  return group.sourceDetails?.sprites?.front_default || '';
};

const getTypedCardStyle = (types = []) => {
  if (!types?.length) {
    return {};
  }

  return {
    background: getTypeGradient(types),
  };
};

const openItem = (name) => {
  emit('openResource', {
    kind: 'items',
    name,
  });
};

const collectEvolutionItemNames = (node) => {
  if (!node) {
    return [];
  }

  const itemNames = (node.evolution_details || [])
    .flatMap((detail) => [detail.item?.name, detail.held_item?.name])
    .filter(Boolean);

  return [
    ...itemNames,
    ...(node.evolves_to || []).flatMap(collectEvolutionItemNames),
  ];
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

  const forms = resolvedFinalSpecies
    .flatMap((entry) => getSpecialBattleForms(entry.varieties || []));
  const stoneNames = forms
    .map((form) => form.megaStone?.name)
    .filter(Boolean);
  const evolutionItemNames = collectEvolutionItemNames(resolvedChain);
  const itemNames = [...new Set([...stoneNames, ...evolutionItemNames])];

  const [sourceDetailResults, formDetailResults, itemResults] = await Promise.all([
    Promise.allSettled(
      resolvedFinalSpecies.map((entry) => PokeAPI.getPokemonDetails(entry.name)),
    ),
    Promise.allSettled(
      forms.map((form) => PokeAPI.getPokemonDetails(form.name)),
    ),
    Promise.allSettled(
      itemNames.map((name) => PokeAPI.getItemDetails(name)),
    ),
  ]);

  if (requestId !== activeRequestId) {
    return;
  }

  finalPokemonDetailsByName.value = Object.fromEntries(
    sourceDetailResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => [result.value.data.name, result.value.data]),
  );
  specialFormDetailsByName.value = Object.fromEntries(
    formDetailResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => [result.value.data.name, result.value.data]),
  );
  itemDetailsByName.value = Object.fromEntries(
    itemResults
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
  finalPokemonDetailsByName.value = {};
  specialFormDetailsByName.value = {};
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

.evolution-stage-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
}

.evolution-entry {
  display: grid;
  flex: 1 1 190px;
  max-width: 280px;
  justify-items: center;
}

.evolution-transition,
.special-branch-transition {
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

.evolution-item {
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

.evolution-item img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  image-rendering: pixelated;
}

.evolution-item strong {
  color: #333333;
}

.special-forms {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px dashed #aaaaaa;
}

.special-forms-heading {
  margin-bottom: 16px;
}

.special-form-group {
  display: grid;
  justify-items: center;
  width: 100%;
  margin-top: 18px;
}

.special-origin {
  display: flex;
  gap: 12px;
  align-items: center;
  width: min(100%, 340px);
  min-height: 96px;
  padding: 10px 14px;
  border: 1px solid #aaaaaa;
  border-radius: 4px;
  color: #333333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
}

.special-origin img {
  flex: 0 0 auto;
  width: 78px;
  height: 78px;
  object-fit: contain;
  image-rendering: pixelated;
}

.special-origin-copy {
  display: grid;
  min-width: 0;
}

.special-origin-copy > span {
  color: #555555;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.special-origin-copy > strong {
  margin-top: 2px;
  font-size: 1rem;
}

.compact-type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.compact-type-list span {
  padding: 3px 7px;
  border: 1px solid rgba(51, 51, 51, 0.2);
  border-radius: 4px;
  color: #333333;
  font-size: 0.62rem;
  font-weight: 900;
}

.branch-connector {
  position: relative;
  width: min(82%, 760px);
  height: 30px;
}

.branch-connector::before {
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 16px;
  content: '';
  background: #777777;
  transform: translateX(-50%);
}

.branch-connector::after {
  position: absolute;
  top: 15px;
  right: 0;
  left: 0;
  height: 2px;
  content: '';
  background: #777777;
}

.branch-connector.is-single {
  width: 2px;
}

.special-form-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
}

.special-form-list.is-single {
  grid-template-columns: minmax(0, 280px);
  justify-content: center;
}

.special-form-list.is-pair {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.special-form-entry {
  position: relative;
  display: grid;
  min-width: 0;
  justify-items: stretch;
}

.special-form-entry::before {
  position: absolute;
  top: -15px;
  left: 50%;
  width: 2px;
  height: 18px;
  content: '';
  background: #777777;
  transform: translateX(-50%);
}

.special-form-item {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 230px;
  justify-items: center;
  align-content: center;
  padding: 14px;
  border: 1px solid #aaaaaa;
  border-radius: 4px;
  color: #333333;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
}

.special-form-item img {
  width: 112px;
  height: 112px;
  object-fit: contain;
  image-rendering: pixelated;
}

.special-form-item > strong {
  margin-top: 6px;
  color: #333333;
  font-size: 1rem;
  overflow-wrap: anywhere;
}

.form-kind {
  padding: 5px 9px;
  border: 1px solid #aaaaaa;
  border-radius: 4px;
  color: #333333;
  font-size: 0.68rem;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.72);
}

.form-types {
  justify-content: center;
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

  .evolution-entry {
    flex-basis: 100%;
    max-width: 100%;
  }

  .evolution-item {
    padding: 10px;
  }

  .special-form-list,
  .special-form-list.is-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .special-form-list.is-single {
    grid-template-columns: minmax(0, 260px);
  }

  .branch-connector {
    width: 76%;
  }

  .special-branch-transition {
    min-height: 72px;
  }

  .special-form-item {
    min-height: 205px;
    padding: 8px;
  }

  .special-form-item img {
    width: 94px;
    height: 94px;
  }

  .special-form-item > strong {
    font-size: 0.88rem;
  }

  .form-kind {
    padding: 4px 6px;
    font-size: 0.58rem;
  }

  .compact-type-list span {
    padding: 2px 5px;
    font-size: 0.56rem;
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
    width: 32px;
    height: 32px;
  }

  .transition-item strong {
    max-width: 72px;
    font-size: 0.62rem;
  }

  .special-origin {
    min-height: 82px;
    padding: 8px 10px;
  }

  .special-origin img {
    width: 64px;
    height: 64px;
  }

  .special-form-item {
    min-height: 190px;
  }

  .special-form-item img {
    width: 86px;
    height: 86px;
  }
}
</style>
