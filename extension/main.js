/* ============================================================
   VOID PROTOCOL — Arena Shooter
   main.js — Core game loop, state management, and initialization
   ============================================================ */
import { initAudio, SFX } from './audio.js';
import { keys, initInput } from './input.js';
import { getBestScore, submitScore } from './storage.js';
import { canvas, ctx, initStars, updateStars, render } from './render.js';
import { updateWeaponPanel, updateUpgradesHUD, updateBestStatsMenu, updateLowHpVignette, updateHUD } from './ui.js';
import { WEAPONS, resetWeapons, updatePlayer, updateBullets } from './player.js';
import { spawnEnemy, updateEnemies, updateEnemyBullets } from './enemies.js';
import { spawnBoss } from './boss.js';
import { showUpgradeScreen } from './upgrades.js';

// ===== Viewport =====
export let W = window.innerWidth, H = window.innerHeight;
function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// ===== Shared Game State =====
// Shared with other modules via ES module live bindings. Since imported
// bindings are read-only, reassignment happens here and via setState().
export let state = 'menu';
export let game = null;

export function setState(s) {
  state = s;
}

export function newGame(){
  resetWeapons();

  return {
    player:{ x:W/2, y:H/2, r:14, hp:100, maxHp:100, speed:3.6, dashCooldown:0, dashMaxCooldown:90, dashTime:0, dashDir:{x:0,y:0}, invuln:0, angle:0, currentWeapon:0, fireTimer:0, lifesteal:0, activeUpgrades:[], trailTimer:0 },
    bullets:[], enemyBullets:[], enemies:[], particles:[], pickups:[], floaters:[], shockwaves:[],
    bossActive: false,
    wave:0, waveEnemies:0, waveInterval:60, upgradePhase:false,
    score:0, kills:0, shotsFired:0, shotsHit:0, combo:1, comboTimer:0,
    shake:0, time:0, elapsed:0, paused:false,
    nextPickupKills:8,
    bgStars: initStars()
  };
}

// ===== Particles & FX =====
export function spawnExplosion(x, y, color, count=18, scale=1){
  for(let i = 0; i < count; i++){
    const a = Math.random() * Math.PI * 2;
    const s = (1 + Math.random()*4) * scale;
    game.particles.push({
      x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s,
      r: (1+Math.random()*3)*scale, life: 20+Math.random()*20, maxLife: 40, color
    });
  }
  game.shockwaves.push({ x, y, r: 4, maxR: 40*scale, life: 20, color });
  game.shake = Math.max(game.shake, 4*scale);
}

export function spawnFloater(x, y, text, color){
  game.floaters.push({ x, y, vy: -1.2, text, color, life: 50, maxLife: 50 });
}

// ===== Flow Control =====
function startGame(){
  initAudio();
  game = newGame();
  state = 'playing';
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('new-record').style.display = 'none';
  document.getElementById('hud').classList.add('active');
  document.getElementById('boss-hud').classList.remove('active');
  nextWave();
  updateWeaponPanel();
  updateUpgradesHUD();
}

export function endGame(){
  state = 'gameover';
  document.getElementById('hud').classList.remove('active');
  document.getElementById('boss-hud').classList.remove('active');
  document.getElementById('gameover-screen').classList.remove('hidden');

  const finalScore = Math.floor(game.score);
  document.getElementById('end-score').textContent = finalScore;
  document.getElementById('end-wave').textContent = game.wave;
  document.getElementById('end-kills').textContent = game.kills;

  const newRecord = submitScore(finalScore, game.wave);

  if (newRecord) {
    document.getElementById('new-record').style.display = 'block';
  }
  updateBestStatsMenu();
}

function returnToMenu() {
  state = 'menu';
  document.getElementById('menu-screen').classList.remove('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('pause-overlay').classList.remove('show');
  document.getElementById('upgrade-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('active');
  document.getElementById('boss-hud').classList.remove('active');
}

export function togglePause(){
  if(state === 'playing'){ state = 'paused'; document.getElementById('pause-overlay').classList.add('show'); }
  else if(state === 'paused'){ state = 'playing'; document.getElementById('pause-overlay').classList.remove('show'); }
}

// ===== Waves =====
export function nextWave(){
  game.wave++;
  game.upgradePhase = false;
  game.waveInterval = 60;

  if (game.wave % 5 === 0) {
    spawnBoss();
    game.waveEnemies = 1;
    document.getElementById('wave-banner-text').textContent = `BOSS`;
    document.querySelector('.wave-banner .small').textContent = `WARNING`;
    document.getElementById('boss-hud').classList.add('active');
    SFX.bossSpawn();
  } else {
    game.waveEnemies = Math.floor(4 + game.wave * 2.4);
    document.getElementById('wave-banner-text').textContent = `WAVE ${game.wave}`;
    document.querySelector('.wave-banner .small').textContent = `INCOMING`;
    document.getElementById('boss-hud').classList.remove('active');
  }

  const banner = document.getElementById('wave-banner');
  banner.classList.remove('show'); void banner.offsetWidth;
  banner.classList.add('show');
}

// ===== Update =====
function update(dt){
  if(state !== 'playing') return;
  game.time += dt/60;
  game.elapsed += dt;

  const p = game.player;

  updateLowHpVignette(p);

  const move = updatePlayer();
  updateStars(move.dx, move.dy);

  if (updateBullets()) return;
  if (updateEnemyBullets()) return;
  if (updateEnemies()) return;

  for(let i = game.pickups.length - 1; i >= 0; i--){
    const pk = game.pickups[i];
    pk.life--;
    if(pk.life <= 0){ game.pickups.splice(i,1); continue; }
    if(Math.hypot(pk.x - p.x, pk.y - p.y) < p.r + pk.r){
      if(pk.type === 'health'){ p.hp = Math.min(p.maxHp, p.hp + 35); spawnFloater(p.x, p.y - 20, '+35 HP', '#7fff3a'); }
      else if(pk.type === 'ammo'){ WEAPONS[1].ammo += 30; WEAPONS[2].ammo += 12; updateWeaponPanel(); spawnFloater(p.x, p.y - 20, 'AMMO', '#ffae00'); }
      else if(pk.type === 'weapon'){ WEAPONS[2].ammo += 20; updateWeaponPanel(); spawnFloater(p.x, p.y - 20, 'RAILGUN +20', '#ff2e7e'); }
      SFX.pickup();
      spawnExplosion(pk.x, pk.y, pk.type === 'health' ? '#7fff3a' : pk.type === 'ammo' ? '#ffae00' : '#ff2e7e', 20, 1);
      game.pickups.splice(i,1);
    }
  }

  for(let i = game.particles.length - 1; i >= 0; i--){
    const pt = game.particles[i];
    pt.x += pt.vx; pt.y += pt.vy; pt.vx *= 0.95; pt.vy *= 0.95; pt.life--;
    if(pt.life <= 0) game.particles.splice(i,1);
  }
  for(let i = game.floaters.length - 1; i >= 0; i--){
    const f = game.floaters[i];
    f.y += f.vy; f.vy *= 0.96; f.life--;
    if(f.life <= 0) game.floaters.splice(i,1);
  }
  for(let i = game.shockwaves.length - 1; i >= 0; i--){
    const s = game.shockwaves[i];
    s.r += (s.maxR - s.r) * 0.18; s.life--;
    if(s.life <= 0) game.shockwaves.splice(i,1);
  }

  if(game.combo > 1){ game.comboTimer--; if(game.comboTimer <= 0) game.combo = 1; }

  if(game.waveEnemies > 0 && game.waveInterval <= 0 && !game.bossActive){
    spawnEnemy(); game.waveEnemies--; game.waveInterval = Math.max(20, 70 - game.wave * 2);
  } else { game.waveInterval--; }

  if(game.waveEnemies === 0 && game.enemies.length === 0 && !game.upgradePhase){
    game.upgradePhase = true;
    showUpgradeScreen();
  }

  if(game.shake > 0) game.shake *= 0.88;

  updateHUD();
}

// ===== Main Loop =====
let last = performance.now();
function loop(now){
  const dt = Math.min(2, (now - last) / 16.67);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ===== Initialization =====
updateBestStatsMenu();
initInput(canvas);

// NOTE: PWA service-worker registration is disabled in the extension build;
// extension pages are offline by definition.

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', returnToMenu);
document.getElementById('pause-menu-btn').addEventListener('click', returnToMenu);
document.getElementById('pause-restart-btn').addEventListener('click', () => {
  document.getElementById('pause-overlay').classList.remove('show');
  startGame();
});

requestAnimationFrame(loop);
