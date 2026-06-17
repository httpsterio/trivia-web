# Trivia (single-player web)

A single-player web version of the IRC trivia bot, built with Vue 3 + Vite +
TypeScript and reusing the visual theme from the `toxic` project.

## How it works

- One endless, shuffled pool drawn from all **loaded** (non-hidden) question
  banks in the sibling `../trivia/questions` repo.
- **3 tries** per question:
  - correct on the 1st try → **5 points**
  - correct on the 2nd try → **3 points**
  - correct on the 3rd try → **1 point**
  - all 3 wrong, or you hit Skip → **−1 point**, answer revealed.
- Each wrong guess reveals more of the answer, outside-in (first letter, last
  letter, second, second-last, …) — the same scheme as the bot's easy mode.
  The reveal is capped so **at least 50% of the answer stays hidden through two
  guesses**, and very short answers reveal little or nothing.
- All-time stats (total score, accuracy, 1st/2nd/3rd-try tallies, skips, wrong
  guesses) are kept in `localStorage`.

## Develop

```sh
npm install
npm run dev      # regenerates questions, then starts Vite on :5173
```

## Questions

Question data is generated from the TOML banks into
`src/data/questions.generated.ts` (git-ignored) by:

```sh
npm run questions
```

This runs automatically before `dev` and `build`. Configuration via env vars:

- `QUESTIONS_DIR` — path to the banks (default: `../trivia/questions`).
- `INCLUDE_HIDDEN=1` — also bundle banks marked `hidden = true`
  (e.g. Capitals, Periodic Table, Overwatch, Final Fantasy).
