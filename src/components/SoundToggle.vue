<script setup lang="ts">
import { useAudio } from '../composables/useAudio';

const { isMuted, toggleMute } = useAudio();
</script>

<template>
  <button class="sound-toggle" @click="toggleMute" :title="isMuted ? 'Unmute Sounds' : 'Mute Sounds'">
    <span v-if="isMuted">🔇</span>
    <span v-else>🔊</span>
  </button>
</template>

<style scoped>
.sound-toggle {
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
