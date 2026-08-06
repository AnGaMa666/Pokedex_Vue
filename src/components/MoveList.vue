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
        <small v-if="formLabel" class="active-form">{{ labels.form }}: {{ formLabel }}</small>
      </div>
      <span>{{ displayedMoves.length }} / {{ relevantMoveEntries.length }}</span>
    </div>

    <div class="move-controls" :aria-label="labels.filters">
      <label class="version-control">
        <span>{{ labels.gameGroup }}</span>
        <select v-model="selectedVersionGroup">
          <optgroup
            v-for="section in versionGroupSections"
            :key="section.generation"
            :label="section.label"
          >
            <option v-for="group in section.groups" :key="group.name" :value="group.name">
              {{ group.label }}
            </option>
          </optgroup>
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
          <option value="power">{{ labels.sortPower }}</option>
        </select>
      </label>
    </div>

    <p v-if="loadingDetails" class="move-status" role="status">{{ labels.loading }}</p>
    <p v-else-if="displayedMoves.length === 0" class="move-status">{{ labels.noMatches }}</p>

    <ul v-else class="move-list">
      <li v-for="move in displayedMoves" :key="move.name" v-memo="[move, language]">
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
          <span class="move-title-row">
            <img
              :src="getTypeIconDataUri(move.type)"
              :alt="getLocalizedTypeName(move.type, language)"
              width="34"
              height="34"
            >
            <span class="move-title-copy">
              <strong>{{ move.label }}</strong>
              <small>{{ getLocalizedTypeName(move.type, language) }}</small>
            </span>
            <span class="damage-class">{{ getDamageClassLabel(move.damageClass) }}</span>
          </span>

          <span class="move-values">
            <small>{{ labels.power }}: {{ move.power ?? '—' }}</small>
            <small>{{ labels.accuracy }}: {{ move.accuracy === null ? '—' : `${move.accuracy}%` }}</small>
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
  getCatalogLabel,
  loadGermanPokemonCatalog,
} from '@/services/localizationCatalog';
import { useActivePokemonForm } from '@/state/activePokemonForm';
import {
  getLocalizedDamageClassName,
  getLocalizedTypeName,
  getTypeTextColor,
} from '@/utils/localization';
import { getLocalizedName, getResourceId } from '@/utils/resource';
import { getTypeIconDataUri } from '@/utils/typeIcons';
import {
  getLatestVersionGroupName,
  groupVersionGroupsByGeneration,
} from '@/utils/versionGroups';

const props = defineProps({
  pokemonDetails: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['openResource']);
const { language } = useI18n();
const { activePokemonForm } = useActivePokemonForm();

const TYPE_COLORS = {
  fire: '#df4747', water: '#4a90da', grass: '#7cc576', electric: '#f5d547',
  ice: '#9ad6df', fighting: '#f08030', poison: '#a040a0', ground: '#e0c068',
  flying: '#32b3d1', psychic: '#ef70ef', bug: '#a8b820', rock: '#a38632',
  ghost: '#705898', dark: '#6b6663', dragon: '#7038f8', steel: '#a8a8b8',
  fairy: '#f0a6b6', normal: '#b6afaf',
};

const MAX_PARALLEL_REQUESTS = 8;
const moveDetailsByName = ref({});
const pokemonCatalog = ref(new Map());
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
      subtitle: 'Lernweg und Zeitpunkt nach Generation und Spielgruppe',
      form: 'Aktive Form',
      filters: 'Attacken filtern und sortieren',
      gameGroup: 'Generation / Spielgruppe',
      damageClass: 'Schadensart', learnMethod: 'Lernmethode', type: 'Typ', sort: 'Sortierung',
      all: 'Alle', physical: 'Physisch', special: 'Spezial', status: 'Status',
      sortName: 'Name A–Z', sortLevel: 'Level aufsteigend', sortDamageClass: 'Schadensart',
      sortType: 'Typ', sortPower: 'Stärke absteigend',
      loading: 'Attackendetails werden geladen…',
      noMatches: 'Keine Attacke entspricht den gewählten Filtern.',
      open: 'öffnen', power: 'Stärke', accuracy: 'Genauigkeit', level: 'Level',
      machine: 'TM / VM / TR', tutor: 'Attacken-Lehrer', egg: 'Zucht',
      lightBallEgg: 'Zucht mit Kugelblitz', formChange: 'Formwechsel',
      levelUp: 'Levelaufstieg', other: 'Andere Methode',
    }
  : {
      title: 'Moves', subtitle: 'Learning method and timing by generation and game group',
      form: 'Active form', filters: 'Filter and sort moves', gameGroup: 'Generation / game group',
      damageClass: 'Damage class', learnMethod: 'Learn method', type: 'Type', sort: 'Sort',
      all: 'All', physical: 'Physical', special: 'Special', status: 'Status',
      sortName: 'Name A–Z', sortLevel: 'Level ascending', sortDamageClass: 'Damage class',
      sortType: 'Type', sortPower: 'Power descending',
      loading: 'Loading move details…', noMatches: 'No move matches the selected filters.',
      open: 'open', power: 'Power', accuracy: 'Accuracy', level: 'Level',
      machine: 'TM / HM / TR', tutor: 'Move Tutor', egg: 'Breeding',
      lightBallEgg: 'Light Ball breeding', formChange: 'Form change',
      levelUp: 'Level up', other: 'Other method',
    });

const effectivePokemonDetails = computed(() => {
  const active = activePokemonForm.value;
  const activeSpecies = active?.species?.name;
  const propSpecies = props.pokemonDetails?.species?.name;
  return active && activeSpecies && activeSpecies === propSpecies
    ? active
    : props.pokemonDetails;
});

const formLabel = computed(() => {
  const details = effectivePokemonDetails.value;
  if (!details) return '';
  if (language.value === 'de') {
    return getCatalogLabel(pokemonCatalog.value, details.id, details.name);
  }
  return getLocalizedName(details.forms?.[0]?.names, details.name, 'en');
});

const moveEntries = computed(() => {
  const uniqueMoves = new Map();
  for (const moveEntry of effectivePokemonDetails.value?.moves || []) {
    const name = moveEntry.move?.name;
    if (!name) continue;
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
  return [...groupsByName.values()];
});

const versionGroupSections = computed(() => groupVersionGroupsByGeneration(
  versionGroupOptions.value,
  language.value,
));

const relevantMoveEntries = computed(() => moveEntries.value.filter((move) => (
  !selectedVersionGroup.value
  || move.versionGroupDetails.some((detail) => detail.version_group?.name === selectedVersionGroup.value)
)));

const getLearningForMove = (move) => move.versionGroupDetails
  .filter((detail) => !selectedVersionGroup.value
    || detail.version_group?.name === selectedVersionGroup.value)
  .map((detail) => ({
    method: detail.move_learn_method?.name || 'other',
    level: detail.level_learned_at ?? 0,
  }));

const enrichedMoves = computed(() => relevantMoveEntries.value
  .map((move) => {
    const details = moveDetailsByName.value[move.name];
    return {
      ...move,
      label: getLocalizedName(details?.names, move.name, language.value),
      type: details?.type?.name || 'normal',
      damageClass: details?.damage_class?.name || 'status',
      power: details?.power ?? null,
      accuracy: details?.accuracy ?? null,
      learning: getLearningForMove(move),
    };
  })
  .filter((move) => move.learning.length));

const availableTypes = computed(() => [...new Set(enrichedMoves.value.map((move) => move.type))]
  .sort((first, second) => getLocalizedTypeName(first, language.value).localeCompare(
    getLocalizedTypeName(second, language.value),
    language.value === 'de' ? 'de-DE' : 'en-US',
  )));

const availableLearnMethods = computed(() => [...new Set(
  enrichedMoves.value.flatMap((move) => move.learning.map((entry) => entry.method)),
)].sort((first, second) => formatLearnMethod(first).localeCompare(formatLearnMethod(second))));

const getMinimumLearnLevel = (move) => {
  const levels = move.learning.filter((entry) => entry.method === 'level-up').map((entry) => entry.level);
  return levels.length ? Math.min(...levels) : Number.MAX_SAFE_INTEGER;
};

const displayedMoves = computed(() => {
  const filtered = enrichedMoves.value.filter((move) => (
    (!selectedDamageClass.value || move.damageClass === selectedDamageClass.value)
    && (!selectedType.value || move.type === selectedType.value)
    && (!selectedLearnMethod.value
      || move.learning.some((entry) => entry.method === selectedLearnMethod.value))
  ));

  return [...filtered].sort((first, second) => {
    if (sortMode.value === 'level') {
      return getMinimumLearnLevel(first) - getMinimumLearnLevel(second)
        || first.label.localeCompare(second.label, language.value);
    }
    if (sortMode.value === 'damage-class') {
      return first.damageClass.localeCompare(second.damageClass)
        || first.label.localeCompare(second.label, language.value);
    }
    if (sortMode.value === 'type') {
      return getLocalizedTypeName(first.type, language.value).localeCompare(
        getLocalizedTypeName(second.type, language.value),
        language.value,
      ) || first.label.localeCompare(second.label, language.value);
    }
    if (sortMode.value === 'power') {
      return (second.power ?? -1) - (first.power ?? -1)
        || first.label.localeCompare(second.label, language.value);
    }
    return first.label.localeCompare(second.label, language.value);
  });
});

const getMoveTypeColor = (type) => TYPE_COLORS[type] || '#94a3b8';
const getDamageClassLabel = (damageClass) => getLocalizedDamageClassName(damageClass, language.value);
const formatLearnMethod = (method) => ({
  'level-up': labels.value.levelUp,
  machine: labels.value.machine,
  tutor: labels.value.tutor,
  egg: labels.value.egg,
  'light-ball-egg': labels.value.lightBallEgg,
  'form-change': labels.value.formChange,
})[method] || labels.value.other;
const formatLearning = (learning) => learning.method === 'level-up'
  ? `${labels.value.level} ${learning.level}`
  : formatLearnMethod(learning.method);
const openMove = (move) => emit('openResource', { kind: 'moves', name: move.name });

const loadMoveDetails = async () => {
  const loadId = ++activeLoadId;
  const missingMoves = relevantMoveEntries.value.filter((move) => !moveDetailsByName.value[move.name]);
  if (!missingMoves.length) {
    loadingDetails.value = false;
    return;
  }

  loadingDetails.value = true;
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < missingMoves.length) {
      const move = missingMoves[nextIndex];
      nextIndex += 1;
      try {
        const response = await PokeAPI.getMoveDetails(move.name);
        if (loadId !== activeLoadId) return;
        moveDetailsByName.value = {
          ...moveDetailsByName.value,
          [move.name]: response.data,
        };
      } catch (error) {
        console.error(`Failed to load move ${move.name}:`, error);
      }
    }
  };

  await Promise.all(Array.from(
    { length: Math.min(MAX_PARALLEL_REQUESTS, missingMoves.length) },
    worker,
  ));
  if (loadId === activeLoadId) loadingDetails.value = false;
};

const resetForPokemonForm = () => {
  activeLoadId += 1;
  moveDetailsByName.value = {};
  selectedDamageClass.value = '';
  selectedLearnMethod.value = '';
  selectedType.value = '';
  sortMode.value = 'name';
  selectedVersionGroup.value = getLatestVersionGroupName(versionGroupOptions.value);
};

watch(
  () => effectivePokemonDetails.value?.name,
  () => {
    resetForPokemonForm();
    void loadMoveDetails();
  },
  { immediate: true },
);

watch(versionGroupOptions, (groups) => {
  if (!groups.some((group) => group.name === selectedVersionGroup.value)) {
    selectedVersionGroup.value = getLatestVersionGroupName(groups);
  }
}, { immediate: true });

watch(selectedVersionGroup, () => {
  selectedDamageClass.value = '';
  selectedLearnMethod.value = '';
  selectedType.value = '';
  void loadMoveDetails();
});

watch(language, async () => {
  if (language.value === 'de' && !pokemonCatalog.value.size) {
    try {
      pokemonCatalog.value = await loadGermanPokemonCatalog();
    } catch (error) {
      console.error('Failed to load German Pokémon form names:', error);
    }
  }
}, { immediate: true });
</script>

<style scoped>
.pokemon-moves { position: sticky; top: 86px; max-height: calc(100vh - 104px); overflow: hidden; border: 1px solid var(--legacy-border); border-radius: 4px; background: var(--legacy-surface); box-shadow: 0 2px 5px var(--legacy-shadow); }
.move-heading { display: flex; justify-content: space-between; align-items: start; padding: 14px; border-bottom: 1px solid var(--legacy-border); background: var(--legacy-page); }
.move-heading h2 { margin: 0; color: var(--legacy-text); font-size: 1.25rem; }
.move-heading small, .move-heading > span { color: var(--legacy-muted); font-size: 0.7rem; }
.move-heading > div { display: grid; gap: 3px; }
.active-form { color: var(--legacy-text) !important; font-weight: 800; }
.move-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 9px; border-bottom: 1px solid var(--legacy-border); }
.move-controls label { display: grid; gap: 3px; min-width: 0; color: var(--legacy-muted); font-size: 0.62rem; font-weight: 850; }
.move-controls .version-control { grid-column: 1 / -1; }
.move-controls select { min-width: 0; width: 100%; min-height: 33px; padding: 5px 7px; border: 1px solid var(--legacy-border); border-radius: 4px; color: var(--legacy-text); background: var(--legacy-page); font-size: 0.72rem; }
.move-status { margin: 0; padding: 18px; color: var(--legacy-muted); }
.move-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; max-height: calc(100vh - 374px); padding: 9px; margin: 0; overflow-y: auto; overscroll-behavior: contain; list-style: none; }
.move-list > li { content-visibility: auto; contain-intrinsic-size: 118px; }
.move-item { display: grid; gap: 7px; width: 100%; min-width: 0; min-height: 112px; align-content: start; padding: 9px; border: 1px solid rgba(51, 51, 51, 0.22); border-radius: 4px; overflow-wrap: anywhere; text-align: left; cursor: pointer; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12); }
.move-item:hover { filter: brightness(0.96); }
.move-item:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.move-title-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 7px; align-items: center; }
.move-title-row img { width: 34px; height: 34px; border-radius: 8px; }
.move-title-copy { display: grid; min-width: 0; }
.move-title-copy strong { overflow: hidden; font-size: 0.84rem; text-overflow: ellipsis; white-space: nowrap; }
.move-title-copy small { font-size: 0.62rem; font-weight: 750; opacity: 0.82; }
.damage-class { flex: 0 0 auto; padding: 2px 5px; border: 1px solid currentColor; border-radius: 999px; font-size: 0.54rem; font-weight: 900; opacity: 0.84; }
.move-values { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; }
.move-values small { font-size: 0.62rem; font-weight: 800; opacity: 0.84; }
.learn-methods { display: flex; flex-wrap: wrap; gap: 4px; }
.learn-chip { padding: 3px 5px; border-radius: 3px; color: #f8fafc; font-size: 0.55rem; font-weight: 850; background: rgba(17, 24, 39, 0.8); }
@media (max-width: 1380px) { .pokemon-moves { position: static; max-height: none; } .move-list { max-height: 640px; } }
@media (max-width: 560px) { .move-list, .move-controls { grid-template-columns: 1fr; } .move-controls label, .move-controls .version-control { grid-column: 1; } }
</style>
