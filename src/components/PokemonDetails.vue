<template>
  <article class="pokemon-details" :aria-busy="loading">
    <p v-if="loading" class="status-message" role="status">
      Loading Pokémon details…
    </p>

    <p v-else-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </p>

    <template v-else-if="pokemonDetails">
      <header class="details-header">
        <div>
          <p class="eyebrow">#{{ formatPokemonId(pokemonDetails.id) }}</p>
          <h2>{{ formatPokemonName(pokemonDetails.name) }}</h2>
        </div>
        <img
          v-if="spriteUrl"
          :src="spriteUrl"
          :alt="`${formatPokemonName(pokemonDetails.name)} ${isShiny ? 'shiny' : 'normal'} sprite`"
          width="160"
          height="160"
        >
      </header>

      <div class="type-list" aria-label="Pokémon types">
        <span
          v-for="typeEntry in pokemonDetails.types"
          :key="typeEntry.type.name"
          class="type-badge"
        >
          {{ formatPokemonName(typeEntry.type.name) }}
        </span>
      </div>

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

      <section v-if="evolutionChain.length" class="evolution-section">
        <h3>Evolution chain</h3>
        <ul class="evolution-chain">
          <li
            v-for="evolution in evolutionChain"
            :key="`${evolution.stage}-${evolution.name}`"
            class="evolution-item"
          >
            <span class="evolution-stage">Stage {{ evolution.stage + 1 }}</span>
            <img
              v-if="evolution.sprite"
              :src="evolution.sprite"
              :alt="`${formatPokemonName(evolution.name)} sprite`"
              width="96"
              height="96"
              loading="lazy"
            >
            <span>{{ formatPokemonName(evolution.name) }}</span>
          </li>
        </ul>
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
  padding: 24px;
  border: 1px solid #d5d9e1;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(23, 32, 51, 0.08);
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
  display: flex;
  gap: 24px;
  justify-content: space-between;
  align-items: center;
}

.details-header h2 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.25rem);
  line-height: 1;
}

.details-header img {
  width: 160px;
  height: 160px;
  object-fit: contain;
  image-rendering: pixelated;
}

.eyebrow {
  margin: 0 0 8px;
  color: #687386;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}

.type-badge {
  padding: 6px 10px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 800;
  background: #334155;
}

.descriptions {
  padding: 16px;
  border-left: 4px solid #dc2626;
  border-radius: 8px;
  background: #f8fafc;
}

.descriptions p {
  margin: 0;
}

.descriptions p + p {
  margin-top: 10px;
  color: #4b5563;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0 0;
}

.facts-grid div {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e3e6eb;
  border-radius: 10px;
  background: #fbfcfe;
}

.facts-grid dt {
  margin-bottom: 4px;
  color: #687386;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.facts-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 650;
}

.evolution-section {
  margin-top: 24px;
}

.evolution-section h3 {
  margin: 0 0 12px;
  font-size: 1.15rem;
}

.evolution-chain {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.evolution-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 12px;
  border: 1px solid #e3e6eb;
  border-radius: 10px;
  text-align: center;
  background: #fbfcfe;
}

.evolution-item img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  image-rendering: pixelated;
}

.evolution-stage {
  color: #687386;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

@media (max-width: 560px) {
  .pokemon-details {
    padding: 18px;
  }

  .details-header {
    align-items: flex-start;
  }

  .details-header img {
    width: 112px;
    height: 112px;
  }

  .facts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
