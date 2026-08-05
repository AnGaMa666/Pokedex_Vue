<template>
  <article class="detail-card move-detail" :style="{ '--resource-color': typeColor }" :aria-busy="loading">
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
            <span class="type-badge">{{ formatResourceName(details.type?.name) }}</span>
            <span class="neutral-badge">{{ formatResourceName(details.damage_class?.name) }}</span>
          </div>
        </div>
        <span class="move-symbol" aria-hidden="true">⚡</span>
      </header>

      <p class="description">{{ effectDescription }}</p>

      <dl class="facts-grid">
        <div>
          <dt>{{ labels.power }}</dt>
          <dd>{{ details.power ?? '—' }}</dd>
        </div>
        <div>
          <dt>{{ labels.accuracy }}</dt>
          <dd>{{ details.accuracy === null ? '—' : `${details.accuracy}%` }}</dd>
        </div>
        <div>
          <dt>AP</dt>
          <dd>{{ details.pp ?? '—' }}</dd>
        </div>
        <div>
          <dt>{{ labels.priority }}</dt>
          <dd>{{ formatSignedNumber(details.priority) }}</dd>
        </div>
        <div>
          <dt>{{ labels.target }}</dt>
          <dd>{{ formatResourceName(details.target?.name) }}</dd>
        </div>
        <div>
          <dt>{{ labels.generation }}</dt>
          <dd>{{ formatResourceName(details.generation?.name) }}</dd>
        </div>
      </dl>

      <section v-if="flavorText" class="secondary-section">
        <h3>{{ labels.gameDescription }}</h3>
        <p>{{ flavorText }}</p>
      </section>

      <section class="secondary-section">
        <h3>{{ labels.availability }}</h3>
        <p>{{ labels.learnedBy.replace('{count}', details.learned_by_pokemon?.length ?? 0) }}</p>
      </section>
    </template>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  formatResourceId,
  formatResourceName,
  getLocalizedEffect,
  getLocalizedFlavorText,
  getLocalizedName,
} from '@/utils/resource';
import { getTypeColor } from '@/utils/typeColors';

const props = defineProps({
  resource: {
    type: Object,
    required: true,
  },
});

const { language } = useI18n();
const details = ref(null);
const loading = ref(false);
const errorMessage = ref('');
let activeRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      loading: 'Attackendetails werden geladen…',
      tryAgain: 'Erneut versuchen',
      move: 'Attacke',
      power: 'Stärke',
      accuracy: 'Genauigkeit',
      priority: 'Priorität',
      target: 'Ziel',
      generation: 'Generation',
      gameDescription: 'Spielbeschreibung',
      availability: 'Verfügbarkeit',
      learnedBy: '{count} Pokémon können diese Attacke im API-Datensatz erlernen.',
      loadError: 'Die Attackendetails konnten nicht geladen werden.',
    }
  : {
      loading: 'Loading move details…',
      tryAgain: 'Try again',
      move: 'Move',
      power: 'Power',
      accuracy: 'Accuracy',
      priority: 'Priority',
      target: 'Target',
      generation: 'Generation',
      gameDescription: 'Game description',
      availability: 'Availability',
      learnedBy: '{count} Pokémon can learn this move in the API dataset.',
      loadError: 'The move details could not be loaded.',
    });

const typeColor = computed(() => getTypeColor(details.value?.type?.name));
const displayName = computed(() => {
  return getLocalizedName(details.value?.names, details.value?.name, language.value);
});
const effectDescription = computed(() => {
  return getLocalizedEffect(
    details.value?.effect_entries,
    details.value?.effect_chance,
    language.value,
  );
});
const flavorText = computed(() => {
  return getLocalizedFlavorText(details.value?.flavor_text_entries, language.value);
});

const formatSignedNumber = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }

  return value > 0 ? `+${value}` : String(value);
};

const loadDetails = async () => {
  const requestId = ++activeRequestId;
  loading.value = true;
  errorMessage.value = '';
  details.value = null;

  try {
    const response = await PokeAPI.getMoveDetails(props.resource.name);

    if (requestId === activeRequestId) {
      details.value = response.data;
    }
  } catch (requestError) {
    if (requestId === activeRequestId) {
      console.error('Failed to load move details:', requestError);
      errorMessage.value = labels.value.loadError;
    }
  } finally {
    if (requestId === activeRequestId) {
      loading.value = false;
    }
  }
};

watch(
  () => props.resource.name,
  loadDetails,
  { immediate: true },
);
</script>

<style scoped>
.detail-card {
  min-width: 0;
  min-height: 420px;
  padding: clamp(22px, 4vw, 34px);
  border: 1px solid color-mix(in srgb, var(--resource-color) 34%, #d5d9e1);
  border-radius: 22px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--resource-color) 9%, #ffffff), #ffffff 230px);
  box-shadow: 0 16px 42px rgba(23, 32, 51, 0.08);
}

.status-message,
.error-message {
  margin: 0;
  padding: 28px 0;
  color: #596579;
}

.error-message {
  color: #991b1b;
}

.error-message button {
  margin-top: 10px;
  padding: 8px 12px;
  border: 1px solid #b91c1c;
  border-radius: 9px;
  color: #991b1b;
  cursor: pointer;
  background: #fff7f7;
}

.detail-header {
  display: flex;
  gap: 24px;
  justify-content: space-between;
  align-items: flex-start;
}

.eyebrow {
  margin: 0 0 8px;
  color: color-mix(in srgb, var(--resource-color) 74%, #172033);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.detail-header h2 {
  margin: 0;
  color: #172033;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
  letter-spacing: -0.04em;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.type-badge,
.neutral-badge {
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 900;
}

.type-badge {
  border: 1px solid rgba(23, 32, 51, 0.14);
  color: #172033;
  background: var(--resource-color);
}

.neutral-badge {
  color: #4b5563;
  background: #eef1f6;
}

.move-symbol {
  display: grid;
  flex: 0 0 auto;
  width: 92px;
  height: 92px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--resource-color) 38%, #172033);
  border-radius: 26px;
  color: #172033;
  font-size: 2.2rem;
  background: var(--resource-color);
}

.description {
  margin: 28px 0 0;
  padding: 18px;
  border-left: 4px solid var(--resource-color);
  border-radius: 10px;
  color: #344054;
  line-height: 1.65;
  background: rgba(248, 250, 252, 0.9);
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0 0;
}

.facts-grid div {
  padding: 15px;
  border: 1px solid #e3e6eb;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
}

.facts-grid dt {
  margin-bottom: 5px;
  color: #7a8494;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.facts-grid dd {
  margin: 0;
  color: #172033;
  font-size: 1.05rem;
  font-weight: 800;
}

.secondary-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e3e6eb;
}

.secondary-section h3 {
  margin: 0 0 8px;
  color: #172033;
  font-size: 1rem;
}

.secondary-section p {
  margin: 0;
  color: #596579;
  line-height: 1.6;
}

@media (max-width: 680px) {
  .detail-card {
    min-height: 0;
    padding: 14px;
  }

  .detail-header {
    gap: 12px;
  }

  .detail-header h2 {
    font-size: clamp(1.65rem, 9vw, 2.5rem);
  }

  .move-symbol {
    width: 62px;
    height: 62px;
    border-radius: 14px;
    font-size: 1.45rem;
  }

  .description {
    margin-top: 16px;
    padding: 12px;
  }

  .facts-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-top: 14px;
  }

  .facts-grid div {
    padding: 10px;
  }

  .facts-grid dd {
    font-size: 0.95rem;
  }
}

@media (max-width: 340px) {
  .facts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
