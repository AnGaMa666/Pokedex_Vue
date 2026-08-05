<template>
  <section
    v-if="moveEntries.length"
    class="pokemon-moves"
    :aria-busy="loadingDetails"
    aria-labelledby="move-list-title"
  >
    <div class="move-heading">
      <div>
        <h2 id="move-list-title">{{ labels.title }}</h2>
        <small>{{ labels.subtitle }}</small>
      </div>
      <span>{{ displayedMoves.length }} / {{ moveEntries.length }}</span>
    </div>

    <div class="move-controls" :aria-label="labels.filters">
      <label class="version-control">
        <span>{{ labels.gameGroup }}</span>
        <select v-model="selectedVersionGroup">
          <option v-for="group in versionGroupOptions" :key="group.name" :value="group.name">
            {{ formatVersionGroup(group.name) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ labels.damageClass }}</span>
        <select v-model="selectedDamageClass">
          <option value="">{{ labels.all }}</option>
          <option value="physical">{{ labels.physical }}</option>
          <option value="special">{{ labels.special }}</option>
          <option value="status">{{ labels.status }}</option>
        </select>
      </label>

      <label>
        <span>{{ labels.learnMethod }}</span>
        <select v-model="selectedLearnMethod">
          <option value="">{{ labels.all }}</option>
          <option v-for="method in availableLearnMethods" :key="method" :value="method">
            {{ formatLearnMethod(method) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ labels.type }}</span>
        <select v-model="selectedType">
          <option value="">{{ labels.all }}</option>
          <option v-for="type in availableTypes" :key="type" :value="type">
            {{ getLocalizedTypeName(type, language) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ labels.sort }}</span>
        <select v-model="sortMode">
          <option value="name">{{ labels.sortName }}</option>
          <option value="level">{{ labels.sortLevel }}</option>
          <option value="damage-class">{{ labels.sortDamageClass }}</option>
          <option value="type">{{ labels.sortType }}</option>
        </select>
      </label>
    </div>

    <p v-if="loadingDetails" class="move-status" role="status">{{ labels.loading }}</p>
    <p v-else-if="displayedMoves.length === 0" class="move-status">{{ labels.noMatches }}</p>

    <ul v-else class="move-list">
      <li v-for="move in displayedMoves" :key="move.name">
        <button
          type="button"
          class="move-item"
          :style="{
            backgroundColor: getMoveTypeColor(move.type),
            color: getTypeTextColor(move.type),
          }"
          :aria-label="`${move.label} ${labels.open}`"
          @click="openMove(move)"
        >
          <span class="move-main-row">
            <strong>{{ move.label }}</strong>
            <span class="damage-class">{{ getDamageClassLabel(move.damageClass) }}</span>
          </span>
          <span class="move-type-row">
            <small>{{ getLocalizedTypeName(move.type, language) }}</small>
            <small v-if="move.power">{{ labels.power }} {{ move.power }}</small>
          </span>
          <span class="learn-methods">
            <span
              v-for="learning in move.learning"
              :key="`${move.name}-${learning.method}-${learning.level}`"
              class="learn-chip"
            >
              {{ formatLearning(learning) }}
            </span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  getLocalizedDamageClassName,
  getLocalizedTypeName,
  getTypeTextColor,
} from '@/utils/localization';
import { getLocalizedName, getResourceId } from '@/utils/resource';

const props = defineProps({
  pokemonDetails: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['openResource']);
const { language } = useI18n();

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
  rock: '#8b6d13',
  ghost: '#705898',
  dark: '#838383',
  dragon: '#7038f8',
  steel: '#a8a8b8',
  fairy: '#f0b6bc',
  normal: '#b6afaf',
};

const MAX_PARALLEL_REQUESTS = 8;
const moveDetailsByName = ref({});
const loadingDetails = ref(false);
const selectedVersionGroup = ref('');
const selectedDamageClass = ref('');
const selectedLearnMethod = ref('');
const selectedType = ref('');
const sortMode = ref('name');
let activeLoadId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      title: 'Attacken',
      subtitle: 'Lernweg und Zeitpunkt nach Spielgruppe',
      filters: 'Attacken filtern und sortieren',
      gameGroup: 'Spiel / Versionsgruppe',
      damageClass: 'Schadensart',
      learnMethod: 'Lernmethode',
      type: 'Typ',
      sort: 'Sortierung',
      all: 'Alle',
      physical: 'Physisch',
      special: 'Spezial',
      status: 'Status',
      sortName: 'Name A–Z',
      sortLevel: 'Level aufsteigend',
      sortDamageClass: 'Schadensart',
      sortType: 'Typ',
      loading: 'Attackendetails werden geladen…',
      noMatches: 'Keine Attacke entspricht den gewählten Filtern.',
      open: 'öffnen',
      power: 'Stärke',
      level: 'Level',
      machine: 'TM / VM / TR',
      tutor: 'Attacken-Lehrer',
      egg: 'Zucht',
      lightBallEgg: 'Zucht mit Kugelblitz',
      formChange: 'Formwechsel',
      levelUp: 'Levelaufstieg',
      other: 'Andere Methode',
    }
  : {
      title: 'Moves',
      subtitle: 'Learning method and timing by game group',
      filters: 'Filter and sort moves',
      gameGroup: 'Game / version group',
      damageClass: 'Damage class',
      learnMethod: 'Learn method',
      type: 'Type',
      sort: 'Sort',
      all: 'All',
      physical: 'Physical',
      special: 'Special',
      status: 'Status',
      sortName: 'Name A–Z',
      sortLevel: 'Level ascending',
      sortDamageClass: 'Damage class',
      sortType: 'Type',
      loading: 'Loading move details…',
      noMatches: 'No move matches the selected filters.',
      open: 'open',
      power: 'Power',
      level: 'Level',
      machine: 'TM / HM / TR',
      tutor: 'Move Tutor',
      egg: 'Breeding',
      lightBallEgg: 'Light Ball breeding',
      formChange: 'Form change',
      levelUp: 'Level up',
      other: 'Other method',
    });

const moveEntries = computed(() => {
  const uniqueMoves = new Map();

  for (const moveEntry of props.pokemonDetails.moves || []) {
    const name = moveEntry.move?.name;

    if (!name) {
      continue;
    }

    uniqueMoves.set(name, {
      name,
      versionGroupDetails: moveEntry.version_group_details || [],
    });
  }

  return [...uniqueMoves.values()];
});

const versionGroupOptions = computed(() => {
  const groupsByName = new Map();

  for (const move of moveEntries.value) {
    for (const detail of move.versionGroupDetails) {
      const group = detail.version_group;

      if (group?.name && !groupsByName.has(group.name)) {
        groupsByName.set(group.name, {
          name: group.name,
          id: getResourceId(group.url) ?? 0,
        });
      }
    }
  }

  return [...groupsByName.values()].sort((firstGroup, secondGroup) => {
    return secondGroup.id - firstGroup.id;
  });
});

const getLearningForMove = (move) => {
  const matchingEntries = move.versionGroupDetails.filter((detail) => {
    return !selectedVersionGroup.value
      || detail.version_group?.name === selectedVersionGroup.value;
  });

  return matchingEntries.map((detail) => ({
    method: detail.move_learn_method?.name || 'other',
    level: detail.level_learned_at ?? 0,
  }));
};

const enrichedMoves = computed(() => {
  return moveEntries.value
    .map((move) => {
      const details = moveDetailsByName.value[move.name];
      const learning = getLearningForMove(move);

      return {
        ...move,
        label: getLocalizedName(details?.names, move.name, language.value),
        type: details?.type?.name || 'normal',
        damageClass: details?.damage_class?.name || 'status',
        power: details?.power ?? null,
        learning,
      };
    })
    .filter((move) => move.learning.length > 0);
});

const availableTypes = computed(() => [...new Set(
  enrichedMoves.value.map((move) => move.type).filter(Boolean),
)].sort((firstType, secondType) => {
  return getLocalizedTypeName(firstType, language.value).localeCompare(
    getLocalizedTypeName(secondType, language.value),
    language.value,
  );
}));

const availableLearnMethods = computed(() => [...new Set(
  enrichedMoves.value.flatMap((move) => move.learning.map((entry) => entry.method)),
)].sort((firstMethod, secondMethod) => {
  return formatLearnMethod(firstMethod).localeCompare(
    formatLearnMethod(secondMethod),
    language.value,
  );
}));

const getMinimumLearnLevel = (move) => {
  const levels = move.learning
    .filter((entry) => entry.method === 'level-up')
    .map((entry) => entry.level);
  return levels.length ? Math.min(...levels) : Number.MAX_SAFE_INTEGER;
};

const displayedMoves = computed(() => {
  const filtered = enrichedMoves.value.filter((move) => {
    const matchesDamageClass = !selectedDamageClass.value
      || move.damageClass === selectedDamageClass.value;
    const matchesType = !selectedType.value || move.type === selectedType.value;
    const matchesMethod = !selectedLearnMethod.value
      || move.learning.some((entry) => entry.method === selectedLearnMethod.value);
    return matchesDamageClass && matchesType && matchesMethod;
  });

  return [...filtered].sort((firstMove, secondMove) => {
    if (sortMode.value === 'level') {
      const levelDifference = getMinimumLearnLevel(firstMove) - getMinimumLearnLevel(secondMove);
      return levelDifference || firstMove.label.localeCompare(secondMove.label, language.value);
    }

    if (sortMode.value === 'damage-class') {
      const classDifference = firstMove.damageClass.localeCompare(secondMove.damageClass);
      return classDifference || firstMove.label.localeCompare(secondMove.label, language.value);
    }

    if (sortMode.value === 'type') {
      const typeDifference = getLocalizedTypeName(firstMove.type, language.value).localeCompare(
        getLocalizedTypeName(secondMove.type, language.value),
        language.value,
      );
      return typeDifference || firstMove.label.localeCompare(secondMove.label, language.value);
    }

    return firstMove.label.localeCompare(secondMove.label, language.value);
  });
});

const getMoveTypeColor = (type) => TYPE_COLORS[type] || '#f8f8f8';
const getDamageClassLabel = (damageClass) => getLocalizedDamageClassName(
  damageClass,
  language.value,
);

const formatVersionGroup = (name) => {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
};

const formatLearnMethod = (method) => {
  const mapping = {
    'level-up': labels.value.levelUp,
    machine: labels.value.machine,
    tutor: labels.value.tutor,
    egg: labels.value.egg,
    'light-ball-egg': labels.value.lightBallEgg,
    'form-change': labels.value.formChange,
  };
  return mapping[method] || labels.value.other;
};

const formatLearning = (learning) => {
  if (learning.method === 'level-up') {
    return `${labels.value.level} ${learning.level}`;
  }

  return formatLearnMethod(learning.method);
};

const openMove = (move) => {
  emit('openResource', {
    kind: 'moves',
    name: move.name,
  });
};

const loadMoveDetails = async () => {
  const loadId = ++activeLoadId;
  const missingMoves = moveEntries.value.filter((move) => {
    return !moveDetailsByName.value[move.name];
  });

  if (!missingMoves.length) {
    loadingDetails.value = false;
    return;
  }

  loadingDetails.value = true;
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < missingMoves.length) {
      const index = nextIndex;
      nextIndex += 1;
      const move = missingMoves[index];

      try {
        const response = await PokeAPI.getMoveDetails(move.name);

        if (loadId !== activeLoadId) {
          return;
        }

        moveDetailsByName.value = {
          ...moveDetailsByName.value,
          [move.name]: response.data,
        };
      } catch (requestError) {
        console.error(`Failed to load move ${move.name}:`, requestError);
      }
    }
  };

  const workerCount = Math.min(MAX_PARALLEL_REQUESTS, missingMoves.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  if (loadId === activeLoadId) {
    loadingDetails.value = false;
  }
};

watch(
  () => props.pokemonDetails,
  () => {
    moveDetailsByName.value = {};
    selectedDamageClass.value = '';
    selectedLearnMethod.value = '';
    selectedType.value = '';
    sortMode.value = 'name';
    selectedVersionGroup.value = versionGroupOptions.value[0]?.name || '';
    void loadMoveDetails();
  },
  { immediate: true },
);

watch(versionGroupOptions, (groups) => {
  if (!groups.some((group) => group.name === selectedVersionGroup.value)) {
    selectedVersionGroup.value = groups[0]?.name || '';
  }
}, { immediate: true });
</script>

<style scoped>
.pokemon-moves {
  position: sticky;
  top: 86px;
  max-height: calc(100vh - 104px);
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.move-heading {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 14px;
  border-bottom: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.move-heading h2 {
  margin: 0;
  color: var(--legacy-text);
  font-size: 1.25rem;
}

.move-heading small,
.move-heading > span {
  color: var(--legacy-muted);
  font-size: 0.7rem;
}

.move-heading > div {
  display: grid;
  gap: 3px;
}

.move-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  padding: 9px;
  border-bottom: 1px solid var(--legacy-border);
}

.move-controls label {
  display: grid;
  gap: 3px;
  min-width: 0;
  color: var(--legacy-muted);
  font-size: 0.62rem;
  font-weight: 850;
}

.move-controls .version-control {
  grid-column: 1 / -1;
}

.move-controls select {
  min-width: 0;
  width: 100%;
  min-height: 33px;
  padding: 5px 7px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-page);
  font-size: 0.72rem;
}

.move-status {
  margin: 0;
  padding: 18px;
  color: var(--legacy-muted);
}

.move-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  max-height: calc(100vh - 355px);
  padding: 9px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.move-item {
  display: grid;
  gap: 6px;
  width: 100%;
  min-width: 0;
  min-height: 92px;
  align-content: start;
  padding: 9px;
  border: 1px solid rgba(51, 51, 51, 0.22);
  border-radius: 4px;
  overflow-wrap: anywhere;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.move-item:hover {
  filter: brightness(0.96);
}

.move-item:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.move-main-row,
.move-type-row {
  display: flex;
  gap: 6px;
  justify-content: space-between;
  align-items: start;
}

.move-main-row strong {
  min-width: 0;
  font-size: 0.86rem;
}

.damage-class {
  flex: 0 0 auto;
  padding: 2px 5px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 0.54rem;
  font-weight: 900;
  opacity: 0.84;
}

.move-type-row small {
  font-size: 0.64rem;
  font-weight: 750;
  opacity: 0.82;
}

.learn-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.learn-chip {
  padding: 3px 5px;
  border: 1px solid currentColor;
  border-radius: 4px;
  font-size: 0.56rem;
  font-weight: 850;
  background: rgba(255, 255, 255, 0.46);
}

@media (max-width: 1280px) {
  .pokemon-moves {
    position: static;
    max-height: none;
  }

  .move-list {
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    max-height: 520px;
  }
}

@media (max-width: 760px) {
  .move-heading {
    padding: 11px;
  }

  .move-controls {
    padding: 7px;
  }

  .move-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    max-height: min(58vh, 520px);
    padding: 7px;
  }

  .move-item {
    min-height: 88px;
    padding: 7px;
  }
}

@media (max-width: 420px) {
  .move-controls,
  .move-list {
    grid-template-columns: 1fr;
  }

  .move-controls .version-control {
    grid-column: auto;
  }
}
</style>
