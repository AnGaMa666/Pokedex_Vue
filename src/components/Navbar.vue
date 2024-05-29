<template>
  <nav class="fixed">
    <ul>
      <li><router-link to="/pokedex">Pokedex</router-link></li>
      <li><router-link to="/pokemonDetails">PokemonDetails</router-link></li>
      <li><router-link to="/moves">Moves</router-link></li>
      <li><router-link to="/items">Items</router-link></li>
      <li><router-link to="/berries">Berries</router-link></li>
    </ul>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.fixed {
  position: fixed;
  margin-top: 10px;
  top: 50px;
  left: 0;
  width: 200px;
  height: 100%;
  background-color: #f8f8f8;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.fixed ul {
  list-style: none;
  padding: 0;
}

.fixed li {
  padding: 10px;
}
</style>
