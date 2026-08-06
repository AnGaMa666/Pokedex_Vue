<template>
  <article
    class="detail-card move-detail"
    :style="{ '--resource-color': typeColor }"
    :aria-busy="loading"
    :lang="language"
  >
    <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>

    <div v-else-if="errorMessage" class="error-message" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadDetails">{{ labels.tryAgain }}</button>
    </div>

    <template v-else-if="details">
      <header class="detail-header">
        <div>
          <p class="eyebrow">{{ labels.move }} #{{ formatResourceId(details.id) }}</p>
          <h2>{{ displayName }}</h2>
          <div class="badge-row">
            <span class="type-badge">{{ getLocalizedTypeName(details.type?.name, language) }}</span>
            <span class="neutral-badge">{{ getLocalizedDamageClassName(details.damage_class?.name, language) }}</span>
          </div>
        </div>
        <span class="move-symbol">
          <img
            :src="getTypeIconDataUri(details.type?.name)"
            :alt="getLocalizedTypeName(details.type?.name, language)"
            width="80"
            height="80"
          >
        </span>
      </header>

      <p class="description">{{ effectDescription }}</p>

      <dl class="facts-grid">
        <div><dt>{{ labels.power }}</dt><dd>{{ details.power ?? '—' }}</dd></div>
        <div><dt>{{ labels.accuracy }}</dt><dd>{{ details.accuracy === null ? '—' : `${details.accuracy}%` }}</dd></div>
        <div><dt>AP</dt><dd>{{ details.pp ?? '—' }}</dd></div>
        <div><dt>{{ labels.priority }}</dt><dd>{{ formatSignedNumber(details.priority) }}</dd></div>
        <div><dt>{{ labels.target }}</dt><dd>{{ getLocalizedMoveTargetName(details.target?.name, language) }}</dd></div>
        <div><dt>{{ labels.generation }}</dt><dd>{{ getLocalizedGenerationName(details.generation?.name, language) }}</dd></div>
      </dl>

      <section v-if="showFlavorText" class="secondary-section">
        <h3>{{ labels.gameDescription }}</h3>
        <p>{{ flavorText }}</p>
      </section>

      <details class="secondary-section availability-section">
        <summary>
          <span>
            <strong>{{ labels.availability }}</strong>
            <small>{{ labels.learnedBy.replace('{count}', learnerRows.length) }}</small>
          </span>
        </summary>

        <div class="availability-content">
          <div class="availability-heading">
            <label v-if="learnerRows.length > 12" class="learner-search">
              <span>{{ labels.searchLearners }}</span>
              <input v-model="learnerQuery" type="search" :placeholder="labels.searchLearners">
            </label>
          </div>

          <p v-if="learnerRows.length === 0" class="empty-learners">{{ labels.noLearners }}</p>
          <p v-else-if="filteredLearners.length === 0" class="empty-learners">{{ labels.noMatches }}</p>

          <div v-else class="learner-grid">
            <article v-for="pokemon in visibleLearners" :key="pokemon.id" class="learner-card">
              <img
                :src="pokemon.sprite"
                :alt="pokemon.label"
                width="64"
                height="64"
                loading="lazy"
                decoding="async"
              >
              <div>
                <small>#{{ formatResourceId(pokemon.number) }} · {{ pokemon.isDefault ? labels.standardForm : labels.form }}</small>
                <strong>{{ pokemon.label }}</strong>
              </div>
            </article>
          </div>

          <button
            v-if="filteredLearners.length > learnerLimit"
            type="button"
            class="show-more-button"
            @click="learnerLimit += LEARNER_PAGE_SIZE"
          >
            {{ labels.showMore }} ({{ visibleLearners.length }} / {{ filteredLearners.length }})
          </button>
        </div>
      </details>
    </template>
  </article>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  loadGermanCatalog,
  loadGermanPokemonCatalog,
} from '@/services/localizationCatalog';
import {
  getLocalizedDamageClassName,
  getLocalizedGenerationName,
  getLocalizedMoveTargetName,
  getLocalizedTypeName,
} from '@/utils/localization';
import {
  formatResourceId,
  getLocalizedFlavorText,
  getLocalizedMoveDescription,
  getLocalizedName,
} from '@/utils/resource';
import { buildMoveLearnerRows } from '@/utils/pokemonForms';
import { getTypeColor } from '@/utils/typeColors';
import { getTypeIconDataUri } from '@/utils/typeIcons';

const props = defineProps({
  resource: {
    type: Object,
    required: true,
  },
});

const { language } = useI18n();
const LEARNER_PAGE_SIZE = 30;
const details = ref(null);
const pokemonCatalog = ref(new Map());
const pokemonIndex = ref(new Map());
const loading = ref(false);
const errorMessage = ref('');
const learnerQuery = ref('');
const learnerLimit = ref(LEARNER_PAGE_SIZE);
let activeRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      loading: 'Attackendetails werden geladen…', tryAgain: 'Erneut versuchen', move: 'Attacke',
      power: 'Stärke', accuracy: 'Genauigkeit', priority: 'Priorität', target: 'Ziel',
      generation: 'Generation', gameDescription: 'Spielbeschreibung', availability: 'Erlernbar von',
      learnedBy: '{count} Pokémon und Formen können diese Attacke erlernen.',
      searchLearners: 'Pokémon durchsuchen', noLearners: 'Für diese Attacke sind keine erlernenden Pokémon hinterlegt.',
      noMatches: 'Kein Pokémon entspricht der Suche.', showMore: 'Weitere Pokémon anzeigen',
      standardForm: 'Standardform', form: 'Form',
      loadError: 'Die Attackendetails konnten nicht geladen werden.',
    }
  : {
      loading: 'Loading move details…', tryAgain: 'Try again', move: 'Move', power: 'Power',
      accuracy: 'Accuracy', priority: 'Priority', target: 'Target', generation: 'Generation',
      gameDescription: 'Game description', availability: 'Learned by',
      learnedBy: '{count} Pokémon and forms can learn this move.', searchLearners: 'Search Pokémon',
      noLearners: 'No Pokémon are listed for this move.', noMatches: 'No Pokémon matches the search.',
      showMore: 'Show more Pokémon', loadError: 'The move details could not be loaded.',
      standardForm: 'Default form', form: 'Form',
    });

const typeColor = computed(() => getTypeColor(details.value?.type?.name));
const displayName = computed(() => getLocalizedName(details.value?.names, details.value?.name, language.value));
const flavorText = computed(() => getLocalizedFlavorText(details.value?.flavor_text_entries, language.value));
const effectDescription = computed(() => getLocalizedMoveDescription({
  effectEntries: details.value?.effect_entries,
  flavorTextEntries: details.value?.flavor_text_entries,
  effectChance: details.value?.effect_chance,
  language: language.value,
}));
const showFlavorText = computed(() => Boolean(flavorText.value && flavorText.value !== effectDescription.value));

const learnerRows = computed(() => buildMoveLearnerRows({
  learnedByPokemon: details.value?.learned_by_pokemon || [],
  pokemonIndex: pokemonIndex.value,
  pokemonCatalog: pokemonCatalog.value,
  language: language.value,
}));

const filteredLearners = computed(() => {
  const query = learnerQuery.value.trim().toLocaleLowerCase(language.value);
  if (!query) return learnerRows.value;
  return learnerRows.value.filter((pokemon) => (
    pokemon.name.includes(query)
    || pokemon.label.toLocaleLowerCase(language.value).includes(query)
    || String(pokemon.number || '').includes(query)
    || String(pokemon.pokemonId || '').includes(query)
  ));
});
const visibleLearners = computed(() => filteredLearners.value.slice(0, learnerLimit.value));

const formatSignedNumber = (value) => {
  if (value === null || value === undefined) return '—';
  return value > 0 ? `+${value}` : String(value);
};

const loadDetails = async () => {
  const requestId = ++activeRequestId;
  loading.value = true;
  errorMessage.value = '';
  details.value = null;
  learnerQuery.value = '';
  learnerLimit.value = LEARNER_PAGE_SIZE;

  try {
    const [moveResult, catalogResult, indexResult] = await Promise.allSettled([
      PokeAPI.getMoveDetails(props.resource.name),
      language.value === 'de' ? loadGermanPokemonCatalog() : Promise.resolve(new Map()),
      loadGermanCatalog('pokemonIndex'),
    ]);
    if (requestId !== activeRequestId) return;
    if (moveResult.status === 'rejected') throw moveResult.reason;
    details.value = moveResult.value.data;
    pokemonCatalog.value = catalogResult.status === 'fulfilled' ? catalogResult.value : new Map();
    pokemonIndex.value = indexResult.status === 'fulfilled' ? indexResult.value : new Map();
  } catch (requestError) {
    if (requestId === activeRequestId) {
      console.error('Failed to load move details:', requestError);
      errorMessage.value = labels.value.loadError;
    }
  } finally {
    if (requestId === activeRequestId) loading.value = false;
  }
};

watch(() => props.resource.name, loadDetails, { immediate: true });
watch(language, loadDetails);
watch(learnerQuery, () => { learnerLimit.value = LEARNER_PAGE_SIZE; });
onBeforeUnmount(() => { activeRequestId += 1; });
</script>

<style scoped>
.detail-card { min-width: 0; min-height: 420px; padding: clamp(20px, 3vw, 32px); border: 1px solid color-mix(in srgb, var(--resource-color) 34%, var(--legacy-border)); border-radius: 4px; color: var(--legacy-text); background: var(--legacy-surface); box-shadow: 0 2px 5px var(--legacy-shadow); }
.status-message, .error-message { margin: 0; padding: 28px 0; color: var(--legacy-muted); }
.error-message { color: #ef4444; }
.error-message button, .show-more-button { margin-top: 10px; padding: 8px 12px; border: 1px solid var(--legacy-border-strong); border-radius: 4px; color: var(--legacy-text); cursor: pointer; background: var(--legacy-page); }
.detail-header { display: flex; gap: 24px; justify-content: space-between; align-items: flex-start; padding: 18px; background: var(--legacy-page); }
.eyebrow { margin: 0 0 8px; color: var(--legacy-muted); font-size: 0.78rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
.detail-header h2 { margin: 0; overflow-wrap: anywhere; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1; letter-spacing: -0.04em; }
.badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.type-badge, .neutral-badge { padding: 6px 11px; border: 1px solid var(--legacy-border); border-radius: 999px; font-size: 0.8rem; font-weight: 900; }
.type-badge { color: #1f2937; background: var(--resource-color); }
.neutral-badge { color: var(--legacy-text); background: var(--legacy-surface); }
.move-symbol { display: grid; flex: 0 0 auto; width: 96px; height: 96px; place-items: center; border: 1px solid var(--legacy-border); border-radius: 18px; background: var(--legacy-surface); }
.move-symbol img { width: 80px; height: 80px; border-radius: 16px; }
.description { margin: 18px 0 0; padding: 18px; border-left: 4px solid var(--resource-color); color: var(--legacy-text); line-height: 1.65; background: var(--legacy-page); }
.facts-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 18px 0 0; }
.facts-grid div { padding: 14px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.facts-grid dt { margin-bottom: 5px; color: var(--legacy-muted); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
.facts-grid dd { margin: 0; font-size: 1rem; font-weight: 800; }
.secondary-section { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--legacy-border); }
.secondary-section h3 { margin: 0 0 8px; font-size: 1rem; }
.secondary-section p { margin: 0; color: var(--legacy-muted); line-height: 1.6; }
.availability-section summary { padding: 12px; border: 1px solid var(--legacy-border); color: var(--legacy-text); cursor: pointer; background: var(--legacy-page); }
.availability-section summary::marker { color: var(--resource-color); }
.availability-section summary > span { display: inline-grid; gap: 3px; margin-left: 4px; vertical-align: middle; }
.availability-section summary strong { font-size: 1rem; }
.availability-section summary small { color: var(--legacy-muted); font-size: 0.72rem; font-weight: 650; }
.availability-content { padding-top: 14px; }
.availability-heading { display: flex; gap: 14px; justify-content: space-between; align-items: end; }
.learner-search { display: grid; gap: 4px; width: min(100%, 360px); color: var(--legacy-muted); font-size: 0.72rem; font-weight: 800; }
.learner-search input { min-height: 38px; padding: 7px 9px; border: 1px solid var(--legacy-border); color: var(--legacy-text); background: var(--legacy-page); }
.learner-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin-top: 14px; }
.learner-card { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 9px; align-items: center; min-height: 82px; padding: 8px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.learner-card img { width: 64px; height: 64px; object-fit: contain; image-rendering: pixelated; }
.learner-card div { display: grid; min-width: 0; }
.learner-card small { color: var(--legacy-muted); font-size: 0.62rem; }
.learner-card strong { overflow: hidden; font-size: 0.82rem; text-overflow: ellipsis; white-space: nowrap; }
.empty-learners { margin-top: 12px !important; }
@media (max-width: 680px) { .detail-card { min-height: 0; padding: 12px; } .detail-header { gap: 12px; padding: 12px; } .move-symbol { width: 66px; height: 66px; } .move-symbol img { width: 56px; height: 56px; } .facts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .availability-heading { align-items: stretch; flex-direction: column; } .learner-search input { width: 100%; } }
@media (max-width: 360px) { .facts-grid, .learner-grid { grid-template-columns: 1fr; } }
</style>
