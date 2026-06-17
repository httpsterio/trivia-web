<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useTrivia } from '../composables/useTrivia';

defineProps<{
  onQuit: () => void;
}>();

const {
  current,
  attemptsUsed,
  triesLeft,
  hintWords,
  wrongGuesses,
  phase,
  lastResult,
  wrongFlash,
  sessionScore,
  maxTries,
  start,
  submit,
  skip,
  next,
} = useTrivia();

const inputValue = ref('');
const inputEl = ref<HTMLInputElement | null>(null);
const shake = ref(false);
let resultShownAt = 0;

// Ignore Enter for this long after the result card appears, so a held/repeated
// Enter from submitting the answer can't instantly skip the card.
const ENTER_GUARD_MS = 500;

const resultText = computed(() => {
  if (!lastResult.value) return '';
  switch (lastResult.value.resolution) {
    case 'first': return 'Correct! 🎉';
    case 'second': return 'Correct!';
    case 'third': return 'Correct!';
    case 'skipped': return 'Skipped';
  }
});

const focusInput = () => nextTick(() => inputEl.value?.focus());

const onSubmit = () => {
  if (phase.value !== 'answering') return;
  submit(inputValue.value);
  inputValue.value = '';
  focusInput();
};

const advance = () => {
  next();
  inputValue.value = '';
  focusInput();
};

// Flash + clear the field on a non-fatal wrong guess.
watch(wrongFlash, () => {
  shake.value = true;
  setTimeout(() => (shake.value = false), 400);
});

// The result card waits for an explicit Enter or Next click — no auto-advance.
watch(phase, (p) => {
  if (p === 'result') resultShownAt = Date.now();
});

// Enter advances off the result card — but not from the same keystroke that
// submitted the answer (key-repeat) or within the guard window.
const onKeydown = (e: KeyboardEvent) => {
  if (phase.value !== 'result' || e.key !== 'Enter' || e.repeat) return;
  e.preventDefault();
  if (Date.now() - resultShownAt < ENTER_GUARD_MS) return;
  advance();
};

onMounted(() => {
  start();
  window.addEventListener('keydown', onKeydown);
  focusInput();
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div class="quiz-screen toxic-border">
    <div class="top-bar">
      <div class="score-box">
        <span class="score-label">Score</span>
        <span class="score-value">{{ sessionScore }}</span>
      </div>
      <div class="meta">
        <span v-if="current" class="bank-tag">{{ current.bank }}</span>
        <div class="tries">
          <span
            v-for="i in maxTries"
            :key="i"
            class="try-dot"
            :class="{ used: i > triesLeft }"
          ></span>
        </div>
      </div>
    </div>

    <div class="question-area">
      <p class="question">{{ current?.question }}</p>

      <div v-if="attemptsUsed > 0 || phase === 'result'" class="hint">
        <span v-for="(word, wi) in hintWords" :key="wi" class="hint-word">
          <span
            v-for="(cell, ci) in word"
            :key="ci"
            class="hint-cell"
            :class="{ filled: cell.revealed }"
          >{{ cell.revealed ? cell.char : '' }}</span>
        </span>
      </div>

      <div v-if="wrongGuesses.length" class="wrong-guesses">
        <span class="wrong-label">tried:</span>
        <span v-for="(g, i) in wrongGuesses" :key="i" class="wrong-chip">{{ g }}</span>
      </div>
    </div>

    <!-- Answering -->
    <form v-if="phase === 'answering'" class="answer-form" @submit.prevent="onSubmit">
      <input
        ref="inputEl"
        v-model="inputValue"
        class="answer-input"
        :class="{ shake }"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="type your answer..."
      />
      <button type="submit" class="submit-btn">Answer</button>
    </form>

    <!-- Result card -->
    <div v-else class="result" :class="lastResult?.resolution">
      <div class="result-head">
        <span class="result-text">{{ resultText }}</span>
        <span
          class="result-points"
          :class="(lastResult?.points ?? 0) >= 0 ? 'pos' : 'neg'"
        >{{ (lastResult?.points ?? 0) >= 0 ? '+' : '' }}{{ lastResult?.points }}</span>
      </div>
      <div class="result-answer">
        <span class="ans-label">answer:</span> {{ lastResult?.answer }}
      </div>
      <button class="next-btn" @click="advance">Next (Enter)</button>
    </div>

    <div class="bottom-controls">
      <button
        class="skip-btn"
        :disabled="phase !== 'answering'"
        @click="skip"
      >Skip (-1)</button>
      <button class="quit-btn" @click="onQuit">Quit</button>
    </div>
  </div>
</template>

<style scoped>
.quiz-screen {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--text-main);
  color: var(--bg-color);
  padding: 5px 18px;
}

.score-label {
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
}

.score-value {
  font-size: 1.6rem;
  font-weight: bold;
}

.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.bank-tag {
  font-size: 0.9rem;
  color: var(--text-upcoming);
}

.tries {
  display: flex;
  gap: 6px;
}

.try-dot {
  width: 16px;
  height: 16px;
  border: 3px solid var(--border-color);
  background: var(--cursor-bg);
}

.try-dot.used {
  background: transparent;
}

.question-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 25px;
  text-align: center;
}

.question {
  font-size: 1.9rem;
  font-weight: bold;
  line-height: 1.4;
  margin: 0;
  color: var(--text-main);
}

.hint {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px; /* prominent space between words */
}

.hint-word {
  display: inline-flex;
  gap: 4px;
}

.hint-cell {
  width: 1.1em;
  font-size: 1.6rem;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  color: var(--text-main);
  border-bottom: 3px solid var(--text-completed);
}

.hint-cell.filled {
  border-bottom-color: var(--text-main);
}

.wrong-guesses {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.wrong-label {
  font-size: 0.9rem;
  color: var(--text-upcoming);
}

.wrong-chip {
  font-size: 0.95rem;
  font-weight: bold;
  padding: 2px 10px;
  color: var(--text-typed-wrong);
  border: 2px solid var(--text-typed-wrong);
  text-decoration: line-through;
}

.answer-form {
  display: flex;
  gap: 12px;
}

.answer-input {
  flex-grow: 1;
  font-family: var(--font-main);
  font-size: 1.4rem;
  font-weight: bold;
  padding: 12px 16px;
  border: 4px solid var(--border-color);
  background: var(--container-bg);
  color: var(--text-main);
  box-shadow: 5px 5px 0px var(--shadow-color);
  outline: none;
}

.answer-input::placeholder {
  color: var(--text-upcoming);
}

.answer-input.shake {
  animation: shake 0.4s;
  border-color: var(--text-typed-wrong);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border: 4px solid var(--border-color);
  background: var(--container-bg);
  box-shadow: 5px 5px 0px var(--shadow-color);
}

.result.skipped {
  border-color: var(--text-typed-wrong);
}

.result-head {
  display: flex;
  align-items: baseline;
  gap: 15px;
}

.result-text {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-main);
}

.result-points {
  font-size: 1.8rem;
  font-weight: bold;
}

.result-points.pos { color: var(--text-main); }
.result-points.neg { color: var(--text-typed-wrong); }

.result-answer {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--text-typed-correct);
}

.ans-label {
  color: var(--text-upcoming);
  font-weight: normal;
}

.bottom-controls {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.skip-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quit-btn {
  background: var(--text-completed);
  border-color: var(--text-completed);
  color: var(--bg-color);
}
</style>
