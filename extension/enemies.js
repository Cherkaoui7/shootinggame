/* ============================================================
   enemies.js — Enemy spawning, AI, and standard enemy types
   (grunt, fast, tank, exploder, shooter, shielded, splitter,
   swarmer) plus enemy bullet handling.
   ============================================================ */
import { game, W, H, endGame, spawnExplosion } from './main.js';
import { SFX } from './audio.js';
import { flashDamage } from './ui.js';
import { updateBoss } from './boss.js';

export function spawnEnemy(){
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const m = 60;
  if(side === 0){ x = Math.random()*W; y = -m; }
  else if(side === 1){ x = W + m; y = Math.random()*H; }
  else if(side === 2){ x = Math.random()*W; y = H + m; }
  else { x = -m; y = Math.random()*H; }

  const r = Math.random();
  let type;
  if(game.wave >= 6 && r < 0.16) type = 'splitter';
  else if(game.wave >= 5 && r < 0.32) type = 'shielded';
  else if(game.wave >= 4 && r < 0.48) type = 'tank';
  else if(game.wave >= 3 && r < 0.65) type = 'exploder';
  else if(game.wave >= 3 && r < 0.80) type = 'shooter';
  else if(game.wave >= 2 && r < 0.90) type = 'fast';
  else type = 'grunt';

  const proto = {
    grunt:    { hp:20,  r:13, speed:1.4,  damage:10, score:100, color:'#ff2e7e', sides:6 },
    fast:     { hp:12,  r:10, speed:2.8,  damage:8,  score:150, color:'#ffae00', sides:3 },
    tank:     { hp:90,  r:20, speed:0.7,  damage:20, score:300, color:'#7fff3a', sides:8 },
    shooter:  { hp:28,  r:13, speed:1.0,  damage:12, score:250, color:'#c77dff', sides:4 },
    exploder: { hp:30,  r:14, speed:1.8,  damage:35, score:200, color:'#ff0040', sides:4 },
    shielded: { hp:50,  r:15, speed:1.0,  damage:15, score:300, color:'#00d2ff', sides:8 },
    splitter: { hp:40,  r:18, speed:1.2,  damage:12, score:250, color:'#b400ff', sides:5 },
    swarmer:  { hp:8,   r:7,  speed:3.2,  damage:6,  score:50,  color:'#ff00ff', sides:3 }
  }[type];

  game.enemies.push({
    ...proto, x, y, maxHp: proto.hp, type, vx:0, vy:0,
    angle: Math.random()*Math.PI*2, rotSpeed: (Math.random()-0.5)*0.06,
    shootCooldown: 90 + Math.random()*60, hitFlash:0, spawnTime: 30,
    isDetonating: false, detonateTime: 0
  });
}

// Enemy bullet movement + collision with the player. Returns true if the run ended.
export function updateEnemyBullets(){
  const p = game.player;
  for(let i = game.enemyBullets.length - 1; i >= 0; i--){
    const b = game.enemyBullets[i];
    b.x += b.vx; b.y += b.vy; b.life--;
    if(b.life <= 0 || b.x < -20 || b.x > W+20 || b.y < -20 || b.y > H+20){
      game.enemyBullets.splice(i,1); continue;
    }
    if(p.invuln <= 0 && Math.hypot(b.x - p.x, b.y - p.y) < p.r + b.r){
      p.hp -= b.damage;
      p.invuln = 30;
      flashDamage();
      SFX.damage();
      game.enemyBullets.splice(i,1);
      game.shake = Math.max(game.shake, 6);
      spawnExplosion(b.x, b.y, '#ff2e7e', 8, 0.5);
      if(p.hp <= 0){ endGame(); return true; }
    }
  }
  return false;
}

// Enemy AI, movement, and contact damage. Returns true if the run ended.
export function updateEnemies(){
  const p = game.player;
  for(let i = game.enemies.length - 1; i >= 0; i--){
    const e = game.enemies[i];
    if(e.spawnTime > 0){ e.spawnTime--; e.angle += e.rotSpeed; continue; }

    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    e.angle += e.rotSpeed;

    if (e.type === 'boss') {
      updateBoss(e, p);
    } else if (e.type === 'exploder') {
      const dist = Math.hypot(p.x - e.x, p.y - e.y);
      if (!e.isDetonating) {
        e.x += Math.cos(ang) * e.speed;
        e.y += Math.sin(ang) * e.speed;
        if (dist < 80) {
          e.isDetonating = true;
          e.detonateTime = 30;
          SFX.exploderWarn();
        }
      } else {
        e.detonateTime--;
        if (Math.floor(e.detonateTime/3) % 2 === 0) e.hitFlash = 8;
        if (e.detonateTime <= 0) {
          spawnExplosion(e.x, e.y, e.color, 40, 2.0);
          SFX.explode();
          game.shake = Math.max(game.shake, 8);
          if (dist < 100 && p.invuln <= 0) {
            p.hp -= e.damage;
            p.invuln = 30;
            flashDamage();
            SFX.damage();
            if(p.hp <= 0){ endGame(); return true; }
          }
          game.enemies.splice(i,1);
        }
      }
    } else if (e.type === 'shielded') {
      e.angle = ang;
      e.x += Math.cos(ang) * e.speed;
      e.y += Math.sin(ang) * e.speed;
    } else if (e.type === 'shooter') {
      const dist = Math.hypot(p.x - e.x, p.y - e.y);
      const desired = 240;
      const move = dist > desired ? 1 : -0.6;
      e.x += Math.cos(ang) * e.speed * move;
      e.y += Math.sin(ang) * e.speed * move;
      e.shootCooldown--;
      if(e.shootCooldown <= 0){
        e.shootCooldown = 80 + Math.random()*40;
        game.enemyBullets.push({ x:e.x, y:e.y, vx:Math.cos(ang)*5, vy:Math.sin(ang)*5, damage:8, r:4, life:120, color:'#c77dff' });
      }
    } else {
      e.x += Math.cos(ang) * e.speed;
      e.y += Math.sin(ang) * e.speed;
    }
    if(e.hitFlash > 0) e.hitFlash--;

    if(p.invuln <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r){
      let contactDamage = e.damage;
      if (e.type === 'exploder' && !e.isDetonating) {
        e.isDetonating = true;
        e.detonateTime = 15;
      } else {
        p.hp -= contactDamage;
        p.invuln = 40;
        flashDamage();
        SFX.damage();
        const kAng = Math.atan2(p.y - e.y, p.x - e.x);

        const shoveDist = e.type === 'boss' ? 80 : 40;
        p.x += Math.cos(kAng) * shoveDist;
        p.y += Math.sin(kAng) * shoveDist;
        p.x = Math.max(p.r, Math.min(W - p.r, p.x));
        p.y = Math.max(p.r, Math.min(H - p.r, p.y));

        if (e.type !== 'boss') {
          e.x -= Math.cos(kAng) * 30;
          e.y -= Math.sin(kAng) * 30;
        }

        game.shake = Math.max(game.shake, 8);
        spawnExplosion(p.x, p.y, '#ff2e7e', 12, 0.7);
        if(p.hp <= 0){ endGame(); return true; }
      }
    }
  }
  return false;
}
