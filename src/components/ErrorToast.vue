<template>
  <transition name="fade">
    <div v-if="visible" class="toast">
      {{ message }}
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);
const message = ref('');

function show(msg) {
  message.value = msg;
  visible.value = true;

  setTimeout(() => {
    visible.value = false;
  }, 5000);
}

defineExpose({ show });
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #e53935;
  color: white;
  padding: 12px 18px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: bold;
  z-index: 9999;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
