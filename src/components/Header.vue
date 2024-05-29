<template>
  <header class="header">
    <input
        type="text"
        placeholder="Search Pokémon"
        v-model="searchQuery"
        @input="updateQuery"
        class="search-input"
    />
    <button @click="toggleShiny" class="styled-button">
      Toggle Shiny
    </button>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  searchQuery: String,
  isShiny: Boolean,
});

const emit = defineEmits(['updateSearchQuery', 'toggleShiny']);

const searchQuery = ref(props.searchQuery);

const updateQuery = () => {
  emit('updateSearchQuery', searchQuery.value);
};

const toggleShiny = () => {
  emit('toggleShiny');
};

watch(() => props.searchQuery, (newVal) => {
  searchQuery.value = newVal;
});
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  width: 98%;
  background-color: white;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
}

.search-input {
  padding: 5px;
  font-size: 16px;
  flex: 1;
  margin-right: 15px;
}

.styled-button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
}

.styled-button:hover {
  background-color: #e0e0e0;
}
</style>
