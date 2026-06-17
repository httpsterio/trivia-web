import { ref } from 'vue';
import type { TriviaStats, Resolution } from '../types';

const STORAGE_KEY = 'trivia:stats';

const POINTS: Record<Resolution, number> = {
  first: 5,
  second: 3,
  third: 1,
  skipped: -1,
};

function emptyStats(): TriviaStats {
  return {
    totalScore: 0,
    answered: 0,
    correct: 0,
    firstTry: 0,
    secondTry: 0,
    thirdTry: 0,
    skipped: 0,
    wrongGuesses: 0,
  };
}

// Lifetime stats persisted to localStorage, shared across the app.
const stats = ref<TriviaStats>(loadStats());

function loadStats(): TriviaStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...emptyStats(), ...JSON.parse(stored) };
  } catch (e) {
    console.error('Failed to load trivia stats', e);
  }
  return emptyStats();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats.value));
  } catch (e) {
    console.error('Failed to save trivia stats', e);
  }
}

export function pointsFor(resolution: Resolution): number {
  return POINTS[resolution];
}

export function useStats() {
  // Record a resolved question. `wrongGuesses` is the number of wrong
  // submissions made on it (used purely for the running wrong tally).
  const recordResolution = (resolution: Resolution, wrongGuesses: number) => {
    const s = stats.value;
    s.totalScore += POINTS[resolution];
    s.answered += 1;
    s.wrongGuesses += wrongGuesses;
    if (resolution === 'skipped') {
      s.skipped += 1;
    } else {
      s.correct += 1;
      if (resolution === 'first') s.firstTry += 1;
      else if (resolution === 'second') s.secondTry += 1;
      else s.thirdTry += 1;
    }
    persist();
  };

  const resetStats = () => {
    stats.value = emptyStats();
    persist();
  };

  return { stats, recordResolution, resetStats };
}
