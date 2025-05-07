<template>
  <div class="berries-view">
    <Header />
    <div class="main-container">
      <Navbar />
      <div class="content-wrapper">
        <Berries />
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue';
import Navbar from '@/components/Navbar.vue';
import Berries from '@/components/Berries.vue';
</script>

<style scoped>
.berries-view {
  display: flex;
  flex-direction: column;
}
.main-container {
  display: flex;
  margin-top: 60px;
}
.content-wrapper {
  flex: 1;
  padding: 20px;
  margin-left: 200px;
}
</style>
