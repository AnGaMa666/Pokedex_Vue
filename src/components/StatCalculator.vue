<template>
  <section class="calculator-card" aria-labelledby="stat-calculator-title">
    <div class="calculator-heading">
      <div>
        <p class="calculator-eyebrow">{{ labels.competitive }}</p>
        <h3 id="stat-calculator-title">{{ labels.title }}</h3>
      </div>
      <label class="level-field">
        <span>{{ labels.level }}</span>
        <input v-model.number="level" type="number" min="1" max="100">
      </label>
    </div>

    <label class="nature-field">
      <span>{{ labels.nature }}</span>
      <select v-model="nature">
        <option v-for="entry in natureOptions" :key="entry.name" :value="entry.name">
          {{ entry.label }} · {{ formatNatureEffect(entry) }}
        </option>
      </select>
    </label>

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
        <span role="cell">{{ baseStats[statName] }}</span>
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
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
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
const level = ref(50);
const nature = ref('hardy');
const ivs = reactive(Object.fromEntries(BATTLE_STATS.map((statName) => [statName, 31])));
const evs = reactive(Object.fromEntries(BATTLE_STATS.map((statName) => [statName, 0])));

const germanNatureNames = {
  hardy: 'Robust',
  lonely: 'Solo',
  brave: 'Mutig',
  adamant: 'Hart',
  naughty: 'Frech',
  bold: 'Kühn',
  docile: 'Sanft',
  relaxed: 'Locker',
  impish: 'Pfiffig',
  lax: 'Lasch',
  timid: 'Scheu',
  hasty: 'Hastig',
  serious: 'Ernst',
  jolly: 'Froh',
  naive: 'Naiv',
  modest: 'Mäßig',
  mild: 'Mild',
  quiet: 'Ruhig',
  bashful: 'Zaghaft',
  rash: 'Hitzig',
  calm: 'Still',
  gentle: 'Zart',
  sassy: 'Forsch',
  careful: 'Sacht',
  quirky: 'Kauzig',
};

const germanStatNames = {
  hp: 'KP',
  attack: 'Angriff',
  defense: 'Verteidigung',
  'special-attack': 'Spezial-Angriff',
  'special-defense': 'Spezial-Verteidigung',
  speed: 'Initiative',
};

const englishStatNames = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Special Attack',
  'special-defense': 'Special Defense',
  speed: 'Speed',
};

const labels = computed(() => language.value === 'de'
  ? {
      competitive: 'Werteplanung',
      title: 'EV-, IV-/DV- und Wesen-Rechner',
      level: 'Level',
      nature: 'Wesen',
      stat: 'Statuswert',
      base: 'Basis',
      iv: 'IV / DV',
      ev: 'EV',
      result: 'Ergebnis',
      neutral: 'neutral',
      increased: 'erhöht',
      decreased: 'gesenkt',
      evTotal: 'Verteilte EV',
      evTooHigh: 'Die zulässige Gesamtgrenze von 510 EV ist überschritten.',
      evHint: 'Pro Statuswert zählen höchstens 252 EV; vier EV ergeben einen Punkt vor der Level-Skalierung.',
    }
  : {
      competitive: 'Stat planning',
      title: 'EV, IV/DV and nature calculator',
      level: 'Level',
      nature: 'Nature',
      stat: 'Stat',
      base: 'Base',
      iv: 'IV / DV',
      ev: 'EV',
      result: 'Result',
      neutral: 'neutral',
      increased: 'raised',
      decreased: 'lowered',
      evTotal: 'Allocated EVs',
      evTooHigh: 'The legal total limit of 510 EVs has been exceeded.',
      evHint: 'Each stat accepts up to 252 EVs; four EVs contribute one point before level scaling.',
    });

const statNames = BATTLE_STATS;
const baseStats = computed(() => normalizeBaseStats(props.pokemonDetails.stats));
const natureDetails = computed(() => getNature(nature.value));
const calculatedStats = computed(() => calculatePokemonStats({
  pokemonStats: props.pokemonDetails.stats,
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

const getStatLabel = (statName) => {
  return language.value === 'de'
    ? germanStatNames[statName]
    : englishStatNames[statName];
};

const formatNatureEffect = (entry) => {
  if (!entry.increased || !entry.decreased) {
    return labels.value.neutral;
  }

  return `+${getStatLabel(entry.increased)} / −${getStatLabel(entry.decreased)}`;
};

const normalizeValue = (target, key, maximum) => {
  const numericValue = Number(target[key]);
  target[key] = Math.min(maximum, Math.max(0, Number.isFinite(numericValue) ? Math.trunc(numericValue) : 0));
};

watch(level, (value) => {
  const numericValue = Number(value);
  level.value = Math.min(100, Math.max(1, Number.isFinite(numericValue) ? Math.trunc(numericValue) : 50));
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

.calculator-heading h3 {
  margin: 0;
  font-size: 1.2rem;
}

.calculator-eyebrow {
  margin: 0 0 4px;
  color: var(--legacy-muted);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.level-field,
.nature-field {
  display: grid;
  gap: 5px;
  color: var(--legacy-muted);
  font-size: 0.75rem;
  font-weight: 800;
}

.level-field input {
  width: 82px;
}

.nature-field {
  margin-top: 16px;
}

.nature-field select,
.level-field input,
.stat-row input {
  min-height: 36px;
  padding: 6px 8px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-page);
}

.stat-table {
  display: grid;
  gap: 5px;
  margin-top: 16px;
  overflow-x: auto;
}

.stat-row {
  display: grid;
  grid-template-columns: minmax(130px, 1.5fr) 64px 82px 82px 82px;
  gap: 8px;
  align-items: center;
  min-width: 500px;
  padding: 8px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.stat-head {
  color: var(--legacy-muted);
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
}

.stat-row input {
  width: 100%;
}

.result-value {
  text-align: right;
}

.result-value.increased {
  color: #15803d;
}

.result-value.decreased {
  color: #b91c1c;
}

.calculator-summary {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.calculator-summary small {
  grid-column: 1 / -1;
  color: var(--legacy-muted);
  line-height: 1.45;
}

.calculator-summary.invalid {
  border-color: #b91c1c;
}

.calculator-summary.invalid strong,
.calculator-summary.invalid small {
  color: #b91c1c;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 760px) {
  .calculator-card {
    padding: 12px;
  }

  .calculator-heading {
    align-items: start;
  }
}
</style>
