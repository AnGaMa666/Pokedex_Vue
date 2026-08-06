<template>
  <section class="calculator-card" aria-labelledby="stat-calculator-title">
    <div class="calculator-heading">
      <div>
        <p class="calculator-eyebrow">{{ labels.competitive }}</p>
        <h3 id="stat-calculator-title">{{ labels.title }}</h3>
      </div>
      <button type="button" class="reset-button" @click="resetCalculator">
        {{ labels.reset }}
      </button>
    </div>

    <div class="form-selector">
      <span class="form-sprite" aria-hidden="true">
        <img
          v-if="activeSprite"
          :src="activeSprite"
          alt=""
          width="88"
          height="88"
        >
      </span>
      <label>
        <span>{{ labels.form }}</span>
        <select v-model="selectedFormName" :disabled="loadingForms || formOptions.length < 2">
          <option v-for="option in formOptions" :key="option.name" :value="option.name">
            {{ option.label }} · {{ option.isDefault ? labels.standardForm : labels.variantForm }}
          </option>
        </select>
        <small v-if="loadingForms">{{ labels.loadingForms }}</small>
        <small v-else>{{ labels.formHint }}</small>
      </label>
      <div class="base-total">
        <span>{{ labels.baseTotal }}</span>
        <strong>{{ baseTotal }}</strong>
      </div>
    </div>

    <div class="control-grid">
      <label class="level-field">
        <span>{{ labels.level }}</span>
        <input v-model.number="level" type="number" min="1" max="100">
      </label>

      <label class="nature-field">
        <span>{{ labels.nature }}</span>
        <select v-model="nature">
          <option v-for="entry in natureOptions" :key="entry.name" :value="entry.name">
            {{ entry.label }} · {{ formatNatureEffect(entry) }}
          </option>
        </select>
      </label>
    </div>

    <p class="formula-note">{{ labels.formulaNote }}</p>

    <div class="stat-table" role="table" :aria-label="labels.title">
      <div class="stat-row stat-head" role="row">
        <span role="columnheader">{{ labels.stat }}</span>
        <span role="columnheader">{{ labels.base }}</span>
        <span role="columnheader">{{ labels.iv }}</span>
        <span role="columnheader">{{ labels.ev }}</span>
        <span role="columnheader">{{ labels.result }}</span>
      </div>

      <div v-for="statName in statNames" :key="statName" class="stat-row" role="row">
        <strong role="cell">{{ getStatLabel(statName) }}</strong>
        <span role="cell" class="base-value">{{ baseStats[statName] }}</span>
        <label role="cell">
          <span class="sr-only">{{ `${getStatLabel(statName)} ${labels.iv}` }}</span>
          <input
            v-model.number="ivs[statName]"
            type="number"
            min="0"
            max="31"
            @change="normalizeValue(ivs, statName, 31)"
          >
        </label>
        <label role="cell">
          <span class="sr-only">{{ `${getStatLabel(statName)} ${labels.ev}` }}</span>
          <input
            v-model.number="evs[statName]"
            type="number"
            min="0"
            max="252"
            step="4"
            @change="normalizeValue(evs, statName, 252)"
          >
        </label>
        <strong
          role="cell"
          class="result-value"
          :class="{
            increased: natureDetails.increased === statName,
            decreased: natureDetails.decreased === statName,
          }"
        >
          {{ calculatedStats[statName] }}
        </strong>
      </div>
    </div>

    <div class="calculator-summary" :class="{ invalid: totalEvs > 510 }">
      <span>{{ labels.evTotal }}</span>
      <strong>{{ totalEvs }} / 510</strong>
      <small>{{ totalEvs > 510 ? labels.evTooHigh : labels.evHint }}</small>
    </div>
  </section>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  watch,
} from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import { loadGermanPokemonCatalog } from '@/services/localizationCatalog';
import { useActivePokemonForm } from '@/state/activePokemonForm';
import {
  createPokemonVarietyOptions,
  getDefaultPokemonVariety,
  isPokemonForSpecies,
  mapWithConcurrency,
} from '@/utils/pokemonForms';
import {
  BATTLE_STATS,
  NATURES,
  calculatePokemonStats,
  getNature,
  getTotalEvs,
  normalizeBaseStats,
} from '@/utils/statCalculator';

const props = defineProps({
  pokemonDetails: {
    type: Object,
    required: true,
  },
});

const { language } = useI18n();
const {
  activePokemonForm,
  resetActivePokemonForm,
  setActivePokemonForm,
  setDefaultPokemonForm,
} = useActivePokemonForm();
const MAX_PARALLEL_REQUESTS = 6;
const level = ref(50);
const nature = ref('hardy');
const selectedFormName = ref('');
const formOptions = ref([]);
const loadingForms = ref(false);
const ivs = reactive(Object.fromEntries(BATTLE_STATS.map((statName) => [statName, 0])));
const evs = reactive(Object.fromEntries(BATTLE_STATS.map((statName) => [statName, 0])));
let formRequestId = 0;

const germanNatureNames = {
  hardy: 'Robust', lonely: 'Solo', brave: 'Mutig', adamant: 'Hart', naughty: 'Frech',
  bold: 'Kühn', docile: 'Sanft', relaxed: 'Locker', impish: 'Pfiffig', lax: 'Lasch',
  timid: 'Scheu', hasty: 'Hastig', serious: 'Ernst', jolly: 'Froh', naive: 'Naiv',
  modest: 'Mäßig', mild: 'Mild', quiet: 'Ruhig', bashful: 'Zaghaft', rash: 'Hitzig',
  calm: 'Still', gentle: 'Zart', sassy: 'Forsch', careful: 'Sacht', quirky: 'Kauzig',
};

const germanStatNames = {
  hp: 'KP', attack: 'Angriff', defense: 'Verteidigung',
  'special-attack': 'Spezial-Angriff', 'special-defense': 'Spezial-Verteidigung', speed: 'Initiative',
};

const englishStatNames = {
  hp: 'HP', attack: 'Attack', defense: 'Defense',
  'special-attack': 'Special Attack', 'special-defense': 'Special Defense', speed: 'Speed',
};

const labels = computed(() => language.value === 'de'
  ? {
      competitive: 'Werteplanung',
      title: 'EV-, IV-/DV- und Wesen-Rechner',
      form: 'Pokémon-Form',
      standardForm: 'Standardform',
      variantForm: 'Form',
      formHint: 'Die Auswahl ändert Basiswerte und erlernbare Attacken auf genau diese Form.',
      loadingForms: 'Weitere Formen werden geladen…',
      baseTotal: 'Basiswertsumme',
      reset: 'Auf Standard zurücksetzen',
      level: 'Level',
      nature: 'Wesen',
      stat: 'Statuswert',
      base: 'Basis',
      iv: 'IV / DV',
      ev: 'EV',
      result: 'Ergebnis',
      neutral: 'neutral',
      evTotal: 'Verteilte EV',
      evTooHigh: 'Die zulässige Gesamtgrenze von 510 EV ist überschritten.',
      evHint: 'Standard: Level 50, 0 IV/DV und 0 EV. Pro Statuswert zählen höchstens 252 EV.',
      formulaNote: 'Die Basiswerte der ausgewählten Form werden vollständig in die Hauptspiel-Formel eingerechnet. IV/DV und EV starten bewusst bei 0.',
    }
  : {
      competitive: 'Stat planning',
      title: 'EV, IV/DV and nature calculator',
      form: 'Pokémon form',
      standardForm: 'Default form',
      variantForm: 'Form',
      formHint: 'The selection changes base stats and learnable moves to this exact form.',
      loadingForms: 'Loading additional forms…',
      baseTotal: 'Base stat total',
      reset: 'Reset to defaults',
      level: 'Level',
      nature: 'Nature',
      stat: 'Stat',
      base: 'Base',
      iv: 'IV / DV',
      ev: 'EV',
      result: 'Result',
      neutral: 'neutral',
      evTotal: 'Allocated EVs',
      evTooHigh: 'The legal total limit of 510 EVs has been exceeded.',
      evHint: 'Default: level 50, 0 IV/DV and 0 EV. Each stat accepts up to 252 EVs.',
      formulaNote: 'The selected form’s base stats are fully included in the main-series formula. IV/DV and EV intentionally start at 0.',
    });

const statNames = BATTLE_STATS;
const activeOption = computed(() => formOptions.value.find((option) => (
  option.name === selectedFormName.value
)) || formOptions.value[0] || { details: props.pokemonDetails });
const activePokemonDetails = computed(() => activeOption.value.details || props.pokemonDetails);
const activeSprite = computed(() => activePokemonDetails.value?.sprites?.other?.['official-artwork']?.front_default
  || activePokemonDetails.value?.sprites?.front_default
  || '');
const baseStats = computed(() => normalizeBaseStats(activePokemonDetails.value?.stats));
const baseTotal = computed(() => Object.values(baseStats.value).reduce((total, value) => total + value, 0));
const natureDetails = computed(() => getNature(nature.value));
const calculatedStats = computed(() => calculatePokemonStats({
  pokemonStats: activePokemonDetails.value?.stats,
  ivs,
  evs,
  level: level.value,
  nature: nature.value,
}));
const totalEvs = computed(() => getTotalEvs(evs));
const natureOptions = computed(() => NATURES.map((entry) => ({
  ...entry,
  label: language.value === 'de'
    ? germanNatureNames[entry.name]
    : entry.name.charAt(0).toUpperCase() + entry.name.slice(1),
})));

const getStatLabel = (statName) => language.value === 'de'
  ? germanStatNames[statName]
  : englishStatNames[statName];

const formatNatureEffect = (entry) => {
  if (!entry.increased || !entry.decreased) return labels.value.neutral;
  return `+${getStatLabel(entry.increased)} / −${getStatLabel(entry.decreased)}`;
};

const normalizeValue = (target, key, maximum) => {
  const numericValue = Number(target[key]);
  target[key] = Math.min(maximum, Math.max(0, Number.isFinite(numericValue) ? Math.trunc(numericValue) : 0));
};

const resetTrainingValues = () => {
  for (const statName of BATTLE_STATS) {
    ivs[statName] = 0;
    evs[statName] = 0;
  }
};

const resetCalculator = () => {
  level.value = 50;
  nature.value = 'hardy';
  resetTrainingValues();
  const defaultDetails = resetActivePokemonForm()
    || getDefaultPokemonVariety(formOptions.value)?.details
    || props.pokemonDetails;
  selectedFormName.value = defaultDetails.name;
  setActivePokemonForm(defaultDetails);
};

const loadFormOptions = async ({ preserveSelection = false } = {}) => {
  const requestId = ++formRequestId;
  const currentDetails = props.pokemonDetails;
  const globallyActiveDetails = activePokemonForm.value;
  const previousSelection = preserveSelection && globallyActiveDetails?.species?.name === currentDetails.species?.name
    ? globallyActiveDetails.name
    : currentDetails.name;
  selectedFormName.value = previousSelection;
  if (!preserveSelection || !formOptions.value.length) {
    formOptions.value = [{
      name: currentDetails.name,
      id: currentDetails.id,
      label: currentDetails.name,
      isDefault: false,
      isForm: true,
      details: currentDetails,
    }];
  }
  loadingForms.value = true;

  try {
    const speciesName = currentDetails.species?.name || currentDetails.name;
    const speciesResponse = await PokeAPI.getPokemonSpecies(speciesName);
    const resolvedSpecies = speciesResponse.data;
    if (!isPokemonForSpecies(currentDetails, resolvedSpecies)) {
      throw new Error(`Pokémon ${currentDetails.name} does not belong to species ${resolvedSpecies.name}.`);
    }

    const varieties = resolvedSpecies.varieties || [];
    const detailsByName = new Map([[currentDetails.name, currentDetails]]);

    await mapWithConcurrency(varieties, async (variety) => {
      const name = variety.pokemon?.name;
      if (!name || detailsByName.has(name)) return;
      try {
        const response = await PokeAPI.getPokemonDetails(name);
        detailsByName.set(name, response.data);
      } catch (error) {
        console.error(`Failed to load calculator form ${name}:`, error);
      }
    }, MAX_PARALLEL_REQUESTS);

    let germanCatalog = null;
    if (language.value === 'de') {
      try {
        germanCatalog = await loadGermanPokemonCatalog();
      } catch (error) {
        console.error('Failed to load German form names for the stat calculator:', error);
      }
    }

    if (requestId !== formRequestId) return;

    const options = createPokemonVarietyOptions({
      species: resolvedSpecies,
      detailsByName,
      catalog: germanCatalog,
      language: language.value,
    });
    if (!options.length) throw new Error(`No verified varieties were found for ${resolvedSpecies.name}.`);

    formOptions.value = options;
    const defaultOption = getDefaultPokemonVariety(options);
    if (defaultOption) setDefaultPokemonForm(defaultOption.details);

    selectedFormName.value = formOptions.value.some((option) => option.name === previousSelection)
      ? previousSelection
      : defaultOption?.name || currentDetails.name;
  } catch (error) {
    console.error('Failed to load calculator forms:', error);
  } finally {
    if (requestId === formRequestId) loadingForms.value = false;
  }
};

watch(level, (value) => {
  const numericValue = Number(value);
  level.value = Math.min(100, Math.max(1, Number.isFinite(numericValue) ? Math.trunc(numericValue) : 50));
});

watch(activePokemonDetails, (details) => {
  setActivePokemonForm(details);
}, { immediate: true });

watch(activePokemonForm, (details) => {
  if (
    !details
    || details.species?.name !== props.pokemonDetails.species?.name
    || !formOptions.value.some((option) => option.name === details.name)
  ) {
    return;
  }

  selectedFormName.value = details.name;
});

watch(
  () => props.pokemonDetails.name,
  () => {
    level.value = 50;
    nature.value = 'hardy';
    resetTrainingValues();
    void loadFormOptions();
  },
  { immediate: true },
);

watch(language, () => {
  void loadFormOptions({ preserveSelection: true });
});

onBeforeUnmount(() => {
  formRequestId += 1;
});
</script>

<style scoped>
.calculator-card {
  padding: 20px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-surface);
}

.calculator-heading {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: end;
}

.calculator-heading h3 { margin: 0; font-size: 1.2rem; }
.calculator-eyebrow { margin: 0 0 4px; color: var(--legacy-muted); font-size: 0.7rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
.reset-button { min-height: 36px; padding: 7px 11px; border: 1px solid var(--legacy-border-strong); border-radius: 4px; color: var(--legacy-text); cursor: pointer; background: var(--legacy-page); }
.reset-button:hover { background: var(--legacy-surface-hover); }
.form-selector { display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; gap: 12px; align-items: center; margin-top: 16px; padding: 12px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.form-sprite { display: grid; width: 88px; height: 88px; place-items: center; border: 1px solid var(--legacy-border); background: var(--legacy-surface); }
.form-sprite img { width: 84px; height: 84px; object-fit: contain; image-rendering: pixelated; }
.form-selector label, .level-field, .nature-field { display: grid; gap: 5px; min-width: 0; color: var(--legacy-muted); font-size: 0.75rem; font-weight: 800; }
.form-selector select, .control-grid select, .control-grid input, .stat-row input { width: 100%; min-height: 36px; padding: 6px 8px; border: 1px solid var(--legacy-border); border-radius: 4px; color: var(--legacy-text); background: var(--legacy-surface); }
.form-selector small { color: var(--legacy-muted); font-size: 0.66rem; font-weight: 500; }
.base-total { display: grid; justify-items: end; gap: 3px; min-width: 92px; }
.base-total span { color: var(--legacy-muted); font-size: 0.64rem; font-weight: 900; text-transform: uppercase; }
.base-total strong { font-size: 1.3rem; }
.control-grid { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 10px; margin-top: 14px; }
.formula-note { margin: 12px 0 0; color: var(--legacy-muted); font-size: 0.72rem; line-height: 1.45; }
.stat-table { display: grid; gap: 5px; margin-top: 16px; overflow-x: auto; }
.stat-row { display: grid; grid-template-columns: minmax(130px, 1.5fr) 64px 82px 82px 82px; gap: 8px; align-items: center; min-width: 500px; padding: 8px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.stat-head { color: var(--legacy-muted); font-size: 0.7rem; font-weight: 900; text-transform: uppercase; }
.base-value, .result-value { text-align: right; }
.result-value.increased { color: #22c55e; }
.result-value.decreased { color: #ef4444; }
.calculator-summary { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; margin-top: 14px; padding: 12px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.calculator-summary small { grid-column: 1 / -1; color: var(--legacy-muted); line-height: 1.45; }
.calculator-summary.invalid { border-color: #ef4444; }
.calculator-summary.invalid strong, .calculator-summary.invalid small { color: #ef4444; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 760px) {
  .calculator-card { padding: 12px; }
  .calculator-heading { align-items: start; flex-direction: column; }
  .form-selector { grid-template-columns: 70px minmax(0, 1fr); }
  .form-sprite { width: 70px; height: 70px; }
  .form-sprite img { width: 66px; height: 66px; }
  .base-total { grid-column: 1 / -1; justify-items: start; }
  .control-grid { grid-template-columns: 1fr; }
}
</style>
