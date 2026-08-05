<template>
  <section
    v-if="movesWithType.length"
    class="pokemon-moves"
    :aria-busy="loadingTypes"
    aria-labelledby="move-list-title"
  >
    <div class="move-heading">
      <h2 id="move-list-title">{{ t('navigation.moves.label') }}</h2>
      <span>{{ movesWithType.length }}</span>
    </div>

    <ul class="move-list">
      <li
        v-for="move in movesWithType"
        :key="move.name"
        class="move-item"
        :style="{
          backgroundColor: getMoveTypeColor(move.type),
          color: getMoveTextColor(move.type),
        }"
      >
        <strong>{{ move.label }}</strong>
        <small v-if="move.type">{{ formatMoveName(move.type) }}</small>
        <small v-else aria-hidden="true">…</small>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';

const props = defineProps({
  pokemonDetails: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();

const TYPE_COLORS = {
  fire: '#df4747',
  water: '#4a90da',
  grass: '#7cc576',
  electric: '#fdfda9',
  ice: '#9ad6df',
  fighting: '#f08030',
  poison: '#a040a0',
  ground: '#e0c068',
  flying: '#32b3d1',
  psychic: '#ff80ff',
  bug: '#a8b820',
  rock: '#5c4705',
  ghost: '#705898',
  dark: '#838383',
  dragon: '#7038f8',
  steel: 'rgba(135, 131, 131, 0.52)',
  fairy: '#f0b6bc',
  normal: '#b6afaf',
};

const DARK_MOVE_TYPES = new Set([
  'dark',
  'dragon',
  'fire',
  'ghost',
  'poison',
  'rock',
  'water',
]);

const MAX_PARALLEL_REQUESTS = 8;
const movesWithType = ref([]);
const loadingTypes = ref(false);
let activeLoadId = 0;

const formatMoveName = (name = '') => {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const moveEntries = computed(() => {
  const uniqueMoves = new Map();

  for (const moveEntry of props.pokemonDetails.moves || []) {
    const name = moveEntry.move?.name;

    if (name && !uniqueMoves.has(name)) {
      uniqueMoves.set(name, {
        name,
        label: formatMoveName(name),
        type: null,
      });
    }
  }

  return [...uniqueMoves.values()]
    .sort((firstMove, secondMove) => firstMove.label.localeCompare(secondMove.label));
});

const getMoveTypeColor = (type) => TYPE_COLORS[type] || '#f8f8f8';
const getMoveTextColor = (type) => DARK_MOVE_TYPES.has(type) ? '#ffffff' : '#333333';

const loadMoveTypes = async () => {
  const loadId = ++activeLoadId;
  const entries = moveEntries.value.map((move) => ({ ...move }));

  movesWithType.value = entries;

  if (!entries.length) {
    loadingTypes.value = false;
    return;
  }

  loadingTypes.value = true;
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < entries.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        const response = await PokeAPI.getMoveDetails(entries[index].name);

        if (loadId !== activeLoadId) {
          return;
        }

        movesWithType.value[index] = {
          ...movesWithType.value[index],
          type: response.data.type?.name || null,
        };
      } catch (requestError) {
        console.error(`Failed to load the type for ${entries[index].name}:`, requestError);
      }
    }
  };

  const workerCount = Math.min(MAX_PARALLEL_REQUESTS, entries.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  if (loadId === activeLoadId) {
    loadingTypes.value = false;
  }
};

watch(
  () => props.pokemonDetails,
  loadMoveTypes,
  { immediate: true },
);
</script>

<style scoped>
.pokemon-moves {
  max-height: calc(100vh - 112px);
  overflow: hidden;
  border: 1px solid #cccccc;
  border-radius: 4px;
  background: #f8f8f8;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22);
}

.move-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 16px;
  border-bottom: 1px solid #cccccc;
  background: #ffffff;
}

.move-heading h2 {
  margin: 0;
  color: #333333;
  font-size: 1.35rem;
}

.move-heading span {
  color: #666666;
  font-size: 0.875rem;
}

.move-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-height: calc(100vh - 182px);
  padding: 12px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.move-item {
  display: grid;
  gap: 3px;
  min-width: 0;
  min-height: 54px;
  align-content: center;
  padding: 9px 10px;
  border: 1px solid rgba(51, 51, 51, 0.2);
  border-radius: 4px;
  overflow-wrap: anywhere;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.move-item strong {
  font-size: 0.9rem;
}

.move-item small {
  font-size: 0.7rem;
  font-weight: 700;
  opacity: 0.82;
}

@media (max-width: 1100px) {
  .pokemon-moves {
    max-height: none;
  }

  .move-list {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    max-height: 420px;
  }
}
</style>
