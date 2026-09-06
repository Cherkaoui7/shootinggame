/* ============================================================
   audio.js — Web Audio API sound synthesis + SFX
   ============================================================ */
let audioCtx = null;

export function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(freq, type, duration, volume = 0.1, freqEnd = null) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(0.01, freqEnd), audioCtx.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e){}
}

function playNoise(duration, volume = 0.2, filterFreq = 1000) {
  if (!audioCtx) return;
  try {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start(); noise.stop(audioCtx.currentTime + duration);
  } catch(e){}
}

export const SFX = {
  shoot: (type) => {
    if (type === 'single') playSound(800, 'square', 0.08, 0.04, 200);
    else if (type === 'spread') playSound(400, 'sawtooth', 0.1, 0.05, 100);
    else if (type === 'rail') {
      playSound(1200, 'sawtooth', 0.2, 0.08, 100);
      playNoise(0.2, 0.05, 2000);
    }
  },
  hit: () => playSound(1200, 'square', 0.04, 0.06),
  explode: () => {
    playSound(100, 'sawtooth', 0.3, 0.15, 20);
    playNoise(0.3, 0.2, 400);
  },
  damage: () => {
    playNoise(0.2, 0.3, 200);
    playSound(150, 'sawtooth', 0.2, 0.2, 50);
  },
  pickup: () => {
    playSound(600, 'sine', 0.1, 0.1, 1200);
    setTimeout(() => playSound(900, 'sine', 0.1, 0.1, 1800), 80);
  },
  upgrade: () => {
    playSound(400, 'sine', 0.15, 0.1, 800);
    setTimeout(() => playSound(600, 'sine', 0.15, 0.1, 1200), 100);
    setTimeout(() => playSound(800, 'sine', 0.2, 0.1, 1600), 200);
  },
  bossSpawn: () => {
    playSound(80, 'sawtooth', 1.5, 0.2, 40);
    playNoise(1.5, 0.15, 300);
  },
  bossAttack: () => {
    playSound(200, 'sawtooth', 0.4, 0.1, 800);
  },
  bossDeath: () => {
    playSound(50, 'sawtooth', 1.0, 0.3, 10);
    playNoise(1.0, 0.3, 800);
    setTimeout(() => playSound(100, 'sawtooth', 0.5, 0.2, 20), 300);
  },
  shieldBlock: () => playSound(300, 'sine', 0.05, 0.08),
  exploderWarn: () => playSound(1000, 'square', 0.1, 0.05, 1500)
};
