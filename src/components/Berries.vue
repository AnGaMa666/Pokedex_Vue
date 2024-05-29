<template>
  <div v-if="isLoaded" class="berries">
    <h1>Berries</h1>
    <ul>
      <li v-for="berry in berries" :key="berry.name">{{ berry.name }}</li>
    </ul>
  </div>
  <div v-else class="loading">Loading...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PokeAPI from '@/services/pokeapi';

const berries = ref([]);
const isLoaded = ref(false);

onMounted(async () => {
  const response = await PokeAPI.getBerries();
  berries.value = response.data.results;
  isLoaded.value = true;
});
</script>

<style scoped>
.berries {
  position: fixed;
  top: 60px;
  right: 0;
  padding: 20px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid #ccc;
  background-color: #f8f8f8;
  max-width: fit-content;
}

.loading {
  /* Stile für den Ladezustand */
}
</style>
