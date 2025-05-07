<template>
  <div>
    <div v-if="!isLoaded" class="loading-overlay">
      <p>Lade Beeren und Sprites...</p>
    </div>
    <div v-else class="berry-grid">
      <div
          v-for="berry in berries"
          :key="berry.name"
          class="berry-card"
      >
        <img :src="berry.image" :alt="berry.name" />
        <span>{{ berry.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PokeAPI from '@/services/pokeapi';

const berries = ref([]);
const isLoaded = ref(false);

onMounted(async () => {
  try {
    const response = await PokeAPI.getBerries();
    berries.value = response.data;
  } catch (error) {
    console.error('Fehler beim Laden der Beeren:', error);
  } finally {
    isLoaded.value = true;
  }
});
</script>

<style scoped>
.berry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 15px;
  padding: 20px;
}
.berry-card {
  padding: 10px;
  border-radius: 6px;
  background-color: #f8f8f8;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  text-transform: capitalize;
  font-weight: bold;
  color: #333;
}
.berry-card img {
  width: 48px;
  height: 48px;
  margin-bottom: 5px;
}

.loading-overlay {
  padding: 40px;
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
  color: var(--primary-red);
}
</style>
