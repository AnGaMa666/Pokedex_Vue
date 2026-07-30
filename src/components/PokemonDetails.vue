<template>
  <article class="pokemon-details" :style="detailStyle" :aria-busy="loading">
    <p v-if="loading" class="status-message" role="status">
      Loading Pokémon details…
    </p>

    <p v-else-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </p>

    <template v-else-if="pokemonDetails">
      <header class="details-hero">
        <div class="hero-copy">
          <p class="eyebrow">National Pokédex #{{ formatPokemonId(pokemonDetails.id) }}</p>
          <h2>{{ formatPokemonName(pokemonDetails.name) }}</h2>
          <div class="type-list" aria-label="Pokémon types">
            <span
              v-for="typeEntry in pokemonDetails.types"
              :key="typeEntry.type.name"
              class="type-badge"
              :style="{ '--badge-color': getTypeColor(typeEntry.type.name) }"
            >
              {{ formatPokemonName(typeEntry.type.name) }}
            </span>
          </div>
        </div>

        <div class="sprite-stage">
          <span v-if="isShiny" class="shiny-label">Shiny</span>
          <img
            v-if="spriteUrl"
            :src="spriteUrl"
            :alt="`${formatPokemonName(pokemonDetails.name)} ${isShiny ? 'shiny' : 'normal'} sprite`"
            width="192"
            height="192"
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
          <div>
            <p>Growth path</p>
            <h3>Evolution chain</h3>
          </div>
          <span>{{ evolutionChain.length }} forms</span>
        </div>

        <ol class="evolution-chain">
          <li
            v-for="stage in evolutionStages"
            :key="stage.stage"
            class="evolution-stage-group"
          >
            <span class="evolution-stage-label">Stage {{ stage.stage + 1 }}</span>
            <div class="evolution-options">
              <article
                v-for="evolution in stage.pokemon"
                :key="evolution.name"
                class="evolution-item"
                :class="{ 'is-current': evolution.name === pokemonDetails.name }"
              >
                <img
                  v-if="evolution.sprite"
                  :src="evolution.sprite"
                  :alt="`${formatPokemonName(evolution.name)} sprite`"
                  width="104"
                  height="104"
                  loading="lazy"
                >
                <span>{{ formatPokemonName(evolution.name) }}</span>
              </article>
            </div>
          </li>
        </ol>
      </section>
    </template>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import PokeAPI from '@/services/pokeapi';

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

const typeColors = {
  bug: '#92a83e',
  dark: '#5b5365',
  dragon: '#5f63d3',
  electric: '#d8ad22',
  fairy: '#d875a7',
  fighting: '#b2473f',
  fire: '#dc5f36',
  flying: '#7894d0',
  ghost: '#62588f',
  grass: '#529b4c',
  ground: '#c49d4c',
  ice: '#62aaaa',
  normal: '#858a86',
  poison: '#925095',
  psychic: '#d94f78',
  rock: '#9e8840',
  steel: '#82919c',
  water: '#477cc3',
};

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

const getTypeColor = (typeName) => typeColors[typeName] || '#64748b';

const spriteUrl = computed(() => {
  if (!pokemonDetails.value) {
    return '';
  }

  if (props.isShiny && pokemonDetails.value.sprites.front_shiny) {
    return pokemonDetails.value.sprites.front_shiny;
  }

  return pokemonDetails.value.sprites.front_default || '';
});

const detailStyle = computed(() => {
  const types = pokemonDetails.value?.types || [];
  const primaryType = types[0]?.type?.name;
  const secondaryType = types[1]?.type?.name || primaryType;

  return {
    '--primary-type': getTypeColor(primaryType),
    '--secondary-type': getTypeColor(secondaryType),
  };
});

const evolutionStages = computed(() => {
  const stages = new Map();

  evolutionChain.value.forEach((evolution) => {
    if (!stages.has(evolution.stage)) {
      stages.set(evolution.stage, []);
    }

    stages.get(evolution.stage).push(evolution);
  });

  return [...stages.entries()]
    .sort(([firstStage], [secondStage]) => firstStage - secondStage)
    .map(([stage, pokemon]) => ({ stage, pokemon }));
});

const formatPokemonId = (id) => String(id).padStart(4, '0');

const formatPokemonName = (name) => {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatList = (values) => {
  if (!values.length) {
    return 'None';
  }

  return values.map(formatPokemonName).join(', ');
};

const formatAbilities = (abilities) => {
  return abilities
    .map((abilityEntry) => formatPokemonName(abilityEntry.ability.name))
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

const resolveEvolutionNode = async (node, stage) => {
  let sprite = null;

  try {
    const response = await PokeAPI.getPokemonDetails(node.species.name);
    sprite = response.data.sprites.front_default;
  } catch (requestError) {
    console.error(`Failed to load evolution sprite for ${node.species.name}:`, requestError);
  }

  const descendantGroups = await Promise.all(
    node.evolves_to.map((childNode) => resolveEvolutionNode(childNode, stage + 1)),
  );

  return [
    {
      name: node.species.name,
      sprite,
      stage,
    },
    ...descendantGroups.flat(),
  ];
};

const extractEvolutionChain = async (chain) => {
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
          resolvedEvolutionChain = await extractEvolutionChain(evolutionResponse.data.chain);
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
  {
    immediate: true,
  },
);
</script>

<style scoped>
.pokemon-details {
  min-width: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--primary-type) 28%, #d5d9e1);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 48px rgba(23, 32, 51, 0.11);
}

.status-message,
.error-message {
  margin: 0;
  padding: 32px;
}

.error-message {
  color: #991b1b;
}

.details-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  min-height: 238px;
  padding: 28px;
  overflow: hidden;
  color: #ffffff;
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.26), transparent 28%),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--primary-type) 74%, #0f172a),
      color-mix(in srgb, var(--secondary-type) 70%, #0f172a)
    );
}

.details-hero::after {
  position: absolute;
  right: -74px;
  bottom: -104px;
  width: 260px;
  height: 260px;
  border: 48px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  content: '';
}

.hero-copy,
.sprite-stage {
  position: relative;
  z-index: 1;
}

.details-hero h2 {
  max-width: 760px;
  margin: 0;
  font-size: clamp(2.35rem, 6vw, 4.3rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
  text-shadow: 0 3px 18px rgba(15, 23, 42, 0.24);
}

.eyebrow {
  margin: 0 0 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.type-badge {
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  background: color-mix(in srgb, var(--badge-color) 70%, rgba(15, 23, 42, 0.56));
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.14);
}

.sprite-stage {
  display: grid;
  width: 202px;
  height: 202px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.98) 0 46%, rgba(255, 255, 255, 0.28) 47% 49%, transparent 50%),
    rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0 0 30px rgba(255, 255, 255, 0.22),
    0 22px 40px rgba(15, 23, 42, 0.24);
  backdrop-filter: blur(8px);
}

.sprite-stage img {
  width: 192px;
  height: 192px;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 14px 16px rgba(15, 23, 42, 0.28));
}

.shiny-label {
  position: absolute;
  z-index: 2;
  top: 6px;
  right: 6px;
  padding: 5px 9px;
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 999px;
  color: #581c87;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: #f3e8ff;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
}

.descriptions {
  padding: 20px 22px;
  margin: 24px 24px 0;
  border-left: 5px solid var(--primary-type);
  border-radius: 12px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--primary-type) 9%, #ffffff), #f8fafc);
}

.descriptions p {
  margin: 0;
  line-height: 1.65;
}

.descriptions p + p {
  margin-top: 10px;
  color: #4b5563;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 0 24px;
  margin: 24px 0 0;
}

.facts-grid div {
  min-width: 0;
  padding: 15px;
  border: 1px solid #e3e6eb;
  border-radius: 13px;
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  box-shadow: 0 6px 14px rgba(23, 32, 51, 0.04);
}

.facts-grid dt {
  margin-bottom: 5px;
  color: #687386;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.facts-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 750;
  line-height: 1.45;
}

.evolution-section {
  padding: 24px;
  margin-top: 24px;
  border-top: 1px solid #e3e6eb;
  background: #fbfcfe;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.section-heading p {
  margin: 0 0 3px;
  color: var(--primary-type);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.section-heading h3 {
  margin: 0;
  font-size: 1.3rem;
}

.section-heading > span {
  padding: 5px 9px;
  border-radius: 999px;
  color: #687386;
  font-size: 0.76rem;
  font-weight: 800;
  background: #eef1f6;
}

.evolution-chain {
  display: flex;
  gap: 44px;
  align-items: stretch;
  padding: 4px 4px 12px;
  margin: 0;
  overflow-x: auto;
  list-style: none;
  scrollbar-color: #b9c0cc transparent;
  scrollbar-width: thin;
}

.evolution-stage-group {
  position: relative;
  display: flex;
  flex: 0 0 min(220px, 72vw);
  flex-direction: column;
  gap: 9px;
}

.evolution-stage-group:not(:last-child)::after {
  position: absolute;
  top: 50%;
  right: -34px;
  color: color-mix(in srgb, var(--primary-type) 62%, #64748b);
  content: '→';
  font-size: 1.65rem;
  font-weight: 900;
  transform: translateY(-50%);
}

.evolution-stage-label {
  align-self: flex-start;
  padding: 4px 8px;
  border-radius: 999px;
  color: #687386;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: #eef1f6;
}

.evolution-options {
  display: grid;
  gap: 10px;
}

.evolution-item {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 116px;
  padding: 8px 12px 8px 8px;
  border: 1px solid #e3e6eb;
  border-radius: 16px;
  color: #344054;
  font-weight: 800;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(23, 32, 51, 0.05);
}

.evolution-item.is-current {
  border-color: color-mix(in srgb, var(--primary-type) 55%, #d5d9e1);
  background: linear-gradient(145deg, color-mix(in srgb, var(--primary-type) 10%, #ffffff), #ffffff);
  box-shadow: inset 4px 0 0 var(--primary-type), 0 8px 18px rgba(23, 32, 51, 0.06);
}

.evolution-item img {
  width: 104px;
  height: 104px;
  object-fit: contain;
  image-rendering: pixelated;
}

@media (max-width: 680px) {
  .details-hero {
    grid-template-columns: 1fr;
    min-height: 0;
    padding: 24px;
  }

  .sprite-stage {
    width: 172px;
    height: 172px;
    margin: 0 auto;
  }

  .sprite-stage img {
    width: 164px;
    height: 164px;
  }

  .descriptions {
    margin: 18px 18px 0;
  }

  .facts-grid {
    grid-template-columns: 1fr;
    padding: 0 18px;
    margin-top: 18px;
  }

  .evolution-section {
    padding: 20px 18px;
    margin-top: 18px;
  }

  .evolution-chain {
    flex-direction: column;
    gap: 38px;
    overflow-x: visible;
  }

  .evolution-stage-group {
    flex-basis: auto;
  }

  .evolution-stage-group:not(:last-child)::after {
    top: auto;
    right: 50%;
    bottom: -32px;
    content: '↓';
    transform: translateX(50%);
  }
}

@media (max-width: 420px) {
  .details-hero h2 {
    font-size: 2.25rem;
  }

  .evolution-item {
    grid-template-columns: 88px minmax(0, 1fr);
  }

  .evolution-item img {
    width: 88px;
    height: 88px;
  }
}
</style>
