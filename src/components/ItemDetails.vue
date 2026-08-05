<template>
  <article class="detail-card item-detail" :aria-busy="loading">
    <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>

    <div v-else-if="errorMessage" class="error-message" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadDetails">{{ labels.tryAgain }}</button>
    </div>

    <template v-else-if="details">
      <header class="detail-header">
        <div>
          <p class="eyebrow">{{ labels.item }} #{{ formatResourceId(details.id) }}</p>
          <h2>{{ displayName }}</h2>
          <div class="badge-row">
            <span>{{ formatResourceName(details.category?.name) }}</span>
            <span v-for="attribute in details.attributes" :key="attribute.name">
              {{ formatResourceName(attribute.name) }}
            </span>
          </div>
        </div>
        <div class="sprite-frame">
          <img
            v-if="spriteUrl"
            :src="spriteUrl"
            :alt="`${displayName} sprite`"
            width="96"
            height="96"
          >
          <span v-else aria-hidden="true">◆</span>
        </div>
      </header>

      <p class="description">{{ effectDescription }}</p>

      <dl class="facts-grid">
        <div>
          <dt>{{ labels.storePrice }}</dt>
          <dd>{{ formatCost(details.cost) }}</dd>
        </div>
        <div>
          <dt>{{ labels.flingPower }}</dt>
          <dd>{{ details.fling_power ?? '—' }}</dd>
        </div>
        <div>
          <dt>{{ labels.heldBy }}</dt>
          <dd>{{ details.held_by_pokemon?.length ?? 0 }} Pokémon</dd>
        </div>
        <div>
          <dt>{{ labels.gameAppearances }}</dt>
          <dd>{{ details.game_indices?.length ?? 0 }}</dd>
        </div>
      </dl>

      <section v-if="flavorText" class="secondary-section">
        <h3>{{ labels.gameDescription }}</h3>
        <p>{{ flavorText }}</p>
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
  getLocalizedName,
} from '@/utils/resource';

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
      loading: 'Itemdetails werden geladen…',
      tryAgain: 'Erneut versuchen',
      item: 'Item',
      storePrice: 'Ladenpreis',
      flingPower: 'Schleuderstärke',
      heldBy: 'Getragen von',
      gameAppearances: 'Spielauftritte',
      gameDescription: 'Spielbeschreibung',
      notSold: 'Nicht verkäuflich',
      loadError: 'Die Itemdetails konnten nicht geladen werden.',
    }
  : {
      loading: 'Loading item details…',
      tryAgain: 'Try again',
      item: 'Item',
      storePrice: 'Store price',
      flingPower: 'Fling power',
      heldBy: 'Held by',
      gameAppearances: 'Game appearances',
      gameDescription: 'Game description',
      notSold: 'Not sold',
      loadError: 'The item details could not be loaded.',
    });

const displayName = computed(() => {
  return getLocalizedName(details.value?.names, details.value?.name, language.value);
});
const spriteUrl = computed(() => {
  return details.value?.sprites?.default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${details.value?.name}.png`;
});
const effectDescription = computed(() => {
  return getLocalizedEffect(
    details.value?.effect_entries,
    null,
    language.value,
  );
});
const flavorText = computed(() => {
  const entries = details.value?.flavor_text_entries || [];
  const localizedEntries = entries.filter((entry) => entry.language?.name === language.value);
  const englishEntries = entries.filter((entry) => entry.language?.name === 'en');
  const entry = localizedEntries.at(-1) || englishEntries.at(-1);
  return entry?.text?.replace(/[\n\f]+/g, ' ') || '';
});

const formatCost = (cost) => {
  if (!cost) {
    return labels.value.notSold;
  }

  const locale = language.value === 'de' ? 'de-DE' : 'en-US';
  return `${new Intl.NumberFormat(locale).format(cost)} ₽`;
};

const loadDetails = async () => {
  const requestId = ++activeRequestId;
  loading.value = true;
  errorMessage.value = '';
  details.value = null;

  try {
    const response = await PokeAPI.getItemDetails(props.resource.name);

    if (requestId === activeRequestId) {
      details.value = response.data;
    }
  } catch (requestError) {
    if (requestId === activeRequestId) {
      console.error('Failed to load item details:', requestError);
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
  border: 1px solid #cfd8e8;
  border-radius: 22px;
  background: #ffffff;
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
  color: #1d4ed8;
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

.badge-row span {
  padding: 6px 11px;
  border-radius: 999px;
  color: #344054;
  font-size: 0.78rem;
  font-weight: 850;
  background: #eef4ff;
}

.sprite-frame {
  display: grid;
  flex: 0 0 auto;
  width: 112px;
  height: 112px;
  place-items: center;
  border: 1px solid #cfd8e8;
  border-radius: 28px;
  color: #2563eb;
  font-size: 2rem;
  background: linear-gradient(145deg, #ffffff, #edf4ff);
}

.sprite-frame img {
  width: 88px;
  height: 88px;
  object-fit: contain;
  image-rendering: pixelated;
}

.description {
  margin: 28px 0 0;
  padding: 18px;
  border-left: 4px solid #2563eb;
  border-radius: 10px;
  color: #344054;
  line-height: 1.65;
  background: #f8fafc;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 24px 0 0;
}

.facts-grid div {
  padding: 15px;
  border: 1px solid #e3e6eb;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.84);
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

@media (max-width: 760px) {
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

  .sprite-frame {
    width: 76px;
    height: 76px;
    border-radius: 14px;
  }

  .sprite-frame img {
    width: 60px;
    height: 60px;
  }

  .description {
    margin-top: 16px;
    padding: 12px;
  }

  .facts-grid {
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
