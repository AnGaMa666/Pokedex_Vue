<template>
  <nav class="fixed">
    <ul>
      <li><router-link to="/pokedex">Pokedex</router-link></li>
      <li><router-link to="/moves">Moves</router-link></li>
      <li><router-link to="/items">Items</router-link></li>
      <li><router-link to="/berries">Berries</router-link></li>
    </ul>
  </nav>
</template>

<script setup>
</script>

<<style scoped>
.fixed {
  position: fixed;
  top: 70px; /* direkt unter dem Header */
  left: 0;
  width: 200px;
  height: calc(100vh - 70px);
  background-color: #f8f8f8;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 999;
}
.fixed ul {
  list-style: none;
  padding: 0;
}
.fixed li {
  padding: 10px;
}
</style>
