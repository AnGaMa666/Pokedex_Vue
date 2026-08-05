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
        <h2>{{ labels.export }}</h2>
        <textarea :value="teamExport" readonly rows="8" :aria-label="labels.export"></textarea>
      </article>
    </section>

    <div class="slot-grid">
      <article
        v-for="(slot, slotIndex) in teamSlots"
        :key="slot.slotId"
        class="team-slot"
        :class="{ filled: slot.details }"
      >
        <header class="slot-header">
          <div class="slot-identity">
            <div class="slot-sprite">
              <img
                v-if="slot.details"
                :src="getPokemonSprite(slot.details, spriteMode, isShiny)"
                :alt="`${formatName(slot.speciesName)} sprite`"
                width="88"
                height="88"
              >
              <span v-else aria-hidden="true">{{ slotIndex + 1 }}</span>
            </div>
            <div>
              <p>{{ labels.slot }} {{ slotIndex + 1 }}</p>
              <h2>{{ slot.details ? formatName(slot.speciesName) : labels.emptySlot }}</h2>
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
          <button
            type="button"
            class="remove-button"
            :disabled="!slot.speciesName"
            @click="clearSlot(slotIndex)"
          >
            {{ labels.remove }}
          </button>
        </header>

        <div class="slot-form">
          <label class="species-field">
            <span>{{ labels.pokemon }}</span>
            <input
              v-model.trim="slot.speciesName"
              list="team-pokemon-options"
              :placeholder="labels.pokemonPlaceholder"
              @change="loadSlot(slotIndex, false)"
            >
          </label>

          <p v-if="slot.loading" class="slot-status" role="status">{{ labels.loadingPokemon }}</p>
          <p v-else-if="slot.error" class="slot-error" role="alert">{{ slot.error }}</p>

          <template v-if="slot.details">
            <div class="basic-grid">
              <label>
                <span>{{ labels.level }}</span>
                <input v-model.number="slot.level" type="number" min="1" max="100">
              </label>
              <label>
                <span>{{ labels.ability }}</span>
                <select v-model="slot.ability">
                  <option
                    v-for="abilityEntry in slot.details.abilities"
                    :key="abilityEntry.ability.name"
                    :value="abilityEntry.ability.name"
                  >
                    {{ formatName(abilityEntry.ability.name) }}
                    {{ abilityEntry.is_hidden ? `(${labels.hidden})` : '' }}
                  </option>
                </select>
              </label>
              <label>
                <span>{{ labels.nature }}</span>
                <select v-model="slot.nature">
                  <option v-for="nature in natureOptions" :key="nature.name" :value="nature.name">
                    {{ nature.label }} · {{ formatNatureEffect(nature) }}
                  </option>
                </select>
              </label>
              <label>
                <span>{{ labels.item }}</span>
                <input v-model.trim="slot.item" list="team-item-options" :placeholder="labels.itemPlaceholder">
              </label>
            </div>

            <fieldset class="moves-fieldset">
              <legend>{{ labels.moves }}</legend>
              <div class="move-grid">
                <label v-for="moveIndex in 4" :key="moveIndex">
                  <span>{{ labels.move }} {{ moveIndex }}</span>
                  <input
                    v-model.trim="slot.moves[moveIndex - 1]"
                    :list="`team-move-options-${slotIndex}`"
                    :placeholder="labels.movePlaceholder"
                  >
                </label>
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
          </template>
        </div>

        <datalist :id="`team-move-options-${slotIndex}`">
          <option v-for="move in getMoveOptions(slot)" :key="move" :value="move"></option>
        </datalist>
      </article>
    </div>

    <datalist id="team-pokemon-options">
      <option v-for="pokemon in pokemonOptions" :key="pokemon.name" :value="pokemon.name">
        #{{ pokemon.id }} {{ formatName(pokemon.name) }}
      </option>
    </datalist>

    <datalist id="team-item-options">
      <option v-for="item in itemOptions" :key="item.name" :value="item.name">
        {{ formatName(item.name) }}
      </option>
    </datalist>
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
  BATTLE_STATS,
  NATURES,
  calculatePokemonStats,
  getTotalEvs,
  normalizeBaseStats,
} from '@/utils/statCalculator';
import { getLocalizedTypeName } from '@/utils/localization';
import { getResourceId } from '@/utils/resource';
import { getPokemonSprite } from '@/utils/sprites';
import { getTypeColor } from '@/utils/typeColors';

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
const STORAGE_KEY = 'pokedex-vue:competitive-team-v1';
const TEAM_SIZE = 6;
const statNames = BATTLE_STATS;
const pokemonOptions = ref([]);
const itemOptions = ref([]);
const copyState = ref('');
const restoring = ref(false);

const createStatValues = (defaultValue) => Object.fromEntries(
  BATTLE_STATS.map((statName) => [statName, defaultValue]),
);

const createEmptySlot = (slotId) => ({
  slotId,
  speciesName: '',
  details: null,
  species: null,
  damageRelations: null,
  loading: false,
  error: '',
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
      description: 'Stelle bis zu sechs Pokémon mit Fähigkeit, Item, Wesen, Attacken, EV und IV/DV zusammen. Das Team wird lokal im Browser gespeichert.',
      clearTeam: 'Team leeren',
      copy: 'Export kopieren',
      copied: 'Kopiert',
      copyFailed: 'Kopieren fehlgeschlagen',
      typeCoverage: 'Typverteilung',
      sharedWeaknesses: 'Gemeinsame Schwächen',
      noTeamData: 'Noch keine Teamdaten vorhanden.',
      export: 'Team-Export',
      slot: 'Teamslot',
      emptySlot: 'Leer',
      remove: 'Entfernen',
      pokemon: 'Pokémon-Art',
      pokemonPlaceholder: 'z. B. garchomp',
      loadingPokemon: 'Pokémon-Daten werden geladen…',
      invalidPokemon: 'Die eingegebene Pokémon-Art wurde im nationalen Artenindex nicht gefunden.',
      loadError: 'Die Pokémon-Daten konnten nicht geladen werden.',
      level: 'Level',
      ability: 'Fähigkeit',
      hidden: 'versteckt',
      nature: 'Wesen',
      item: 'Trageitem',
      itemPlaceholder: 'z. B. leftovers',
      moves: 'Attacken',
      move: 'Attacke',
      movePlaceholder: 'Attacke auswählen',
      training: 'EV / IV / DV und berechnete Werte',
      stat: 'Statuswert',
      base: 'Basis',
      iv: 'IV / DV',
      ev: 'EV',
      value: 'Wert',
      totalEvs: 'EV gesamt',
      neutral: 'neutral',
    }
  : {
      kicker: 'Competitive play',
      title: 'Team Builder',
      description: 'Build a team of up to six Pokémon with ability, item, nature, moves, EVs and IVs/DVs. The team is stored locally in the browser.',
      clearTeam: 'Clear team',
      copy: 'Copy export',
      copied: 'Copied',
      copyFailed: 'Copy failed',
      typeCoverage: 'Type distribution',
      sharedWeaknesses: 'Shared weaknesses',
      noTeamData: 'No team data yet.',
      export: 'Team export',
      slot: 'Team slot',
      emptySlot: 'Empty',
      remove: 'Remove',
      pokemon: 'Pokémon species',
      pokemonPlaceholder: 'e.g. garchomp',
      loadingPokemon: 'Loading Pokémon data…',
      invalidPokemon: 'The entered Pokémon species was not found in the National Pokédex species index.',
      loadError: 'The Pokémon data could not be loaded.',
      level: 'Level',
      ability: 'Ability',
      hidden: 'hidden',
      nature: 'Nature',
      item: 'Held item',
      itemPlaceholder: 'e.g. leftovers',
      moves: 'Moves',
      move: 'Move',
      movePlaceholder: 'Select a move',
      training: 'EV / IV / DV and calculated stats',
      stat: 'Stat',
      base: 'Base',
      iv: 'IV / DV',
      ev: 'EV',
      value: 'Value',
      totalEvs: 'Total EVs',
      neutral: 'neutral',
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
    : nature.name.charAt(0).toUpperCase() + nature.name.slice(1),
})));

const countValues = (values) => {
  const counts = new Map();

  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

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
const getStatAbbreviation = (statName) => ({
  hp: 'HP', attack: 'Atk', defense: 'Def',
  'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spe',
})[statName];
const formatNatureEffect = (nature) => {
  if (!nature.increased || !nature.decreased) {
    return labels.value.neutral;
  }

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
const getMoveOptions = (slot) => [...new Set(
  (slot.details?.moves || []).map((entry) => entry.move?.name).filter(Boolean),
)].sort();

const teamExport = computed(() => teamSlots
  .filter((slot) => slot.details)
  .map((slot) => {
    const lines = [slot.item
      ? `${formatName(slot.speciesName)} @ ${formatName(slot.item)}`
      : formatName(slot.speciesName)];

    if (slot.ability) {
      lines.push(`Ability: ${formatName(slot.ability)}`);
    }

    lines.push(`Level: ${slot.level}`);
    lines.push(`${formatName(slot.nature)} Nature`);

    const evLine = BATTLE_STATS
      .filter((statName) => Number(slot.evs[statName]) > 0)
      .map((statName) => `${slot.evs[statName]} ${getStatAbbreviation(statName)}`)
      .join(' / ');
    const ivLine = BATTLE_STATS
      .filter((statName) => Number(slot.ivs[statName]) < 31)
      .map((statName) => `${slot.ivs[statName]} ${getStatAbbreviation(statName)}`)
      .join(' / ');

    if (evLine) {
      lines.push(`EVs: ${evLine}`);
    }

    if (ivLine) {
      lines.push(`IVs: ${ivLine}`);
    }

    slot.moves.filter(Boolean).forEach((move) => lines.push(`- ${formatName(move)}`));
    return lines.join('\n');
  })
  .join('\n\n'));

const normalizeSlotNumber = (target, statName, maximum) => {
  const value = Number(target[statName]);
  target[statName] = Math.min(maximum, Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 0));
};

const clearLoadedData = (slot, preserveConfiguration) => {
  slot.details = null;
  slot.species = null;
  slot.damageRelations = null;
  slot.error = '';

  if (!preserveConfiguration) {
    slot.ability = '';
    slot.item = '';
    slot.moves = ['', '', '', ''];
  }
};

const loadSlot = async (slotIndex, preserveConfiguration = false) => {
  const slot = teamSlots[slotIndex];
  const speciesName = slot.speciesName.trim().toLowerCase();
  const savedAbility = slot.ability;
  const savedMoves = [...slot.moves];
  const savedItem = slot.item;
  slot.speciesName = speciesName;
  clearLoadedData(slot, preserveConfiguration);

  if (!speciesName) {
    return;
  }

  if (!pokemonOptions.value.some((pokemon) => pokemon.name === speciesName)) {
    slot.error = labels.value.invalidPokemon;
    return;
  }

  slot.loading = true;

  try {
    const [detailsResponse, speciesResponse] = await Promise.all([
      PokeAPI.getPokemonDetails(speciesName),
      PokeAPI.getPokemonSpecies(speciesName),
    ]);
    slot.details = detailsResponse.data;
    slot.species = speciesResponse.data;
    slot.damageRelations = await PokeAPI.getPokemonDamageRelations(detailsResponse.data.types);

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
  } catch (requestError) {
    console.error(`Failed to load team slot ${speciesName}:`, requestError);
    slot.error = labels.value.loadError;
  } finally {
    slot.loading = false;
  }
};

const clearSlot = (slotIndex) => {
  Object.assign(teamSlots[slotIndex], createEmptySlot(slotIndex + 1));
};
const clearTeam = () => {
  for (let index = 0; index < TEAM_SIZE; index += 1) {
    clearSlot(index);
  }
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
  if (restoring.value || typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeTeam()));
  } catch {
    // The builder remains usable when local storage is unavailable.
  }
};

const restoreTeam = async () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  restoring.value = true;

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');

    if (!Array.isArray(stored)) {
      return;
    }

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

    await Promise.all(teamSlots.map((slot, index) => {
      return slot.speciesName ? loadSlot(index, true) : Promise.resolve();
    }));
  } catch (requestError) {
    console.error('Failed to restore competitive team:', requestError);
  } finally {
    restoring.value = false;
    saveTeam();
  }
};

const loadOptions = async () => {
  try {
    const [speciesResponse, itemsResponse] = await Promise.all([
      PokeAPI.getPokemonSpeciesList(),
      PokeAPI.getItems(),
    ]);
    pokemonOptions.value = speciesResponse.data.results
      .map((pokemon) => ({ ...pokemon, id: getResourceId(pokemon.url) }))
      .filter((pokemon) => pokemon.id !== null);
    itemOptions.value = itemsResponse.data.results;
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

watch(teamSlots, saveTeam, { deep: true });
watch(labels, () => {
  copyState.value = labels.value.copy;
}, { immediate: true });

onMounted(loadOptions);
</script>

<style scoped>
.team-builder {
  display: grid;
  gap: 14px;
}

.team-header,
.team-overview article,
.team-slot {
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
}

.team-header {
  display: flex;
  gap: 18px;
  justify-content: space-between;
  align-items: start;
  padding: 20px;
}

.team-header p,
.slot-identity p {
  margin: 0 0 5px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.team-header h1 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 3rem);
}

.team-header > div > span {
  display: block;
  max-width: 850px;
  margin-top: 8px;
  color: var(--legacy-muted);
  line-height: 1.5;
}

.team-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  justify-content: flex-end;
}

.team-actions button,
.remove-button {
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: var(--legacy-page);
}

.remove-button:disabled {
  opacity: 0.45;
}

.team-overview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.team-overview article {
  padding: 13px;
}

.team-overview h2 {
  margin: 0;
  font-size: 1rem;
}

.team-overview p {
  margin: 8px 0 0;
  color: var(--legacy-muted);
}

.overview-chips,
.slot-types {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.overview-chips span,
.slot-types span {
  padding: 4px 7px;
  border: 1px solid var(--legacy-border);
  font-size: 0.68rem;
  font-weight: 800;
}

.weakness-chips span {
  border-color: var(--danger-color);
}

.export-card {
  grid-column: 1 / -1;
}

.export-card textarea {
  width: 100%;
  margin-top: 9px;
  padding: 9px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: var(--legacy-page);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  resize: vertical;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}

.team-slot {
  min-width: 0;
}

.slot-header {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: start;
  padding: 11px;
  border-bottom: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.slot-identity {
  display: flex;
  gap: 9px;
  min-width: 0;
  align-items: center;
}

.slot-sprite {
  display: grid;
  flex: 0 0 auto;
  width: 88px;
  height: 88px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.slot-sprite img {
  width: 84px;
  height: 84px;
  object-fit: contain;
  image-rendering: pixelated;
}

.slot-sprite > span {
  color: var(--legacy-muted);
  font-size: 1.7rem;
  font-weight: 900;
}

.slot-identity h2 {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 1.15rem;
}

.slot-types span {
  color: #222222;
  margin-top: 0;
  font-size: 0.58rem;
  font-weight: 900;
}

.slot-form {
  padding: 11px;
}

.slot-form label,
.moves-fieldset label {
  display: grid;
  gap: 3px;
  color: var(--legacy-muted);
  font-size: 0.64rem;
  font-weight: 850;
}

.slot-form input,
.slot-form select {
  width: 100%;
  min-width: 0;
  min-height: 34px;
  padding: 5px 7px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: var(--legacy-page);
}

.species-field {
  margin-bottom: 9px;
}

.slot-status,
.slot-error {
  margin: 7px 0;
  color: var(--legacy-muted);
}

.slot-error {
  color: var(--danger-color);
}

.basic-grid,
.move-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.moves-fieldset,
.training-fieldset {
  min-width: 0;
  padding: 9px;
  margin: 10px 0 0;
  border: 1px solid var(--legacy-border);
}

.moves-fieldset legend,
.training-fieldset legend {
  padding: 0 4px;
  font-size: 0.7rem;
  font-weight: 900;
}

.training-table {
  display: grid;
  gap: 4px;
  overflow-x: auto;
}

.training-row {
  display: grid;
  grid-template-columns: minmax(118px, 1.4fr) 52px 68px 68px 62px;
  gap: 5px;
  align-items: center;
  min-width: 425px;
  padding: 5px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.training-head {
  color: var(--legacy-muted);
  font-size: 0.6rem;
  font-weight: 900;
  text-transform: uppercase;
}

.training-row input {
  min-height: 30px;
}

.ev-summary {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  padding: 7px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
  font-size: 0.7rem;
}

.ev-summary.invalid {
  border-color: var(--danger-color);
  color: var(--danger-color);
}

@media (max-width: 1200px) {
  .slot-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .team-header {
    align-items: stretch;
    flex-direction: column;
    padding: 15px;
  }

  .team-actions {
    justify-content: flex-start;
  }

  .team-overview {
    grid-template-columns: 1fr;
  }

  .export-card {
    grid-column: auto;
  }
}

@media (max-width: 460px) {
  .slot-header {
    align-items: stretch;
    flex-direction: column;
  }

  .slot-sprite {
    width: 74px;
    height: 74px;
  }

  .slot-sprite img {
    width: 70px;
    height: 70px;
  }

  .basic-grid,
  .move-grid {
    grid-template-columns: 1fr;
  }
}
</style>
