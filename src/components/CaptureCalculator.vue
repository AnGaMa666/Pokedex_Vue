<template>
  <section class="capture-card" aria-labelledby="capture-calculator-title">
    <div class="capture-heading">
      <div>
        <p class="capture-eyebrow">{{ labels.capture }}</p>
        <h3 id="capture-calculator-title">{{ labels.title }}</h3>
      </div>
      <div class="base-rate">
        <span>{{ labels.baseRate }}</span>
        <strong>{{ captureRate }} / 255</strong>
      </div>
    </div>

    <p class="capture-note">{{ labels.note }}</p>

    <div class="capture-controls">
      <label>
        <span>{{ labels.maxHp }}</span>
        <input v-model.number="context.maxHp" type="number" min="1" max="9999">
      </label>
      <label>
        <span>{{ labels.currentHp }}</span>
        <input v-model.number="context.currentHp" type="number" min="1" :max="context.maxHp">
      </label>
      <label>
        <span>{{ labels.status }}</span>
        <select v-model="context.status">
          <option value="none">{{ labels.statusNone }}</option>
          <option value="paralysis">{{ labels.paralysis }}</option>
          <option value="poison">{{ labels.poison }}</option>
          <option value="burn">{{ labels.burn }}</option>
          <option value="sleep">{{ labels.sleep }}</option>
          <option value="freeze">{{ labels.freeze }}</option>
        </select>
      </label>
      <label>
        <span>{{ labels.targetLevel }}</span>
        <input v-model.number="context.targetLevel" type="number" min="1" max="100">
      </label>
      <label>
        <span>{{ labels.playerLevel }}</span>
        <input v-model.number="context.playerLevel" type="number" min="1" max="100">
      </label>
      <label>
        <span>{{ labels.turns }}</span>
        <input v-model.number="context.turns" type="number" min="1" max="30">
      </label>
    </div>

    <div class="condition-grid">
      <label><input v-model="context.isNightOrCave" type="checkbox"> {{ labels.nightOrCave }}</label>
      <label><input v-model="context.isFishingOrUnderwater" type="checkbox"> {{ labels.fishing }}</label>
      <label><input v-model="context.caughtBefore" type="checkbox"> {{ labels.caughtBefore }}</label>
      <label><input v-model="context.sameSpeciesOppositeSex" type="checkbox"> {{ labels.loveCondition }}</label>
      <label><input v-model="context.evolvesWithMoonStone" type="checkbox"> {{ labels.moonCondition }}</label>
      <label><input v-model="context.isUltraBeast" type="checkbox"> {{ labels.ultraBeast }}</label>
    </div>

    <div class="ball-grid">
      <article v-for="ball in rates" :key="ball.name" class="ball-card">
        <img
          :src="getBallSprite(ball.name)"
          :alt="formatBallName(ball.name)"
          width="56"
          height="56"
          loading="lazy"
        >
        <div class="ball-copy">
          <strong>{{ formatBallName(ball.name) }}</strong>
          <small>{{ formatCondition(ball) }}</small>
        </div>
        <div class="ball-result">
          <strong>{{ formatPercent(ball.probability) }}</strong>
          <small v-if="!ball.guaranteed">×{{ formatMultiplier(ball.multiplier) }}</small>
          <small v-else>{{ labels.guaranteed }}</small>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useI18n } from '@/i18n';
import { calculateBallRates } from '@/utils/capture';
import { formatResourceName } from '@/utils/resource';

const props = defineProps({
  captureRate: {
    type: Number,
    required: true,
  },
  pokemonDetails: {
    type: Object,
    required: true,
  },
  isUltraBeast: {
    type: Boolean,
    default: false,
  },
});

const { language } = useI18n();
const context = reactive({
  maxHp: 100,
  currentHp: 1,
  status: 'sleep',
  targetLevel: 50,
  playerLevel: 50,
  turns: 1,
  isNightOrCave: false,
  isFishingOrUnderwater: false,
  caughtBefore: false,
  sameSpeciesOppositeSex: false,
  evolvesWithMoonStone: false,
  isUltraBeast: props.isUltraBeast,
  isWaterOrBug: false,
  targetSpeed: 0,
  targetWeightKg: 0,
});

const labels = computed(() => language.value === 'de'
  ? {
      capture: 'Fangmechanik',
      title: 'Fangchance nach Pokéball',
      baseRate: 'Basis-Fangrate',
      note: 'Die Prozentwerte sind ein generationsübergreifender Näherungswert auf Basis der klassischen Hauptspiel-Formel. Spiel-, Gebiets-, Orden- und Spezialboni können die tatsächliche Chance verändern.',
      maxHp: 'Maximale KP',
      currentHp: 'Aktuelle KP',
      status: 'Status',
      statusNone: 'Kein Status',
      paralysis: 'Paralyse',
      poison: 'Vergiftung',
      burn: 'Verbrennung',
      sleep: 'Schlaf',
      freeze: 'Gefroren',
      targetLevel: 'Pokémon-Level',
      playerLevel: 'Eigenes Level',
      turns: 'Kampfrunde',
      nightOrCave: 'Nacht oder Höhle',
      fishing: 'Angeln oder Unterwasser',
      caughtBefore: 'Art bereits gefangen',
      loveCondition: 'Gleiche Art, anderes Geschlecht',
      moonCondition: 'Entwicklung mit Mondstein',
      ultraBeast: 'Ultrabestie',
      guaranteed: 'Garantiert',
      normalCondition: 'Keine Sonderbedingung',
      activeCondition: 'Sonderbonus aktiv',
      inactiveCondition: 'Sonderbonus nicht aktiv',
    }
  : {
      capture: 'Capture mechanics',
      title: 'Catch chance by Poké Ball',
      baseRate: 'Base capture rate',
      note: 'Percentages are a cross-generation approximation based on the classic main-series formula. Game, area, badge and special bonuses can change the actual chance.',
      maxHp: 'Maximum HP',
      currentHp: 'Current HP',
      status: 'Status',
      statusNone: 'No status',
      paralysis: 'Paralysis',
      poison: 'Poison',
      burn: 'Burn',
      sleep: 'Sleep',
      freeze: 'Freeze',
      targetLevel: 'Pokémon level',
      playerLevel: 'Player level',
      turns: 'Battle turn',
      nightOrCave: 'Night or cave',
      fishing: 'Fishing or underwater',
      caughtBefore: 'Species caught before',
      loveCondition: 'Same species, opposite sex',
      moonCondition: 'Moon Stone evolution',
      ultraBeast: 'Ultra Beast',
      guaranteed: 'Guaranteed',
      normalCondition: 'No special condition',
      activeCondition: 'Conditional bonus active',
      inactiveCondition: 'Conditional bonus inactive',
    });

const conditionLabelsDe = {
  waterOrBug: 'Bonus bei Wasser- oder Käfer-Pokémon',
  fishingOrUnderwater: 'Bonus beim Angeln oder Unterwasser',
  lowLevel: 'Bonus bei niedrigem Pokémon-Level',
  caughtBefore: 'Bonus, wenn die Art bereits gefangen wurde',
  turns: 'Bonus steigt mit der Rundenzahl',
  nightOrCave: 'Bonus nachts oder in Höhlen',
  firstTurn: 'Bonus in der ersten Kampfrunde',
  fastTarget: 'Bonus ab 100 Initiative-Basiswert',
  levelDifference: 'Bonus durch höheren Levelunterschied',
  fishing: 'Bonus beim Angeln',
  weight: 'Fangrate wird durch das Gewicht verändert',
  love: 'Bonus bei gleicher Art und anderem Geschlecht',
  moonEvolution: 'Bonus bei Mondstein-Entwicklung',
  sleeping: 'Bonus bei Schlaf oder Gefroren',
  ultraBeast: 'Starker Bonus bei Ultrabestien, sonst Malus',
};

const conditionLabelsEn = {
  waterOrBug: 'Bonus for Water- or Bug-type Pokémon',
  fishingOrUnderwater: 'Bonus while fishing or underwater',
  lowLevel: 'Bonus for low-level Pokémon',
  caughtBefore: 'Bonus when the species was caught before',
  turns: 'Bonus increases with battle turns',
  nightOrCave: 'Bonus at night or in caves',
  firstTurn: 'Bonus during the first battle turn',
  fastTarget: 'Bonus at 100 or more base Speed',
  levelDifference: 'Bonus from the level difference',
  fishing: 'Bonus while fishing',
  weight: 'Capture rate is adjusted by weight',
  love: 'Bonus for same species and opposite sex',
  moonEvolution: 'Bonus for Moon Stone evolutions',
  sleeping: 'Bonus while asleep or frozen',
  ultraBeast: 'Strong Ultra Beast bonus, penalty otherwise',
};

const syncPokemonContext = () => {
  const typeNames = (props.pokemonDetails.types || []).map((entry) => entry.type?.name);
  const speedEntry = (props.pokemonDetails.stats || []).find((entry) => entry.stat?.name === 'speed');
  context.isWaterOrBug = typeNames.includes('water') || typeNames.includes('bug');
  context.targetSpeed = speedEntry?.base_stat ?? 0;
  context.targetWeightKg = (props.pokemonDetails.weight ?? 0) / 10;
  context.isUltraBeast = props.isUltraBeast;
};

const rates = computed(() => calculateBallRates({
  captureRate: props.captureRate,
  context,
}));

const formatBallName = (name) => {
  const germanNames = {
    'poke-ball': 'Pokéball',
    'great-ball': 'Superball',
    'ultra-ball': 'Hyperball',
    'master-ball': 'Meisterball',
    'safari-ball': 'Safariball',
    'sport-ball': 'Turnierball',
    'premier-ball': 'Premierball',
    'luxury-ball': 'Luxusball',
    'heal-ball': 'Heilball',
    'friend-ball': 'Freundesball',
    'cherish-ball': 'Jubelball',
    'net-ball': 'Netzball',
    'dive-ball': 'Tauchball',
    'nest-ball': 'Nestball',
    'repeat-ball': 'Wiederball',
    'timer-ball': 'Timerball',
    'dusk-ball': 'Finsterball',
    'quick-ball': 'Flottball',
    'fast-ball': 'Turboball',
    'level-ball': 'Levelball',
    'lure-ball': 'Köderball',
    'heavy-ball': 'Schwerball',
    'love-ball': 'Sympaball',
    'moon-ball': 'Mondball',
    'dream-ball': 'Traumball',
    'beast-ball': 'Ultraball',
  };

  return language.value === 'de'
    ? germanNames[name] || formatResourceName(name)
    : formatResourceName(name);
};

const formatCondition = (ball) => {
  if (!ball.condition) {
    return labels.value.normalCondition;
  }

  const dictionary = language.value === 'de' ? conditionLabelsDe : conditionLabelsEn;
  return dictionary[ball.condition] || labels.value.normalCondition;
};

const formatPercent = (probability) => {
  const locale = language.value === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: probability > 0 && probability < 0.01 ? 2 : 1,
    maximumFractionDigits: probability > 0 && probability < 0.01 ? 3 : 1,
  }).format(probability);
};

const formatMultiplier = (value) => {
  const locale = language.value === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(value);
};

const getBallSprite = (name) => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;
};

watch(
  () => props.pokemonDetails,
  syncPokemonContext,
  { immediate: true },
);

watch(
  () => [context.maxHp, context.currentHp],
  () => {
    context.maxHp = Math.max(1, Math.trunc(Number(context.maxHp) || 1));
    context.currentHp = Math.min(
      context.maxHp,
      Math.max(1, Math.trunc(Number(context.currentHp) || 1)),
    );
  },
);
</script>

<style scoped>
.capture-card {
  padding: 20px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-surface);
}

.capture-heading {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: start;
}

.capture-heading h3 {
  margin: 0;
  font-size: 1.2rem;
}

.capture-eyebrow {
  margin: 0 0 4px;
  color: var(--legacy-muted);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.base-rate {
  display: grid;
  justify-items: end;
  color: var(--legacy-muted);
  font-size: 0.72rem;
}

.base-rate strong {
  color: var(--legacy-text);
  font-size: 1rem;
}

.capture-note {
  margin: 12px 0 0;
  color: var(--legacy-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

.capture-controls {
  display: grid;
  grid-template-columns: repeat(6, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.capture-controls label {
  display: grid;
  gap: 5px;
  color: var(--legacy-muted);
  font-size: 0.7rem;
  font-weight: 800;
}

.capture-controls input,
.capture-controls select {
  width: 100%;
  min-height: 36px;
  padding: 6px 8px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-page);
}

.condition-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.condition-grid label {
  display: flex;
  gap: 7px;
  align-items: center;
  min-height: 38px;
  padding: 7px 9px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
  font-size: 0.78rem;
}

.ball-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.ball-card {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.ball-card img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  image-rendering: pixelated;
}

.ball-copy,
.ball-result {
  display: grid;
  min-width: 0;
}

.ball-copy small,
.ball-result small {
  margin-top: 3px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  line-height: 1.3;
}

.ball-result {
  justify-items: end;
  text-align: right;
}

.ball-result strong {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1100px) {
  .capture-controls {
    grid-template-columns: repeat(3, minmax(100px, 1fr));
  }
}

@media (max-width: 760px) {
  .capture-card {
    padding: 12px;
  }

  .capture-controls,
  .condition-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ball-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .capture-controls,
  .condition-grid {
    grid-template-columns: 1fr;
  }
}
</style>
