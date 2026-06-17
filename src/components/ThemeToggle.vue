<script setup lang="ts">
import { useTheme } from '../composables/useTheme';

const { theme, toggleTheme } = useTheme();
</script>

<template>
  <button class="theme-toggle" @click="toggleTheme" title="Toggle Theme">
    <span v-if="theme === 'light'">☀️</span>
    <span v-else>🌙</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  padding: 5px 10px;
  font-size: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
}
</style>
