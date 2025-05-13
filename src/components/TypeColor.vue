<template>
  <div :style="typeStyle">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { TypeColors } from '../utils/colors.js';

const props = defineProps({
  types: {
    type: Array,
    required: true,
    default: () => [],
  },
});

const typeStyle = computed(() => {
  if (props.types.length === 1) {
    const name = props.types[0]?.type?.name;
    return {
      backgroundColor: TypeColors[name] || 'transparent',
    };
  } else if (props.types.length === 2) {
    const color1 = TypeColors[props.types[0]?.type?.name] || 'transparent';
    const color2 = TypeColors[props.types[1]?.type?.name] || 'transparent';
    return {
      background: `linear-gradient(to right, ${color1}, ${color2})`,
    };
  }
  return {};
});
</script>

<style scoped>
div {
  padding: 5px;
  border-radius: 5px;
}
</style>
