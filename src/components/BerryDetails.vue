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
          <img :src="spriteUrl" :alt="`${displayName} ${labels.sprite}`" width="96" height="96">
        </div>
      </header>

      <ItemPriceOverview :item-details="itemDetails" />

      <dl class="facts-grid">
        <div><dt>{{ labels.growthStage }}</dt><dd>{{ details.growth_time }} h</dd></div>
        <div><dt>{{ labels.fullGrowth }}</dt><dd>{{ details.growth_time * 4 }} h</dd></div>
        <div><dt>{{ labels.maximumHarvest }}</dt><dd>{{ details.max_harvest }}</dd></div>
        <div><dt>{{ labels.size }}</dt><dd>{{ details.size }} mm</dd></div>
        <div><dt>{{ labels.smoothness }}</dt><dd>{{ details.smoothness }}</dd></div>
        <div><dt>{{ labels.soilDryness }}</dt><dd>{{ details.soil_dryness }}</dd></div>
        <div><dt>{{ labels.giftPower }}</dt><dd>{{ details.natural_gift_power }}</dd></div>
        <div><dt>{{ labels.giftType }}</dt><dd>{{ naturalGiftTypeLabel }}</dd></div>
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
import ItemPriceOverview from './ItemPriceOverview.vue';

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
      loading: 'Beerendetails werden geladen…', tryAgain: 'Erneut versuchen', berry: 'Beere',
      sprite: 'Sprite', firmness: 'Festigkeit', naturalGift: 'Beerenkräfte',
      growthStage: 'Dauer je Wachstumsphase', fullGrowth: 'Gesamte Wachstumsdauer',
      maximumHarvest: 'Maximaler Ertrag', size: 'Größe', smoothness: 'Glätte',
      soilDryness: 'Bodentrockenheit pro Stunde', giftPower: 'Beerenkräfte-Stärke',
      giftType: 'Beerenkräfte-Typ', flavorProfile: 'Geschmacksprofil',
      positiveOnly: 'Nur Geschmackswerte über null',
      noFlavor: 'Für diese Beere sind keine Geschmackswerte hinterlegt.',
      loadError: 'Die Beerendetails konnten nicht geladen werden.',
    }
  : {
      loading: 'Loading berry details…', tryAgain: 'Try again', berry: 'Berry', sprite: 'sprite',
      firmness: 'Firmness', naturalGift: 'Natural Gift', growthStage: 'Time per growth stage',
      fullGrowth: 'Total growth time', maximumHarvest: 'Maximum harvest', size: 'Size',
      smoothness: 'Smoothness', soilDryness: 'Soil dryness per hour',
      giftPower: 'Natural Gift power', giftType: 'Natural Gift type', flavorProfile: 'Flavor profile',
      positiveOnly: 'Only values above zero', noFlavor: 'This berry has no recorded flavor potency.',
      loadError: 'The berry details could not be loaded.',
    });

const fallbackDisplayName = computed(() => {
  const baseName = formatResourceName(details.value?.name || props.resource.name);
  return language.value === 'de' ? `${baseName}beere` : `${baseName} Berry`;
});
const displayName = computed(() => getLocalizedName(
  itemDetails.value?.names,
  fallbackDisplayName.value,
  language.value,
));
const spriteUrl = computed(() => {
  const itemName = details.value?.item?.name || `${details.value?.name}-berry`;
  return itemDetails.value?.sprites?.default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;
});
const firmnessLabel = computed(() => getLocalizedBerryFirmnessName(details.value?.firmness?.name, language.value));
const naturalGiftTypeLabel = computed(() => getLocalizedTypeName(details.value?.natural_gift_type?.name, language.value));
const activeFlavors = computed(() => (details.value?.flavors || [])
  .filter((entry) => entry.potency > 0)
  .sort((first, second) => second.potency - first.potency));
const getFlavorLabel = (name) => getLocalizedBerryFlavorName(name, language.value);
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
    if (requestId !== activeRequestId) return;
    if (berryResult.status === 'rejected') throw berryResult.reason;
    details.value = berryResult.value.data;
    itemDetails.value = itemResult.status === 'fulfilled' ? itemResult.value.data : null;
  } catch (requestError) {
    if (requestId === activeRequestId) {
      console.error('Failed to load berry details:', requestError);
      errorMessage.value = labels.value.loadError;
    }
  } finally {
    if (requestId === activeRequestId) loading.value = false;
  }
};

watch(() => props.resource.name, loadDetails, { immediate: true });
watch(language, loadDetails);
</script>

<style scoped>
.detail-card { min-width: 0; min-height: 420px; padding: clamp(20px, 3vw, 32px); border: 1px solid var(--legacy-border); border-radius: 4px; color: var(--legacy-text); background: var(--legacy-surface); box-shadow: 0 2px 5px var(--legacy-shadow); }
.status-message, .error-message { margin: 0; padding: 28px 0; color: var(--legacy-muted); }
.error-message { color: #ef4444; }
.error-message button { margin-top: 10px; padding: 8px 12px; border: 1px solid #ef4444; color: #ef4444; background: var(--legacy-page); }
.detail-header { display: flex; gap: 20px; justify-content: space-between; align-items: flex-start; padding: 18px; background: var(--legacy-page); }
.eyebrow { margin: 0 0 8px; color: #c026d3; font-size: 0.76rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
.detail-header h2 { margin: 0; overflow-wrap: anywhere; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1; }
.badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.badge-row span { padding: 5px 9px; border: 1px solid var(--legacy-border); border-radius: 999px; font-size: 0.72rem; font-weight: 850; background: var(--legacy-surface); }
.sprite-frame { display: grid; flex: 0 0 auto; width: 112px; height: 112px; place-items: center; border: 1px solid var(--legacy-border); border-radius: 22px; background: var(--legacy-surface); }
.sprite-frame img { width: 96px; height: 96px; object-fit: contain; image-rendering: pixelated; }
.facts-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 18px 0 0; }
.facts-grid div { padding: 14px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.facts-grid dt { margin-bottom: 5px; color: var(--legacy-muted); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.07em; text-transform: uppercase; }
.facts-grid dd { margin: 0; font-size: 1rem; font-weight: 800; }
.secondary-section { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--legacy-border); }
.section-heading { display: flex; gap: 12px; justify-content: space-between; align-items: baseline; }
.section-heading h3 { margin: 0; }
.section-heading span { color: var(--legacy-muted); font-size: 0.72rem; }
.flavor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 12px; }
.flavor-grid > div { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 12px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.flavor-grid span { color: var(--legacy-muted); font-weight: 750; }
.flavor-meter { grid-column: 1 / -1; height: 7px; overflow: hidden; border-radius: 999px; background: var(--legacy-border); }
.flavor-meter span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #c026d3, #f472b6); }
@media (max-width: 900px) { .facts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) { .detail-card { min-height: 0; padding: 12px; } .detail-header { padding: 12px; } .sprite-frame { width: 76px; height: 76px; } .sprite-frame img { width: 64px; height: 64px; } .section-heading { align-items: flex-start; flex-direction: column; } }
@media (max-width: 340px) { .facts-grid { grid-template-columns: 1fr; } }
</style>
