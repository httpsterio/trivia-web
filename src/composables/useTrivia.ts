import { ref, computed } from 'vue';
import type { Question, Resolution } from '../types';
import { questions as allQuestions } from '../data/questions.generated';
import { useStats, pointsFor } from './useStats';
import { useAudio } from './useAudio';

export const MAX_TRIES = 3;

// Build a reveal order over the non-space characters of `answer` that spreads
// revealed letters evenly across the whole word instead of clustering at the
// ends: reveal the middle first, then the quarter points, then eighths, etc.
// (recursive midpoint subdivision). At any prefix the revealed letters stay
// roughly evenly distributed.
function getRevealOrder(answer: string): number[] {
  const indices: number[] = [];
  for (let i = 0; i < answer.length; i++) {
    if (answer[i] !== ' ') indices.push(i);
  }
  const order: number[] = [];
  const queue: [number, number][] = [[0, indices.length - 1]];
  while (queue.length) {
    const [lo, hi] = queue.shift()!;
    if (lo > hi) continue;
    const mid = Math.floor((lo + hi) / 2);
    order.push(indices[mid]);
    queue.push([lo, mid - 1]);
    queue.push([mid + 1, hi]);
  }
  return order;
}

// How many characters of the answer to reveal after `wrongCount` wrong guesses.
// Guarantees at least 50% stays hidden through two guesses (and short answers
// reveal little to nothing).
function revealTargetFor(wrongCount: number, letterCount: number): number {
  if (wrongCount <= 0) return 0;
  if (wrongCount === 1) return Math.floor(letterCount / 4);
  return Math.floor(letterCount / 2);
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function useTrivia() {
  const { recordResolution } = useStats();
  const { playSound } = useAudio();

  let pool: Question[] = [];
  let poolIndex = 0;

  const current = ref<Question | null>(null);
  const attemptsUsed = ref(0); // wrong guesses on the current question
  const revealed = ref<Set<number>>(new Set());
  const wrongGuesses = ref<string[]>([]); // raw wrong answers typed this question
  const phase = ref<'answering' | 'result'>('answering');
  const lastResult = ref<{ resolution: Resolution; points: number; answer: string } | null>(null);
  const wrongFlash = ref(0); // bumps on each non-fatal wrong guess (UI shake/clear)
  const sessionScore = ref(0);

  const triesLeft = computed(() => MAX_TRIES - attemptsUsed.value);

  // The canonical answer used for hints/reveals.
  const canonical = computed(() => current.value?.answer[0] ?? '');

  // Hint grouped into words so it can wrap onto multiple lines for long
  // answers. Each cell is a character plus whether it's currently revealed.
  const hintWords = computed(() => {
    const ans = canonical.value;
    const words: { char: string; revealed: boolean }[][] = [];
    let cur: { char: string; revealed: boolean }[] = [];
    for (let i = 0; i < ans.length; i++) {
      if (ans[i] === ' ') {
        if (cur.length) words.push(cur);
        cur = [];
      } else {
        cur.push({ char: ans[i], revealed: revealed.value.has(i) });
      }
    }
    if (cur.length) words.push(cur);
    return words;
  });

  function drawNext(): Question | null {
    if (allQuestions.length === 0) return null;
    if (pool.length === 0 || poolIndex >= pool.length) {
      pool = shuffle(allQuestions);
      poolIndex = 0;
    }
    return pool[poolIndex++];
  }

  function loadQuestion() {
    current.value = drawNext();
    attemptsUsed.value = 0;
    revealed.value = new Set();
    wrongGuesses.value = [];
    phase.value = 'answering';
    lastResult.value = null;
  }

  function start() {
    sessionScore.value = 0;
    pool = shuffle(allQuestions);
    poolIndex = 0;
    loadQuestion();
  }

  function applyReveal() {
    const order = getRevealOrder(canonical.value);
    const target = revealTargetFor(attemptsUsed.value, order.length);
    const next = new Set(revealed.value);
    for (let i = 0; i < target && i < order.length; i++) next.add(order[i]);
    revealed.value = next;
  }

  function resolve(resolution: Resolution) {
    const points = pointsFor(resolution);
    sessionScore.value += points;
    recordResolution(resolution, attemptsUsed.value);
    // Reveal the full answer on the result card.
    revealed.value = new Set(canonical.value.split('').map((_, i) => i));
    lastResult.value = { resolution, points, answer: canonical.value };
    phase.value = 'result';
  }

  // Submit a typed answer. Returns true if it was correct.
  function submit(raw: string): boolean {
    if (phase.value !== 'answering' || !current.value) return false;
    const guess = normalize(raw);
    if (!guess) return false;

    const accepted = current.value.answer.map(normalize);
    if (accepted.includes(guess)) {
      const resolution: Resolution = ['first', 'second', 'third'][attemptsUsed.value] as Resolution;
      playSound(resolution === 'first' ? 'victory' : 'correct');
      resolve(resolution);
      return true;
    }

    wrongGuesses.value = [...wrongGuesses.value, raw.trim()];
    attemptsUsed.value += 1;
    if (attemptsUsed.value >= MAX_TRIES) {
      playSound('error');
      resolve('skipped');
    } else {
      playSound('error');
      applyReveal();
      wrongFlash.value += 1;
    }
    return false;
  }

  // Give up on the current question.
  function skip() {
    if (phase.value !== 'answering' || !current.value) return;
    playSound('error');
    resolve('skipped');
  }

  // Advance from the result card to the next question.
  function next() {
    loadQuestion();
  }

  return {
    current,
    attemptsUsed,
    triesLeft,
    hintWords,
    wrongGuesses,
    phase,
    lastResult,
    wrongFlash,
    sessionScore,
    maxTries: MAX_TRIES,
    start,
    submit,
    skip,
    next,
  };
}
