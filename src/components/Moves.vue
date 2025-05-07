<script setup>
import { ref, onMounted } from 'vue';
import PokeAPI from '@/services/pokeapi';
import { globalCache } from '@/utils/globalCache.js';

const moves = ref([]);
const isLoaded = ref(false);

onMounted(async () => {
  const cache = globalCache.get(globalCache.keys.moves);
  if (cache) {
    moves.value = cache;
    isLoaded.value = true;
    return;
  }

  try {
    const response = await PokeAPI.getMoves();
    moves.value = response.data.results;
    globalCache.set(globalCache.keys.moves, moves.value);
  } catch (error) {
    console.error('Fehler beim Laden der Moves:', error);
  } finally {
    isLoaded.value = true;
  }
});
</script>
