/* ============================================================
   storage.js — LocalStorage high score persistence
   ============================================================ */
let bestScore = 0;
let bestWave = 0;

try {
  bestScore = parseInt(localStorage.getItem('voidProtocol_bestScore') || '0', 10);
  bestWave = parseInt(localStorage.getItem('voidProtocol_bestWave') || '0', 10);
} catch(e) {}

export function getBestScore() {
  return bestScore;
}

export function getBestWave() {
  return bestWave;
}

// Persists a finished run; returns true if a new record was set.
export function submitScore(finalScore, wave) {
  let newRecord = false;
  try {
    if (finalScore > bestScore) {
      bestScore = finalScore;
      localStorage.setItem('voidProtocol_bestScore', bestScore);
      newRecord = true;
    }
    if (wave > bestWave) {
      bestWave = wave;
      localStorage.setItem('voidProtocol_bestWave', bestWave);
      newRecord = true;
    }
  } catch(e) {}
  return newRecord;
}
