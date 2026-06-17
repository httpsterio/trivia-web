<script setup lang="ts">
import { computed } from 'vue';
import { useStats } from '../composables/useStats';

defineProps<{
  onStart: () => void;
}>();

const { stats, resetStats } = useStats();

const accuracy = computed(() => {
  const s = stats.value;
  const attempts = s.correct + s.wrongGuesses;
  if (attempts === 0) return '—';
  return Math.round((s.correct / attempts) * 100) + '%';
});

const confirmReset = () => {
  if (confirm('Reset all-time stats?')) resetStats();
};
</script>

<template>
  <div class="home-screen toxic-border">
    <h1 class="title">Trivia</h1>

    <button class="start-btn" @click="onStart">Start Quiz</button>

    <div class="stats">
      <h2>All-time</h2>
      <div class="score-grid">
        <div class="score-item big">
          <span class="label">Total score</span>
          <span class="value">{{ stats.totalScore }}</span>
        </div>
        <div class="score-item big">
          <span class="label">Accuracy</span>
          <span class="value">{{ accuracy }}</span>
        </div>
        <div class="score-item">
          <span class="label">1st try</span>
          <span class="value">{{ stats.firstTry }}</span>
        </div>
        <div class="score-item">
          <span class="label">2nd try</span>
          <span class="value">{{ stats.secondTry }}</span>
        </div>
        <div class="score-item">
          <span class="label">3rd try</span>
          <span class="value">{{ stats.thirdTry }}</span>
        </div>
        <div class="score-item">
          <span class="label">Skipped</span>
          <span class="value">{{ stats.skipped }}</span>
        </div>
        <div class="score-item">
          <span class="label">Correct</span>
          <span class="value">{{ stats.correct }}</span>
        </div>
        <div class="score-item">
          <span class="label">Wrong guesses</span>
          <span class="value">{{ stats.wrongGuesses }}</span>
        </div>
      </div>
      <button v-if="stats.answered > 0" class="reset-btn" @click="confirmReset">
        Reset stats
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-screen {
  display: flex;
  flex-direction: column;
  gap: 25px;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.title {
  font-size: 4rem;
  margin: 0;
  color: var(--text-main);
  animation: wiggle 1s infinite ease-in-out;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

.start-btn {
  font-size: 1.6rem;
  padding: 15px 40px;
}

.stats {
  width: 100%;
}

.score-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 2px dashed var(--text-completed);
}

.score-item.big {
  border-style: solid;
  border-color: var(--text-main);
}

.label {
  font-size: 0.9rem;
  color: var(--text-upcoming);
}

.value {
  font-size: 1.4rem;
  font-weight: bold;
}

.reset-btn {
  width: 100%;
  margin-top: 20px;
  background: var(--text-completed);
  color: var(--bg-color);
  border-color: var(--text-completed);
}
</style>
