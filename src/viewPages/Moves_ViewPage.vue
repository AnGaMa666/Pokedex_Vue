<template>
  <div class="moves-view">
    <Header />
    <div class="main-container">
      <Navbar />
      <div class="move-wrapper">
        <Moves />
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue';
import Navbar from '@/components/Navbar.vue';
import Moves from '@/components/Moves.vue';
</script>

<style scoped>
.moves-view {
  display: flex;
  flex-direction: column;
}
.main-container {
  display: flex;
  margin-top: 60px;
}
.move-wrapper {
  flex: 1;
  padding: 20px;
  margin-left: 200px;
}
</style>
