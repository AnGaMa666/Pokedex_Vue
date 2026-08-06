<template>
  <section class="price-overview" :aria-labelledby="headingId">
    <div class="price-heading">
      <h3 :id="headingId">{{ labels.title }}</h3>
      <span v-if="priceSummaries.length > 1">{{ labels.separateCurrencies }}</span>
    </div>

    <div v-if="priceSummaries.length" class="currency-summaries">
      <article
        v-for="summary in priceSummaries"
        :key="summary.currency || 'unspecified-currency'"
        class="currency-summary"
      >
        <header>
          <h4>{{ summary.currencyLabel }}</h4>
          <span v-if="summary.isFallback" class="fallback-badge">{{ labels.fallback }}</span>
        </header>
        <dl>
          <div>
            <dt>{{ labels.purchase }}</dt>
            <dd>{{ summary.purchaseLabel }}</dd>
          </div>
          <div>
            <dt>{{ labels.sell }}</dt>
            <dd>{{ summary.sellLabel }}</dd>
          </div>
        </dl>
      </article>
    </div>

    <p v-else class="price-empty">{{ labels.noPrices }}</p>

    <details v-if="priceSections.length" class="price-history">
      <summary>{{ labels.history }}</summary>
      <div class="generation-list">
        <section
          v-for="section in priceSections"
          :key="section.label"
          class="generation-prices"
        >
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
              :key="price.id"
              class="price-row"
              role="row"
            >
              <strong role="cell" :data-label="labels.gameGroup">
                {{ price.versionGroupLabel }}
              </strong>
              <span role="cell" :data-label="labels.currency">{{ price.currencyLabel }}</span>
              <span role="cell" :data-label="labels.purchase">{{ price.purchaseLabel }}</span>
              <span role="cell" :data-label="labels.sell">{{ price.sellLabel }}</span>
            </div>
          </div>
        </section>
      </div>
    </details>
  </section>
</template>

<script setup>
import { computed, useId } from 'vue';
import { useI18n } from '@/i18n';
import {
  createCompactItemPriceSummaries,
  createItemPriceSections,
} from '@/utils/itemPrices';

const props = defineProps({
  itemDetails: {
    type: Object,
    default: null,
  },
});

const { language } = useI18n();
const headingId = useId();

const labels = computed(() => language.value === 'de'
  ? {
      title: 'Kauf- und Verkaufspreise',
      purchase: 'Einkaufspreis',
      sell: 'Verkaufspreis',
      history: 'Preise nach Generation und Spielgruppe anzeigen',
      gameGroup: 'Spielgruppe',
      currency: 'Währung',
      noPrices: 'Für dieses Item sind keine Kauf- oder Verkaufspreise hinterlegt.',
      fallback: 'Fallback aus dem allgemeinen Listenpreis',
      separateCurrencies: 'Währungen getrennt zusammengefasst',
    }
  : {
      title: 'Purchase and sale prices',
      purchase: 'Purchase price',
      sell: 'Sale price',
      history: 'Show prices by generation and game group',
      gameGroup: 'Game group',
      currency: 'Currency',
      noPrices: 'No purchase or sale prices are listed for this item.',
      fallback: 'Fallback from the general list price',
      separateCurrencies: 'Currencies summarized separately',
    });

const priceSections = computed(() => createItemPriceSections(
  props.itemDetails || {},
  language.value,
));
const priceSummaries = computed(() => createCompactItemPriceSummaries(
  props.itemDetails || {},
  language.value,
));
</script>

<style scoped>
.price-overview {
  margin-top: 18px;
}

.price-heading {
  display: flex;
  gap: 12px;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 9px;
}

.price-heading h3 {
  margin: 0;
  font-size: 1rem;
}

.price-heading > span {
  color: var(--legacy-muted);
  font-size: 0.68rem;
}

.currency-summaries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}

.currency-summary {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.currency-summary header {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.currency-summary h4 {
  margin: 0;
  font-size: 0.8rem;
}

.fallback-badge {
  padding: 3px 6px;
  border: 1px solid var(--legacy-border-strong);
  color: var(--legacy-muted);
  font-size: 0.58rem;
  font-weight: 800;
}

.currency-summary dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.currency-summary dl > div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.currency-summary dt {
  color: var(--legacy-muted);
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.currency-summary dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 0.92rem;
  font-weight: 800;
}

.price-history {
  margin-top: 10px;
  border: 1px solid var(--legacy-border);
  background: var(--legacy-page);
}

.price-history summary {
  padding: 12px 14px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 850;
}

.generation-list {
  display: grid;
  gap: 12px;
  padding: 0 12px 12px;
}

.generation-prices h4 {
  margin: 0 0 7px;
  font-size: 0.78rem;
}

.price-table {
  display: grid;
  overflow-x: auto;
  border-bottom: 1px solid var(--legacy-border);
}

.price-row {
  display: grid;
  grid-template-columns: minmax(170px, 1.5fr) minmax(110px, 1fr) minmax(110px, 0.8fr) minmax(110px, 0.8fr);
  gap: 8px;
  align-items: center;
  min-width: 560px;
  padding: 8px;
  border-top: 1px solid var(--legacy-border);
  font-size: 0.72rem;
}

.price-head {
  color: var(--legacy-muted);
  font-size: 0.62rem;
  font-weight: 900;
  text-transform: uppercase;
}

.price-empty {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--legacy-border);
  color: var(--legacy-muted);
  background: var(--legacy-page);
}

@media (max-width: 620px) {
  .price-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .currency-summaries,
  .currency-summary dl {
    grid-template-columns: 1fr;
  }

  .price-table {
    gap: 8px;
    overflow: visible;
    border-bottom: 0;
  }

  .price-head {
    display: none;
  }

  .price-row:not(.price-head) {
    grid-template-columns: 1fr;
    gap: 5px;
    min-width: 0;
    border: 1px solid var(--legacy-border);
  }

  .price-row:not(.price-head) > * {
    display: flex;
    gap: 12px;
    justify-content: space-between;
  }

  .price-row:not(.price-head) > *::before {
    color: var(--legacy-muted);
    content: attr(data-label);
    font-size: 0.6rem;
    font-weight: 900;
    text-transform: uppercase;
  }
}
</style>
