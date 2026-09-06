/* ============================================================
   boss.js — Boss spawning, attack patterns, and phase logic
   ============================================================ */
import { game, W, H, spawnFloater, spawnExplosion } from './main.js';
import { SFX } from './audio.js';

export function spawnBoss() {
  const hp = 800 + game.wave * 120;
  game.bossActive = true;
  game.enemies.push({
    type: 'boss',
    x: W/2, y: -100,
    r: 50,
    hp: hp, maxHp: hp,
    speed: 0.8, damage: 30, score: 5000,
    color: '#ff2e7e',
    angle: 0, rotSpeed: 0.01, hitFlash:0, spawnTime: 60,
    phase: 1, attackTimer: 120, currentAttack: 0,
    telegraph: 0, isCharging: false, chargeDir: {x:0, y:0}
  });
}

export function updateBoss(e, p) {
  if (e.phase === 1 && e.hp <= e.maxHp / 2) {
    e.phase = 2;
    e.color = '#ffae00';
    SFX.bossSpawn();
    spawnFloater(e.x, e.y, 'ENRAGED', '#ffae00');
  }

  if (e.isCharging) {
    e.x += e.chargeDir.x * 14;
    e.y += e.chargeDir.y * 14;

    if (e.x <= e.r || e.x >= W - e.r || e.y <= e.r || e.y >= H - e.r) {
      e.x = Math.max(e.r, Math.min(W - e.r, e.x));
      e.y = Math.max(e.r, Math.min(H - e.r, e.y));
      e.isCharging = false;
      e.attackTimer = e.phase === 2 ? 80 : 120;
      spawnExplosion(e.x, e.y, e.color, 30, 1.5);
      game.shake = Math.max(game.shake, 10);
    }
  } else {
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    e.x += Math.cos(ang) * e.speed;
    e.y += Math.sin(ang) * e.speed;
    e.x = Math.max(e.r, Math.min(W - e.r, e.x));
    e.y = Math.max(e.r, Math.min(H - e.r, e.y));

    e.attackTimer--;
    if (e.attackTimer <= 0) {
      executeBossAttack(e, p);
    }
  }
}

function executeBossAttack(e, p) {
  const attackType = e.currentAttack % 3;
  if (attackType === 0) {
    SFX.bossAttack();
    const numBullets = e.phase === 2 ? 24 : 16;
    const offset = Math.random() * Math.PI * 2;
    for (let i = 0; i < numBullets; i++) {
      const a = (i / numBullets) * Math.PI * 2 + offset;
      game.enemyBullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
        damage: 12, r: 5, life: 200, color: e.color
      });
    }
    e.attackTimer = e.phase === 2 ? 60 : 90;
  } else if (attackType === 1) {
    SFX.bossSpawn();
    const count = e.phase === 2 ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sx = e.x + Math.cos(a) * 60;
      const sy = e.y + Math.sin(a) * 60;
      game.enemies.push({
        hp: 20, r: 10, speed: 2.8, damage: 8, score: 150, color: '#ffae00', sides: 3,
        x: sx, y: sy, maxHp: 20, type: 'fast', vx: 0, vy: 0, angle: 0, rotSpeed: 0.06,
        shootCooldown: 0, hitFlash: 0, spawnTime: 20
      });
    }
    e.attackTimer = e.phase === 2 ? 100 : 140;
  } else {
    e.isCharging = true;
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    e.chargeDir = { x: Math.cos(ang), y: Math.sin(ang) };
    e.attackTimer = 1000;
  }
  e.currentAttack++;
}

export function handleBossDeath(e) {
  spawnExplosion(e.x, e.y, e.color, 80, 3.0);
  spawnExplosion(e.x, e.y, '#fff', 40, 2.0);
  SFX.bossDeath();
  game.shake = 20;
  game.bossActive = false;
  document.getElementById('boss-hud').classList.remove('active');

  game.pickups.push({ x: e.x - 30, y: e.y, type: 'health', life: 600, r: 12 });
  game.pickups.push({ x: e.x, y: e.y, type: 'ammo', life: 600, r: 12 });
  game.pickups.push({ x: e.x + 30, y: e.y, type: 'weapon', life: 600, r: 12 });
}
