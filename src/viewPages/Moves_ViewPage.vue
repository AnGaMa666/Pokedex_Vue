<template>
  <div class="moves-view">
    <Header />
    <div class="main-container">
      <Navbar />
      <div class="move-wrapper">
        <Moves :moves="moves" v-if="isLoaded" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Navbar from '@/components/Navbar.vue';
import Moves from '@/components/Moves.vue';
import PokeAPI from '@/services/pokeapi';
import { getCachedData, setCachedList } from '@/utils/cache.js';
import { useErrorToast } from '@/composables/useErrorToast.js';

const toast = useErrorToast();

const moves = ref([]);
const isLoaded = ref(false);

onMounted(async () => {
  const cached = getCachedData('moves');
  if (cached) {
    moves.value = cached;
    isLoaded.value = true;
    return;
  }

  try {
    const response = await PokeAPI.getMoves();
    moves.value = response.data;
    setCachedList('moves', moves.value);
  } catch (error) {
    toast.show('Fehler beim Laden der Attacken!');
    console.error(error);
  } finally {
    isLoaded.value = true;
  }
});
</script>

<style scoped>
.moves-view {
  display: flex;
  flex-direction: column;
}
.main-container {
  display: flex;
  margin-top: 20px;
}
.move-wrapper {
  flex: 1;
  padding: 20px;
  margin-left: 20px;
}
</style>
