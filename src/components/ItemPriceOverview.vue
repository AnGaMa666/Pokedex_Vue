<template>
  <section class="price-overview" :aria-label="labels.title">
    <div class="price-summary">
      <article>
        <span>{{ labels.purchase }}</span>
        <strong>{{ representativePurchase }}</strong>
      </article>
      <article>
        <span>{{ labels.sell }}</span>
        <strong>{{ representativeSell }}</strong>
      </article>
    </div>

    <details v-if="priceSections.length" class="price-history">
      <summary>{{ labels.history }}</summary>
      <div class="generation-list">
        <section v-for="section in priceSections" :key="section.generation" class="generation-prices">
          <h4>{{ section.label }}</h4>
          <div class="price-table" role="table" :aria-label="section.label">
            <div class="price-row price-head" role="row">
              <span role="columnheader">{{ labels.gameGroup }}</span>
              <span role="columnheader">{{ labels.currency }}</span>
              <span role="columnheader">{{ labels.purchase }}</span>
              <span role="columnheader">{{ labels.sell }}</span>
            </div>
            <div
              v-for="price in section.prices"
              :key="`${price.versionGroup}-${price.currency}`"
              class="price-row"
              role="row"
            >
              <strong role="cell">{{ price.versionGroupLabel }}</strong>
              <span role="cell">{{ price.currencyLabel }}</span>
              <span role="cell">{{ price.purchaseLabel }}</span>
              <span role="cell">{{ price.sellLabel }}</span>
            </div>
          </div>
        </section>
      </div>
    </details>

    <p v-else class="price-empty">{{ labels.noPrices }}</p>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/i18n';
import {
  createItemPriceSections,
  formatItemPrice,
  getRepresentativeItemPrice,
} from '@/utils/itemPrices';

const props = defineProps({
  itemDetails: {
    type: Object,
    default: null,
  },
});

const { language } = useI18n();
const labels = computed(() => language.value === 'de'
  ? {
      title: 'Kauf- und Verkaufspreise',
      purchase: 'Einkaufspreis',
      sell: 'Verkaufspreis',
      history: 'Preise nach Generation und Spielgruppe anzeigen',
      gameGroup: 'Spielgruppe',
      currency: 'Währung',
      noPrices: 'Für dieses Item sind keine Kauf- oder Verkaufspreise hinterlegt.',
      unavailable: 'Nicht verfügbar',
    }
  : {
      title: 'Purchase and sale prices',
      purchase: 'Purchase price',
      sell: 'Sale price',
      history: 'Show prices by generation and game group',
      gameGroup: 'Game group',
      currency: 'Currency',
      noPrices: 'No purchase or sale prices are listed for this item.',
      unavailable: 'Unavailable',
    });

const priceSections = computed(() => createItemPriceSections(props.itemDetails || {}, language.value));
const representative = computed(() => getRepresentativeItemPrice(props.itemDetails || {}));
const representativePurchase = computed(() => representative.value
  ? formatItemPrice(representative.value.purchasePrice, representative.value.currency, language.value)
  : labels.value.unavailable);
const representativeSell = computed(() => representative.value
  ? formatItemPrice(representative.value.sellPrice, representative.value.currency, language.value)
  : labels.value.unavailable);
</script>

<style scoped>
.price-overview { margin-top: 18px; }
.price-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.price-summary article { display: grid; gap: 6px; padding: 15px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.price-summary span { color: var(--legacy-muted); font-size: 0.7rem; font-weight: 900; letter-spacing: 0.07em; text-transform: uppercase; }
.price-summary strong { font-size: 1.05rem; }
.price-history { margin-top: 10px; border: 1px solid var(--legacy-border); background: var(--legacy-page); }
.price-history summary { padding: 12px 14px; cursor: pointer; font-size: 0.78rem; font-weight: 850; }
.generation-list { display: grid; gap: 12px; padding: 0 12px 12px; }
.generation-prices h4 { margin: 0 0 7px; font-size: 0.78rem; }
.price-table { display: grid; overflow-x: auto; }
.price-row { display: grid; grid-template-columns: minmax(170px, 1.5fr) minmax(110px, 1fr) minmax(110px, 0.8fr) minmax(110px, 0.8fr); gap: 8px; align-items: center; min-width: 560px; padding: 8px; border-top: 1px solid var(--legacy-border); font-size: 0.72rem; }
.price-head { color: var(--legacy-muted); font-size: 0.62rem; font-weight: 900; text-transform: uppercase; }
.price-empty { margin: 10px 0 0; padding: 12px; border: 1px solid var(--legacy-border); color: var(--legacy-muted); background: var(--legacy-page); }
@media (max-width: 520px) { .price-summary { grid-template-columns: 1fr; } }
</style>
