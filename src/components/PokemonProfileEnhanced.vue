<template>
  <div class="enhanced-profile">
    <PokemonProfile
      :pokemon="pokemon"
      :is-shiny="isShiny"
      :sprite-mode="spriteMode"
      @details-loaded="emit('detailsLoaded', $event)"
      @open-resource="emit('openResource', $event)"
    />

    <EvolutionRequirements
      :pokemon="pokemon"
      :is-shiny="isShiny"
      :sprite-mode="spriteMode"
      @open-resource="emit('openResource', $event)"
    />
  </div>
</template>

<script setup>
import EvolutionRequirements from './EvolutionRequirements.vue';
import PokemonProfile from './PokemonProfile.vue';

defineProps({
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
</script>

<style scoped>
.enhanced-profile {
  display: grid;
  gap: 18px;
  min-width: 0;
}
</style>
