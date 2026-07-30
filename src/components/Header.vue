<template>
  <header class="header">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true"></span>
      <span>Pokédex</span>
    </div>
    <label class="search-field">
      <span class="visually-hidden">Search Pokémon</span>
      <input
        :value="searchQuery"
        type="search"
        inputmode="search"
        autocomplete="off"
        placeholder="Search by name or number"
        class="search-input"
        @input="emit('updateSearchQuery', $event.target.value)"
      >
    </label>
    <button
      type="button"
      class="styled-button"
      :aria-pressed="isShiny"
      @click="emit('toggleShiny')"
    >
      {{ isShiny ? 'Show normal sprites' : 'Show shiny sprites' }}
    </button>
  </header>
</template>

<script setup>
defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
  isShiny: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'updateSearchQuery',
  'toggleShiny',
]);
</script>

<style scoped>
.header {
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  display: grid;
  grid-template-columns: auto minmax(220px, 680px) auto;
  gap: 20px;
  align-items: center;
  width: 100%;
  min-height: 64px;
  padding: 12px 24px;
  border-bottom: 1px solid #d5d9e1;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 2px 12px rgba(23, 32, 51, 0.08);
  backdrop-filter: blur(12px);
}

.brand {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.brand-mark {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 6px solid #dc2626;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: inset 0 0 0 2px #172033;
}

.search-field {
  min-width: 0;
}

.search-input {
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  border: 1px solid #b9c0cc;
  border-radius: 10px;
  color: #172033;
  background: #ffffff;
  outline: none;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

.styled-button {
  min-height: 42px;
  padding: 9px 14px;
  border: 1px solid #b9c0cc;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  background: #f8fafc;
}

.styled-button:hover {
  background: #eef2f7;
}

.styled-button:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.35);
  outline-offset: 2px;
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

@media (max-width: 760px) {
  .header {
    grid-template-columns: 1fr auto;
    gap: 10px;
    padding: 10px 16px;
  }

  .search-field {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .styled-button {
    font-size: 0.875rem;
  }
}
</style>
