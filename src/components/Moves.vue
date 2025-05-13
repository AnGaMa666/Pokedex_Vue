<template>
  <div class="moves-page">
    <h1 class="title">Moves</h1>

    <div class="filters">
      <label>
        Typ:
        <select v-model="selectedType">
          <option value="">Alle</option>
          <option v-for="(color, type) in TypeColors" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </label>

      <label>
        Generation:
        <select v-model="selectedGeneration">
          <option value="">Alle</option>
          <option v-for="gen in availableGenerations" :key="gen" :value="gen">
            {{ gen }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="!isLoaded" class="loading">Lade Attacken...</div>

    <div v-else>
      <div v-for="(group, gen) in groupedMoves" :key="gen">
        <h2 class="generation-heading">Generation {{ gen }}</h2>
        <div class="moves-grid">
          <div
              v-for="move in group"
              :key="move.name"
              class="move-tile"
              :style="{ backgroundColor: TypeColors[move.type] || '#DDD' }"
          >
            <span>{{ move.name }} <small>({{ move.type }})</small></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import PokeAPI from '@/services/pokeapi';
import { useErrorToast } from '@/composables/useErrorToast.js';
import { TypeColors } from '@/utils/colors.js';

const toast = useErrorToast();
const isLoaded = ref(false);
const allMoves = ref([]);
const selectedType = ref('');
const selectedGeneration = ref('');

const availableGenerations = ref([]);

function normalizeGen(gen) {
  if (!gen) return 'Unbekannt';
  const roman = gen.replace('generation-', '').toUpperCase();
  return romanMap[roman] ? roman : 'Unbekannt';
}

function romanToNumber(roman) {
  return romanMap[roman.toUpperCase()] || 999;
}

const romanMap = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9,
};

onMounted(async () => {
  try {
    const response = await PokeAPI.getMoves();
    allMoves.value = response.data;

    const gens = [...new Set(response.data.map(m => normalizeGen(m.generation)))];
    availableGenerations.value = gens.sort((a, b) => romanToNumber(a) - romanToNumber(b));

    isLoaded.value = true;
  } catch (error) {
    toast.show('Fehler beim Laden der Attacken!');
    console.error(error);
    isLoaded.value = true;
  }
});

const filteredMoves = computed(() => {
  return allMoves.value.filter(move => {
    const matchType = selectedType.value ? move.type === selectedType.value : true;
    const moveGen = normalizeGen(move.generation);
    const matchGen = selectedGeneration.value ? moveGen === selectedGeneration.value : true;
    return matchType && matchGen;
  });
});

const groupedMoves = computed(() => {
  const grouped = {};
  filteredMoves.value.forEach(move => {
    const gen = normalizeGen(move.generation);
    if (!grouped[gen]) grouped[gen] = [];
    grouped[gen].push(move);
  });

  return Object.keys(grouped)
      .sort((a, b) => romanToNumber(a) - romanToNumber(b))
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});
});
</script>

<style scoped>
.moves-page {
  padding: 20px;
}
.title {
  font-size: 28px;
  margin-bottom: 16px;
}
.loading {
  font-style: italic;
  color: #666;
}
.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.filters label {
  font-weight: bold;
}
.filters select {
  margin-left: 8px;
  padding: 4px;
}
.generation-heading {
  font-size: 20px;
  text-align: center;
  margin-top: 32px;
  margin-bottom: 10px;
  font-weight: bold;
  color: #444;
}
.moves-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.move-tile {
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  text-transform: capitalize;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
