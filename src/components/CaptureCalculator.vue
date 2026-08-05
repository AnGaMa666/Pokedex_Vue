<template>
  <section class="capture-disclosure">
    <button
      type="button"
      class="capture-toggle"
      :aria-expanded="isOpen"
      aria-controls="capture-calculator-content"
      @click="isOpen = !isOpen"
    >
      <span>
        <small>{{ labels.capture }}</small>
        <strong>{{ labels.title }}</strong>
      </span>
      <span class="toggle-meta">
        <span>{{ labels.baseRate }} {{ captureRate }} / 255</span>
        <span class="toggle-chevron" aria-hidden="true">{{ isOpen ? '−' : '+' }}</span>
      </span>
    </button>

    <section
      v-if="isOpen"
      id="capture-calculator-content"
      class="capture-card"
      aria-labelledby="capture-calculator-title"
    >
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

      <p class="capture-note">{{ activeMechanicsNote }}</p>

      <div class="capture-controls mechanics-controls">
        <label class="wide-control">
          <span>{{ labels.mechanics }}</span>
          <select v-model="context.mechanics">
            <option value="gen9">{{ labels.gen9 }}</option>
            <option value="gen8">{{ labels.gen8 }}</option>
            <option value="gen6-7">{{ labels.gen67 }}</option>
            <option value="gen5">{{ labels.gen5 }}</option>
            <option value="gen3-4">{{ labels.gen34 }}</option>
          </select>
        </label>

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
          <input v-model.number="context.turns" type="number" min="1" max="99">
        </label>

        <label v-if="context.mechanics === 'gen9'">
          <span>{{ labels.badges }}</span>
          <select v-model.number="context.badges">
            <option v-for="badgeCount in 9" :key="badgeCount - 1" :value="badgeCount - 1">
              {{ badgeCount - 1 }}
            </option>
          </select>
        </label>

        <label v-if="context.mechanics !== 'gen3-4'">
          <span>{{ labels.capturePower }}</span>
          <select v-model.number="context.capturePower">
            <option :value="0">{{ labels.capturePowerNone }}</option>
            <option :value="1">{{ labels.capturePowerOne }}</option>
            <option :value="2">{{ labels.capturePowerTwo }}</option>
            <option :value="3">{{ labels.capturePowerThree }}</option>
          </select>
        </label>
      </div>

      <div class="condition-grid">
        <label><input v-model="context.isNightOrCave" type="checkbox"> {{ labels.nightOrCave }}</label>
        <label><input v-model="context.isFishingOrUnderwater" type="checkbox"> {{ labels.fishing }}</label>
        <label><input v-model="context.caughtBefore" type="checkbox"> {{ labels.caughtBefore }}</label>
        <label><input v-model="context.sameSpeciesOppositeSex" type="checkbox"> {{ labels.loveCondition }}</label>
        <label><input v-model="context.evolvesWithMoonStone" type="checkbox"> {{ labels.moonCondition }}</label>
        <label><input v-model="context.isUltraBeast" type="checkbox"> {{ labels.ultraBeast }}</label>
        <label v-if="context.mechanics === 'gen9'">
          <input v-model="context.backStrike" type="checkbox"> {{ labels.backStrike }}
        </label>
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
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
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
const isOpen = ref(false);
const context = reactive({
  mechanics: 'gen9',
  maxHp: 100,
  currentHp: 100,
  status: 'none',
  targetLevel: 50,
  playerLevel: 50,
  turns: 1,
  badges: 8,
  capturePower: 0,
  backStrike: false,
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
      mechanics: 'Spielmechanik',
      gen9: 'Generation IX – Karmesin/Purpur',
      gen8: 'Generation VIII – Schwert/Schild und Remakes',
      gen67: 'Generation VI–VII',
      gen5: 'Generation V',
      gen34: 'Generation III–IV',
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
      playerLevel: 'Eigenes Pokémon-Level',
      turns: 'Kampfrunde',
      badges: 'Orden',
      capturePower: 'Fangkraft',
      capturePowerNone: 'Keine',
      capturePowerOne: 'Stufe 1',
      capturePowerTwo: 'Stufe 2',
      capturePowerThree: 'Stufe 3',
      nightOrCave: 'Nacht oder Höhle',
      fishing: 'Angeln oder Unterwasser',
      caughtBefore: 'Art bereits gefangen',
      loveCondition: 'Gleiche Art, anderes Geschlecht',
      moonCondition: 'Entwicklung mit Mondstein',
      ultraBeast: 'Ultrabestie',
      backStrike: 'Kampf von hinten begonnen',
      guaranteed: 'Garantiert',
      normalCondition: 'Keine Sonderbedingung',
      activeCondition: 'Sonderbonus aktiv',
      inactiveCondition: 'Sonderbonus nicht aktiv',
      noteModern: 'Berechnung nach der ausgewählten Hauptspiel-Generation. Kritische Fänge, Raid-Garantien und ereignisspezifische Sonderregeln sind nicht eingerechnet.',
      noteClassic: 'Berechnung nach der Fangformel der Generationen III und IV mit vier Fangprüfungen. Safari-Sonderregeln sind nicht eingerechnet.',
    }
  : {
      capture: 'Capture mechanics',
      title: 'Catch chance by Poké Ball',
      baseRate: 'Base catch rate',
      mechanics: 'Game mechanics',
      gen9: 'Generation IX – Scarlet/Violet',
      gen8: 'Generation VIII – Sword/Shield and remakes',
      gen67: 'Generation VI–VII',
      gen5: 'Generation V',
      gen34: 'Generation III–IV',
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
      playerLevel: 'Own Pokémon level',
      turns: 'Battle turn',
      badges: 'Badges',
      capturePower: 'Capture Power',
      capturePowerNone: 'None',
      capturePowerOne: 'Level 1',
      capturePowerTwo: 'Level 2',
      capturePowerThree: 'Level 3',
      nightOrCave: 'Night or cave',
      fishing: 'Fishing or underwater',
      caughtBefore: 'Species caught before',
      loveCondition: 'Same species, opposite sex',
      moonCondition: 'Moon Stone evolution',
      ultraBeast: 'Ultra Beast',
      backStrike: 'Battle started with a back strike',
      guaranteed: 'Guaranteed',
      normalCondition: 'No special condition',
      activeCondition: 'Conditional bonus active',
      inactiveCondition: 'Conditional bonus inactive',
      noteModern: 'Calculated with the selected main-series generation. Critical captures, raid guarantees and event-specific rules are not included.',
      noteClassic: 'Calculated with the Generation III and IV formula using four shake checks. Safari-specific rules are not included.',
    });

const activeMechanicsNote = computed(() => {
  return context.mechanics === 'gen3-4'
    ? labels.value.noteClassic
    : labels.value.noteModern;
});

const conditionLabelsDe = {
  waterOrBug: 'Bonus bei Wasser- oder Käfer-Pokémon',
  fishingOrUnderwater: 'Bonus beim Angeln oder Unterwasser',
  lowLevel: 'Bonus bei niedrigem Pokémon-Level',
  caughtBefore: 'Bonus, wenn die Art bereits gefangen wurde',
  turns: 'Bonus abhängig von der Kampfrunde',
  nightOrCave: 'Bonus nachts oder in Höhlen',
  firstTurn: 'Bonus in der ersten Kampfrunde',
  fastTarget: 'Bonus ab 100 Initiative-Basiswert',
  levelDifference: 'Bonus durch höheren Levelunterschied',
  fishing: 'Bonus beim Angeln',
  weight: 'Fangrate wird durch das Gewicht verändert',
  love: 'Bonus bei gleicher Art und anderem Geschlecht',
  moonEvolution: 'Bonus bei Mondstein-Entwicklung',
  sleeping: 'Bonus bei Schlaf',
  ultraBeast: 'Bonus bei Ultrabestien, sonst deutlicher Malus',
};

const conditionLabelsEn = {
  waterOrBug: 'Bonus for Water- or Bug-type Pokémon',
  fishingOrUnderwater: 'Bonus while fishing or underwater',
  lowLevel: 'Bonus for low-level Pokémon',
  caughtBefore: 'Bonus when the species was caught before',
  turns: 'Bonus depends on the battle turn',
  nightOrCave: 'Bonus at night or in caves',
  firstTurn: 'Bonus during the first battle turn',
  fastTarget: 'Bonus at 100 or more base Speed',
  levelDifference: 'Bonus from the level difference',
  fishing: 'Bonus while fishing',
  weight: 'Capture rate is adjusted by weight',
  love: 'Bonus for same species and opposite sex',
  moonEvolution: 'Bonus for Moon Stone evolutions',
  sleeping: 'Bonus while asleep',
  ultraBeast: 'Bonus for Ultra Beasts, strong penalty otherwise',
};

const syncPokemonContext = () => {
  const typeNames = (props.pokemonDetails.types || []).map((entry) => entry.type?.name);
  const speedEntry = (props.pokemonDetails.stats || []).find((entry) => entry.stat?.name === 'speed');
  context.isWaterOrBug = typeNames.includes('water') || typeNames.includes('bug');
  context.targetSpeed = speedEntry?.base_stat ?? 0;
  context.targetWeightKg = (props.pokemonDetails.weight ?? 0) / 10;
  context.isUltraBeast = props.isUltraBeast;
  context.maxHp = 100;
  context.currentHp = 100;
  context.status = 'none';
  context.targetLevel = 50;
  context.playerLevel = 50;
  context.turns = 1;
  context.badges = 8;
  context.capturePower = 0;
  context.backStrike = false;
  isOpen.value = false;
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
.capture-disclosure {
  min-width: 0;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  overflow: hidden;
  background: var(--legacy-surface);
}

.capture-toggle {
  display: flex;
  gap: 18px;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: 72px;
  padding: 14px 16px;
  border: 0;
  color: var(--legacy-text);
  text-align: left;
  cursor: pointer;
  background: var(--legacy-surface);
}

.capture-toggle:hover {
  background: var(--legacy-surface-hover);
}

.capture-toggle > span:first-child {
  display: grid;
  gap: 3px;
}

.capture-toggle small {
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.capture-toggle strong {
  font-size: 1rem;
}

.toggle-meta {
  display: flex;
  gap: 14px;
  align-items: center;
  color: var(--legacy-muted);
  font-size: 0.72rem;
  font-weight: 800;
}

.toggle-chevron {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  font-size: 1.2rem;
  background: var(--legacy-page);
}

.capture-card {
  padding: 20px;
  border-top: 1px solid var(--legacy-border);
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
  grid-template-columns: repeat(4, minmax(120px, 1fr));
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

.capture-controls .wide-control {
  grid-column: span 2;
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
  grid-template-columns: 58px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 80px;
  padding: 9px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.ball-card img {
  width: 54px;
  height: 54px;
  object-fit: contain;
  image-rendering: pixelated;
}

.ball-copy,
.ball-result {
  display: grid;
  min-width: 0;
}

.ball-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ball-copy small,
.ball-result small {
  margin-top: 3px;
  color: var(--legacy-muted);
  font-size: 0.66rem;
  line-height: 1.3;
}

.ball-result {
  justify-items: end;
  text-align: right;
}

.ball-result strong {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1100px) {
  .capture-controls {
    grid-template-columns: repeat(3, minmax(120px, 1fr));
  }
}

@media (max-width: 760px) {
  .capture-toggle {
    align-items: flex-start;
  }

  .toggle-meta {
    align-items: flex-end;
    flex-direction: column;
    gap: 6px;
  }

  .capture-card {
    padding: 14px;
  }

  .capture-controls,
  .condition-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .capture-controls .wide-control {
    grid-column: 1 / -1;
  }
}

@media (max-width: 480px) {
  .capture-controls,
  .condition-grid,
  .ball-grid {
    grid-template-columns: 1fr;
  }

  .capture-heading {
    flex-direction: column;
  }

  .base-rate {
    justify-items: start;
  }
}
</style>
