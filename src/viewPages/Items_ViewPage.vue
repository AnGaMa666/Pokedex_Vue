<template>
  <div class="items-view">
    <Header />
    <div class="main-container">
      <Navbar />
      <div class="content-wrapper">
        <Items />
      </div>
    </div>
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue';
import Navbar from '@/components/Navbar.vue';
import Items from '@/components/Items.vue';
</script>

<style scoped>
.items-view {
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
