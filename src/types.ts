export type Theme = 'light' | 'dark';

export type GameState = 'home' | 'playing';

export type Question = {
  question: string;
  answer: string[]; // accepted answers; answer[0] is canonical (used for hints)
  bank: string;
};

// Outcome of resolving a single question.
export type Resolution = 'first' | 'second' | 'third' | 'skipped';

export type TriviaStats = {
  totalScore: number;
  answered: number; // questions resolved (correct + skipped)
  correct: number;
  firstTry: number;
  secondTry: number;
  thirdTry: number;
  skipped: number;
  wrongGuesses: number; // total wrong submissions across all questions
};
