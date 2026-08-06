<template>
  <section class="team-builder" aria-labelledby="team-builder-title">
    <header class="team-header">
      <div>
        <p>{{ labels.kicker }}</p>
        <h1 id="team-builder-title">{{ labels.title }}</h1>
        <span>{{ labels.description }}</span>
      </div>
      <div class="team-actions">
        <button type="button" @click="clearTeam">{{ labels.clearTeam }}</button>
        <button type="button" @click="copyExport">{{ copyState }}</button>
      </div>
    </header>

    <section class="team-overview">
      <article>
        <h2>{{ labels.typeCoverage }}</h2>
        <div v-if="teamTypes.length" class="overview-chips">
          <span v-for="entry in teamTypes" :key="entry.type">
            {{ getLocalizedTypeName(entry.type, language) }} ×{{ entry.count }}
          </span>
        </div>
        <p v-else>{{ labels.noTeamData }}</p>
      </article>

      <article>
        <h2>{{ labels.sharedWeaknesses }}</h2>
        <div v-if="teamWeaknesses.length" class="overview-chips weakness-chips">
          <span v-for="entry in teamWeaknesses" :key="entry.type">
            {{ getLocalizedTypeName(entry.type, language) }} ×{{ entry.count }}
          </span>
        </div>
        <p v-else>{{ labels.noTeamData }}</p>
      </article>

      <article class="export-card">
        <div class="export-heading">
          <h2>{{ labels.export }}</h2>
          <label>
            <span>{{ labels.exportFormat }}</span>
            <select v-model="exportMode">
              <option value="summary">{{ labels.readableSummary }}</option>
              <option value="showdown">Pokémon Showdown</option>
            </select>
          </label>
        </div>
        <textarea :value="teamExport" readonly rows="8" :aria-label="labels.export"></textarea>
      </article>
    </section>

    <div class="slot-grid">
      <article
        v-for="(slot, slotIndex) in teamSlots"
        :key="slot.slotId"
        class="team-slot"
        :class="{ filled: slot.details, expanded: slot.expanded }"
      >
        <header class="slot-header">
          <div class="slot-identity">
            <button
              type="button"
              class="slot-sprite"
              :aria-label="labels.choosePokemon"
              @click="openPicker('pokemon', slotIndex)"
            >
              <img
                v-if="slot.details"
                :src="getPokemonSprite(slot.details, spriteMode, isShiny)"
                :alt="getSlotPokemonName(slot)"
                width="88"
                height="88"
                decoding="async"
              >
              <span v-else aria-hidden="true">{{ slotIndex + 1 }}</span>
            </button>
            <div class="slot-title">
              <p>{{ labels.slot }} {{ slotIndex + 1 }}</p>
              <h2>{{ slot.details ? getSlotPokemonName(slot) : labels.emptySlot }}</h2>
              <div v-if="slot.details" class="slot-types">
                <span
                  v-for="typeEntry in slot.details.types"
                  :key="typeEntry.type.name"
                  :style="{ backgroundColor: getTypeColor(typeEntry.type.name) }"
                >
                  {{ getLocalizedTypeName(typeEntry.type.name, language) }}
                </span>
              </div>
            </div>
          </div>
          <div class="slot-header-actions">
            <button type="button" class="select-pokemon-button" @click="openPicker('pokemon', slotIndex)">
              {{ slot.details ? labels.changePokemon : labels.choosePokemon }}
            </button>
            <button
              v-if="slot.details"
              type="button"
              class="toggle-editor-button"
              :aria-expanded="slot.expanded"
              @click="slot.expanded = !slot.expanded"
            >
              {{ slot.expanded ? labels.collapse : labels.edit }}
            </button>
            <button
              type="button"
              class="remove-button"
              :disabled="!slot.speciesName"
              @click="clearSlot(slotIndex)"
            >
              {{ labels.remove }}
            </button>
          </div>
        </header>

        <p v-if="slot.loading" class="slot-status" role="status">{{ labels.loadingPokemon }}</p>
        <p v-else-if="slot.error" class="slot-error" role="alert">{{ slot.error }}</p>

        <div v-if="slot.details && slot.expanded" class="slot-editor">
          <section class="selection-grid">
            <label class="number-field">
              <span>{{ labels.level }}</span>
              <input v-model.number="slot.level" type="number" min="1" max="100">
            </label>

            <button type="button" class="selection-field" @click="openPicker('ability', slotIndex)">
              <span>{{ labels.ability }}</span>
              <strong>{{ getAbilityLabel(slot, slot.ability) || labels.chooseAbility }}</strong>
              <small v-if="isHiddenAbility(slot, slot.ability)">{{ labels.hiddenAbility }}</small>
              <b aria-hidden="true">›</b>
            </button>

            <label class="native-field">
              <span>{{ labels.nature }}</span>
              <select v-model="slot.nature">
                <option v-for="nature in natureOptions" :key="nature.name" :value="nature.name">
                  {{ nature.label }} · {{ formatNatureEffect(nature) }}
                </option>
              </select>
            </label>

            <button type="button" class="selection-field" @click="openPicker('item', slotIndex)">
              <span>{{ labels.item }}</span>
              <strong>{{ slot.item ? getItemLabel(slot.item) : labels.noItem }}</strong>
              <small>{{ labels.chooseItemHint }}</small>
              <b aria-hidden="true">›</b>
            </button>
          </section>

          <fieldset class="moves-fieldset">
            <legend>{{ labels.moves }}</legend>
            <div class="move-grid">
              <button
                v-for="moveIndex in 4"
                :key="moveIndex"
                type="button"
                class="selection-field move-field"
                @click="openPicker('move', slotIndex, moveIndex - 1)"
              >
                <span>{{ labels.move }} {{ moveIndex }}</span>
                <strong>
                  {{ slot.moves[moveIndex - 1]
                    ? getMoveLabel(slot, slot.moves[moveIndex - 1])
                    : labels.chooseMove }}
                </strong>
                <small v-if="slot.moves[moveIndex - 1]">{{ labels.replaceSelection }}</small>
                <b aria-hidden="true">›</b>
              </button>
            </div>
          </fieldset>

          <fieldset class="training-fieldset">
            <legend>{{ labels.training }}</legend>
            <div class="training-table">
              <div class="training-row training-head">
                <span>{{ labels.stat }}</span>
                <span>{{ labels.base }}</span>
                <span>{{ labels.iv }}</span>
                <span>{{ labels.ev }}</span>
                <span>{{ labels.value }}</span>
              </div>
              <div v-for="statName in statNames" :key="statName" class="training-row">
                <strong>{{ getStatLabel(statName) }}</strong>
                <span>{{ getBaseStat(slot, statName) }}</span>
                <input
                  v-model.number="slot.ivs[statName]"
                  type="number"
                  min="0"
                  max="31"
                  @change="normalizeSlotNumber(slot.ivs, statName, 31)"
                >
                <input
                  v-model.number="slot.evs[statName]"
                  type="number"
                  min="0"
                  max="252"
                  step="4"
                  @change="normalizeSlotNumber(slot.evs, statName, 252)"
                >
                <strong>{{ getCalculatedStats(slot)[statName] }}</strong>
              </div>
            </div>
            <div class="ev-summary" :class="{ invalid: getTotalEvs(slot.evs) > 510 }">
              <span>{{ labels.totalEvs }}</span>
              <strong>{{ getTotalEvs(slot.evs) }} / 510</strong>
            </div>
          </fieldset>
        </div>
      </article>
    </div>

    <TeamBuilderPicker
      :open="picker.open"
      :title="pickerTitle"
      :eyebrow="pickerEyebrow"
      :options="pickerOptions"
      :selected-value="pickerSelectedValue"
      :placeholder="pickerPlaceholder"
      :search-label="labels.search"
      :close-label="labels.close"
      :empty-label="labels.noPickerResults"
      :loading-label="labels.loadingOptions"
      :more-label="labels.showMore"
      :result-label="labels.resultCount"
      :loading="pickerLoading"
      :categories="pickerCategories"
      :selected-category="pickerCategory"
      :category-label="labels.itemCategory"
      :all-categories-label="labels.allHeldItems"
      :filters="pickerFilters"
      @close="closePicker"
      @select="applyPickerSelection"
      @update:selected-category="pickerCategory = $event"
      @visible-options="hydrateVisiblePickerOptions"
      @filters-changed="handlePickerFiltersChanged"
    />
  </section>
</template>

<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  getCatalogLabel,
  loadGermanCatalog,
  loadGermanPokemonCatalog,
} from '@/services/localizationCatalog';
import {
  BATTLE_STATS,
  NATURES,
  calculatePokemonStats,
  getTotalEvs,
  normalizeBaseStats,
} from '@/utils/statCalculator';
import {
  getLocalizedDamageClassName,
  getLocalizedTypeName,
} from '@/utils/localization';
import { formatResourceId, getResourceId } from '@/utils/resource';
import { getPokemonSprite } from '@/utils/sprites';
import {
  HELD_ITEM_ATTRIBUTE_NAMES,
  TEAM_ITEM_CATEGORIES,
  buildHeldItemCatalog,
  createTeamExport,
  getMoveLearnMethodLabel,
  getPokemonMoveAvailability,
  mapWithConcurrency,
} from '@/utils/teamBuilder';
import { getTypeColor } from '@/utils/typeColors';
import { getTypeIconDataUri } from '@/utils/typeIcons';
import {
  getVersionGroupLabel,
  getVersionGroupMetadata,
  sortVersionGroups,
} from '@/utils/versionGroups';
import TeamBuilderPicker from './TeamBuilderPicker.vue';

const props = defineProps({
  isShiny: {
    type: Boolean,
    default: false,
  },
  spriteMode: {
    type: String,
    default: 'pixel',
  },
});

const { language } = useI18n();
const STORAGE_KEY = 'pokedex-vue:competitive-team-v2';
const TEAM_SIZE = 6;
const statNames = BATTLE_STATS;
const pokemonOptions = ref([]);
const itemOptions = ref([]);
const heldItemsLoaded = ref(false);
const pokemonCatalog = ref(new Map());
const itemCatalog = ref(new Map());
const moveCatalog = ref(new Map());
const abilityCatalog = ref(new Map());
const moveDetailsByName = reactive(new Map());
const moveDetailFailures = reactive(new Set());
const copyState = ref('');
const restoring = ref(false);
const exportMode = ref('summary');
const pickerPendingOperations = reactive(new Set());
const pickerLoading = computed(() => pickerPendingOperations.size > 0);
const pickerCategory = ref('');
let heldItemLoadPromise = null;
let moveHydrationSequence = 0;
let pickerOperationSequence = 0;

const runPickerOperation = async (operation) => {
  const operationId = ++pickerOperationSequence;
  pickerPendingOperations.add(operationId);
  try {
    return await operation();
  } finally {
    pickerPendingOperations.delete(operationId);
  }
};
const picker = reactive({
  open: false,
  kind: '',
  slotIndex: 0,
  moveIndex: 0,
});

const createStatValues = (defaultValue) => Object.fromEntries(
  BATTLE_STATS.map((statName) => [statName, defaultValue]),
);

const createEmptySlot = (slotId) => ({
  slotId,
  speciesName: '',
  resourceId: null,
  details: null,
  species: null,
  damageRelations: null,
  loading: false,
  error: '',
  expanded: false,
  level: 50,
  ability: '',
  nature: 'hardy',
  item: '',
  moves: ['', '', '', ''],
  ivs: createStatValues(31),
  evs: createStatValues(0),
});

const teamSlots = reactive(Array.from({ length: TEAM_SIZE }, (_, index) => createEmptySlot(index + 1)));

const labels = computed(() => language.value === 'de'
  ? {
      kicker: 'Kompetitives Spielen',
      title: 'Team Builder',
      description: 'Stelle bis zu sechs Pokémon oder Formen zusammen. Pokémon, Fähigkeiten, Items und Attacken werden in einem durchsuchbaren Auswahlfenster mit deutschen Namen angezeigt.',
      clearTeam: 'Team leeren',
      copy: 'Export kopieren',
      copied: 'Kopiert',
      copyFailed: 'Kopieren fehlgeschlagen',
      typeCoverage: 'Typverteilung',
      sharedWeaknesses: 'Gemeinsame Schwächen',
      noTeamData: 'Noch keine Teamdaten vorhanden.',
      export: 'Team-Export',
      exportFormat: 'Format',
      readableSummary: 'Deutsche Übersicht',
      slot: 'Teamslot',
      emptySlot: 'Noch kein Pokémon ausgewählt',
      remove: 'Entfernen',
      choosePokemon: 'Pokémon auswählen',
      changePokemon: 'Pokémon wechseln',
      edit: 'Bearbeiten',
      collapse: 'Einklappen',
      loadingPokemon: 'Pokémon-Daten werden geladen…',
      invalidPokemon: 'Dieses Pokémon oder diese Form wurde nicht gefunden.',
      loadError: 'Die Pokémon-Daten konnten nicht geladen werden.',
      level: 'Level',
      ability: 'Fähigkeit',
      chooseAbility: 'Fähigkeit auswählen',
      hiddenAbility: 'Versteckte Fähigkeit',
      hidden: 'versteckt',
      nature: 'Wesen',
      item: 'Trageitem',
      noItem: 'Kein Item',
      chooseItemHint: 'Item auswählen oder entfernen',
      moves: 'Attacken',
      move: 'Attacke',
      chooseMove: 'Attacke auswählen',
      removeMove: 'Attacke entfernen',
      replaceSelection: 'Auswahl ändern',
      training: 'EV / IV / DV und berechnete Werte',
      stat: 'Statuswert',
      base: 'Basis',
      iv: 'IV / DV',
      ev: 'EV',
      value: 'Wert',
      totalEvs: 'EV gesamt',
      neutral: 'neutral',
      search: 'Auswahl durchsuchen',
      close: 'Auswahl schließen',
      noPickerResults: 'Keine passenden Einträge gefunden.',
      loadingOptions: 'Übersetzungen und Auswahl werden geladen…',
      showMore: 'Mehr anzeigen',
      resultCount: '{count} Ergebnisse',
      pokemonPicker: 'Pokémon und Formen',
      abilityPicker: 'Verfügbare Fähigkeiten',
      itemPicker: 'Trageitems',
      movePicker: 'Erlernbare Attacken',
      itemCategory: 'Trageitem-Kategorie',
      allHeldItems: 'Alle geeigneten Trageitems',
      moveTypeFilter: 'Typ',
      allMoveTypes: 'Alle Typen',
      moveDamageClassFilter: 'Schadensart',
      allDamageClasses: 'Alle Schadensarten',
      moveLearnMethodFilter: 'Lernmethode',
      allLearnMethods: 'Alle Lernmethoden',
      moveVersionGroupFilter: 'Versionsgruppe',
      allVersionGroups: 'Alle Versionsgruppen',
      power: 'Stärke',
      accuracy: 'Genauigkeit',
      pp: 'AP',
      noValue: '—',
      moveMetadataLoading: 'Attackendaten werden geladen…',
      pokemonPickerHint: 'Nach deutschem oder englischem Namen sowie Pokédex- beziehungsweise API-Nummer suchen',
      abilityPickerHint: 'Fähigkeit suchen',
      itemPickerHint: 'Item suchen',
      movePickerHint: 'Attacke suchen',
      selector: 'Auswahl',
      pokemonEntry: 'Pokémon-Eintrag',
      form: 'Form oder Variante',
      standardForm: 'Standardform',
      noItemDescription: 'Aktuell ausgewähltes Trageitem entfernen',
      noMoveDescription: 'Diesen Attackenslot leeren',
      abilityExport: 'Fähigkeit',
      levelExport: 'Level',
      natureExport: 'Wesen',
      evExport: 'EVs',
      ivExport: 'IVs / DVs',
    }
  : {
      kicker: 'Competitive play',
      title: 'Team Builder',
      description: 'Build a team of up to six Pokémon or forms. Pokémon, abilities, items and moves use a searchable selection dialog.',
      clearTeam: 'Clear team',
      copy: 'Copy export',
      copied: 'Copied',
      copyFailed: 'Copy failed',
      typeCoverage: 'Type distribution',
      sharedWeaknesses: 'Shared weaknesses',
      noTeamData: 'No team data yet.',
      export: 'Team export',
      exportFormat: 'Format',
      readableSummary: 'Readable summary',
      slot: 'Team slot',
      emptySlot: 'No Pokémon selected',
      remove: 'Remove',
      choosePokemon: 'Choose Pokémon',
      changePokemon: 'Change Pokémon',
      edit: 'Edit',
      collapse: 'Collapse',
      loadingPokemon: 'Loading Pokémon data…',
      invalidPokemon: 'This Pokémon or form was not found.',
      loadError: 'The Pokémon data could not be loaded.',
      level: 'Level',
      ability: 'Ability',
      chooseAbility: 'Choose ability',
      hiddenAbility: 'Hidden ability',
      hidden: 'hidden',
      nature: 'Nature',
      item: 'Held item',
      noItem: 'No item',
      chooseItemHint: 'Choose or remove an item',
      moves: 'Moves',
      move: 'Move',
      chooseMove: 'Choose move',
      removeMove: 'Remove move',
      replaceSelection: 'Change selection',
      training: 'EV / IV / DV and calculated stats',
      stat: 'Stat',
      base: 'Base',
      iv: 'IV / DV',
      ev: 'EV',
      value: 'Value',
      totalEvs: 'Total EVs',
      neutral: 'neutral',
      search: 'Search selection',
      close: 'Close selection',
      noPickerResults: 'No matching entries found.',
      loadingOptions: 'Loading translations and options…',
      showMore: 'Show more',
      resultCount: '{count} results',
      pokemonPicker: 'Pokémon and forms',
      abilityPicker: 'Available abilities',
      itemPicker: 'Held items',
      movePicker: 'Learnable moves',
      itemCategory: 'Held item category',
      allHeldItems: 'All suitable held items',
      moveTypeFilter: 'Type',
      allMoveTypes: 'All types',
      moveDamageClassFilter: 'Damage class',
      allDamageClasses: 'All damage classes',
      moveLearnMethodFilter: 'Learn method',
      allLearnMethods: 'All learn methods',
      moveVersionGroupFilter: 'Version group',
      allVersionGroups: 'All version groups',
      power: 'Power',
      accuracy: 'Accuracy',
      pp: 'PP',
      noValue: '—',
      moveMetadataLoading: 'Loading move data…',
      pokemonPickerHint: 'Search by name or Pokédex/API number',
      abilityPickerHint: 'Search ability',
      itemPickerHint: 'Search item',
      movePickerHint: 'Search move',
      selector: 'Selection',
      pokemonEntry: 'Pokémon entry',
      form: 'Form or variant',
      standardForm: 'Standard form',
      noItemDescription: 'Remove the currently selected held item',
      noMoveDescription: 'Clear this move slot',
      abilityExport: 'Ability',
      levelExport: 'Level',
      natureExport: 'Nature',
      evExport: 'EVs',
      ivExport: 'IVs / DVs',
    });

const germanNatureNames = {
  hardy: 'Robust', lonely: 'Solo', brave: 'Mutig', adamant: 'Hart', naughty: 'Frech',
  bold: 'Kühn', docile: 'Sanft', relaxed: 'Locker', impish: 'Pfiffig', lax: 'Lasch',
  timid: 'Scheu', hasty: 'Hastig', serious: 'Ernst', jolly: 'Froh', naive: 'Naiv',
  modest: 'Mäßig', mild: 'Mild', quiet: 'Ruhig', bashful: 'Zaghaft', rash: 'Hitzig',
  calm: 'Still', gentle: 'Zart', sassy: 'Forsch', careful: 'Sacht', quirky: 'Kauzig',
};
const statLabelsDe = {
  hp: 'KP', attack: 'Angriff', defense: 'Verteidigung',
  'special-attack': 'Spezial-Angriff', 'special-defense': 'Spezial-Verteidigung', speed: 'Initiative',
};
const statLabelsEn = {
  hp: 'HP', attack: 'Attack', defense: 'Defense',
  'special-attack': 'Special Attack', 'special-defense': 'Special Defense', speed: 'Speed',
};

const natureOptions = computed(() => NATURES.map((nature) => ({
  ...nature,
  label: language.value === 'de'
    ? germanNatureNames[nature.name]
    : formatName(nature.name),
})));

const countValues = (values) => {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((first, second) => second.count - first.count || first.type.localeCompare(second.type));
};

const teamTypes = computed(() => countValues(
  teamSlots.flatMap((slot) => (slot.details?.types || []).map((entry) => entry.type.name)),
));
const teamWeaknesses = computed(() => countValues(
  teamSlots.flatMap((slot) => slot.damageRelations?.weaknesses || []),
).filter((entry) => entry.count >= 2));

const formatName = (name = '') => name
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');
const getStatLabel = (statName) => language.value === 'de'
  ? statLabelsDe[statName]
  : statLabelsEn[statName];
const formatNatureEffect = (nature) => {
  if (!nature.increased || !nature.decreased) return labels.value.neutral;
  return `+${getStatLabel(nature.increased)} / −${getStatLabel(nature.decreased)}`;
};
const getBaseStat = (slot, statName) => normalizeBaseStats(slot.details?.stats || [])[statName];
const getCalculatedStats = (slot) => calculatePokemonStats({
  pokemonStats: slot.details?.stats || [],
  ivs: slot.ivs,
  evs: slot.evs,
  level: slot.level,
  nature: slot.nature,
});

const getSlotPokemonName = (slot) => {
  if (!slot.details) return '';
  return language.value === 'de'
    ? getCatalogLabel(pokemonCatalog.value, slot.details.id, slot.speciesName)
    : formatName(slot.speciesName);
};
const getAbilityEntry = (slot, abilityName) => (slot.details?.abilities || [])
  .find((entry) => entry.ability?.name === abilityName);
const getAbilityLabel = (slot, abilityName) => {
  const entry = getAbilityEntry(slot, abilityName);
  const id = getResourceId(entry?.ability?.url);
  return language.value === 'de'
    ? getCatalogLabel(abilityCatalog.value, id, abilityName)
    : formatName(abilityName);
};
const isHiddenAbility = (slot, abilityName) => Boolean(getAbilityEntry(slot, abilityName)?.is_hidden);
const getMoveEntry = (slot, moveName) => (slot.details?.moves || [])
  .find((entry) => entry.move?.name === moveName);
const getMoveLabel = (slot, moveName) => {
  const entry = getMoveEntry(slot, moveName);
  const id = getResourceId(entry?.move?.url);
  return language.value === 'de'
    ? getCatalogLabel(moveCatalog.value, id, moveName)
    : formatName(moveName);
};
const getItemEntry = (itemName) => itemOptions.value.find((item) => item.name === itemName);
const getItemLabel = (itemName) => {
  const entry = getItemEntry(itemName);
  return language.value === 'de'
    ? getCatalogLabel(itemCatalog.value, entry?.id, itemName)
    : formatName(itemName);
};

const readableExport = computed(() => createTeamExport(teamSlots, {
  mode: 'summary',
  statNames: BATTLE_STATS,
  labels: {
    ability: labels.value.abilityExport,
    level: labels.value.levelExport,
    nature: labels.value.natureExport,
    evs: labels.value.evExport,
    ivs: labels.value.ivExport,
  },
  resolvePokemonName: getSlotPokemonName,
  resolveAbilityName: getAbilityLabel,
  resolveItemName: getItemLabel,
  resolveMoveName: getMoveLabel,
  resolveNatureName: (natureName) => natureOptions.value
    .find((entry) => entry.name === natureName)?.label || formatName(natureName),
  resolveStatName: getStatLabel,
}));

const showdownExport = computed(() => createTeamExport(teamSlots, {
  mode: 'showdown',
  statNames: BATTLE_STATS,
}));
const teamExport = computed(() => exportMode.value === 'showdown'
  ? showdownExport.value
  : readableExport.value);

const pickerSlot = computed(() => teamSlots[picker.slotIndex]);
const pickerTitle = computed(() => ({
  pokemon: labels.value.pokemonPicker,
  ability: labels.value.abilityPicker,
  item: labels.value.itemPicker,
  move: labels.value.movePicker,
})[picker.kind] || labels.value.selector);
const pickerEyebrow = computed(() => picker.kind === 'pokemon'
  ? labels.value.pokemonEntry
  : pickerSlot.value?.details
    ? getSlotPokemonName(pickerSlot.value)
    : labels.value.selector);
const pickerPlaceholder = computed(() => ({
  pokemon: labels.value.pokemonPickerHint,
  ability: labels.value.abilityPickerHint,
  item: labels.value.itemPickerHint,
  move: labels.value.movePickerHint,
})[picker.kind] || labels.value.search);
const pickerSelectedValue = computed(() => {
  const slot = pickerSlot.value;
  if (!slot) return '';
  if (picker.kind === 'pokemon') return slot.speciesName;
  if (picker.kind === 'ability') return slot.ability;
  if (picker.kind === 'item') return slot.item;
  if (picker.kind === 'move') return slot.moves[picker.moveIndex] || '';
  return '';
});

const pokemonPickerOptions = computed(() => pokemonOptions.value.map((pokemon) => ({
  value: pokemon.name,
  label: language.value === 'de'
    ? getCatalogLabel(pokemonCatalog.value, pokemon.id, pokemon.name)
    : formatName(pokemon.name),
  aliases: [pokemon.name],
  number: formatResourceId(pokemon.id),
  description: pokemon.id > 1025 ? labels.value.form : labels.value.standardForm,
  image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
})));
const abilityPickerOptions = computed(() => (pickerSlot.value?.details?.abilities || []).map((entry) => {
  const id = getResourceId(entry.ability?.url);
  return {
    value: entry.ability.name,
    label: language.value === 'de'
      ? getCatalogLabel(abilityCatalog.value, id, entry.ability.name)
      : formatName(entry.ability.name),
    aliases: [entry.ability.name],
    number: id ? String(id) : '',
    description: entry.is_hidden ? labels.value.hiddenAbility : labels.value.ability,
    symbol: entry.is_hidden ? '✦' : '◆',
  };
}));
const getTeamItemCategoryLabel = (categoryValue) => {
  const category = TEAM_ITEM_CATEGORIES.find((entry) => entry.value === categoryValue);
  return category?.[language.value] || formatName(categoryValue);
};
const itemPickerOptions = computed(() => [{
  value: '',
  label: labels.value.noItem,
  description: labels.value.noItemDescription,
  symbol: '×',
}, ...itemOptions.value.map((item) => ({
  value: item.name,
  label: language.value === 'de'
    ? getCatalogLabel(itemCatalog.value, item.id, item.name)
    : formatName(item.name),
  aliases: [item.name],
  number: formatResourceId(item.id),
  image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.name}.png`,
  description: getTeamItemCategoryLabel(item.category),
  category: item.category,
  categoryLabel: getTeamItemCategoryLabel(item.category),
  chips: [
    language.value === 'de' ? item.apiCategory.de : item.apiCategory.en,
  ].filter(Boolean),
}))]);
const movePickerOptions = computed(() => {
  const moves = [...new Map(
    (pickerSlot.value?.details?.moves || [])
      .filter((entry) => entry.move?.name)
      .map((entry) => [entry.move.name, entry]),
  ).values()];
  return [{
    value: '',
    label: labels.value.removeMove,
    description: labels.value.noMoveDescription,
    symbol: '×',
  }, ...moves.map((entry) => {
    const id = getResourceId(entry.move.url);
    const details = moveDetailsByName.get(entry.move.name);
    const availability = getPokemonMoveAvailability(entry);
    const typeName = details?.type?.name || '';
    const damageClass = details?.damage_class?.name || '';
    const metric = (value) => value === null || value === undefined
      ? labels.value.noValue
      : String(value);
    const description = details
      ? [
          getLocalizedTypeName(typeName, language.value),
          getLocalizedDamageClassName(damageClass, language.value),
          `${labels.value.power}: ${metric(details.power)}`,
          `${labels.value.accuracy}: ${metric(details.accuracy)}`,
          `${labels.value.pp}: ${metric(details.pp)}`,
        ].join(' · ')
      : labels.value.moveMetadataLoading;
    return {
      value: entry.move.name,
      label: language.value === 'de'
        ? getCatalogLabel(moveCatalog.value, id, entry.move.name)
        : formatName(entry.move.name),
      aliases: [entry.move.name],
      number: id ? String(id) : '',
      image: typeName ? getTypeIconDataUri(typeName) : '',
      symbol: '⚡',
      description,
      chips: availability.methods.map((method) => getMoveLearnMethodLabel(method, language.value)),
      filterValues: {
        type: typeName,
        damageClass,
        learnMethod: availability.methods,
        versionGroup: availability.versionGroups,
      },
    };
  })];
});
const pickerCategories = computed(() => {
  if (picker.kind !== 'item') return [];
  const counts = new Map();
  for (const item of itemOptions.value) counts.set(item.category, (counts.get(item.category) || 0) + 1);
  return TEAM_ITEM_CATEGORIES
    .filter((category) => counts.has(category.value))
    .map((category) => ({
      value: category.value,
      label: category[language.value] || category.en,
      count: counts.get(category.value),
    }));
});

const MOVE_TYPES = Object.freeze([
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]);

const pickerFilters = computed(() => {
  if (picker.kind !== 'move') return [];
  const moveEntries = pickerSlot.value?.details?.moves || [];
  const methods = new Set();
  const versionGroups = new Map();
  for (const entry of moveEntries) {
    const availability = getPokemonMoveAvailability(entry);
    availability.methods.forEach((method) => methods.add(method));
    availability.versionGroups.forEach((name) => {
      const metadata = getVersionGroupMetadata(name);
      versionGroups.set(name, { name, id: metadata.id });
    });
  }

  return [
    {
      key: 'type',
      label: labels.value.moveTypeFilter,
      allLabel: labels.value.allMoveTypes,
      options: MOVE_TYPES.map((typeName) => ({
        value: typeName,
        label: getLocalizedTypeName(typeName, language.value),
      })),
    },
    {
      key: 'damageClass',
      label: labels.value.moveDamageClassFilter,
      allLabel: labels.value.allDamageClasses,
      options: ['physical', 'special', 'status'].map((damageClass) => ({
        value: damageClass,
        label: getLocalizedDamageClassName(damageClass, language.value),
      })),
    },
    {
      key: 'learnMethod',
      label: labels.value.moveLearnMethodFilter,
      allLabel: labels.value.allLearnMethods,
      options: [...methods]
        .map((method) => ({ value: method, label: getMoveLearnMethodLabel(method, language.value) }))
        .sort((first, second) => first.label.localeCompare(second.label, language.value)),
    },
    {
      key: 'versionGroup',
      label: labels.value.moveVersionGroupFilter,
      allLabel: labels.value.allVersionGroups,
      options: sortVersionGroups([...versionGroups.values()]).map((group) => ({
        value: group.name,
        label: getVersionGroupLabel(group.name, language.value),
      })),
    },
  ];
});
const pickerOptions = computed(() => ({
  pokemon: pokemonPickerOptions.value,
  ability: abilityPickerOptions.value,
  item: itemPickerOptions.value,
  move: movePickerOptions.value,
})[picker.kind] || []);

const normalizeSlotNumber = (target, statName, maximum) => {
  const value = Number(target[statName]);
  target[statName] = Math.min(maximum, Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 0));
};

const clearLoadedData = (slot, preserveConfiguration) => {
  slot.details = null;
  slot.species = null;
  slot.damageRelations = null;
  slot.resourceId = null;
  slot.error = '';
  if (!preserveConfiguration) {
    slot.ability = '';
    slot.item = '';
    slot.moves = ['', '', '', ''];
  }
};

const loadSlotLocalizationCatalogs = async () => {
  if (language.value !== 'de') return;
  const results = await Promise.allSettled([
    loadGermanCatalog('abilities'),
    loadGermanCatalog('moves'),
  ]);
  if (results[0].status === 'fulfilled') abilityCatalog.value = results[0].value;
  if (results[1].status === 'fulfilled') moveCatalog.value = results[1].value;
};

const ensureHeldItemOptions = async () => {
  if (heldItemsLoaded.value) return;
  if (heldItemLoadPromise) return heldItemLoadPromise;

  heldItemLoadPromise = (async () => {
    const [attributeResults, categoryListResponse] = await Promise.all([
      Promise.allSettled(
        HELD_ITEM_ATTRIBUTE_NAMES.map((attributeName) => PokeAPI.getItemAttribute(attributeName)),
      ),
      PokeAPI.getItemCategories(),
    ]);
    const attributePayloads = attributeResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value.data);
    if (!attributePayloads.some((payload) => payload.name === 'holdable')) {
      throw new Error('The holdable item attribute could not be loaded.');
    }

    const categoryPayloads = (await mapWithConcurrency(
      categoryListResponse.data.results || [],
      6,
      async (category) => {
        try {
          const response = await PokeAPI.getItemCategory(category.name);
          return response.data;
        } catch (categoryError) {
          console.error(`Failed to load item category ${category.name}:`, categoryError);
          return null;
        }
      },
    )).filter(Boolean);

    itemOptions.value = buildHeldItemCatalog({ attributePayloads, categoryPayloads });
    heldItemsLoaded.value = true;
  })();

  try {
    await heldItemLoadPromise;
  } finally {
    heldItemLoadPromise = null;
  }
};

const hydrateVisiblePickerOptions = async (options = []) => {
  if (!picker.open || picker.kind !== 'move') return;
  const hydrationId = ++moveHydrationSequence;
  const moveNames = [...new Set(
    options
      .map((option) => option.value)
      .filter((moveName) => moveName
        && !moveDetailsByName.has(moveName)
        && !moveDetailFailures.has(moveName)),
  )];
  if (!moveNames.length) return;

  await runPickerOperation(async () => {
    await mapWithConcurrency(moveNames, 6, async (moveName) => {
      try {
        const response = await PokeAPI.getMoveDetails(moveName);
        moveDetailsByName.set(moveName, response.data);
      } catch (moveError) {
        console.error(`Failed to load move ${moveName}:`, moveError);
        moveDetailFailures.add(moveName);
      }
    });
  });

  if (hydrationId !== moveHydrationSequence) return;
};

const handlePickerFiltersChanged = (filterValues = {}) => {
  if (picker.kind !== 'move') return;
  if (filterValues.type || filterValues.damageClass) {
    void hydrateVisiblePickerOptions(movePickerOptions.value);
  }
};

const loadSlot = async (slotIndex, preserveConfiguration = false) => {
  const slot = teamSlots[slotIndex];
  const pokemonName = slot.speciesName.trim().toLowerCase();
  const savedAbility = slot.ability;
  const savedMoves = [...slot.moves];
  const savedItem = slot.item;
  slot.speciesName = pokemonName;
  clearLoadedData(slot, preserveConfiguration);
  if (!pokemonName) return;
  if (!pokemonOptions.value.some((pokemon) => pokemon.name === pokemonName)) {
    slot.error = labels.value.invalidPokemon;
    return;
  }

  slot.loading = true;
  try {
    const detailsResponse = await PokeAPI.getPokemonDetails(pokemonName);
    const speciesName = detailsResponse.data.species?.name || pokemonName;
    const [speciesResponse, damageRelations] = await Promise.all([
      PokeAPI.getPokemonSpecies(speciesName),
      PokeAPI.getPokemonDamageRelations(detailsResponse.data.types),
    ]);
    slot.details = detailsResponse.data;
    slot.resourceId = detailsResponse.data.id;
    slot.species = speciesResponse.data;
    slot.damageRelations = damageRelations;
    slot.expanded = true;
    const validAbilities = new Set(
      (detailsResponse.data.abilities || []).map((entry) => entry.ability.name),
    );
    slot.ability = preserveConfiguration && validAbilities.has(savedAbility)
      ? savedAbility
      : detailsResponse.data.abilities?.[0]?.ability?.name || '';
    if (preserveConfiguration) {
      const validMoves = new Set(
        (detailsResponse.data.moves || []).map((entry) => entry.move?.name).filter(Boolean),
      );
      slot.moves = savedMoves.map((move) => validMoves.has(move) ? move : '');
      slot.item = savedItem;
    }
    void loadSlotLocalizationCatalogs();
  } catch (requestError) {
    console.error(`Failed to load team slot ${pokemonName}:`, requestError);
    slot.error = labels.value.loadError;
  } finally {
    slot.loading = false;
  }
};

const openPicker = async (kind, slotIndex, moveIndex = 0) => {
  pickerPendingOperations.clear();
  pickerCategory.value = '';
  if (kind === 'move') moveDetailFailures.clear();
  picker.kind = kind;
  picker.slotIndex = slotIndex;
  picker.moveIndex = moveIndex;
  picker.open = true;
  await runPickerOperation(async () => {
    try {
      const pendingLoads = [];
      if (kind === 'item') pendingLoads.push(ensureHeldItemOptions());
      if (language.value === 'de') {
        if (kind === 'pokemon' && !pokemonCatalog.value.size) {
          pendingLoads.push(loadGermanPokemonCatalog().then((catalog) => {
            pokemonCatalog.value = catalog;
          }));
        } else if (kind === 'item' && !itemCatalog.value.size) {
          pendingLoads.push(loadGermanCatalog('items').then((catalog) => {
            itemCatalog.value = catalog;
          }));
        } else if (kind === 'move' && !moveCatalog.value.size) {
          pendingLoads.push(loadGermanCatalog('moves').then((catalog) => {
            moveCatalog.value = catalog;
          }));
        } else if (kind === 'ability' && !abilityCatalog.value.size) {
          pendingLoads.push(loadGermanCatalog('abilities').then((catalog) => {
            abilityCatalog.value = catalog;
          }));
        }
      }
      await Promise.all(pendingLoads);
    } catch (catalogError) {
      console.error(`Failed to load ${kind} picker data:`, catalogError);
    }
  });
};

const closePicker = () => {
  moveHydrationSequence += 1;
  pickerPendingOperations.clear();
  picker.open = false;
};

const applyPickerSelection = async (option) => {
  const slot = pickerSlot.value;
  if (!slot) return;
  const kind = picker.kind;
  const slotIndex = picker.slotIndex;
  const moveIndex = picker.moveIndex;
  closePicker();
  if (kind === 'pokemon') {
    if (slot.speciesName === option.value && slot.details) return;
    slot.speciesName = option.value;
    await loadSlot(slotIndex, false);
  } else if (kind === 'ability') {
    slot.ability = option.value;
  } else if (kind === 'item') {
    slot.item = option.value;
  } else if (kind === 'move') {
    slot.moves[moveIndex] = option.value;
  }
};

const clearSlot = (slotIndex) => {
  Object.assign(teamSlots[slotIndex], createEmptySlot(slotIndex + 1));
};
const clearTeam = () => {
  for (let index = 0; index < TEAM_SIZE; index += 1) clearSlot(index);
};
const serializeTeam = () => teamSlots.map((slot) => ({
  speciesName: slot.speciesName,
  level: slot.level,
  ability: slot.ability,
  nature: slot.nature,
  item: slot.item,
  moves: [...slot.moves],
  ivs: { ...slot.ivs },
  evs: { ...slot.evs },
}));
const saveTeam = () => {
  if (restoring.value || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeTeam()));
  } catch {
    // The builder remains usable when local storage is unavailable.
  }
};

const restoreTeam = async () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  restoring.value = true;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)
      || window.localStorage.getItem('pokedex-vue:competitive-team-v1')
      || 'null',
    );
    if (!Array.isArray(stored)) return;
    stored.slice(0, TEAM_SIZE).forEach((savedSlot, index) => {
      const slot = teamSlots[index];
      slot.speciesName = savedSlot.speciesName || '';
      slot.level = savedSlot.level || 50;
      slot.ability = savedSlot.ability || '';
      slot.nature = savedSlot.nature || 'hardy';
      slot.item = savedSlot.item || '';
      slot.moves = Array.isArray(savedSlot.moves)
        ? [...savedSlot.moves.slice(0, 4), '', '', '', ''].slice(0, 4)
        : ['', '', '', ''];
      Object.assign(slot.ivs, createStatValues(31), savedSlot.ivs || {});
      Object.assign(slot.evs, createStatValues(0), savedSlot.evs || {});
    });
    await Promise.all(teamSlots.map((slot, index) => (
      slot.speciesName ? loadSlot(index, true) : Promise.resolve()
    )));
  } catch (requestError) {
    console.error('Failed to restore competitive team:', requestError);
  } finally {
    restoring.value = false;
    saveTeam();
  }
};

const loadOptions = async () => {
  try {
    const pokemonResponse = await PokeAPI.getPokemons();
    pokemonOptions.value = pokemonResponse.data.results
      .map((pokemon) => ({ ...pokemon, id: getResourceId(pokemon.url) }))
      .filter((pokemon) => pokemon.id !== null)
      .sort((first, second) => first.id - second.id);
    if (language.value === 'de') {
      const catalogResults = await Promise.allSettled([
        loadGermanPokemonCatalog(),
        loadGermanCatalog('items'),
      ]);
      if (catalogResults[0].status === 'fulfilled') pokemonCatalog.value = catalogResults[0].value;
      if (catalogResults[1].status === 'fulfilled') itemCatalog.value = catalogResults[1].value;
    }
    await restoreTeam();
  } catch (requestError) {
    console.error('Failed to load team builder options:', requestError);
  }
};

const copyExport = async () => {
  try {
    await navigator.clipboard.writeText(teamExport.value);
    copyState.value = labels.value.copied;
  } catch {
    copyState.value = labels.value.copyFailed;
  }
  window.setTimeout(() => {
    copyState.value = labels.value.copy;
  }, 1800);
};

watch(serializeTeam, saveTeam, { deep: true });
watch(labels, () => {
  copyState.value = labels.value.copy;
  if (language.value === 'en' && exportMode.value === 'summary') exportMode.value = 'showdown';
}, { immediate: true });
watch(language, async (newLanguage) => {
  if (newLanguage !== 'de') return;
  try {
    const [pokemonNames, itemNames] = await Promise.all([
      loadGermanPokemonCatalog(),
      loadGermanCatalog('items'),
    ]);
    pokemonCatalog.value = pokemonNames;
    itemCatalog.value = itemNames;
    void loadSlotLocalizationCatalogs();
  } catch (catalogError) {
    console.error('Failed to switch team builder localization:', catalogError);
  }
});

onMounted(loadOptions);
</script>

<style scoped>
.team-builder { display: grid; gap: 14px; min-width: 0; }
.team-header, .team-overview article, .team-slot { border: 1px solid var(--legacy-border); border-radius: 4px; background: var(--legacy-surface); box-shadow: 0 2px 5px var(--legacy-shadow); }
.team-header { display: flex; gap: 18px; justify-content: space-between; align-items: start; padding: 20px; }
.team-header p, .slot-identity p { margin: 0 0 5px; color: var(--legacy-muted); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
.team-header h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 3rem); }
.team-header > div > span { display: block; max-width: 850px; margin-top: 7px; color: var(--legacy-muted); line-height: 1.5; }
.team-actions, .slot-header-actions { display: flex; flex-wrap: wrap; gap: 7px; justify-content: flex-end; }
.team-actions button, .slot-header-actions button { min-height: 36px; padding: 7px 11px; border: 1px solid var(--legacy-border-strong); border-radius: 4px; color: var(--legacy-text); cursor: pointer; background: var(--legacy-page); }
.team-actions button:hover, .slot-header-actions button:hover:not(:disabled) { background: var(--legacy-surface-hover); }
.team-actions button:disabled, .slot-header-actions button:disabled { cursor: not-allowed; opacity: 0.45; }
.team-overview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.team-overview article { padding: 15px; }
.team-overview h2 { margin: 0; font-size: 1rem; }
.team-overview p { margin: 9px 0 0; color: var(--legacy-muted); }
.overview-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.overview-chips span { padding: 4px 7px; border: 1px solid var(--legacy-border); border-radius: 999px; font-size: 0.68rem; font-weight: 850; background: var(--legacy-page); }
.weakness-chips span { border-color: color-mix(in srgb, #ef4444 50%, var(--legacy-border)); }
.export-card { grid-column: 1 / -1; }
.export-heading { display: flex; gap: 12px; justify-content: space-between; align-items: end; }
.export-heading label { display: grid; gap: 3px; color: var(--legacy-muted); font-size: 0.62rem; font-weight: 850; }
.export-heading select { min-height: 34px; padding: 5px 8px; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-page); }
.export-card textarea { width: 100%; min-height: 150px; margin-top: 10px; padding: 10px; resize: vertical; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-page); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; line-height: 1.45; }
.slot-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-items: start; }
.team-slot { min-width: 0; overflow: hidden; }
.team-slot.filled { border-color: var(--legacy-border-strong); }
.slot-header { display: flex; gap: 14px; justify-content: space-between; align-items: center; padding: 13px; background: var(--legacy-page); }
.slot-identity { display: flex; gap: 12px; align-items: center; min-width: 0; }
.slot-sprite { display: grid; flex: 0 0 auto; width: 88px; height: 88px; place-items: center; overflow: hidden; border: 1px solid var(--legacy-border); border-radius: 4px; color: var(--legacy-muted); cursor: pointer; font-size: 1.35rem; font-weight: 900; background: var(--legacy-surface); }
.slot-sprite img { width: 84px; height: 84px; object-fit: contain; image-rendering: pixelated; }
.slot-title { min-width: 0; }
.slot-title h2 { margin: 0; overflow: hidden; font-size: 1.15rem; text-overflow: ellipsis; white-space: nowrap; }
.slot-types { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.slot-types span { padding: 3px 7px; color: #222222; font-size: 0.62rem; font-weight: 900; }
.slot-status, .slot-error { margin: 0; padding: 16px; color: var(--legacy-muted); }
.slot-error { color: #ef4444; }
.slot-editor { display: grid; gap: 14px; padding: 14px; border-top: 1px solid var(--legacy-border); }
.selection-grid { display: grid; grid-template-columns: 110px repeat(3, minmax(0, 1fr)); gap: 8px; }
.number-field, .native-field { display: grid; gap: 5px; min-width: 0; color: var(--legacy-muted); font-size: 0.68rem; font-weight: 850; }
.number-field input, .native-field select { width: 100%; min-height: 48px; padding: 7px 9px; border: 1px solid var(--legacy-border); border-radius: 4px; color: var(--legacy-text); background: var(--legacy-page); }
.selection-field { position: relative; display: grid; min-width: 0; min-height: 70px; padding: 8px 34px 8px 10px; border: 1px solid var(--legacy-border); border-radius: 4px; color: var(--legacy-text); text-align: left; cursor: pointer; background: var(--legacy-page); }
.selection-field:hover, .selection-field:focus-visible { border-color: var(--focus-color); outline: none; background: var(--legacy-surface-hover); }
.selection-field > span { color: var(--legacy-muted); font-size: 0.62rem; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; }
.selection-field strong { margin-top: 5px; overflow: hidden; font-size: 0.82rem; text-overflow: ellipsis; white-space: nowrap; }
.selection-field small { margin-top: 3px; overflow: hidden; color: var(--legacy-muted); font-size: 0.62rem; text-overflow: ellipsis; white-space: nowrap; }
.selection-field b { position: absolute; top: 50%; right: 11px; color: var(--legacy-muted); font-size: 1.3rem; transform: translateY(-50%); }
.moves-fieldset, .training-fieldset { min-width: 0; padding: 12px; border: 1px solid var(--legacy-border); }
.moves-fieldset legend, .training-fieldset legend { padding: 0 7px; font-weight: 900; }
.move-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.move-field { min-height: 72px; }
.training-table { display: grid; overflow-x: auto; }
.training-row { display: grid; grid-template-columns: minmax(120px, 1.4fr) repeat(4, minmax(62px, 0.7fr)); gap: 7px; align-items: center; min-width: 520px; padding: 6px 0; border-bottom: 1px solid var(--legacy-border); }
.training-row:last-child { border-bottom: 0; }
.training-head { color: var(--legacy-muted); font-size: 0.62rem; font-weight: 900; text-transform: uppercase; }
.training-row input { width: 100%; min-height: 34px; padding: 4px 6px; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-page); }
.ev-summary { display: flex; justify-content: space-between; margin-top: 10px; padding: 8px 10px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.ev-summary.invalid { border-color: #ef4444; color: #ef4444; }
@media (max-width: 1300px) { .slot-grid { grid-template-columns: 1fr; } }
@media (max-width: 900px) { .team-header, .slot-header { align-items: stretch; flex-direction: column; } .team-actions, .slot-header-actions { justify-content: flex-start; } .selection-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 620px) { .team-overview, .selection-grid, .move-grid { grid-template-columns: 1fr; } .slot-identity { align-items: flex-start; } .slot-sprite { width: 72px; height: 72px; } .slot-sprite img { width: 68px; height: 68px; } .export-heading { align-items: stretch; flex-direction: column; } }
</style>
