<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { GameState } from './types';
import { useTheme } from './composables/useTheme';
import { useAudio } from './composables/useAudio';
import HomeScreen from './components/HomeScreen.vue';
import QuizScreen from './components/QuizScreen.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import SoundToggle from './components/SoundToggle.vue';

// Initialize theme at the root so the attribute is set globally.
useTheme();

const { playSound, initAudio } = useAudio();

const state = ref<GameState>('home');

// Global button click/hover sounds, matching the toxic feel.
const handleGlobalClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest('button')) playSound('click');
};

const handleGlobalMouseOver = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const button = target.closest('button');
  if (button) {
    const related = e.relatedTarget as HTMLElement | null;
    const oldButton = related ? related.closest('button') : null;
    if (button !== oldButton) playSound('hover');
  }
};

// Lazily create the AudioContext on the first user gesture.
const initOnGesture = () => {
  initAudio();
  window.removeEventListener('click', initOnGesture);
  window.removeEventListener('keydown', initOnGesture);
};

onMounted(() => {
  window.addEventListener('click', initOnGesture);
  window.addEventListener('keydown', initOnGesture);
  window.addEventListener('click', handleGlobalClick);
  window.addEventListener('mouseover', handleGlobalMouseOver);
});

onUnmounted(() => {
  window.removeEventListener('click', initOnGesture);
  window.removeEventListener('keydown', initOnGesture);
  window.removeEventListener('click', handleGlobalClick);
  window.removeEventListener('mouseover', handleGlobalMouseOver);
});
</script>

<template>
  <div class="app-container">
    <div class="global-controls">
      <SoundToggle />
      <ThemeToggle />
    </div>

    <main>
      <HomeScreen v-if="state === 'home'" :onStart="() => (state = 'playing')" />
      <QuizScreen v-else :onQuit="() => (state = 'home')" />
    </main>

    <footer class="footer">
      made by <a href="https://httpster.io" target="_blank" class="snazzy-link">httpster.io</a>
    </footer>
  </div>
</template>

<style>
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.global-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 15px;
}

main {
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer {
  position: fixed;
  bottom: 20px;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: var(--font-main);
  font-size: 1.2rem;
  color: var(--text-upcoming);
}

.snazzy-link {
  color: var(--text-main);
  text-decoration: none;
  font-weight: bold;
  display: inline-block;
  padding: 2px 5px;
  -webkit-text-stroke: 1px var(--text-typed-correct);
  text-shadow: 2px 2px 0px var(--shadow-color);
  transition: transform 0.2s;
  animation: snazzy-wiggle 2s infinite ease-in-out;
}

.snazzy-link:hover {
  transform: scale(1.2) rotate(5deg);
  color: var(--cursor-bg);
  -webkit-text-stroke: 1px var(--text-main);
}

@keyframes snazzy-wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
</style>
