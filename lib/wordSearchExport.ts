import { PhonemeWordEntry, KEYPAD_TOP, KEYPAD_BOTTOM, WORD_LIST } from './phonemeData';
import { GREAT_WORD_POSITIONS, GRID_SIZE_WORD_COUNTS } from './wordSearchData';

function formatTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(
    d.getMinutes()
  )}${pad(d.getSeconds())}`;
}

export function downloadStandaloneWordSearchHtml(words: PhonemeWordEntry[], gridSize: number) {
  const html = generateStandaloneWordSearchHtml(words, gridSize);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `word_search_${formatTimestamp()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateStandaloneWordSearchHtml(words: PhonemeWordEntry[], gridSize: number): string {
  const wordDataJson = JSON.stringify(words);
  const masterWordListJson = JSON.stringify(WORD_LIST);
  const keypadTopJson = JSON.stringify(KEYPAD_TOP);
  const keypadBottomJson = JSON.stringify(KEYPAD_BOTTOM);
  const greatEntry = WORD_LIST.find((w) => w.word === 'great');
  const greatPhonemesJson = JSON.stringify(greatEntry ? greatEntry.phonemes : []);
  const greatPositionsJson = JSON.stringify(GREAT_WORD_POSITIONS);
  const wordCountsJson = JSON.stringify(GRID_SIZE_WORD_COUNTS);
  const gridSizeOptionsJson = JSON.stringify(Object.keys(GRID_SIZE_WORD_COUNTS).map(Number));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Phoneme Word Search</title>
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
html, body { margin: 0; padding: 0; }
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
.title-row { display:flex; flex-wrap: wrap; justify-content:center; gap:4px; margin-top: 52px; margin-bottom: 44px; width: 396px; margin-left: auto; margin-right: auto; position: relative; }
.title-tile {
  width:40px; height:40px; border-radius:0.375rem; display:flex; align-items:center; justify-content:center;
  font-size:1rem; font-weight:500; border:2px solid rgba(128,128,128,0.2); color: var(--foreground);
  background: var(--background); perspective: 400px;
}
.title-tile.grey { border:none; background: var(--key); color: var(--key-foreground); }
.title-tile.yellow { background: var(--partial); color: var(--partial-foreground); border-color: transparent; }
.title-tile.green { background: var(--match); color: var(--match-foreground); border-color: transparent; }
.subtitle-row { display:flex; align-items:center; justify-content:center; gap:4px; font-size:1.125rem; color: rgba(128,128,128,0.9); margin: 0 0 30px 0; }
.instructions-row { text-align:center; font-size:1rem; color: rgba(128,128,128,0.9); margin: 0 0 8px 0; }
.instructions-row.with-gap { margin-bottom: 44px; }
.instructions-row-2 { display:flex; align-items:center; justify-content:center; gap:8px; font-size:1rem; color: rgba(128,128,128,0.9); margin: 0 0 44px 0; }
.hint-indicator {
  width:26px; height:26px; border-radius:0.375rem; display:flex; align-items:center; justify-content:center;
  font-size:0.75rem; font-weight:600; perspective:400px;
}
.hint-indicator.empty { border:1px solid rgba(128,128,128,0.2); background: var(--background); color: var(--foreground); }
.hint-indicator.yellow { background: var(--partial); color: var(--partial-foreground); border:none; }
.title-word-box {
  width:128px; height:40px; border-radius:0.375rem; display:flex; align-items:center; justify-content:center;
  font-size:1.125rem; font-weight:600; border:1px solid rgba(128,128,128,0.2); background: var(--background); color: var(--foreground);
  perspective:400px;
}
.title-word-box.blue { background: var(--word-reveal); color: var(--word-reveal-foreground); border-color: transparent; }
.title-word-box.solved { border: 2px solid var(--word-reveal); background: var(--background); color: var(--foreground); text-decoration: line-through; }
.export-footer { text-align:center; padding: 16px; font-size:0.875rem; color: rgba(128,128,128,0.8); }

.game-row { display:flex; gap:24px; flex-wrap: wrap; }
.wordlist-col { width:176px; flex-shrink:0; }
.wordlist-title { font-size:0.875rem; font-weight:500; margin-bottom:8px; }
.word-group { margin-bottom: 8px; }
.word-row { display:flex; gap:4px; margin-bottom:4px; }
.hint-box, .ph-slot {
  width:26px; height:26px; border-radius:0.375rem; display:flex; align-items:center; justify-content:center;
  font-size:0.875rem; font-weight:500; perspective:400px;
}
.hidden-spacer { width:26px; height:26px; }
.hidden-spacer-wide { height:26px; margin-left:30px; }
.eng-box { height:26px; border-radius:0.375rem; display:flex; align-items:center; justify-content:center; font-weight:600; margin-left:30px; perspective:400px; }

.ph-slot.empty, .hint-box.empty-border { border:1px solid rgba(128,128,128,0.2); background: var(--background); color: var(--foreground); }
.ph-slot.green { background: var(--match); color: var(--match-foreground); }
.ph-slot.yellow { background: var(--partial); color: var(--partial-foreground); }
.hint-box.qmark { background: var(--partial); color: var(--partial-foreground); cursor: pointer; border: none; }
.hint-box.tick { border:1px solid rgba(128,128,128,0.2); background: var(--background); color: var(--match); cursor: pointer; }
.eng-box.empty { border:1px solid rgba(128,128,128,0.2); background: var(--background); }
.eng-box.blue { background: var(--word-reveal); color: var(--word-reveal-foreground); }
.eng-box.solved { border:1px solid rgba(128,128,128,0.2); background: var(--background); color: var(--foreground); text-decoration: line-through; }

.grid-col { flex:1; min-width:0; border-left:1px solid rgba(128,128,128,0.1); padding-left:24px; }
.gcell {
  border-radius:0.375rem; display:flex; align-items:center; justify-content:center; font-weight:500;
  cursor:pointer; user-select:none; perspective:400px; font-size:1rem;
}
.gcell.empty { border:2px solid rgba(128,128,128,0.2); background: var(--background); cursor:default; }
.gcell.grey { background: var(--key); color: var(--key-foreground); }
.gcell.green { background: var(--match); color: var(--match-foreground); }
.gcell.yellow { background: var(--partial); color: var(--partial-foreground); }
.gcell.finale-green-border { border:2px solid var(--match); background: var(--background); cursor:default; }
.gcell.finale-blue-border { border:2px solid var(--word-reveal); background: var(--background); cursor:default; }
.gcell.finale-hidden { border:2px solid transparent; background: transparent; cursor:default; }
.great-box {
  border-radius:0.375rem; display:flex; align-items:center; justify-content:center; font-weight:600; perspective:400px;
}
.great-box.hidden { border:2px solid transparent; background: transparent; }
.great-box.revealed { background: var(--word-reveal); color: var(--word-reveal-foreground); }

.connector { position: absolute; background: var(--match); border-radius: 1px; pointer-events: none; }

.start-new-wrap { margin-top:24px; display:flex; justify-content:center; }
.start-new-btn {
  border-radius:0.375rem; padding:6px 12px; font-size:0.875rem; font-weight:500; cursor:pointer; border:none;
  background: var(--match); color: var(--match-foreground);
}
.start-new-btn:disabled { opacity:0.4; cursor:not-allowed; }
.start-new-btn.blue { background: var(--word-reveal); color: var(--word-reveal-foreground); }

.toggles-row { margin-top:24px; display:flex; align-items:center; justify-content:center; gap:32px; }
.control-box { border:1px solid rgba(128,128,128,0.15); border-radius:0.375rem; padding:8px 12px; display:flex; align-items:center; gap:12px; }
.switch { position:relative; width:44px; height:24px; flex-shrink:0; }
.switch input { opacity:0; width:0; height:0; }
.slider { position:absolute; inset:0; background: rgba(128,128,128,0.3); border-radius:999px; cursor:pointer; transition:.2s; }
.slider:before { content:""; position:absolute; height:18px; width:18px; left:3px; top:3px; background:white; border-radius:50%; transition:.2s; }
input:checked + .slider { background: var(--accent); }
input:checked + .slider:before { transform: translateX(20px); }

.tile-flip { animation: flip 0.5s ease-in-out; }
@keyframes flip { 0% { transform: rotateX(0deg); } 50% { transform: rotateX(90deg); } 100% { transform: rotateX(0deg); } }

@media (max-width: 700px) {
  .game-row { flex-direction: column; }
}
</style>
</head>
<body>
<div class="panel">
  <div class="title-row" id="titleRow"></div>
  <div class="subtitle-row" id="subtitleRow">
    <span>A Phoneme</span>
    <div class="title-word-box" id="titleWordBox"></div>
    <div class="title-word-box" id="titleSearchBox"></div>
    <span>Game</span>
  </div>
  <p class="instructions-row">To make a guess, click on a phoneme symbol and hold down your mouse while dragging, then release.</p>
  <div class="instructions-row-2">
    <span>If you get stuck, click on a word's</span>
    <div class="hint-indicator empty" id="hintIndicator">?</div>
    <span>for a hint.</span>
  </div>
  <div class="game-row">
    <div class="wordlist-col">
      <p class="wordlist-title">Word List:</p>
      <div id="wordListCol"></div>
    </div>
    <div class="grid-col">
      <div id="gridWrap" style="display:flex; justify-content:center;">
        <div id="gridInner" style="position:relative;">
          <div id="grid" style="display:grid; gap:4px;"></div>
          <div id="connectorOverlay" style="position:absolute; inset:0; pointer-events:none;"></div>
        </div>
      </div>
      <div class="start-new-wrap">
        <button class="start-new-btn" id="startNewBtn" disabled>Start New Puzzle</button>
      </div>
      <div class="toggles-row">
        <div class="control-box">
          <span>Dark Theme</span>
          <label class="switch"><input type="checkbox" id="darkThemeToggle"><span class="slider"></span></label>
        </div>
        <div class="control-box">
          <span>High Contrast</span>
          <label class="switch"><input type="checkbox" id="highContrastToggle"><span class="slider"></span></label>
        </div>
      </div>
    </div>
  </div>
</div>

<p class="export-footer">Adam Ashmore — Student Number: 22670379</p>

<script>
(function () {
  var INITIAL_WORD_DATA = ${wordDataJson};
  var INITIAL_GRID_SIZE = ${gridSize};
  var MASTER_WORD_LIST = ${masterWordListJson};
  var GRID_SIZE_WORD_COUNTS = ${wordCountsJson};
  var GRID_SIZE_OPTIONS = ${gridSizeOptionsJson};
  var KEYPAD_TOP = ${keypadTopJson};
  var KEYPAD_BOTTOM = ${keypadBottomJson};
  var GREAT_PHONEMES = ${greatPhonemesJson};
  var GREAT_POSITIONS = ${greatPositionsJson};

  var FLIP_MS = 500;
  var CELL_STAGGER_MS = 60;
  var LETTER_STAGGER_MS = 60;
  var GRID_ROW_STAGGER_MS = 80;
  var STAGGER_MS = 250;
  var SOLVE_STAGGER_MS = 150;
  var SOLVE_HOLD_MS = 1000;
  var HINT_HOLD_MS = 2000;
  var COMPLETION_CELL_STAGGER_MS = 15;
  var COMPLETION_ROW_STAGGER_MS = 80;
  var FINALE_WAIT_MS = 1000;
  var START_NEW_PUZZLE_HOLD_MS = 1000;
  var TITLE_INITIAL_DELAY_MS = 1000;
  var TITLE_SWIPE_STAGGER_MS = 100;
  var TITLE_SWIPE_HOLD_MS = 500;
  var TITLE_GAP_BETWEEN_WORDS_MS = 500;
  var TITLE_REVEAL_STAGGER_MS = FLIP_MS / 2;
  var TITLE_FLOURISH_STAGGER_MS = TITLE_REVEAL_STAGGER_MS / 2;
  var TITLE_FLOURISH_CELL_STAGGER_MS = CELL_STAGGER_MS / 2;
  var CONNECTOR_THICKNESS = 3;
  var CONNECTOR_OVERLAP = 3;
  var PHONEME_EXAMPLES = {
    'p': 'Pit, Pin, taP', 't': 'Ten, Tap, caT', 'k': 'Kit, Cat, saCK', 'b': 'Bat, Bed, ruBBer',
    'd': 'Dog, Dig, aDD', 'g': 'Go, Get, eGG', 'n': 'No, Net, peN', 'm': 'Man, Map, haMMer',
    'ŋ': 'siNG, riNG, thiNK', 'f': 'Fan, Fox, Phone', 's': 'Sun, See, ciTy',
    'θ': 'THin, THink, THrough (Voiceless)', 'ʃ': 'SHip, SHe, Chef', 'v': 'Van, Very, haVe',
    'z': 'Zoo, haS, buZZ', 'ð': 'THis, THem, fæTHer (Voiced)', 'ʒ': 'meaSUre, viSIon, caSUal',
    'l': 'Lamp, Leg, baLL', 'ɹ': 'Run, Red, Write', 'w': 'Wet, Win, What', 'j': 'Yes, You, Use',
    'h': 'Hat, Hot, Who', 'tʃ': 'CHip, CHurch, caTCH', 'dʒ': 'Judge, Jet, caGe',
    'iː': 'sEE, bEAD, flEEce (Long)', 'ɪ': 'bId, kIt, sIt (Short)', 'e': 'bEd, drEss, mEn (Short)',
    'eː': 'bAREd, squARE, chAIR (Long)', 'æ': 'bAd, trAp, cAt (Short)', 'ɐ': 'bUd, strUt, cUt (Short)',
    'ɐː': 'bARd, stAR, fAther (Long)', 'ɜː': 'bIRd, nURse, hER (Long)', 'ʉː': 'bOOed, gOOse, twO (Long)',
    'ɔ': 'bOd, gOt, lOt (Short)', 'oː': 'bOARd, thOUGHt, mORE (Long)', 'ʊ': 'gOOd, fOOt, pUt (Short)',
    'æɪ': 'bAY, fAce, rAIn', 'ɑe': 'bUY, prIce, lIGHt', 'oɪ': 'bOY, chOIce, cOIn',
    'əʉ': 'bOW (ribbon), gOAt, nO', 'æɔ': 'bOUGH, mOUth, cOW', 'ɪə': 'bEER, nEAR, hEAR',
    'ə': 'Above, commA, lettER (The Unstressed "Schwa")'
  };
  function phonemeHoverText(symbol) {
    var examples = PHONEME_EXAMPLES[symbol];
    return examples ? '/' + symbol + '/  ' + examples : '/' + symbol + '/';
  }

  var ALL_PHONEME_SYMBOLS = KEYPAD_TOP.concat(KEYPAD_BOTTOM).reduce(function (acc, row) { return acc.concat(row); }, []).filter(function (s) { return s; });

  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randomPhoneme() { return ALL_PHONEME_SYMBOLS[randomInt(0, ALL_PHONEME_SYMBOLS.length - 1)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ---------- theme (always available, defaults to browser preference) ----------
  function loadTheme() {
    var dark = localStorage.getItem('wordsearch_export_dark');
    var hc = localStorage.getItem('wordsearch_export_hc');
    if (dark === null) dark = window.matchMedia('(prefers-color-scheme: dark)').matches ? '1' : '0';
    if (hc === null) hc = '0';
    return { dark: dark === '1', hc: hc === '1' };
  }
  function applyTheme(state) {
    document.documentElement.classList.toggle('dark', state.dark);
    document.documentElement.classList.toggle('high-contrast', state.hc);
    localStorage.setItem('wordsearch_export_dark', state.dark ? '1' : '0');
    localStorage.setItem('wordsearch_export_hc', state.hc ? '1' : '0');
  }
  var themeState = loadTheme();
  applyTheme(themeState);
  var darkToggle = document.getElementById('darkThemeToggle');
  var hcToggle = document.getElementById('highContrastToggle');
  darkToggle.checked = themeState.dark;
  hcToggle.checked = themeState.hc;
  darkToggle.addEventListener('change', function () { themeState.dark = darkToggle.checked; applyTheme(themeState); });
  hcToggle.addEventListener('change', function () { themeState.hc = hcToggle.checked; applyTheme(themeState); });

  // ---------- connector geometry (shared by word connectors, "great" connectors, and the title demo) ----------
  function computeSegmentsForCellSequence(cellsArr, cellSize, gap, thickness, overlap, keyPrefix) {
    var step = cellSize + gap;
    var segments = [];
    for (var i = 0; i < cellsArr.length - 1; i++) {
      var a = cellsArr[i], b = cellsArr[i + 1];
      var dRow = b.row - a.row, dCol = b.col - a.col;
      var key = keyPrefix + '-' + i;
      if (dRow === 0) {
        var leftCol = Math.min(a.col, b.col);
        var left = leftCol * step + cellSize - overlap;
        var top = a.row * step + cellSize / 2 - thickness / 2;
        segments.push({ key: key, left: left, top: top, width: gap + overlap * 2, height: thickness, rotationDeg: 0 });
      } else if (dCol === 0) {
        var topRow = Math.min(a.row, b.row);
        var top2 = topRow * step + cellSize - overlap;
        var left2 = a.col * step + cellSize / 2 - thickness / 2;
        segments.push({ key: key, left: left2, top: top2, width: thickness, height: gap + overlap * 2, rotationDeg: 0 });
      } else {
        var leftCol2 = Math.min(a.col, b.col);
        var topRow2 = Math.min(a.row, b.row);
        var gapLeft = leftCol2 * step + cellSize;
        var gapTop = topRow2 * step + cellSize;
        var centerX = gapLeft + gap / 2;
        var centerY = gapTop + gap / 2;
        var length = gap * Math.SQRT2 + overlap * 2;
        var sameSign = dRow * dCol > 0;
        var rotationDeg = sameSign ? 45 : -45;
        segments.push({ key: key, left: centerX - length / 2, top: centerY - thickness / 2, width: length, height: thickness, rotationDeg: rotationDeg });
      }
    }
    return segments;
  }
  function renderSegmentsInto(overlayEl, segments) {
    if (!overlayEl) return;
    overlayEl.innerHTML = '';
    segments.forEach(function (seg) {
      var div = document.createElement('div');
      div.className = 'connector';
      div.style.left = seg.left + 'px';
      div.style.top = seg.top + 'px';
      div.style.width = seg.width + 'px';
      div.style.height = seg.height + 'px';
      if (seg.rotationDeg) div.style.transform = 'rotate(' + seg.rotationDeg + 'deg)';
      overlayEl.appendChild(div);
    });
  }

  // ---------- grid generation ----------
  var DIRECTIONS = [{ dx: 1, dy: 0, o: 'h' }, { dx: 0, dy: 1, o: 'v' }, { dx: 1, dy: 1, o: 'd' }, { dx: -1, dy: 1, o: 'd' }];

  function canPlace(cells, path, letters, orientation) {
    for (var i = 0; i < path.length; i++) {
      var pos = path[i]; var cell = cells[pos.row][pos.col];
      if (cell.symbol === null) continue;
      if (cell.symbol !== letters[i]) return false;
      if (cell.orientations[orientation]) return false;
    }
    return true;
  }
  function tryPlaceWord(cells, entry, size) {
    var length = entry.phonemes.length;
    if (length > size) return null;
    for (var attempt = 0; attempt < 300; attempt++) {
      var dir = DIRECTIONS[randomInt(0, DIRECTIONS.length - 1)];
      var backwards = Math.random() < 0.5;
      var startCol = dir.dx === 1 ? randomInt(0, size - length) : dir.dx === -1 ? randomInt(length - 1, size - 1) : randomInt(0, size - 1);
      var startRow = dir.dy === 1 ? randomInt(0, size - length) : randomInt(0, size - 1);
      var path = [];
      for (var i = 0; i < length; i++) path.push({ row: startRow + dir.dy * i, col: startCol + dir.dx * i });
      var letters = backwards ? entry.phonemes.slice().reverse() : entry.phonemes;
      if (canPlace(cells, path, letters, dir.o)) {
        path.forEach(function (pos, i) { cells[pos.row][pos.col].symbol = letters[i]; cells[pos.row][pos.col].orientations[dir.o] = true; });
        var cellsByPhonemeIndex = entry.phonemes.map(function (_, pi) {
          var pathIndex = backwards ? (length - 1 - pi) : pi;
          return path[pathIndex];
        });
        return cellsByPhonemeIndex;
      }
    }
    return null;
  }
  function generateGrid(words, size) {
    var cells = [];
    for (var r = 0; r < size; r++) { var row = []; for (var c = 0; c < size; c++) row.push({ symbol: null, orientations: {} }); cells.push(row); }
    var placedWords = {};
    var ordered = words.slice().sort(function (a, b) { return b.phonemes.length - a.phonemes.length; });
    ordered.forEach(function (entry) {
      var result = tryPlaceWord(cells, entry, size);
      if (result) placedWords[entry.word] = result;
    });
    for (var r2 = 0; r2 < size; r2++) for (var c2 = 0; c2 < size; c2++) if (cells[r2][c2].symbol === null) cells[r2][c2].symbol = randomPhoneme();
    var grid = cells.map(function (row) { return row.map(function (cell) { return cell.symbol; }); });
    return { grid: grid, placedWords: placedWords };
  }

  function cellsEqual(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i].row !== b[i].row || a[i].col !== b[i].col) return false;
    return true;
  }
  function matchDragToWord(dragPath, wordPhonemeCells, foundWordsObj) {
    if (dragPath.length < 2) return null;
    var reversed = dragPath.slice().reverse();
    for (var word in wordPhonemeCells) {
      if (foundWordsObj[word]) continue;
      var cells = wordPhonemeCells[word];
      if (cells.length !== dragPath.length) continue;
      if (cellsEqual(cells, dragPath) || cellsEqual(cells, reversed)) return word;
    }
    return null;
  }

  function generateRandomGameConfig() {
    var size = GRID_SIZE_OPTIONS[randomInt(0, GRID_SIZE_OPTIONS.length - 1)];
    var count = GRID_SIZE_WORD_COUNTS[size];
    var shuffled = shuffle(MASTER_WORD_LIST);
    return { size: size, words: shuffled.slice(0, count) };
  }

  // ---------- mutable per-game state (reassigned by setupPuzzle) ----------
  var WORD_DATA, GRID_SIZE, grid, wordPhonemeCells, wordCellKeySet, WORD_DATA_BY_WORD;
  var foundWords, foundCellKeySet, isPlayable, isPuzzleComplete, activeSolves;
  var hoverKey, dragging, dragStart, dragPath, releaseHeld, releaseFlipping, hintActive, completionFlipping;
  var GREAT_POS, specialCells, specialKeySet;
  var introRevealedCell, introFlippingCell, finaleCellStage, finaleCellFlipping;
  var showGreatBox, greatBoxRevealed, greatBoxFlipping;
  var wordRowsState, startNewPuzzleReady;
  var cellEls, wordRowEls;
  var finalePhase;
  var greatConnectedCount;
  var replayFlipping; // key -> true while that grid cell is mid click-to-replay flip

  // Hint indicator — deliberately NOT reset by setupPuzzle. It flips
  // yellow exactly once, the first time the game ever becomes playable,
  // and stays yellow forever after (including across Start New Puzzle).
  var hintIndicatorEverRevealed = false;
  var hintIndicatorEl = document.getElementById('hintIndicator');

  var gridEl = document.getElementById('grid');
  var gridInnerEl = document.getElementById('gridInner');
  var connectorOverlayEl = document.getElementById('connectorOverlay');
  var wordListCol = document.getElementById('wordListCol');
  var startNewBtn = document.getElementById('startNewBtn');

  var dynamicStyleEl = document.createElement('style');
  document.head.appendChild(dynamicStyleEl);

  function updateResponsiveBreakpoint() {
    var wordListColWidth = 176;
    var rowGap = 24;
    var cellSize = 40; // cells are currently fixed-size, no responsive shrink implemented yet
    var naturalGridWidth = GRID_SIZE * cellSize + (GRID_SIZE - 1) * 4;
    var breakpoint = wordListColWidth + rowGap + naturalGridWidth;
    dynamicStyleEl.textContent =
      '@media (max-width: ' + breakpoint + 'px) { .game-row { flex-direction: column; } }';
  }

  function cellKey(r, c) { return r + ',' + c; }

  function triggerHintIndicatorIfFirstTime() {
    if (hintIndicatorEverRevealed) return;
    hintIndicatorEverRevealed = true;
    hintIndicatorEl.classList.add('tile-flip');
    setTimeout(function () {
      hintIndicatorEl.className = 'hint-indicator yellow tile-flip';
    }, FLIP_MS / 2);
    setTimeout(function () {
      hintIndicatorEl.classList.remove('tile-flip');
    }, FLIP_MS);
  }

  // ---------- connectors: found words + "great" cells ----------
  function computeWordConnectorSegments() {
    var segments = [];
    for (var word in wordPhonemeCells) {
      var cells = wordPhonemeCells[word];
      var isFound = !!foundWords[word];
      var solve = activeSolves[word];
      for (var i = 0; i < cells.length - 1; i++) {
        var visible = isFound || (solve && solve.letterRevealed[i] && solve.letterRevealed[i + 1]);
        if (!visible) continue;
        segments = segments.concat(
          computeSegmentsForCellSequence([cells[i], cells[i + 1]], 40, 4, CONNECTOR_THICKNESS, CONNECTOR_OVERLAP, word + '-' + i)
        );
      }
    }
    return segments;
  }
  function computeGreatConnectorSegments() {
    if (finalePhase !== 1) return [];
    var all = computeSegmentsForCellSequence(specialCells, 40, 4, CONNECTOR_THICKNESS, CONNECTOR_OVERLAP, 'great');
    return all.slice(0, greatConnectedCount);
  }
  function renderConnectors() {
    var segments = finalePhase === 0 ? computeWordConnectorSegments() : [];
    segments = segments.concat(computeGreatConnectorSegments());
    renderSegmentsInto(connectorOverlayEl, segments);
  }

  function setupPuzzle(words, size) {
    WORD_DATA = words;
    GRID_SIZE = size;
    updateResponsiveBreakpoint();

    var genResult = generateGrid(WORD_DATA, GRID_SIZE);
    grid = genResult.grid;
    wordPhonemeCells = genResult.placedWords;
    wordCellKeySet = {};
    Object.keys(wordPhonemeCells).forEach(function (w) { wordPhonemeCells[w].forEach(function (c) { wordCellKeySet[c.row + ',' + c.col] = true; }); });
    WORD_DATA_BY_WORD = {};
    WORD_DATA.forEach(function (e) { WORD_DATA_BY_WORD[e.word] = e; });

    foundWords = {};
    foundCellKeySet = {};
    isPlayable = false;
    isPuzzleComplete = false;
    activeSolves = {};
    hoverKey = null;
    dragging = false; dragStart = null; dragPath = [];
    releaseHeld = {}; releaseFlipping = {};
    hintActive = null;
    completionFlipping = {};
    startNewPuzzleReady = false;
    finalePhase = 0;
    greatConnectedCount = 0;
    replayFlipping = {};

    GREAT_POS = GREAT_POSITIONS[GRID_SIZE];
    specialCells = [];
    if (GREAT_POS) for (var k = 0; k < 4; k++) specialCells.push({ row: GREAT_POS.row - 1, col: GREAT_POS.startCol - 1 + k });
    specialKeySet = {};
    specialCells.forEach(function (c, i) { specialKeySet[c.row + ',' + c.col] = i; });

    introRevealedCell = []; introFlippingCell = [];
    finaleCellStage = []; finaleCellFlipping = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      introRevealedCell.push([]); introFlippingCell.push([]);
      finaleCellStage.push([]); finaleCellFlipping.push([]);
      for (var c = 0; c < GRID_SIZE; c++) {
        introRevealedCell[r].push(false); introFlippingCell[r].push(false);
        finaleCellStage[r].push(0); finaleCellFlipping[r].push(false);
      }
    }
    showGreatBox = false; greatBoxRevealed = false; greatBoxFlipping = false;

    wordRowsState = WORD_DATA.map(function (entry) {
      return {
        word: entry.word, phonemes: entry.phonemes, isPlaced: !!wordPhonemeCells[entry.word],
        englishRevealed: false, englishFlipping: false,
        hintRevealed: false, hintFlipping: false,
        letterRevealed: entry.phonemes.map(function () { return false; }),
        letterFlipping: entry.phonemes.map(function () { return false; })
      };
    });

    // Rebuild grid DOM
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = 'repeat(' + GRID_SIZE + ', 40px)';
    gridInnerEl.style.width = (GRID_SIZE * 40 + (GRID_SIZE - 1) * 4) + 'px';
    gridInnerEl.style.height = (GRID_SIZE * 40 + (GRID_SIZE - 1) * 4) + 'px';
    connectorOverlayEl.innerHTML = '';
    cellEls = [];
    for (var r3 = 0; r3 < GRID_SIZE; r3++) {
      var rowArr = [];
      for (var c3 = 0; c3 < GRID_SIZE; c3++) {
        var el = document.createElement('div');
        el.className = 'gcell empty';
        el.style.width = '40px'; el.style.height = '40px';
        (function (rr, cc) {
          el.addEventListener('mousedown', function () { handleCellMouseDown(rr, cc); });
          el.addEventListener('mouseenter', function () { handleCellMouseEnter(rr, cc); });
        })(r3, c3);
        gridEl.appendChild(el);
        rowArr.push(el);
      }
      cellEls.push(rowArr);
    }

    // Rebuild word list DOM
    wordListCol.innerHTML = '';
    wordRowEls = WORD_DATA.map(function (entry) {
      var group = document.createElement('div');
      group.className = 'word-group';
      var row = document.createElement('div');
      row.className = 'word-row';
      var hintEl = document.createElement('div');
      row.appendChild(hintEl);
      var slotEls = entry.phonemes.map(function () {
        var s = document.createElement('div');
        row.appendChild(s);
        return s;
      });
      group.appendChild(row);
      var engEl = document.createElement('div');
      group.appendChild(engEl);
      wordListCol.appendChild(group);
      return { hintEl: hintEl, slotEls: slotEls, engEl: engEl };
    });

    renderAllCells();
    renderAllWordRows();
    updateStartNewButton();
  }

  // ---------- render: grid cell ----------
  function renderCell(r, c) {
    var el = cellEls[r][c]; var key = cellKey(r, c);
    var fStage = finaleCellStage[r][c];
    var isSpecial = specialKeySet.hasOwnProperty(key);

    if (fStage > 0) {
      if (showGreatBox && isSpecial) { return; }
      if (fStage === 1) {
        if (isSpecial) {
          el.className = 'gcell green' + (finaleCellFlipping[r][c] ? ' tile-flip' : '');
          var sym = GREAT_PHONEMES[specialKeySet[key]] || '';
          el.textContent = sym; el.title = sym ? phonemeHoverText(sym) : '';
        } else {
          el.className = 'gcell finale-green-border' + (finaleCellFlipping[r][c] ? ' tile-flip' : '');
          el.textContent = ''; el.title = '';
        }
      } else {
        if (isSpecial) {
          el.className = 'gcell finale-hidden' + (finaleCellFlipping[r][c] ? ' tile-flip' : '');
        } else {
          el.className = 'gcell finale-blue-border' + (finaleCellFlipping[r][c] ? ' tile-flip' : '');
        }
        el.textContent = ''; el.title = '';
      }
      return;
    }

    if (!introRevealedCell[r][c]) {
      el.className = 'gcell empty' + (introFlippingCell[r][c] ? ' tile-flip' : '');
      el.textContent = ''; el.title = '';
      return;
    }

    var symbol = grid[r][c];
    var isFound = !!foundCellKeySet[key];
    var solveInfo = null;
    for (var w in activeSolves) {
      var cells = wordPhonemeCells[w]; if (!cells) continue;
      for (var i = 0; i < cells.length; i++) {
        if (cells[i].row === r && cells[i].col === c) { solveInfo = { revealed: activeSolves[w].letterRevealed[i], flipping: activeSolves[w].letterFlipping[i] }; break; }
      }
      if (solveInfo) break;
    }

    var colorClass = 'grey', flipping = false;
    if (solveInfo) {
      colorClass = solveInfo.revealed ? 'green' : 'yellow';
      flipping = solveInfo.flipping;
    } else {
      var trueColor = isFound ? 'green' : 'grey';
      if (hintActive && hintActive.cellKey === key) {
        colorClass = hintActive.revealed ? 'yellow' : trueColor;
        flipping = hintActive.flipping;
      } else {
        colorClass = trueColor;
      }
    }

    var isDragSelected = dragging && dragPath.some(function (p) { return p.row === r && p.col === c; });
    var isHeld = !!releaseHeld[key];
    var isRelFlipping = !!releaseFlipping[key];

    if (isDragSelected) { colorClass = 'yellow'; flipping = false; }
    else if (isHeld) { colorClass = 'yellow'; flipping = isRelFlipping; }
    else if (isRelFlipping) { flipping = true; }

    if (completionFlipping[key]) flipping = true;
    if (hintActive && hintActive.cellKey === key && hintActive.flipping && !hintActive.revealed) flipping = true;

    // Click-to-replay overlay — same color, flip only, no color change.
    if (replayFlipping[key]) flipping = true;

    el.className = 'gcell ' + colorClass + (flipping ? ' tile-flip' : '');
    el.textContent = symbol || '';
    el.title = symbol ? phonemeHoverText(symbol) : '';
  }

  function renderAllCells() {
    for (var r = 0; r < GRID_SIZE; r++) for (var c = 0; c < GRID_SIZE; c++) renderCell(r, c);
    renderConnectors();
  }

  function renderGreatBoxOverlay() {
    if (!GREAT_POS) return;
    var first = specialCells[0];
    var existing = document.getElementById('greatBox');
    if (!showGreatBox) {
      if (existing) existing.remove();
      return;
    }
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'greatBox';
      existing.style.gridColumn = 'span 4';
      existing.style.height = '40px';
      var inner = document.createElement('div');
      inner.className = 'great-box';
      inner.style.height = '40px';
      existing.appendChild(inner);
      var refCell = cellEls[first.row][first.col];
      refCell.parentNode.insertBefore(existing, refCell);
      specialCells.forEach(function (sc) { cellEls[sc.row][sc.col].style.display = 'none'; });
    }
    var inner = existing.firstChild;
    inner.className = 'great-box ' + (greatBoxRevealed ? 'revealed' : 'hidden') + (greatBoxFlipping ? ' tile-flip' : '');
    inner.textContent = greatBoxRevealed ? 'Great!' : '';
  }

  // ---------- render: word list row ----------
  function renderWordRow(idx) {
    var st = wordRowsState[idx];
    var rowEl = wordRowEls[idx];
    var isFound = !!foundWords[st.word];
    var solve = activeSolves[st.word];

    if (!st.isPlaced) {
      rowEl.hintEl.className = 'hint-box empty-border'; rowEl.hintEl.textContent = ''; rowEl.hintEl.title = ''; rowEl.hintEl.onclick = null;
    } else if (!st.hintRevealed && !st.hintFlipping) {
      rowEl.hintEl.className = 'hidden-spacer'; rowEl.hintEl.textContent = ''; rowEl.hintEl.title = ''; rowEl.hintEl.onclick = null;
    } else if (isFound) {
      rowEl.hintEl.className = 'hint-box tick'; rowEl.hintEl.textContent = '\\u2713'; rowEl.hintEl.title = '';
      rowEl.hintEl.onclick = function () { handleFoundWordClick(st.word); };
    } else if (solve) {
      rowEl.hintEl.className = 'hint-box ' + (solve.hintRevealed ? 'tick' : 'qmark') + (solve.hintFlipping ? ' tile-flip' : '');
      rowEl.hintEl.textContent = solve.hintRevealed ? '\\u2713' : '?';
      rowEl.hintEl.title = ''; rowEl.hintEl.onclick = null;
    } else {
      var isThisHint = hintActive && hintActive.word === st.word;
      rowEl.hintEl.className = 'hint-box qmark' + (isThisHint && hintActive.flipping ? ' tile-flip' : '');
      rowEl.hintEl.textContent = '?';
      rowEl.hintEl.title = 'Hint?';
      rowEl.hintEl.onclick = function () { handleHintClick(WORD_DATA_BY_WORD[st.word]); };
    }

    for (var i = 0; i < st.phonemes.length; i++) {
      var slotEl = rowEl.slotEls[i];
      var symbol = st.phonemes[i];
      var shown = st.letterRevealed[i] || st.letterFlipping[i];
      if (!shown) { slotEl.className = 'hidden-spacer'; slotEl.textContent = ''; slotEl.title = ''; continue; }

      var isHintThis = hintActive && hintActive.word === st.word && hintActive.phonemeIndex === i;
      if (isFound) {
        slotEl.className = 'ph-slot green'; slotEl.textContent = symbol; slotEl.title = phonemeHoverText(symbol);
      } else if (solve) {
        var revealed = solve.letterRevealed[i];
        slotEl.className = 'ph-slot ' + (revealed ? 'green' : 'empty') + (solve.letterFlipping[i] ? ' tile-flip' : '');
        slotEl.textContent = revealed ? symbol : '';
        slotEl.title = revealed ? phonemeHoverText(symbol) : '';
      } else if (isHintThis) {
        slotEl.className = 'ph-slot ' + (hintActive.revealed ? 'yellow' : 'empty') + (hintActive.flipping ? ' tile-flip' : '');
        slotEl.textContent = hintActive.revealed ? symbol : '';
        slotEl.title = hintActive.revealed ? phonemeHoverText(symbol) : '';
      } else {
        slotEl.className = 'ph-slot empty'; slotEl.textContent = ''; slotEl.title = '';
      }
    }

    var BOX_SIZE = 26, GAP = 4;
    var engWidth = st.phonemes.length * BOX_SIZE + (st.phonemes.length - 1) * GAP;
    rowEl.engEl.style.width = engWidth + 'px';

    if (!st.englishRevealed && !st.englishFlipping) {
      // Empty white/bordered box — same look as the phoneme boxes'
      // "not yet revealed" state — instead of fully invisible, so the
      // flip-to-blue animation visibly starts FROM this box.
      rowEl.engEl.className = 'eng-box empty'; rowEl.engEl.textContent = '';
    } else if (isFound || (solve && solve.wordBoxRevealed)) {
      rowEl.engEl.className = 'eng-box solved' + ((solve && solve.wordBoxFlipping) ? ' tile-flip' : '');
      rowEl.engEl.textContent = st.word;
    } else {
      rowEl.engEl.className = 'eng-box blue' + (st.englishFlipping ? ' tile-flip' : '');
      rowEl.engEl.textContent = st.word;
    }
  }
  function renderAllWordRows() { for (var i = 0; i < wordRowsState.length; i++) renderWordRow(i); }

  // ---------- click-to-replay a found word's letters on the grid ----------
  function handleFoundWordClick(word) {
    if (isPuzzleComplete) return;
    if (!foundWords[word]) return;
    var cells = wordPhonemeCells[word];
    if (!cells || cells.length === 0) return;

    replayFlipping = {};

    cells.forEach(function (cell, i) {
      var key = cellKey(cell.row, cell.col);
      var start = i * SOLVE_STAGGER_MS;
      setTimeout(function () { replayFlipping[key] = true; renderCell(cell.row, cell.col); }, start);
      setTimeout(function () { delete replayFlipping[key]; renderCell(cell.row, cell.col); }, start + FLIP_MS);
    });
  }

  // ---------- Start New Puzzle button ----------
  function startNewEnabled() { return isPlayable || startNewPuzzleReady; }
  function updateStartNewButton() {
    startNewBtn.disabled = !startNewEnabled();
    startNewBtn.classList.toggle('blue', startNewPuzzleReady);
  }
  startNewBtn.addEventListener('click', function () {
    if (!startNewEnabled()) return;
    startNewPuzzleReady = false;
    isPlayable = false;
    updateStartNewButton();
    var cfg = generateRandomGameConfig();
    setupPuzzle(cfg.words, cfg.size);
    startIntroSequence();
  });

  // ---------- title demo ----------
  var TCOLS = 9, TROWS = 3;
  var TFIXED = [
    { row: 2, col: 2, symbol: 'w' }, { row: 2, col: 3, symbol: '\\u025c\\u02d0' }, { row: 2, col: 4, symbol: 'd' },
    { row: 1, col: 6, symbol: 's' }, { row: 2, col: 7, symbol: '\\u025c\\u02d0' }, { row: 3, col: 8, symbol: 't\\u0283' }
  ];
  function tFlatIndex(row, col) { return (row - 1) * TCOLS + (col - 1); }
  var TWORD1 = [tFlatIndex(2, 2), tFlatIndex(2, 3), tFlatIndex(2, 4)];
  var TWORD2 = [tFlatIndex(1, 6), tFlatIndex(2, 7), tFlatIndex(3, 8)];
  var TWORD1_CELLS = [{ row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }];
  var TWORD2_CELLS = [{ row: 0, col: 5 }, { row: 1, col: 6 }, { row: 2, col: 7 }];

  var titleRow = document.getElementById('titleRow');
  var titleFixedMap = {};
  TFIXED.forEach(function (c) { titleFixedMap[c.row + ',' + c.col] = c.symbol; });
  var titleSymbols = [];
  for (var ti = 0; ti < TROWS * TCOLS; ti++) {
    var trow = Math.floor(ti / TCOLS) + 1, tcol = (ti % TCOLS) + 1;
    titleSymbols.push(titleFixedMap[trow + ',' + tcol] || randomPhoneme());
  }
  var titleTiles = [];
  for (var ti2 = 0; ti2 < TROWS * TCOLS; ti2++) {
    var tt = document.createElement('div');
    tt.className = 'title-tile';
    titleRow.appendChild(tt);
    titleTiles.push(tt);
  }
  var titleConnectorOverlay = document.createElement('div');
  titleConnectorOverlay.id = 'titleConnectorOverlay';
  titleConnectorOverlay.style.position = 'absolute';
  titleConnectorOverlay.style.inset = '0';
  titleConnectorOverlay.style.pointerEvents = 'none';
  titleRow.appendChild(titleConnectorOverlay);

  var TWORD1_SEGMENTS = computeSegmentsForCellSequence(TWORD1_CELLS, 40, 4, CONNECTOR_THICKNESS, CONNECTOR_OVERLAP, 'title-word1');
  var TWORD2_SEGMENTS = computeSegmentsForCellSequence(TWORD2_CELLS, 40, 4, CONNECTOR_THICKNESS, CONNECTOR_OVERLAP, 'title-word2');
  var word1ConnectedCount = 0;
  var word2ConnectedCount = 0;
  function renderTitleConnectors() {
    var segs = TWORD1_SEGMENTS.slice(0, word1ConnectedCount).concat(TWORD2_SEGMENTS.slice(0, word2ConnectedCount));
    renderSegmentsInto(titleConnectorOverlay, segs);
  }

  var titleWordBox = document.getElementById('titleWordBox');
  var titleSearchBox = document.getElementById('titleSearchBox');

  function setTitleCell(idx, className, flipping, text) {
    var el = titleTiles[idx];
    el.className = 'title-tile' + (className ? ' ' + className : '') + (flipping ? ' tile-flip' : '');
    if (text !== undefined) el.textContent = text;
  }
  function setTitleBox(el, cls, flipping, text) {
    el.className = 'title-word-box' + (cls ? ' ' + cls : '') + (flipping ? ' tile-flip' : '');
    if (text !== undefined) el.textContent = text;
  }

  function runTitleSequence(onDone) {
    var timers = [];
    function t(fn, delay) { timers.push(setTimeout(fn, delay)); }
    var time = TITLE_INITIAL_DELAY_MS;

    word1ConnectedCount = 0;
    word2ConnectedCount = 0;
    renderTitleConnectors();

    for (var row = 1; row <= TROWS; row++) {
      var rowIndices = []; for (var col = 1; col <= TCOLS; col++) rowIndices.push(tFlatIndex(row, col));
      rowIndices.forEach(function (idx, i) {
        var start = time + i * CELL_STAGGER_MS;
        t((function (idx) { return function () { setTitleCell(idx, '', true); }; })(idx), start);
        t((function (idx) { return function () { setTitleCell(idx, 'grey', false, titleSymbols[idx]); }; })(idx), start + FLIP_MS / 2);
        t((function (idx) { return function () { setTitleCell(idx, 'grey', false); }; })(idx), start + FLIP_MS);
      });
      time += TITLE_REVEAL_STAGGER_MS;
    }

    t(function () { setTitleBox(titleWordBox, '', true); }, time);
    t(function () { setTitleBox(titleWordBox, 'blue', false, 'word'); }, time + FLIP_MS / 2);
    t(function () { setTitleBox(titleWordBox, 'blue', false); }, time + FLIP_MS);
    time += TITLE_REVEAL_STAGGER_MS;

    t(function () { setTitleBox(titleSearchBox, '', true); }, time);
    t(function () { setTitleBox(titleSearchBox, 'blue', false, 'search'); }, time + FLIP_MS / 2);
    t(function () { setTitleBox(titleSearchBox, 'blue', false); }, time + FLIP_MS);
    time += TITLE_REVEAL_STAGGER_MS;

    time += 1000;
    TWORD1.forEach(function (idx, i) { t((function (idx) { return function () { setTitleCell(idx, 'yellow', false); }; })(idx), time + i * TITLE_SWIPE_STAGGER_MS); });
    time += (TWORD1.length - 1) * TITLE_SWIPE_STAGGER_MS + TITLE_SWIPE_HOLD_MS;
    TWORD1.forEach(function (idx, i) {
      var start = time + i * SOLVE_STAGGER_MS;
      t((function (idx) { return function () { setTitleCell(idx, 'yellow', true); }; })(idx), start);
      t((function (idx) { return function () { setTitleCell(idx, 'green', true); }; })(idx), start + FLIP_MS / 2);
      t((function (idx) { return function () { setTitleCell(idx, 'green', false); }; })(idx), start + FLIP_MS);
      if (i > 0) {
        t((function (i) { return function () { word1ConnectedCount = i; renderTitleConnectors(); }; })(i), start + FLIP_MS / 2);
      }
    });
    var word1End = time + (TWORD1.length - 1) * SOLVE_STAGGER_MS + FLIP_MS;
    t(function () { setTitleBox(titleWordBox, 'blue', true); }, word1End);
    t(function () { setTitleBox(titleWordBox, 'solved', true, 'word'); }, word1End + FLIP_MS / 2);
    t(function () { setTitleBox(titleWordBox, 'solved', false); }, word1End + FLIP_MS);

    time = word1End + FLIP_MS + TITLE_GAP_BETWEEN_WORDS_MS;
    TWORD2.forEach(function (idx, i) { t((function (idx) { return function () { setTitleCell(idx, 'yellow', false); }; })(idx), time + i * TITLE_SWIPE_STAGGER_MS); });
    time += (TWORD2.length - 1) * TITLE_SWIPE_STAGGER_MS + TITLE_SWIPE_HOLD_MS;
    TWORD2.forEach(function (idx, i) {
      var start = time + i * SOLVE_STAGGER_MS;
      t((function (idx) { return function () { setTitleCell(idx, 'yellow', true); }; })(idx), start);
      t((function (idx) { return function () { setTitleCell(idx, 'green', true); }; })(idx), start + FLIP_MS / 2);
      t((function (idx) { return function () { setTitleCell(idx, 'green', false); }; })(idx), start + FLIP_MS);
      if (i > 0) {
        t((function (i) { return function () { word2ConnectedCount = i; renderTitleConnectors(); }; })(i), start + FLIP_MS / 2);
      }
    });
    var word2End = time + (TWORD2.length - 1) * SOLVE_STAGGER_MS + FLIP_MS;
    t(function () { setTitleBox(titleSearchBox, 'blue', true); }, word2End);
    t(function () { setTitleBox(titleSearchBox, 'solved', true, 'search'); }, word2End + FLIP_MS / 2);
    t(function () { setTitleBox(titleSearchBox, 'solved', false); }, word2End + FLIP_MS);

    time = word2End + FLIP_MS + TITLE_SWIPE_HOLD_MS;
    for (var frow = 1; frow <= TROWS; frow++) {
      var frowIndices = []; for (var fcol = 1; fcol <= TCOLS; fcol++) frowIndices.push(tFlatIndex(frow, fcol));
      frowIndices.forEach(function (idx, i) {
        var start = time + i * TITLE_FLOURISH_CELL_STAGGER_MS;
        t((function (idx) { return function () { titleTiles[idx].classList.add('tile-flip'); }; })(idx), start);
        t((function (idx) { return function () { titleTiles[idx].classList.remove('tile-flip'); }; })(idx), start + FLIP_MS);
      });
      time += TITLE_FLOURISH_STAGGER_MS;
    }
    t(function () { titleWordBox.classList.add('tile-flip'); }, time);
    t(function () { titleWordBox.classList.remove('tile-flip'); }, time + FLIP_MS);
    time += TITLE_FLOURISH_STAGGER_MS;
    t(function () { titleSearchBox.classList.add('tile-flip'); }, time);
    t(function () { titleSearchBox.classList.remove('tile-flip'); }, time + FLIP_MS);
    time += FLIP_MS;

    t(onDone, time);
  }

  // ---------- intro reveal sequence (grid + word list) ----------
  function startIntroSequence() {
    var timers = [];
    function t(fn, delay) { timers.push(setTimeout(fn, delay)); }
    var time = 1000;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        var start = time + col * CELL_STAGGER_MS;
        t(function () { introFlippingCell[row][col] = true; renderCell(row, col); }, start);
        t(function () { introRevealedCell[row][col] = true; renderCell(row, col); }, start + FLIP_MS / 2);
        t(function () { introFlippingCell[row][col] = false; renderCell(row, col); }, start + FLIP_MS);
      }
      time += GRID_ROW_STAGGER_MS;
    }
    time += FLIP_MS;

    WORD_DATA.forEach(function (entry, idx) {
      var start = time + idx * STAGGER_MS;
      t(function () { wordRowsState[idx].englishFlipping = true; renderWordRow(idx); }, start);
      t(function () { wordRowsState[idx].englishRevealed = true; renderWordRow(idx); }, start + FLIP_MS / 2);
      t(function () { wordRowsState[idx].englishFlipping = false; renderWordRow(idx); }, start + FLIP_MS);
    });
    var stage2End = WORD_DATA.length > 0 ? time + (WORD_DATA.length - 1) * STAGGER_MS + FLIP_MS : time;
    time = stage2End;

    var stage3MaxEnd = time;
    WORD_DATA.forEach(function (entry, idx) {
      var st = wordRowsState[idx];
      var cursor = time + idx * STAGGER_MS;
      if (st.isPlaced) {
        var hs = cursor;
        t(function () { st.hintFlipping = true; renderWordRow(idx); }, hs);
        t(function () { st.hintRevealed = true; renderWordRow(idx); }, hs + FLIP_MS / 2);
        t(function () { st.hintFlipping = false; renderWordRow(idx); }, hs + FLIP_MS);
        cursor += FLIP_MS;
      }
      st.phonemes.forEach(function (_, li) {
        var ls = cursor;
        t(function () { st.letterFlipping[li] = true; renderWordRow(idx); }, ls);
        t(function () { st.letterRevealed[li] = true; renderWordRow(idx); }, ls + FLIP_MS / 2);
        t(function () { st.letterFlipping[li] = false; renderWordRow(idx); }, ls + FLIP_MS);
        cursor += LETTER_STAGGER_MS;
      });
      cursor = cursor - LETTER_STAGGER_MS + FLIP_MS;
      stage3MaxEnd = Math.max(stage3MaxEnd, cursor);
    });

    t(function () {
      isPlayable = true;
      updateStartNewButton();
      triggerHintIndicatorIfFirstTime();
    }, stage3MaxEnd);
  }

  // ---------- interaction ----------
  function computeStraightPath(start, end) {
    var dRow = end.row - start.row, dCol = end.col - start.col;
    if (dRow === 0 && dCol === 0) return [start];
    var isH = dRow === 0, isV = dCol === 0, isD = Math.abs(dRow) === Math.abs(dCol);
    if (!isH && !isV && !isD) return null;
    var steps = Math.max(Math.abs(dRow), Math.abs(dCol));
    var sr = Math.sign(dRow), sc = Math.sign(dCol);
    var path = [];
    for (var i = 0; i <= steps; i++) path.push({ row: start.row + sr * i, col: start.col + sc * i });
    return path;
  }

  function handleCellMouseDown(r, c) {
    if (!isPlayable) return;
    dragging = true; dragStart = { row: r, col: c }; dragPath = [{ row: r, col: c }];
    releaseHeld = {}; releaseFlipping = {}; hoverKey = null;
    renderAllCells();
  }
  function handleCellMouseEnter(r, c) {
    if (!isPlayable) return;
    if (dragging && dragStart) {
      var path = computeStraightPath(dragStart, { row: r, col: c });
      if (path) { dragPath = path; renderAllCells(); }
    } else {
      hoverKey = cellKey(r, c);
      renderAllCells();
    }
  }
  window.addEventListener('mouseup', function () {
    if (!dragging) return;
    dragging = false;
    var cells = dragPath; dragPath = []; dragStart = null;

    var matched = matchDragToWord(cells, wordPhonemeCells, foundWords);
    if (matched) { renderAllCells(); beginSolveSequence(matched); return; }

    var keys = cells.map(function (c) { return cellKey(c.row, c.col); });
    keys.forEach(function (k) { releaseHeld[k] = true; });
    renderAllCells();
    setTimeout(function () {
      keys.forEach(function (k) { releaseFlipping[k] = true; });
      renderAllCells();
      setTimeout(function () {
        keys.forEach(function (k) { delete releaseHeld[k]; });
        renderAllCells();
        setTimeout(function () {
          keys.forEach(function (k) { delete releaseFlipping[k]; });
          renderAllCells();
        }, FLIP_MS / 2);
      }, FLIP_MS / 2);
    }, 1000);
  });

  // ---------- hint ----------
  function handleHintClick(entry) {
    if (!isPlayable) return;
    if (foundWords[entry.word]) return;
    if (activeSolves[entry.word]) return;
    var cells = wordPhonemeCells[entry.word];
    if (!cells) return;
    var idx = Math.floor(Math.random() * entry.phonemes.length);
    var cell = cells[idx];
    hintActive = { word: entry.word, phonemeIndex: idx, cellKey: cellKey(cell.row, cell.col), revealed: false, flipping: false };

    hintActive.flipping = true; renderAllCells(); renderAllWordRows();
    setTimeout(function () { if (hintActive) { hintActive.revealed = true; renderAllCells(); renderAllWordRows(); } }, FLIP_MS / 2);
    setTimeout(function () { if (hintActive) { hintActive.flipping = false; renderAllCells(); renderAllWordRows(); } }, FLIP_MS);
    setTimeout(function () {
      if (!hintActive) return;
      hintActive.flipping = true; renderAllCells(); renderAllWordRows();
      setTimeout(function () { if (hintActive) { hintActive.revealed = false; renderAllCells(); renderAllWordRows(); } }, FLIP_MS / 2);
      setTimeout(function () { hintActive = null; renderAllCells(); renderAllWordRows(); }, FLIP_MS);
    }, HINT_HOLD_MS);
  }

  // ---------- solve ----------
  function beginSolveSequence(word) {
    var cells = wordPhonemeCells[word];
    if (!cells) return;
    var length = cells.length;

    activeSolves[word] = {
      hintFlipping: false, hintRevealed: false,
      letterFlipping: Array(length).fill(false), letterRevealed: Array(length).fill(false),
      wordBoxFlipping: false, wordBoxRevealed: false
    };
    renderAllCells(); renderAllWordRows();

    var hintStart = SOLVE_HOLD_MS;
    setTimeout(function () { activeSolves[word].hintFlipping = true; renderAllWordRows(); }, hintStart);
    setTimeout(function () { activeSolves[word].hintRevealed = true; renderAllWordRows(); }, hintStart + FLIP_MS / 2);
    setTimeout(function () { activeSolves[word].hintFlipping = false; renderAllWordRows(); }, hintStart + FLIP_MS);

    var lettersStart = hintStart + FLIP_MS;
    for (var i = 0; i < length; i++) {
      (function (i) {
        var start = lettersStart + i * SOLVE_STAGGER_MS;
        setTimeout(function () { activeSolves[word].letterFlipping[i] = true; renderAllCells(); renderAllWordRows(); }, start);
        setTimeout(function () { activeSolves[word].letterRevealed[i] = true; renderAllCells(); renderAllWordRows(); }, start + FLIP_MS / 2);
        setTimeout(function () { activeSolves[word].letterFlipping[i] = false; renderAllCells(); renderAllWordRows(); }, start + FLIP_MS);
      })(i);
    }
    var lettersEnd = lettersStart + (length - 1) * SOLVE_STAGGER_MS + FLIP_MS;
    setTimeout(function () { activeSolves[word].wordBoxFlipping = true; renderAllWordRows(); }, lettersEnd);
    setTimeout(function () { activeSolves[word].wordBoxRevealed = true; renderAllWordRows(); }, lettersEnd + FLIP_MS / 2);
    setTimeout(function () {
      foundWords[word] = true;
      foundCellKeySet = {};
      Object.keys(foundWords).forEach(function (w) { (wordPhonemeCells[w] || []).forEach(function (c) { foundCellKeySet[c.row + ',' + c.col] = true; }); });
      activeSolves[word].wordBoxFlipping = false;
      delete activeSolves[word];
      renderAllCells(); renderAllWordRows();

      var allFound = Object.keys(wordPhonemeCells).every(function (w) { return foundWords[w]; });
      if (allFound && !isPuzzleComplete) { isPuzzleComplete = true; runCompletionSequence(); }
    }, lettersEnd + FLIP_MS);
  }

  // ---------- completion flourish + finale ----------
  function runCompletionSequence() {
    isPlayable = false;
    updateStartNewButton();
    var timers = [];
    function t(fn, delay) { timers.push(setTimeout(fn, delay)); }

    var flourishDuration = (GRID_SIZE - 1) * COMPLETION_ROW_STAGGER_MS + (GRID_SIZE - 1) * COMPLETION_CELL_STAGGER_MS + FLIP_MS;

    for (let row = 0; row < GRID_SIZE; row++) {
      let rowStart = row * COMPLETION_ROW_STAGGER_MS;
      for (let col = 0; col < GRID_SIZE; col++) {
        let key = cellKey(row, col);
        let start = rowStart + col * COMPLETION_CELL_STAGGER_MS;
        t(function () { completionFlipping[key] = true; renderCell(row, col); }, start);
        t(function () { delete completionFlipping[key]; renderCell(row, col); }, start + FLIP_MS);
      }
    }

    var time = flourishDuration + FINALE_WAIT_MS;
    t(function () { finalePhase = 1; greatConnectedCount = 0; renderConnectors(); }, time);

    for (let row2 = 0; row2 < GRID_SIZE; row2++) {
      let rowStart2 = time + row2 * COMPLETION_ROW_STAGGER_MS;
      for (let col2 = 0; col2 < GRID_SIZE; col2++) {
        let start2 = rowStart2 + col2 * COMPLETION_CELL_STAGGER_MS;
        let r2 = row2, c2 = col2;
        t(function () { finaleCellFlipping[r2][c2] = true; renderCell(r2, c2); }, start2);
        t(function () { finaleCellStage[r2][c2] = 1; renderCell(r2, c2); }, start2 + FLIP_MS / 2);
        t(function () { finaleCellFlipping[r2][c2] = false; renderCell(r2, c2); }, start2 + FLIP_MS);

        var specialIdx = specialCells.findIndex(function (sc) { return sc.row === r2 && sc.col === c2; });
        if (specialIdx > 0) {
          t((function (specialIdx) { return function () { greatConnectedCount = specialIdx; renderConnectors(); }; })(specialIdx), start2 + FLIP_MS);
        }
      }
    }
    time += flourishDuration + FINALE_WAIT_MS;
    t(function () { finalePhase = 2; renderConnectors(); }, time);

    for (let row3 = 0; row3 < GRID_SIZE; row3++) {
      var rowStart3 = time + row3 * COMPLETION_ROW_STAGGER_MS;
      for (let col3 = 0; col3 < GRID_SIZE; col3++) {
        var start3 = rowStart3 + col3 * COMPLETION_CELL_STAGGER_MS;
        t(function () { finaleCellFlipping[row3][col3] = true; renderCell(row3, col3); }, start3);
        t(function () { finaleCellStage[row3][col3] = 2; renderCell(row3, col3); }, start3 + FLIP_MS / 2);
        t(function () { finaleCellFlipping[row3][col3] = false; renderCell(row3, col3); }, start3 + FLIP_MS);
      }
    }
    var stage2End = time + flourishDuration;

    t(function () { showGreatBox = true; greatBoxFlipping = true; renderGreatBoxOverlay(); }, stage2End);
    t(function () { greatBoxRevealed = true; renderGreatBoxOverlay(); }, stage2End + FLIP_MS / 2);
    t(function () { greatBoxFlipping = false; renderGreatBoxOverlay(); }, stage2End + FLIP_MS);

    t(function () { startNewPuzzleReady = true; updateStartNewButton(); }, stage2End + FLIP_MS + START_NEW_PUZZLE_HOLD_MS);
  }

  // ---------- boot ----------
  document.getElementById('gridWrap').addEventListener('mouseleave', function () { if (!dragging) { hoverKey = null; } });
  setupPuzzle(INITIAL_WORD_DATA, INITIAL_GRID_SIZE);
  runTitleSequence(function () { startIntroSequence(); });
})();
</script>
</body>
</html>`;
}
