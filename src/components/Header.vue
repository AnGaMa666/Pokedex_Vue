<template>
  <header class="header" :class="{ 'without-search': !showSearch }">
    <a class="brand" href="#home" :aria-label="t('header.openOverview')">
      <span class="brand-icon" aria-hidden="true">
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
          alt=""
          width="48"
          height="48"
        >
      </span>
      <span class="brand-copy">
        <strong>{{ t('header.brand') }}</strong>
        <small>{{ sectionLabel }}</small>
      </span>
    </a>

    <label v-if="showSearch" class="search-field">
      <span class="visually-hidden">{{ searchLabel }}</span>
      <span class="search-icon" aria-hidden="true"></span>
      <input
        :value="searchQuery"
        type="search"
        inputmode="search"
        autocomplete="off"
        :placeholder="searchPlaceholder"
        class="search-input"
        @input="emit('updateSearchQuery', $event.target.value)"
      >
    </label>

    <div class="header-actions">
      <label class="language-field">
        <span class="visually-hidden">{{ t('header.language') }}</span>
        <select
          :value="language"
          class="language-select"
          :aria-label="t('header.language')"
          @change="setLanguage($event.target.value)"
        >
          <option value="de">{{ t('header.german') }}</option>
          <option value="en">{{ t('header.english') }}</option>
        </select>
      </label>

      <button
        v-if="showShiny"
        type="button"
        class="shiny-button"
        :class="{ 'is-active': isShiny }"
        :aria-pressed="isShiny"
        @click="emit('toggleShiny')"
      >
        <span class="shiny-spark" aria-hidden="true">✦</span>
        <span>{{ isShiny ? t('header.shinyOn') : t('header.shinyOff') }}</span>
      </button>
      <span v-else class="cache-status" :title="t('header.cacheTitle')">
        <span aria-hidden="true">↻</span>
        {{ t('header.sessionCache') }}
      </span>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from '@/i18n';

defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
  isShiny: {
    type: Boolean,
    default: false,
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  showShiny: {
    type: Boolean,
    default: false,
  },
  sectionLabel: {
    type: String,
    default: 'Overview',
  },
  searchLabel: {
    type: String,
    default: 'Search resources',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search by name or number',
  },
});

const emit = defineEmits([
  'updateSearchQuery',
  'toggleShiny',
]);

const { language, setLanguage, t } = useI18n();
</script>

<style scoped>
.header {
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  display: grid;
  grid-template-columns: auto minmax(240px, 720px) auto;
  gap: 24px;
  align-items: center;
  width: 100%;
  min-height: 72px;
  padding: 10px max(24px, calc((100vw - 1680px) / 2 + 24px));
  border-bottom: 1px solid rgba(213, 217, 225, 0.9);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 30px rgba(23, 32, 51, 0.09);
  backdrop-filter: blur(18px);
}

.header.without-search {
  grid-template-columns: auto 1fr auto;
}

.brand {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.brand:focus-visible {
  outline: 3px solid rgba(220, 38, 38, 0.24);
  outline-offset: 4px;
  border-radius: 16px;
}

.brand-icon {
  display: grid;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid #e3e6eb;
  border-radius: 15px;
  background: linear-gradient(145deg, #ffffff, #f0f3f8);
  box-shadow: 0 8px 18px rgba(23, 32, 51, 0.1);
}

.brand-icon img {
  width: 42px;
  height: 42px;
  image-rendering: pixelated;
}

.brand-copy {
  display: grid;
  line-height: 1.1;
}

.brand-copy strong {
  color: #172033;
  font-size: 1.08rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.brand-copy small {
  margin-top: 4px;
  color: #687386;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.search-field {
  position: relative;
  min-width: 0;
}

.search-icon {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 15px;
  width: 15px;
  height: 15px;
  border: 2px solid #687386;
  border-radius: 50%;
  pointer-events: none;
  transform: translateY(-56%);
}

.search-icon::after {
  position: absolute;
  right: -6px;
  bottom: -4px;
  width: 7px;
  height: 2px;
  border-radius: 999px;
  content: '';
  background: #687386;
  transform: rotate(45deg);
  transform-origin: left center;
}

.search-input {
  width: 100%;
  min-height: 46px;
  padding: 10px 14px 10px 44px;
  border: 1px solid #b9c0cc;
  border-radius: 14px;
  color: #172033;
  background: rgba(248, 250, 252, 0.92);
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.search-input:hover {
  background: #ffffff;
}

.search-input:focus {
  border-color: #dc2626;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.14);
}

.header-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
}

.language-select {
  min-height: 42px;
  padding: 8px 34px 8px 12px;
  border: 1px solid #b9c0cc;
  border-radius: 12px;
  color: #344054;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;
  background: #f8fafc;
}

.language-select:hover {
  background: #ffffff;
}

.language-select:focus-visible {
  outline: 3px solid rgba(220, 38, 38, 0.22);
  outline-offset: 2px;
}

.shiny-button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 9px 14px;
  border: 1px solid #b9c0cc;
  border-radius: 999px;
  color: #344054;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  background: #f8fafc;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.shiny-button:hover {
  border-color: #8c96a7;
  background: #ffffff;
  transform: translateY(-1px);
}

.shiny-button.is-active {
  border-color: #7c3aed;
  color: #5b21b6;
  background: #f3e8ff;
}

.shiny-button:focus-visible {
  outline: 3px solid rgba(124, 58, 237, 0.28);
  outline-offset: 2px;
}

.shiny-spark {
  color: #7c3aed;
  font-size: 1.1rem;
  line-height: 1;
}

.cache-status {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid #d5d9e1;
  border-radius: 999px;
  color: #596579;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
  background: #f8fafc;
}

.cache-status span {
  color: #15803d;
  font-size: 1rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1080px) {
  .brand-copy small,
  .cache-status {
    display: none;
  }
}

@media (max-width: 760px) {
  .header,
  .header.without-search {
    grid-template-columns: 1fr auto;
    gap: 10px;
    padding: 10px 16px;
  }

  .search-field {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .header-actions {
    gap: 6px;
  }

  .language-select {
    min-height: 42px;
    padding-right: 28px;
  }

  .shiny-button {
    padding-inline: 12px;
    font-size: 0.825rem;
  }
}

@media (max-width: 500px) {
  .brand-icon {
    width: 42px;
    height: 42px;
  }

  .brand-icon img {
    width: 38px;
    height: 38px;
  }

  .brand-copy strong {
    font-size: 0.98rem;
  }

  .language-select {
    width: 64px;
    padding-inline: 8px;
  }

  .shiny-button span:last-child {
    display: none;
  }

  .shiny-button {
    width: 42px;
    min-height: 42px;
    justify-content: center;
    padding: 0;
  }
}
</style>
