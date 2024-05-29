<template>
  <div :style="typeStyle">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  types: {
    type: Array,
    required: true,
    default: () => [],
  },
});

const typeColors = {
  fire: 'lightcoral',
  water: 'lightblue',
  grass: 'lightgreen',
  electric: 'lightyellow',
  ice: 'lightcyan',
  fighting: 'lightpink',
  poison: 'mediumorchid',
  ground: 'burlywood',
  flying: 'lightskyblue',
  psychic: 'lightcoral',
  bug: 'lightgreen',
  rock: 'lightgray',
  ghost: 'lightsteelblue',
  dark: 'darkgray',
  dragon: 'mediumpurple',
  steel: 'lightgray',
  fairy: 'lightpink',
  normal: 'lightgray',
};

const typeStyle = computed(() => {
  if (props.types.length === 1) {
    console.log('hello1');
    console.log(props.types[0]);
    return {
      backgroundColor: typeColors[props.types[0]],
    };
  } else if (props.types.length === 2) {
    const color1 = typeColors[props.types[0]];
    const color2 = typeColors[props.types[1]];
    console.log('hello2');
    console.log(color1);
    console.log(color2);
    return {
      background: `linear-gradient(to right, ${color1}, ${color2})`,
    };
    console.log('hello3');
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
