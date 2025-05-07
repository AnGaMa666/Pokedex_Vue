<template>
  <div class="home-view">
    <Header />
    <div class="main-container">
      <Navbar />
      <div class="welcome-message">
        <h1>Willkommen im Pokédex</h1>
        <p>Wähle links eine Kategorie aus, um zu starten.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue';
import Navbar from '@/components/Navbar.vue';
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
}
.main-container {
  display: flex;
  margin-top: 60px;
}
.welcome-message {
  margin-left: 200px;
  padding: 40px;
}
</style>
