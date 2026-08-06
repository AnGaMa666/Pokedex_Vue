<template>
  <div class="enhanced-profile">
    <PokemonProfile
      :pokemon="pokemon"
      :is-shiny="isShiny"
      :sprite-mode="spriteMode"
      @details-loaded="handleDetailsLoaded"
      @open-resource="emit('openResource', $event)"
    />

    <EvolutionRequirements
      v-if="evolutionSpecies"
      :pokemon="evolutionSpecies"
      :active-pokemon="loadedDetails"
      :is-shiny="isShiny"
      :sprite-mode="spriteMode"
      @open-resource="emit('openResource', $event)"
    />
  </div>
</template>

<script setup>
import {
  computed,
  ref,
  watch,
} from 'vue';
import EvolutionRequirements from './EvolutionRequirements.vue';
import PokemonProfile from './PokemonProfile.vue';

const props = defineProps({
  pokemon: {
    type: Object,
    required: true,
  },
  isShiny: {
    type: Boolean,
    default: false,
  },
  spriteMode: {
    type: String,
    default: 'pixel',
  },
});

const emit = defineEmits(['detailsLoaded', 'openResource']);
const loadedDetails = ref(null);
const evolutionSpecies = computed(() => {
  const species = loadedDetails.value?.species;
  return species?.name ? { name: species.name, url: species.url } : null;
});

const handleDetailsLoaded = (details) => {
  loadedDetails.value = details;
  emit('detailsLoaded', details);
};

watch(() => props.pokemon?.name, () => {
  loadedDetails.value = null;
});
</script>

<style scoped>
.enhanced-profile {
  display: grid;
  gap: 18px;
  min-width: 0;
}
</style>
