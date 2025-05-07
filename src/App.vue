<template>
  <transition name="fade" mode="out-in">
    <router-view />
  </transition>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const setTitle = () => {
  const titleMap = {
    '/': 'Pokédex | Startseite',
    '/pokedex': 'Pokédex | Übersicht',
    '/moves': 'Pokédex | Attacken',
    '/items': 'Pokédex | Items',
    '/berries': 'Pokédex | Beeren',
  };
  document.title = titleMap[route.path] || 'Pokédex';
};

onMounted(setTitle);
watch(route, setTitle);
</script>

<style>
/* Übergänge für Seitenwechsel */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ======= Pokémon Theme Farben ======= */
:root {
  --primary-red: #ef5350;
  --primary-yellow: #fbc02d;
  --primary-white: #f5f5f5;
  --primary-blue: #42a5f5;
  --primary-dark: #2f2f2f;

  --card-bg: #ffffff;
  --card-border: #ddd;
  --card-shadow: rgba(0, 0, 0, 0.1);
}

/* ======= Body & Text ======= */
body {
  font-family: 'Segoe UI', sans-serif;
  background-color: var(--primary-white);
  margin: 0;
  color: var(--primary-dark);
}

h1, h2, h3 {
  color: var(--primary-red);
}

/* ======= Buttons ======= */
button,
.styled-button {
  background-color: var(--primary-red);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}
button:hover,
.styled-button:hover {
  background-color: #d32f2f;
}

/* ======= Inputs ======= */
input[type="text"],
input[type="number"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1em;
}

/* ======= Karten & Grid-Design (für Moves, Items etc.) ======= */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 15px;
}
.grid-item {
  text-align: center;
  border-radius: 6px;
  padding: 10px;
  box-shadow: 0 1px 3px var(--card-shadow);
  background-color: var(--card-bg);
  transition: transform 0.2s ease;
}
.grid-item:hover {
  transform: scale(1.03);
}
.grid-item img {
  width: 48px;
  height: 48px;
  margin-bottom: 5px;
}

/* ======= Allgemeine Layout-Komponenten (z. B. .card) ======= */
.card {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  box-shadow: 0 2px 5px var(--card-shadow);
  padding: 15px;
  transition: transform 0.2s ease;
}
.card:hover {
  transform: scale(1.02);
}

/* ======= Ladeplatzhalter (Skeleton) ======= */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 15px;
}
.skeleton-card {
  height: 64px;
  border-radius: 6px;
  background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
