<template>
  <article class="detail-card berry-detail" :aria-busy="loading">
    <p v-if="loading" class="status-message" role="status">{{ labels.loading }}</p>

    <div v-else-if="errorMessage" class="error-message" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadDetails">{{ labels.tryAgain }}</button>
    </div>

    <template v-else-if="details">
      <header class="detail-header">
        <div>
          <p class="eyebrow">{{ labels.berry }} #{{ formatResourceId(details.id, 3) }}</p>
          <h2>{{ displayName }}</h2>
          <div class="badge-row">
            <span>{{ labels.firmness }}: {{ firmnessLabel }}</span>
            <span>{{ labels.naturalGift }}: {{ naturalGiftTypeLabel }}</span>
          </div>
        </div>
        <div class="sprite-frame">
          <img
            :src="spriteUrl"
            :alt="`${displayName} ${labels.sprite}`"
            width="96"
            height="96"
          >
        </div>
      </header>

      <dl class="facts-grid">
        <div>
          <dt>{{ labels.growthStage }}</dt>
          <dd>{{ details.growth_time }} h</dd>
        </div>
        <div>
          <dt>{{ labels.fullGrowth }}</dt>
          <dd>{{ details.growth_time * 4 }} h</dd>
        </div>
        <div>
          <dt>{{ labels.maximumHarvest }}</dt>
          <dd>{{ details.max_harvest }}</dd>
        </div>
        <div>
          <dt>{{ labels.size }}</dt>
          <dd>{{ details.size }} mm</dd>
        </div>
        <div>
          <dt>{{ labels.smoothness }}</dt>
          <dd>{{ details.smoothness }}</dd>
        </div>
        <div>
          <dt>{{ labels.soilDryness }}</dt>
          <dd>{{ details.soil_dryness }}</dd>
        </div>
        <div>
          <dt>{{ labels.giftPower }}</dt>
          <dd>{{ details.natural_gift_power }}</dd>
        </div>
        <div>
          <dt>{{ labels.giftType }}</dt>
          <dd>{{ naturalGiftTypeLabel }}</dd>
        </div>
      </dl>

      <section class="secondary-section">
        <div class="section-heading">
          <h3>{{ labels.flavorProfile }}</h3>
          <span>{{ labels.positiveOnly }}</span>
        </div>
        <div class="flavor-grid">
          <div v-for="flavor in activeFlavors" :key="flavor.flavor.name">
            <span>{{ getFlavorLabel(flavor.flavor.name) }}</span>
            <strong>{{ flavor.potency }}</strong>
            <div class="flavor-meter" aria-hidden="true">
              <span :style="{ width: `${getFlavorWidth(flavor.potency)}%` }"></span>
            </div>
          </div>
          <p v-if="!activeFlavors.length">{{ labels.noFlavor }}</p>
        </div>
      </section>
    </template>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import PokeAPI from '@/services/pokeapi';
import {
  getLocalizedBerryFirmnessName,
  getLocalizedBerryFlavorName,
  getLocalizedTypeName,
} from '@/utils/localization';
import {
  formatResourceId,
  formatResourceName,
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
const itemDetails = ref(null);
const loading = ref(false);
const errorMessage = ref('');
let activeRequestId = 0;

const labels = computed(() => language.value === 'de'
  ? {
      loading: 'Beerendetails werden geladen…',
      tryAgain: 'Erneut versuchen',
      berry: 'Beere',
      sprite: 'Sprite',
      firmness: 'Festigkeit',
      naturalGift: 'Beerenkräfte',
      growthStage: 'Dauer je Wachstumsphase',
      fullGrowth: 'Gesamte Wachstumsdauer',
      maximumHarvest: 'Maximaler Ertrag',
      size: 'Größe',
      smoothness: 'Glätte',
      soilDryness: 'Bodentrockenheit pro Stunde',
      giftPower: 'Beerenkräfte-Stärke',
      giftType: 'Beerenkräfte-Typ',
      flavorProfile: 'Geschmacksprofil',
      positiveOnly: 'Es werden nur Geschmackswerte über null angezeigt',
      noFlavor: 'Für diese Beere sind keine Geschmackswerte hinterlegt.',
      loadError: 'Die Beerendetails konnten nicht geladen werden.',
    }
  : {
      loading: 'Loading berry details…',
      tryAgain: 'Try again',
      berry: 'Berry',
      sprite: 'sprite',
      firmness: 'Firmness',
      naturalGift: 'Natural Gift',
      growthStage: 'Time per growth stage',
      fullGrowth: 'Total growth time',
      maximumHarvest: 'Maximum harvest',
      size: 'Size',
      smoothness: 'Smoothness',
      soilDryness: 'Soil dryness per hour',
      giftPower: 'Natural Gift power',
      giftType: 'Natural Gift type',
      flavorProfile: 'Flavor profile',
      positiveOnly: 'Only flavor values above zero are shown',
      noFlavor: 'This berry has no recorded flavor potency.',
      loadError: 'The berry details could not be loaded.',
    });

const fallbackDisplayName = computed(() => {
  const baseName = formatResourceName(details.value?.name || props.resource.name);
  return language.value === 'de' ? `${baseName}beere` : `${baseName} Berry`;
});

const displayName = computed(() => {
  return getLocalizedName(
    itemDetails.value?.names,
    fallbackDisplayName.value,
    language.value,
  );
});

const spriteUrl = computed(() => {
  const itemName = details.value?.item?.name || `${details.value?.name}-berry`;
  return itemDetails.value?.sprites?.default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;
});

const firmnessLabel = computed(() => {
  return getLocalizedBerryFirmnessName(
    details.value?.firmness?.name,
    language.value,
  );
});

const naturalGiftTypeLabel = computed(() => {
  return getLocalizedTypeName(
    details.value?.natural_gift_type?.name,
    language.value,
  );
});

const activeFlavors = computed(() => {
  return (details.value?.flavors || [])
    .filter((entry) => entry.potency > 0)
    .sort((firstEntry, secondEntry) => secondEntry.potency - firstEntry.potency);
});

const getFlavorLabel = (name) => {
  return getLocalizedBerryFlavorName(name, language.value);
};

const getFlavorWidth = (potency) => Math.min(100, Math.max(8, potency * 10));

const loadDetails = async () => {
  const requestId = ++activeRequestId;
  loading.value = true;
  errorMessage.value = '';
  details.value = null;
  itemDetails.value = null;

  const berryName = props.resource.name.replace(/-berry$/, '');
  const itemName = `${berryName}-berry`;

  try {
    const [berryResult, itemResult] = await Promise.allSettled([
      PokeAPI.getBerryDetails(berryName),
      PokeAPI.getItemDetails(itemName),
    ]);

    if (requestId !== activeRequestId) {
      return;
    }

    if (berryResult.status === 'rejected') {
      throw berryResult.reason;
    }

    details.value = berryResult.value.data;
    itemDetails.value = itemResult.status === 'fulfilled'
      ? itemResult.value.data
      : null;
  } catch (requestError) {
    if (requestId === activeRequestId) {
      console.error('Failed to load berry details:', requestError);
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
  border: 1px solid #e4c9e9;
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
  color: #86198f;
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
  overflow-wrap: anywhere;
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
  color: #701a75;
  font-size: 0.78rem;
  font-weight: 850;
  background: #fae8ff;
}

.sprite-frame {
  display: grid;
  flex: 0 0 auto;
  width: 112px;
  height: 112px;
  place-items: center;
  border: 1px solid #e4c9e9;
  border-radius: 28px;
  background: linear-gradient(145deg, #ffffff, #fdf4ff);
}

.sprite-frame img {
  width: 88px;
  height: 88px;
  object-fit: contain;
  image-rendering: pixelated;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 28px 0 0;
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
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.facts-grid dd {
  margin: 0;
  color: #172033;
  font-size: 1rem;
  font-weight: 800;
}

.secondary-section {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid #e3e6eb;
}

.section-heading {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: baseline;
}

.section-heading h3 {
  margin: 0;
  color: #172033;
  font-size: 1.05rem;
}

.section-heading span {
  color: #7a8494;
  font-size: 0.76rem;
}

.flavor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.flavor-grid > div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 13px;
  border: 1px solid #eadfed;
  border-radius: 12px;
  background: #fdf8ff;
}

.flavor-grid span {
  color: #4b5563;
  font-weight: 750;
}

.flavor-grid strong {
  color: #86198f;
}

.flavor-meter {
  grid-column: 1 / -1;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #eadfed;
}

.flavor-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #c026d3, #f472b6);
}

.flavor-grid p {
  margin: 0;
  color: #596579;
}

@media (max-width: 900px) {
  .facts-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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

  .facts-grid {
    gap: 8px;
    margin-top: 14px;
  }

  .facts-grid div {
    padding: 10px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 340px) {
  .facts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
