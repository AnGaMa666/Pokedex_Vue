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
        :placeholder="searchLabel || searchPlaceholder"
        :title="searchPlaceholder"
        class="search-input"
        @input="emit('updateSearchQuery', $event.target.value)"
      >
    </label>

    <div class="header-actions">
      <label class="language-field compact-field">
        <span class="visually-hidden">{{ t('header.language') }}</span>
        <select
          :value="language"
          class="header-select language-select"
          :aria-label="t('header.language')"
          @change="setLanguage($event.target.value)"
        >
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </label>

      <label v-if="showSpriteSelector" class="sprite-field compact-field">
        <span class="visually-hidden">{{ labels.spriteSource }}</span>
        <select
          :value="spriteMode"
          class="header-select sprite-select"
          :aria-label="labels.spriteSource"
          @change="emit('updateSpriteMode', $event.target.value)"
        >
          <option v-for="mode in spriteModes" :key="mode.id" :value="mode.id">
            {{ language === 'de' ? mode.labelDe : mode.labelEn }}
          </option>
        </select>
      </label>

      <button
        v-if="showShiny"
        type="button"
        class="header-button shiny-button"
        :class="{ 'is-active': isShiny }"
        :aria-pressed="isShiny"
        @click="emit('toggleShiny')"
      >
        <span class="button-icon shiny-spark" aria-hidden="true">✦</span>
        <span class="button-label">{{ isShiny ? labels.shinyOn : labels.shinyOff }}</span>
      </button>

      <button
        type="button"
        class="header-button theme-button"
        :class="{ 'is-active': isDark }"
        :aria-pressed="isDark"
        :aria-label="isDark ? labels.lightMode : labels.darkMode"
        @click="emit('toggleDark')"
      >
        <span class="button-icon" aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
        <span class="button-label">{{ isDark ? labels.lightMode : labels.darkMode }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/i18n';
import { SPRITE_MODES } from '@/utils/sprites';

defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
  isShiny: {
    type: Boolean,
    default: false,
  },
  isDark: {
    type: Boolean,
    default: false,
  },
  spriteMode: {
    type: String,
    default: 'pixel',
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  showShiny: {
    type: Boolean,
    default: false,
  },
  showSpriteSelector: {
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
  'toggleDark',
  'updateSpriteMode',
]);

const { language, setLanguage, t } = useI18n();
const spriteModes = SPRITE_MODES;
const labels = computed(() => language.value === 'de'
  ? {
      spriteSource: 'Sprite-Version',
      shinyOn: 'Shiny-Sprites an',
      shinyOff: 'Shiny-Sprites aus',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
    }
  : {
      spriteSource: 'Sprite source',
      shinyOn: 'Shiny sprites on',
      shinyOff: 'Shiny sprites off',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
    });
</script>

<style scoped>
.header {
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  display: grid;
  grid-template-columns: auto minmax(260px, 1fr) auto;
  gap: 18px;
  align-items: center;
  width: 100%;
  min-height: 72px;
  padding: 9px max(16px, calc((100vw - 2160px) / 2 + 16px));
  border-bottom: 1px solid var(--legacy-border);
  color: var(--legacy-text);
  background: color-mix(in srgb, var(--legacy-page) 94%, transparent);
  box-shadow: 0 2px 5px var(--legacy-shadow);
  backdrop-filter: blur(16px);
}

.header.without-search {
  grid-template-columns: auto 1fr auto;
}

.brand {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.brand:focus-visible,
.header-button:focus-visible,
.header-select:focus-visible,
.search-input:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

.brand-icon {
  display: grid;
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  background: var(--legacy-surface);
}

.brand-icon img {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
}

.brand-copy {
  display: grid;
  line-height: 1.1;
}

.brand-copy strong {
  color: var(--legacy-text);
  font-size: 1rem;
  white-space: nowrap;
}

.brand-copy small {
  margin-top: 4px;
  color: var(--legacy-muted);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
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
  left: 14px;
  width: 14px;
  height: 14px;
  border: 2px solid var(--legacy-muted);
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
  content: '';
  background: var(--legacy-muted);
  transform: rotate(45deg);
  transform-origin: left center;
}

.search-input {
  width: 100%;
  min-height: 44px;
  padding: 9px 13px 9px 42px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-surface);
}

.search-input:focus {
  border-color: var(--focus-color);
  background: var(--legacy-page);
}

.header-actions {
  display: flex;
  gap: 7px;
  justify-content: flex-end;
  align-items: center;
}

.header-select,
.header-button {
  min-height: 40px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  color: var(--legacy-text);
  background: var(--legacy-surface);
}

.header-select {
  padding: 7px 28px 7px 9px;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
}

.language-select {
  width: 98px;
}

.sprite-select {
  width: 150px;
}

.header-button {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
  padding: 7px 10px;
  font-size: 0.75rem;
  font-weight: 850;
  white-space: nowrap;
  cursor: pointer;
}

.header-button:hover,
.header-select:hover {
  border-color: var(--legacy-border-strong);
  background: var(--legacy-surface-hover);
}

.shiny-button.is-active {
  border-color: #7c3aed;
  color: #7c3aed;
}

.theme-button.is-active {
  border-color: #eab308;
  color: #eab308;
}

.button-icon {
  font-size: 1rem;
  line-height: 1;
}

.shiny-spark {
  color: #7c3aed;
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

@media (max-width: 1220px) {
  .brand-copy small,
  .button-label {
    display: none;
  }

  .header-button {
    width: 40px;
    padding: 0;
  }

  .sprite-select {
    width: 124px;
  }
}

@media (max-width: 900px) {
  .header,
  .header.without-search {
    position: sticky;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 7px;
    min-height: 0;
    padding: 7px 9px;
  }

  .search-field {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .search-input {
    min-height: 40px;
  }

  .brand-copy {
    display: none;
  }

  .brand-icon {
    width: 38px;
    height: 38px;
  }

  .brand-icon img {
    width: 34px;
    height: 34px;
  }

  .header-actions {
    gap: 5px;
  }

  .header-select,
  .header-button {
    min-height: 38px;
  }

  .language-select {
    width: 92px;
  }

  .sprite-select {
    width: 112px;
  }
}

@media (max-width: 520px) {
  .sprite-select {
    width: 92px;
    max-width: 25vw;
  }

  .language-select {
    width: 82px;
    max-width: 23vw;
  }
}
</style>
