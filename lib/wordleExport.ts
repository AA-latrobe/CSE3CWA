import { PhonemeWordEntry, KEYPAD_TOP, KEYPAD_BOTTOM, PREVIEW_TITLE_PHONEMES } from './phonemeData';

function formatTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(
    d.getMinutes()
  )}${pad(d.getSeconds())}`;
}

export function downloadStandaloneWordleHtml(words: PhonemeWordEntry[], numGuesses: number) {
  const html = generateStandaloneWordleHtml(words, numGuesses);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `word_puzzle_${formatTimestamp()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateStandaloneWordleHtml(words: PhonemeWordEntry[], numGuesses: number): string {
  const wordDataJson = JSON.stringify(words);
  const keypadTopJson = JSON.stringify(KEYPAD_TOP);
  const keypadBottomJson = JSON.stringify(KEYPAD_BOTTOM);
  const titlePhonemesJson = JSON.stringify(PREVIEW_TITLE_PHONEMES);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Phoneme Wordle</title>
<style>
:root {
  --background: #ffffff;
  --foreground: #171717;
  --accent: #6aaa64;
  --key: #d3d6da;
  --key-foreground: #1a1a1a;
  --key-used: #86888a;
  --key-used-foreground: #ffffff;
  --match: #6aaa64;
  --match-foreground: #ffffff;
  --partial: #c9b458;
  --partial-foreground: #ffffff;
  --word-reveal: #a8dced;
  --word-reveal-foreground: #111111;
  --page-background: #f3f4f6;
}
.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
  --accent: #538d4e;
  --key: #565758;
  --key-foreground: #f0f0f0;
  --key-used: #2b2b2c;
  --key-used-foreground: #a0a0a0;
  --match: #538d4e;
  --match-foreground: #ffffff;
  --partial: #b59f3b;
  --partial-foreground: #ffffff;
  --page-background: #000000;
}
.high-contrast {
  --match: #f5793a;
  --match-foreground: #111111;
  --partial: #85c0f9;
  --partial-foreground: #111111;
  --accent: #f5793a;
  --word-reveal: #b980f0;
  --word-reveal-foreground: #111111;
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
}
body {
  background: var(--page-background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
.panel {
  max-width: 1000px;
  margin: 2rem auto;
  background: var(--background);
  border: 1px solid rgba(128,128,128,0.15);
  border-radius: 0.5rem;
  padding: 1.5rem;
}
.title-row {
  display:flex; justify-content:center; gap:8px; margin-bottom: 44px;
  /* Matches the height the Preview panel's "Preview" heading row (text +
     mb-6) would occupy if it were present but invisible — keeps the
     title's vertical position consistent between the live Preview and
     this exported page. */
  margin-top: 52px;
}
.title-tile {
  width:64px; height:64px; border-radius:0.375rem; display:flex; align-items:center; justify-content:center;
  font-size:1.875rem; font-weight:600; border:2px solid rgba(128,128,128,0.2); color: var(--foreground);
  perspective: 400px;
}
.subtitle { text-align:center; color: rgba(128,128,128,0.9); font-size:1.125rem; margin: 0 0 44px 0; }
.export-footer { text-align:center; padding: 16px; font-size:0.875rem; color: rgba(128,128,128,0.8); }
.legend { display:flex; align-items:center; justify-content:center; gap:8px; font-size:0.875rem; color: rgba(128,128,128,0.9); margin: 0 0 44px 0; }
.legend-swatch { width:28px; height:28px; border-radius:0.25rem; }
.legend-sep { margin: 0 8px; color: rgba(128,128,128,0.5); }
.game-row { display:flex; gap:24px; flex-wrap: wrap; }
.controls-col { width:176px; flex-shrink:0; display:flex; flex-direction:column; gap:12px; }
.control-box { border:1px solid rgba(128,128,128,0.15); border-radius:0.375rem; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.solution-label { font-size:0.875rem; font-weight:500; margin-bottom:8px; }
.solution-row { display:flex; gap:4px; }
.solution-tile { width:32px; height:32px; border-radius:0.375rem; display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:600; border:1px solid rgba(128,128,128,0.2); perspective:400px; }
.solution-word-box { margin-top:8px; height:36px; border-radius:0.375rem; display:flex; align-items:center; justify-content:center; font-size:1.125rem; font-weight:600; border:1px solid rgba(128,128,128,0.2); perspective:400px; }
.solution-message { margin-top:8px; height:24px; text-align:center; font-size:0.875rem; font-weight:700; }
.stats-box { border:1px solid rgba(128,128,128,0.15); border-radius:0.375rem; padding:8px 12px; font-size:0.875rem; }
.stats-box p { margin: 2px 0; }
button.action {
  border-radius:0.375rem; padding:6px 12px; font-size:0.875rem; font-weight:500; cursor:pointer; border:none;
  background: var(--accent); color: white;
}
button.action:disabled { opacity:0.4; cursor:not-allowed; }
button.action.action-blue {
  background: var(--word-reveal);
  color: var(--word-reveal-foreground);
}
.switch { position:relative; width:44px; height:24px; flex-shrink:0; }
.switch input { opacity:0; width:0; height:0; }
.slider { position:absolute; inset:0; background: rgba(128,128,128,0.3); border-radius:999px; cursor:pointer; transition:.2s; }
.slider:before { content:""; position:absolute; height:18px; width:18px; left:3px; top:3px; background:white; border-radius:50%; transition:.2s; }
input:checked + .slider { background: var(--accent); }
input:checked + .slider:before { transform: translateX(20px); }
.guess-rows-col { display:flex; flex-direction:column; align-items:center; border-left:1px solid rgba(128,128,128,0.15); padding-left:32px; width:256px; }
.guess-row { display:flex; gap:4px; margin-bottom:4px; justify-content:center; }
.guess-tile { width:48px; height:48px; border-radius:0.375rem; display:flex; align-items:center; justify-content:center; font-size:1.25rem; font-weight:600; border:2px solid rgba(128,128,128,0.2); color: var(--foreground); perspective:400px; }
.keypad-col { flex:1; min-width:0; padding-left:32px; }
.keypad-grids { display:flex; gap:16px; flex-wrap:wrap; justify-content:center; }
.keypad-grid { display:grid; grid-template-columns: repeat(4, 40px); gap:4px; }
.key {
  width:40px; height:40px; border-radius:0.375rem; border:none; font-size:1rem; font-weight:500; cursor:pointer;
  background: var(--key); color: var(--key-foreground);
}
.key:disabled { opacity:0.4; cursor:not-allowed; }
.key.used { background: var(--key-used); color: var(--key-used-foreground); }
.key.green { background: var(--match); color: var(--match-foreground); }
.key.yellow { background: var(--partial); color: var(--partial-foreground); }
.enter-btn, .backspace-btn { width:100%; border-radius:0.375rem; padding:8px 12px; font-size:0.875rem; font-weight:500; border:none; cursor:pointer; margin-top:12px; }
.enter-btn { background: var(--match); color: var(--match-foreground); }
.backspace-btn { background: var(--partial); color: var(--partial-foreground); }
.enter-btn:disabled, .backspace-btn:disabled { opacity:0.4; cursor:not-allowed; }
.tile-green { background: var(--match); color: var(--match-foreground); border-color: transparent; }
.tile-yellow { background: var(--partial); color: var(--partial-foreground); border-color: transparent; }
.tile-grey { background: var(--key); color: var(--key-foreground); border-color: transparent; }
.tile-flip { animation: flip 0.5s ease-in-out; }
@keyframes flip { 0% { transform: rotateX(0deg); } 50% { transform: rotateX(90deg); } 100% { transform: rotateX(0deg); } }
.hardmode-error {
  margin-top: 12px;
  font-size: 0.875rem;
  color: #f59e0b;
  text-align: center;
  min-height: 1.25rem;
}
@media (max-width: 700px) {
  .game-row { flex-direction: column; }
  .guess-rows-col { border-left:none; border-top:1px solid rgba(128,128,128,0.15); padding-left:0; padding-top:16px; }
  .keypad-col { padding-left:0; }
  .keypad-grids { flex-direction: column; align-items:center; }
}
</style>
</head>
<body>
<div class="panel">
  <div class="title-row" id="titleRow"></div>
  <p class="subtitle">A Phoneme Word Guessing Game</p>
  <div class="legend">
    <div class="legend-swatch" style="background: var(--match);"></div>
    <span>= Correct position</span>
    <span class="legend-sep">|</span>
    <div class="legend-swatch" style="background: var(--partial);"></div>
    <span>= In the word, but wrong position</span>
  </div>
  <div class="game-row">
    <div class="controls-col">
      <div>
        <p class="solution-label">Solution:</p>
        <div class="solution-row" id="solutionRow"></div>
        <div class="solution-word-box" id="solutionWordBox"></div>
        <p class="solution-message" id="solutionMessage"></p>
      </div>
      <div class="control-box">
        <span>Hard Mode</span>
        <label class="switch"><input type="checkbox" id="hardModeToggle"><span class="slider"></span></label>
      </div>
      <div class="control-box">
        <span>Dark Theme</span>
        <label class="switch"><input type="checkbox" id="darkThemeToggle"><span class="slider"></span></label>
      </div>
      <div class="control-box">
        <span>High Contrast</span>
        <label class="switch"><input type="checkbox" id="highContrastToggle"><span class="slider"></span></label>
      </div>
      <div class="stats-box" id="statsBox"></div>
      <button class="action" id="playNextBtn" style="width:100%">Play Next Word</button>
    </div>
    <div class="guess-rows-col">
      <div id="guessRowsCol"></div>
      <p class="hardmode-error" id="hardModeError"></p>
    </div>
    <div class="keypad-col">
      <div class="keypad-grids">
        <div>
          <div class="keypad-grid" id="keypadTop"></div>
          <button class="enter-btn" id="enterBtn">&#9166; Enter</button>
        </div>
        <div>
          <div class="keypad-grid" id="keypadBottom"></div>
          <button class="backspace-btn" id="backspaceBtn">&#9003; Backspace</button>
        </div>
      </div>
    </div>
  </div>
</div>

<p class="export-footer">Adam Ashmore — Student Number: 22670379</p>

<script>
(function () {
  var WORD_DATA = ${wordDataJson};
  var NUM_GUESSES = ${numGuesses};
  var KEYPAD_TOP = ${keypadTopJson};
  var KEYPAD_BOTTOM = ${keypadBottomJson};
  var TITLE_PHONEMES = ${titlePhonemesJson};
  var FLIP_MS = 500, STAGGER_MS = 150;
  var POST_REVEAL_HOLD_MS = 1000; // extra pause before Play Next Word/Start Over re-enables

  // ---------- theme ----------
  function loadTheme() {
    var dark = localStorage.getItem('wordle_export_dark');
    var hc = localStorage.getItem('wordle_export_hc');
    if (dark === null) dark = window.matchMedia('(prefers-color-scheme: dark)').matches ? '1' : '0';
    if (hc === null) hc = '0';
    return { dark: dark === '1', hc: hc === '1' };
  }
  function applyTheme(state) {
    document.documentElement.classList.toggle('dark', state.dark);
    document.documentElement.classList.toggle('high-contrast', state.hc);
    localStorage.setItem('wordle_export_dark', state.dark ? '1' : '0');
    localStorage.setItem('wordle_export_hc', state.hc ? '1' : '0');
  }
  var themeState = loadTheme();
  applyTheme(themeState);

  var darkToggle = document.getElementById('darkThemeToggle');
  var hcToggle = document.getElementById('highContrastToggle');
  darkToggle.checked = themeState.dark;
  hcToggle.checked = themeState.hc;
  darkToggle.addEventListener('change', function () { themeState.dark = darkToggle.checked; applyTheme(themeState); });
  hcToggle.addEventListener('change', function () { themeState.hc = hcToggle.checked; applyTheme(themeState); });

  // ---------- inline Hard Mode error (same placement as the Preview panel) ----------
  function showHardModeError(message) {
    document.getElementById('hardModeError').textContent = message;
  }
  function clearHardModeError() {
    document.getElementById('hardModeError').textContent = '';
  }

  // ---------- game logic ----------
  function computeColors(guess, target) {
    var colors = guess.map(function () { return 'grey'; });
    var remaining = {};
    target.forEach(function (s, i) {
      if (guess[i] === s) colors[i] = 'green';
      else remaining[s] = (remaining[s] || 0) + 1;
    });
    guess.forEach(function (s, i) {
      if (colors[i] === 'green') return;
      if (remaining[s] > 0) { colors[i] = 'yellow'; remaining[s]--; }
    });
    return colors;
  }
  function computeKeypadColors(guesses) {
    var priority = { grey: 0, yellow: 1, green: 2 };
    var best = {};
    guesses.forEach(function (g) {
      g.symbols.forEach(function (s, i) {
        var c = g.colors[i];
        if (!best[s] || priority[c] > priority[best[s]]) best[s] = c;
      });
    });
    return best;
  }
  function computeHardModeConstraints(guesses) {
    var greenPositions = {}, minCounts = {};
    guesses.forEach(function (g) {
      var counts = {};
      g.symbols.forEach(function (s, i) {
        var c = g.colors[i];
        if (c === 'green') greenPositions[i] = s;
        if (c === 'green' || c === 'yellow') counts[s] = (counts[s] || 0) + 1;
      });
      Object.keys(counts).forEach(function (s) {
        minCounts[s] = Math.max(minCounts[s] || 0, counts[s]);
      });
    });
    return { greenPositions: greenPositions, minCounts: minCounts };
  }
  function validateHardMode(guess, c) {
    for (var idx in c.greenPositions) {
      if (guess[idx] !== c.greenPositions[idx]) return 'Hard Mode: position ' + (Number(idx) + 1) + ' must be "' + c.greenPositions[idx] + '"';
    }
    var counts = {};
    guess.forEach(function (s) { counts[s] = (counts[s] || 0) + 1; });
    for (var s in c.minCounts) {
      if ((counts[s] || 0) < c.minCounts[s]) return 'Hard Mode: guess must include "' + s + '"';
    }
    return null;
  }
  function completionMessage(solved, used, total) {
    if (!solved) return 'Maybe next time!';
    switch (used) {
      case 1: return 'Genius!';
      case 2: return 'Magnificent!';
      case 3: return 'Impressive!';
      case 4: return 'Splendid!';
      case 5: return 'Great!';
      default: return used === total ? 'Phew!' : 'Great!';
    }
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------- state ----------
  var words = WORD_DATA.slice();
  var currentWordIndex = 0;
  var solvedCount = 0, failedCount = 0;
  var currentGuess = [];
  var submittedGuesses = [];
  var hardMode = false;
  var solutionRevealed = false;
  var revealAnimationComplete = true; // true when idle/no game-over reveal pending

  function currentWord() { return words[currentWordIndex]; }
  function wordSize() { return currentWord().phonemes.length; }
  function isLastWord() { return currentWordIndex >= words.length - 1; }
  function gameStatus() {
    var solved = submittedGuesses.length > 0 && submittedGuesses[submittedGuesses.length - 1].colors.every(function (c) { return c === 'green'; });
    var outOfGuesses = submittedGuesses.length >= NUM_GUESSES;
    return { solved: solved, gameOver: solved || outOfGuesses };
  }

  // ---------- title ----------
  function renderTitleEmpty() {
    var row = document.getElementById('titleRow');
    row.innerHTML = '';
    TITLE_PHONEMES.forEach(function () {
      var tile = document.createElement('div');
      tile.className = 'title-tile';
      row.appendChild(tile);
    });
  }
  function animateTitleReveal() {
    var row = document.getElementById('titleRow');
    var palette = shuffle(['green', 'yellow', 'grey', 'grey', 'grey']);
    TITLE_PHONEMES.forEach(function (symbol, i) {
      var tile = row.children[i];
      var delay = i * STAGGER_MS;
      setTimeout(function () { tile.classList.add('tile-flip'); }, delay);
      setTimeout(function () {
        tile.classList.add('tile-' + palette[i]);
        tile.textContent = symbol;
      }, delay + FLIP_MS / 2);
      setTimeout(function () { tile.classList.remove('tile-flip'); }, delay + FLIP_MS);
    });
  }

  function renderKeypadGrids() {
    var letterColors = computeKeypadColors(submittedGuesses);
    function build(container, grid) {
      container.innerHTML = '';
      grid.forEach(function (row) {
        row.forEach(function (symbol) {
          if (!symbol) {
            var spacer = document.createElement('div');
            container.appendChild(spacer);
            return;
          }
          var btn = document.createElement('button');
          btn.className = 'key';
          btn.textContent = symbol;
          btn.title = '/' + symbol + '/';
          var c = letterColors[symbol];
          if (c === 'green') btn.classList.add('green');
          else if (c === 'yellow') btn.classList.add('yellow');
          else if (c === 'grey') btn.classList.add('used');
          btn.addEventListener('click', function () { handleSelect(symbol); });
          container.appendChild(btn);
        });
      });
    }
    build(document.getElementById('keypadTop'), KEYPAD_TOP);
    build(document.getElementById('keypadBottom'), KEYPAD_BOTTOM);
  }

  function renderGuessRows(justSubmittedIndex) {
    var col = document.getElementById('guessRowsCol');
    col.innerHTML = '';
    for (var r = 0; r < NUM_GUESSES; r++) {
      var row = document.createElement('div');
      row.className = 'guess-row';
      var submitted = submittedGuesses[r];
      var isCurrent = r === submittedGuesses.length;
      var symbols = submitted ? submitted.symbols : (isCurrent ? currentGuess : []);
      var colors = submitted ? submitted.colors : null;
      for (var i = 0; i < wordSize(); i++) {
        var tile = document.createElement('div');
        tile.className = 'guess-tile';
        tile.textContent = symbols[i] || '';
        if (colors && r !== justSubmittedIndex) tile.classList.add('tile-' + colors[i]);
        row.appendChild(tile);
      }
      col.appendChild(row);
    }
    if (justSubmittedIndex !== undefined && submittedGuesses[justSubmittedIndex]) {
      animateRowFlip(col.children[justSubmittedIndex], submittedGuesses[justSubmittedIndex].colors);
    }
  }

  function animateRowFlip(rowEl, colors) {
    colors.forEach(function (color, i) {
      var tile = rowEl.children[i];
      var delay = i * STAGGER_MS;
      setTimeout(function () { tile.classList.add('tile-flip'); }, delay);
      setTimeout(function () { tile.classList.add('tile-' + color); }, delay + FLIP_MS / 2);
      setTimeout(function () { tile.classList.remove('tile-flip'); }, delay + FLIP_MS);
    });
  }

  // ---------- solution ----------
  function renderSolutionEmpty() {
    var row = document.getElementById('solutionRow');
    var wordBox = document.getElementById('solutionWordBox');
    var msgEl = document.getElementById('solutionMessage');
    row.innerHTML = '';
    currentWord().phonemes.forEach(function () {
      var tile = document.createElement('div');
      tile.className = 'solution-tile';
      row.appendChild(tile);
    });
    wordBox.textContent = '';
    wordBox.style.background = 'transparent';
    wordBox.style.color = 'var(--foreground)';
    msgEl.textContent = '';
  }
  function animateSolutionReveal() {
    var row = document.getElementById('solutionRow');
    var wordBox = document.getElementById('solutionWordBox');
    var msgEl = document.getElementById('solutionMessage');
    var phonemes = currentWord().phonemes;
    var phonemesEnd = (phonemes.length - 1) * STAGGER_MS + FLIP_MS;

    phonemes.forEach(function (symbol, i) {
      var tile = row.children[i];
      var delay = i * STAGGER_MS;
      setTimeout(function () { tile.classList.add('tile-flip'); }, delay);
      setTimeout(function () {
        tile.classList.add('tile-green');
        tile.textContent = symbol;
      }, delay + FLIP_MS / 2);
      setTimeout(function () { tile.classList.remove('tile-flip'); }, delay + FLIP_MS);
    });

    setTimeout(function () { wordBox.classList.add('tile-flip'); }, phonemesEnd);
    setTimeout(function () {
      wordBox.textContent = currentWord().word;
      wordBox.style.background = 'var(--word-reveal)';
      wordBox.style.color = 'var(--word-reveal-foreground)';
    }, phonemesEnd + FLIP_MS / 2);
    setTimeout(function () {
      wordBox.classList.remove('tile-flip');
      var status = gameStatus();
      msgEl.textContent = completionMessage(status.solved, submittedGuesses.length, NUM_GUESSES);
    }, phonemesEnd + FLIP_MS);
  }

  function renderStats() {
    var box = document.getElementById('statsBox');
    box.innerHTML = '<p>Word: ' + (currentWordIndex + 1) + '/' + words.length + '</p>' +
      '<p>Solved: ' + solvedCount + '</p>' + '<p>Failed: ' + failedCount + '</p>';
  }

  function updatePlayNextButton() {
    var btn = document.getElementById('playNextBtn');
    var last = isLastWord();
    btn.textContent = last ? 'Start Over!' : 'Play Next Word';
    var status = gameStatus();
    btn.disabled = !status.gameOver || !revealAnimationComplete;
    btn.classList.toggle('action-blue', last);
  }

  function updateEnterBackspace() {
    var status = gameStatus();
    var active = !status.gameOver;
    document.getElementById('enterBtn').disabled = !active || currentGuess.length !== wordSize();
    document.getElementById('backspaceBtn').disabled = !active;
  }

  function updateHardModeToggle() {
    document.getElementById('hardModeToggle').disabled = submittedGuesses.length > 0;
  }

  function renderAll(justSubmittedIndex) {
    renderGuessRows(justSubmittedIndex);
    renderKeypadGrids();
    renderStats();
    updatePlayNextButton();
    updateEnterBackspace();
    updateHardModeToggle();
  }

  function scheduleReveal() {
    if (solutionRevealed) return;
    var status = gameStatus();
    if (!status.gameOver) return;

    revealAnimationComplete = false;
    updatePlayNextButton(); // lock the button immediately, before the delay even starts

    var rowFlip = (wordSize() - 1) * STAGGER_MS + FLIP_MS;

    setTimeout(function () {
      solutionRevealed = true;
      animateSolutionReveal();
    }, rowFlip + 1000);

    // animateSolutionReveal's own final stage (word box flip) completes at
    // phonemesEnd + FLIP_MS relative to when it starts (rowFlip + 1000).
    // Add POST_REVEAL_HOLD_MS on top so the button stays locked a little
    // longer after the animation visually finishes, not the instant it ends.
    var phonemesEnd = (wordSize() - 1) * STAGGER_MS + FLIP_MS;
    var totalRevealDuration = phonemesEnd + FLIP_MS;

    setTimeout(function () {
      revealAnimationComplete = true;
      updatePlayNextButton();
    }, rowFlip + 1000 + totalRevealDuration + POST_REVEAL_HOLD_MS);
  }

  // ---------- handlers ----------
  function handleSelect(symbol) {
    var status = gameStatus();
    if (status.gameOver) return;
    if (currentGuess.length >= wordSize()) return;
    clearHardModeError();
    currentGuess.push(symbol);
    renderGuessRows();
    updateEnterBackspace();
  }
  function handleBackspace() {
    var status = gameStatus();
    if (status.gameOver) return;
    if (currentGuess.length === 0) return;
    clearHardModeError();
    currentGuess.pop();
    renderGuessRows();
    updateEnterBackspace();
  }
  function handleEnter() {
    var status = gameStatus();
    if (status.gameOver || currentGuess.length !== wordSize()) return;
    if (hardMode) {
      var constraints = computeHardModeConstraints(submittedGuesses);
      var err = validateHardMode(currentGuess, constraints);
      if (err) { showHardModeError(err); return; }
    }
    var colors = computeColors(currentGuess, currentWord().phonemes);
    submittedGuesses.push({ symbols: currentGuess, colors: colors });
    var justIndex = submittedGuesses.length - 1;
    currentGuess = [];
    renderAll(justIndex);
    var newStatus = gameStatus();
    if (newStatus.gameOver) {
      if (newStatus.solved) solvedCount++; else failedCount++;
      renderStats();
      updatePlayNextButton();
      scheduleReveal();
    }
  }
  function handlePlayNext() {
    var status = gameStatus();
    if (!status.gameOver || !revealAnimationComplete) return;
    if (isLastWord()) {
      words = shuffle(words);
      currentWordIndex = 0;
      solvedCount = 0;
      failedCount = 0;
    } else {
      currentWordIndex++;
    }
    currentGuess = [];
    submittedGuesses = [];
    solutionRevealed = false;
    revealAnimationComplete = true;
    clearHardModeError();
    renderSolutionEmpty();
    renderAll();
  }

  document.getElementById('enterBtn').addEventListener('click', handleEnter);
  document.getElementById('backspaceBtn').addEventListener('click', handleBackspace);
  document.getElementById('playNextBtn').addEventListener('click', handlePlayNext);
  document.getElementById('hardModeToggle').addEventListener('change', function (e) {
    hardMode = e.target.checked;
  });

  renderTitleEmpty();
  renderSolutionEmpty();
  renderAll();
  setTimeout(animateTitleReveal, 1000);
})();
</script>
</body>
</html>`;
}
