# Phoneme Word Games

A frontend tool for Speech Pathology teachers to generate phoneme-based word games for students, built with Next.js (App Router), TypeScript, and Tailwind CSS.

Submission for **2026-CSE3CWA — Assessment 1**. This assessment covers the frontend only; a future assessment will connect it to a word/phoneme database backend and deploy it to the cloud. For now, the app uses a supplied list of 90 English word/phoneme pairs, transcribed using the Harrington, Cox, and Evans (HCE) system for the 43 core phonemes of Australian English.

## What it does

Two game types can be configured, previewed, and exported as **standalone, self-contained `.html` files** that run with no server or dependencies:

- **Phoneme Wordle** — students guess a word spelled out in phonemes, Wordle-style, with configurable word list and number of guesses.
- **Phoneme Word Search** — students find the phonetic spelling of English words hidden in a grid, with configurable grid size (8×8 to 15×15) and word list.

Each generator lets you pick or randomise words from the master list, preview the fully playable game in-browser (with the same look, feel, and animations as the exported file), and then download a ready-to-share `.html` puzzle.

## Key features

- **Config + Preview panels** for each game, with a shared phoneme keypad/search component for building word lists.
- **Fully playable previews** — Wordle supports guessing, hard mode, and a solution reveal; Word Search supports click-and-drag selection, hints, and a win animation.
- **Standalone HTML export** — self-contained vanilla JS/CSS files with no external dependencies, including Dark Theme and High Contrast toggles that default to the browser's preferences. The Word Search export can also generate unlimited new random puzzles after the first.
- **Light/Dark theme and High Contrast mode**, applied consistently across the app and both exports.
- **Cookie-based persistence** — selected words, game progress, scroll position, and settings are restored when navigating away and back.
- **Accessible phoneme reference** — hover tooltips with example words for every phoneme symbol, and a read-only keypad reference on the Word Search screen, grouped by consonants, short/long vowels, and diphthongs/schwa.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + [React](https://react.dev/)
- TypeScript
- Tailwind CSS v4

## Project structure

```
app/                  Route entry (single-page app with tab-based navigation)
components/
  wordle/             Phoneme Wordle builder, grid, title, solution reveal
  wordsearch/         Phoneme Word Search builder, grid, title, keypad reference
  shared/             Shared UI: phoneme keypad, word selector, toggles, stepper
lib/                  Game logic, phoneme data, cookie storage, standalone HTML exporters
context/              Theme (dark/high-contrast) context
```

## Sample exports

Two pre-generated standalone game files are included alongside this README so you can try the exported output directly, without running the app:

- `phoneme_wordle_SAMPLE.html` — a sample Phoneme Wordle game
- `word_search_SAMPLE.html` — a sample Phoneme Word Search game

Both are fully self-contained — just open either file directly in a browser, no server or install required.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Author

Adam Ashmore — Student Number: 22670379
