<template>
  <div class="items-view">
    <div v-if="!isLoaded" class="loading-overlay">
      <p>Lade Items und Sprites...</p>
    </div>

    <div v-else class="content-container">
      <div class="item-grid">
        <div
            v-for="item in paginatedItems"
            :key="item.name"
            class="item-card"
        >
          <img :src="item.image" :alt="item.name" />
          <span class="item-name">{{ item.name }}</span>
        </div>
      </div>
    </div>

    <div class="pagination">
      <button
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
      >
        ◀
      </button>
      <span>Seite {{ currentPage }} / {{ totalPages }}</span>
      <button
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
      >
        ▶
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import PokeAPI from '@/services/pokeapi';
import { preloadSprites } from '@/utils/preloadSprite.js';

const items = ref([]);
const isLoaded = ref(false);
const currentPage = ref(1);
const pageSize = 50;

const totalPages = computed(() =>
    Math.ceil(items.value.length / pageSize)
);

const paginatedItems = computed(() =>
    items.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize)
);

const changePage = async (page) => {
  currentPage.value = page;

  const currentImages = paginatedItems.value.map(item => item.image).filter(Boolean);
  await preloadSprites(currentImages);
};

onMounted(async () => {
  try {
    const response = await PokeAPI.getItems();
    items.value = response.data;

    const firstImages = items.value.slice(0, pageSize).map(i => i.image).filter(Boolean);
    await preloadSprites(firstImages);
  } catch (error) {
    console.error('Fehler beim Laden der Items:', error);
  } finally {
    isLoaded.value = true;
  }
});
</script>

<style scoped>
.items-view {
  padding-top: 80px;
  padding-bottom: 80px; /* Platz für fixierte Pagination */
  min-height: 100vh;
  box-sizing: border-box;
}

.content-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
  padding: 20px;
}

.item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 12px;
  border-radius: 6px;
  background-color: #f8f8f8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  min-height: 120px;
  text-align: center;
  transition: transform 0.2s ease;
}
.item-card:hover {
  transform: scale(1.03);
}
.item-card img {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
}
.item-name {
  text-transform: capitalize;
  font-weight: bold;
  font-size: 0.9rem;
  color: #333;
}

.pagination {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  padding: 10px 20px;
  background-color: white;
  border-top: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  z-index: 999;
}

.pagination button {
  background-color: var(--primary-red);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: default;
}

.loading-overlay {
  padding: 40px;
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
  color: var(--primary-red);
}
</style>
