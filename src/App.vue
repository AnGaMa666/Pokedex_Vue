<template>
  <div id="app">
    <Header
        :showSearch="isPokedexRoute"
        :searchQuery="searchQuery"
        @updateSearchQuery="updateSearchQuery"
        @toggleShiny="toggleShiny"
        :isShiny="isShiny"
    />
    <div class="main-container">
      <Navbar />
      <div class="page-container">
        <router-view
            v-slot="{ Component }"
            :key="$route.fullPath"
        >
          <transition name="fade" mode="out-in">
            <component :is="Component"
                       :searchQuery="searchQuery"
                       :isShiny="isShiny"
                       @updateSearchQuery="updateSearchQuery"
                       @toggleShiny="toggleShiny"
            />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/Header.vue';
import Navbar from '@/components/Navbar.vue';

const searchQuery = ref('');
const isShiny = ref(false);
const route = useRoute();

const isPokedexRoute = computed(() => route.path === '/pokedex');

const updateSearchQuery = (query) => {
  searchQuery.value = query;
};

const toggleShiny = () => {
  isShiny.value = !isShiny.value;
};
</script>

<style scoped>
.main-container {
  display: flex;
  margin-top: 70px; /* Platz für fixierten Header */
}

.page-container {
  flex: 1;
  margin-left: 200px; /* Platz für fixierte Sidebar */
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}
</style>
