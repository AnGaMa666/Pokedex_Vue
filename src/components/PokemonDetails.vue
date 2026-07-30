<template>
  <article
    class="pokemon-details"
    :style="detailsStyle"
    :aria-busy="loading"
  >
    <p v-if="loading" class="status-message" role="status">
      Loading Pokémon details…
    </p>

    <p v-else-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </p>

    <template v-else-if="pokemonDetails">
      <header class="details-header">
        <div>
          <p class="eyebrow">#{{ formatResourceId(pokemonDetails.id) }}</p>
          <h2>{{ formatResourceName(pokemonDetails.name) }}</h2>
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
            :alt="`${formatResourceName(pokemonDetails.name)} ${isShiny ? 'shiny' : 'normal'} sprite`"
            width="180"
            height="180"
          >
        </div>
      </header>

      <div v-if="species" class="descriptions">
        <p>{{ getFlavorText(species.flavor_text_entries, 'de') }}</p>
        <p lang="en">{{ getFlavorText(species.flavor_text_entries, 'en') }}</p>
      </div>

      <dl class="facts-grid">
        <div>
          <dt>Height</dt>
          <dd>{{ pokemonDetails.height / 10 }} m</dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>{{ pokemonDetails.weight / 10 }} kg</dd>
        </div>
        <div>
          <dt>Base experience</dt>
          <dd>{{ pokemonDetails.base_experience ?? 'Unknown' }}</dd>
        </div>
        <div>
          <dt>Abilities</dt>
          <dd>{{ formatAbilities(pokemonDetails.abilities) }}</dd>
        </div>
        <div>
          <dt>Weaknesses</dt>
          <dd>{{ formatList(damageRelations.weaknesses) }}</dd>
        </div>
        <div>
          <dt>Resistances</dt>
          <dd>{{ formatList(damageRelations.resistances) }}</dd>
        </div>
        <div>
          <dt>Immunities</dt>
          <dd>{{ formatList(damageRelations.immunities) }}</dd>
        </div>
        <div>
          <dt>Effective against</dt>
          <dd>{{ formatList(damageRelations.effectiveAgainst) }}</dd>
        </div>
      </dl>

      <section v-if="evolutionStages.length" class="evolution-section">
        <div class="section-heading">
          <h3>Evolution chain</h3>
          <span>Sprites are derived from existing resource IDs</span>
        </div>
        <div class="evolution-stages">
          <div
            v-for="(stage, stageIndex) in evolutionStages"
            :key="stageIndex"
            class="evolution-stage-group"
          >
            <span class="stage-label">Stage {{ stageIndex + 1 }}</span>
            <ul class="evolution-stage-list">
              <li
                v-for="evolution in stage"
                :key="`${evolution.stage}-${evolution.name}`"
                class="evolution-item"
              >
                <img
                  v-if="evolution.sprite"
                  :src="evolution.sprite"
                  :alt="`${formatResourceName(evolution.name)} sprite`"
                  width="96"
                  height="96"
                  loading="lazy"
                >
                <strong>{{ formatResourceName(evolution.name) }}</strong>
                <span v-if="evolution.method" class="evolution-method">
                  {{ evolution.method }}
                </span>
              </li>
            </ul>
            <span
              v-if="stageIndex < evolutionStages.length - 1"
              class="stage-arrow"
              aria-hidden="true"
            >
              ↓
            </span>
          </div>
        </div>
      </section>
    </template>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PokeAPI from '@/services/pokeapi';
import {
  formatResourceId,
  formatResourceName,
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

const emit = defineEmits(['detailsLoaded']);

const emptyDamageRelations = () => ({
  immunities: [],
  weaknesses: [],
  resistances: [],
  effectiveAgainst: [],
});

const pokemonDetails = ref(null);
const species = ref(null);
const evolutionChain = ref([]);
const damageRelations = ref(emptyDamageRelations());
const loading = ref(false);
const errorMessage = ref('');
let activeRequestId = 0;

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

  const gradient = getTypeGradient(pokemonDetails.value.types);
  const primaryColor = getTypeColor(pokemonDetails.value.types[0]?.type?.name);

  return {
    '--pokemon-gradient': gradient,
    '--pokemon-primary': primaryColor,
  };
});

const evolutionStages = computed(() => {
  const groupedStages = [];

  for (const evolution of evolutionChain.value) {
    groupedStages[evolution.stage] ||= [];
    groupedStages[evolution.stage].push(evolution);
  }

  return groupedStages.filter(Boolean);
});

const formatList = (values) => {
  if (!values.length) {
    return 'None';
  }

  return values.map(formatResourceName).join(', ');
};

const formatAbilities = (abilities) => {
  return abilities
    .map((abilityEntry) => {
      const abilityName = formatResourceName(abilityEntry.ability.name);
      return abilityEntry.is_hidden ? `${abilityName} (hidden)` : abilityName;
    })
    .join(', ');
};

const getFlavorText = (entries, language) => {
  const entry = entries.find((candidate) => candidate.language.name === language);

  if (!entry) {
    return language === 'de'
      ? 'Keine Beschreibung verfügbar.'
      : 'No description available.';
  }

  return entry.flavor_text.replace(/[\n\f]+/g, ' ');
};

const formatEvolutionMethod = (evolutionDetails = []) => {
  const detail = evolutionDetails[0];

  if (!detail) {
    return '';
  }

  const parts = [];
  const trigger = detail.trigger?.name;

  if (trigger === 'level-up') {
    parts.push(detail.min_level ? `Level ${detail.min_level}` : 'Level up');
  } else if (trigger === 'use-item') {
    parts.push(`Use ${formatResourceName(detail.item?.name || 'item')}`);
  } else if (trigger === 'trade') {
    parts.push('Trade');
  } else if (trigger) {
    parts.push(formatResourceName(trigger));
  }

  if (detail.held_item) {
    parts.push(`holding ${formatResourceName(detail.held_item.name)}`);
  }

  if (detail.min_happiness) {
    parts.push(`${detail.min_happiness}+ happiness`);
  }

  if (detail.min_affection) {
    parts.push(`${detail.min_affection}+ affection`);
  }

  if (detail.min_beauty) {
    parts.push(`${detail.min_beauty}+ beauty`);
  }

  if (detail.time_of_day) {
    parts.push(`during ${detail.time_of_day}`);
  }

  if (detail.known_move) {
    parts.push(`knowing ${formatResourceName(detail.known_move.name)}`);
  }

  if (detail.known_move_type) {
    parts.push(`knowing a ${formatResourceName(detail.known_move_type.name)} move`);
  }

  if (detail.location) {
    parts.push(`at ${formatResourceName(detail.location.name)}`);
  }

  if (detail.needs_overworld_rain) {
    parts.push('while raining');
  }

  if (detail.turn_upside_down) {
    parts.push('with the device upside down');
  }

  if (detail.party_species) {
    parts.push(`with ${formatResourceName(detail.party_species.name)} in the party`);
  }

  if (detail.party_type) {
    parts.push(`with a ${formatResourceName(detail.party_type.name)} Pokémon in the party`);
  }

  if (detail.trade_species) {
    parts.push(`for ${formatResourceName(detail.trade_species.name)}`);
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
  };
  const descendants = (node.evolves_to || []).flatMap((childNode) => {
    return resolveEvolutionNode(childNode, stage + 1);
  });

  return [currentEvolution, ...descendants];
};

const extractEvolutionChain = (chain) => {
  if (!chain?.species) {
    return [];
  }

  return resolveEvolutionNode(chain, 0);
};

const fetchPokemonDetails = async (name) => {
  const requestId = ++activeRequestId;

  if (!name) {
    pokemonDetails.value = null;
    emit('detailsLoaded', null);
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  pokemonDetails.value = null;
  species.value = null;
  evolutionChain.value = [];
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
    let resolvedEvolutionChain = [];

    if (damageResult.status === 'fulfilled') {
      resolvedDamageRelations = damageResult.value;
    } else {
      console.error('Failed to calculate Pokémon damage relations:', damageResult.reason);
    }

    if (speciesResult.status === 'fulfilled') {
      resolvedSpecies = speciesResult.value.data;

      if (resolvedSpecies.evolution_chain?.url) {
        try {
          const evolutionResponse = await PokeAPI.getEvolutionChain(
            resolvedSpecies.evolution_chain.url,
          );
          resolvedEvolutionChain = extractEvolutionChain(evolutionResponse.data.chain);
        } catch (requestError) {
          console.error('Failed to load the evolution chain:', requestError);
        }
      }
    } else {
      console.error('Failed to load Pokémon species data:', speciesResult.reason);
    }

    if (requestId !== activeRequestId) {
      return;
    }

    pokemonDetails.value = details;
    species.value = resolvedSpecies;
    evolutionChain.value = resolvedEvolutionChain;
    damageRelations.value = resolvedDamageRelations;
    emit('detailsLoaded', details);
  } catch (requestError) {
    if (requestId !== activeRequestId) {
      return;
    }

    console.error('Failed to load Pokémon details:', requestError);
    errorMessage.value = 'The Pokémon details could not be loaded.';
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
  padding: clamp(22px, 4vw, 34px);
  border: 1px solid color-mix(in srgb, var(--pokemon-primary, #64748b) 34%, #d5d9e1);
  border-radius: 22px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--pokemon-primary, #64748b) 10%, #ffffff), #ffffff 300px);
  box-shadow: 0 16px 42px rgba(23, 32, 51, 0.08);
}

.status-message,
.error-message {
  margin: 0;
  padding: 24px 0;
}

.error-message {
  color: #991b1b;
}

.details-header {
  position: relative;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  padding: clamp(20px, 4vw, 34px);
  border-radius: 20px;
  color: #ffffff;
  background: var(--pokemon-gradient, linear-gradient(135deg, #64748b, #334155));
  box-shadow: 0 18px 34px color-mix(in srgb, var(--pokemon-primary, #64748b) 22%, transparent);
}

.details-header::after {
  position: absolute;
  right: -72px;
  bottom: -104px;
  width: 240px;
  height: 240px;
  border: 42px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  content: '';
}

.details-header > * {
  position: relative;
  z-index: 1;
}

.details-header h2 {
  margin: 0;
  font-size: clamp(2.2rem, 6vw, 4.5rem);
  line-height: 0.95;
  letter-spacing: -0.045em;
  text-shadow: 0 3px 16px rgba(23, 32, 51, 0.2);
}

.eyebrow {
  margin: 0 0 10px;
  color: rgba(255, 255, 255, 0.82);
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
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
}

.sprite-frame img {
  width: 90%;
  height: 90%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 16px 18px rgba(23, 32, 51, 0.24));
}

.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.type-badge {
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 900;
  box-shadow: 0 6px 14px rgba(23, 32, 51, 0.14);
}

.descriptions {
  margin-top: 24px;
  padding: 18px;
  border-left: 4px solid var(--pokemon-primary, #dc2626);
  border-radius: 10px;
  background: #f8fafc;
}

.descriptions p {
  margin: 0;
  line-height: 1.6;
}

.descriptions p + p {
  margin-top: 10px;
  color: #596579;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0 0;
}

.facts-grid div {
  min-width: 0;
  padding: 15px;
  border: 1px solid #e3e6eb;
  border-radius: 12px;
  background: #fbfcfe;
}

.facts-grid dt {
  margin-bottom: 5px;
  color: #7a8494;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.facts-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #172033;
  font-weight: 700;
  line-height: 1.45;
}

.evolution-section {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid #e3e6eb;
}

.section-heading {
  display: flex;
  gap: 14px;
  justify-content: space-between;
  align-items: baseline;
}

.section-heading h3 {
  margin: 0;
  color: #172033;
  font-size: 1.15rem;
}

.section-heading span {
  color: #7a8494;
  font-size: 0.75rem;
}

.evolution-stages {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.evolution-stage-group {
  display: grid;
  justify-items: center;
}

.stage-label {
  margin-bottom: 8px;
  color: #7a8494;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.evolution-stage-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
}

.evolution-item {
  display: grid;
  flex: 1 1 150px;
  max-width: 220px;
  justify-items: center;
  padding: 14px;
  border: 1px solid #e3e6eb;
  border-radius: 14px;
  text-align: center;
  background: #fbfcfe;
}

.evolution-item img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  image-rendering: pixelated;
}

.evolution-item strong {
  color: #172033;
}

.evolution-method {
  margin-top: 6px;
  color: #687386;
  font-size: 0.74rem;
  line-height: 1.45;
}

.stage-arrow {
  margin: 6px 0;
  color: var(--pokemon-primary, #64748b);
  font-size: 1.5rem;
  font-weight: 900;
}

@media (max-width: 620px) {
  .details-header {
    align-items: flex-start;
  }

  .sprite-frame {
    width: 112px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 460px) {
  .details-header {
    flex-direction: column-reverse;
  }

  .sprite-frame {
    width: 96px;
  }

  .facts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
