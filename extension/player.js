/* ============================================================
   player.js — Player logic, movement, weapons, firing mechanics
   ============================================================ */
import { game, W, H, endGame, spawnFloater, spawnExplosion } from './main.js';
import { handleBossDeath } from './boss.js';
import { keys, mouse } from './input.js';
import { SFX } from './audio.js';
import { flashDamage, updateWeaponPanel } from './ui.js';

export const WEAPONS = [
  { name:'PULSE',   damage:10, fireRate:8,  spread:0.04, count:1, projectileSpeed:16, projectileSize:3.5, color:'#00f0ff', ammo:Infinity, type:'single' },
  { name:'SPREAD',  damage:8,  fireRate:28, spread:0.18, count:5, projectileSpeed:13, projectileSize:3,   color:'#ffae00', ammo:60, type:'spread' },
  { name:'RAILGUN', damage:55, fireRate:50, spread:0,    count:1, projectileSpeed:30, projectileSize:5,   color:'#ff2e7e', ammo:25, type:'rail' }
];

export function resetWeapons(){
  WEAPONS[0] = { name:'PULSE',   damage:10, fireRate:8,  spread:0.04, count:1, projectileSpeed:16, projectileSize:3.5, color:'#00f0ff', ammo:Infinity, type:'single', pierce:0 };
  WEAPONS[1] = { name:'SPREAD',  damage:8,  fireRate:28, spread:0.18, count:5, projectileSpeed:13, projectileSize:3,   color:'#ffae00', ammo:60, type:'spread', pierce:0 };
  WEAPONS[2] = { name:'RAILGUN', damage:55, fireRate:50, spread:0,    count:1, projectileSpeed:30, projectileSize:5,   color:'#ff2e7e', ammo:25, type:'rail', pierce:99 };
}

// ===== Player actions =====
export function switchWeapon(idx){
  if(!game || idx < 0 || idx >= WEAPONS.length) return;
  if(WEAPONS[idx].ammo !== Infinity && WEAPONS[idx].ammo <= 0) return;
  game.player.currentWeapon = idx;
  game.player.fireTimer = 0;
  updateWeaponPanel();
}

export function fireWeapon(){
  const p = game.player;
  const w = WEAPONS[p.currentWeapon];
  const baseAngle = Math.atan2(mouse.y - p.y, mouse.x - p.x);

  for(let i = 0; i < w.count; i++){
    const offset = w.count > 1 ? (i - (w.count-1)/2) * w.spread : (Math.random()-0.5)*w.spread;
    const a = baseAngle + offset;
    game.bullets.push({
      x: p.x + Math.cos(a)*20, y: p.y + Math.sin(a)*20,
      vx: Math.cos(a)*w.projectileSpeed, vy: Math.sin(a)*w.projectileSpeed,
      damage: w.damage, r: w.projectileSize, color: w.color,
      life: 60, type: w.type, pierce: w.pierce || 0
    });
  }

  for(let i = 0; i < 6; i++){
    const a = baseAngle + (Math.random()-0.5)*0.6;
    game.particles.push({
      x: p.x + Math.cos(baseAngle)*20, y: p.y + Math.sin(baseAngle)*20,
      vx: Math.cos(a)*(2+Math.random()*3), vy: Math.sin(a)*(2+Math.random()*3),
      r: 2+Math.random()*2, life: 10, maxLife: 10, color: w.color
    });
  }

  p.x -= Math.cos(baseAngle)*1.5;
  p.y -= Math.sin(baseAngle)*1.5;
  game.shake = Math.max(game.shake, w.type === 'rail' ? 6 : 2);
  game.shotsFired += w.count;
  SFX.shoot(w.type);

  if(w.ammo !== Infinity){
    w.ammo--; updateWeaponPanel();
    if(w.ammo <= 0){
      for(let i = 0; i < WEAPONS.length; i++){
        if(WEAPONS[i].ammo > 0 || WEAPONS[i].ammo === Infinity){ switchWeapon(i); break; }
      }
    }
  }
  p.fireTimer = w.fireRate;
}

// Returns the player's actual movement this frame (for parallax stars).
export function updatePlayer(){
  const p = game.player;

  let dx = 0, dy = 0;
  if(keys['KeyW'] || keys['ArrowUp']) dy -= 1;
  if(keys['KeyS'] || keys['ArrowDown']) dy += 1;
  if(keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
  if(keys['KeyD'] || keys['ArrowRight']) dx += 1;
  const len = Math.hypot(dx, dy);
  if(len > 0){ dx/=len; dy/=len; }

  if((keys['ShiftLeft'] || keys['ShiftRight']) && p.dashCooldown <= 0 && len > 0){
    p.dashTime = 12;
    p.dashCooldown = p.dashMaxCooldown;
    p.dashDir = { x: dx, y: dy };
    p.invuln = 14;
    for(let i = 0; i < 16; i++){
      game.particles.push({
        x: p.x, y: p.y, vx: -dx*(2+Math.random()*3), vy: -dy*(2+Math.random()*3),
        r: 2+Math.random()*2, life: 16, maxLife: 16, color: '#00f0ff'
      });
    }
  }

  let actualDx = 0, actualDy = 0;
  if(p.dashTime > 0){
    actualDx = p.dashDir.x * 9;
    actualDy = p.dashDir.y * 9;
    p.dashTime--;
  } else {
    actualDx = dx * p.speed;
    actualDy = dy * p.speed;
  }

  p.x += actualDx;
  p.y += actualDy;

  if (len > 0) {
    p.trailTimer++;
    if (p.trailTimer > 2) {
      p.trailTimer = 0;
      const tAng = Math.atan2(dy, dx);
      game.particles.push({
        x: p.x - Math.cos(tAng) * 10, y: p.y - Math.sin(tAng) * 10,
        vx: -Math.cos(tAng) * 2, vy: -Math.sin(tAng) * 2,
        r: 2 + Math.random() * 2, life: 15, maxLife: 15, color: '#00f0ff'
      });
    }
  }

  if(p.dashCooldown > 0) p.dashCooldown--;
  if(p.invuln > 0) p.invuln--;
  if(p.fireTimer > 0) p.fireTimer--;

  p.x = Math.max(p.r, Math.min(W - p.r, p.x));
  p.y = Math.max(p.r, Math.min(H - p.r, p.y));
  p.angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);

  if(mouse.down && p.fireTimer <= 0) fireWeapon();

  return { dx: actualDx, dy: actualDy };
}

// Bullet movement + bullet/enemy collisions. Returns true if the run ended.
export function updateBullets(){
  const p = game.player;

  for(let i = game.bullets.length - 1; i >= 0; i--){
    const b = game.bullets[i];
    b.x += b.vx; b.y += b.vy; b.life--;
    if(b.type === 'rail'){
      game.particles.push({ x:b.x, y:b.y, vx:-b.vx*0.1, vy:-b.vy*0.1, r:2, life:8, maxLife:8, color:b.color });
    }
    if(b.life <= 0 || b.x < -20 || b.x > W+20 || b.y < -20 || b.y > H+20){
      game.bullets.splice(i,1); continue;
    }

    for(let j = game.enemies.length - 1; j >= 0; j--){
      const e = game.enemies[j];
      if(Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r){

        if (e.type === 'shielded') {
          const angToBullet = Math.atan2(b.y - e.y, b.x - e.x);
          let diff = Math.abs(angToBullet - e.angle);
          if (diff > Math.PI) diff = Math.abs(diff - Math.PI*2);
          if (diff < Math.PI / 2.5) {
            SFX.shieldBlock();
            for(let k = 0; k < 4; k++){
              const a = Math.random()*Math.PI*2;
              game.particles.push({ x:b.x, y:b.y, vx:Math.cos(a)*3, vy:Math.sin(a)*3, r:1.5, life:10, maxLife:10, color:'#00d2ff' });
            }
            game.bullets.splice(i,1);
            break;
          }
        }

        e.hp -= b.damage;
        e.hitFlash = 8;
        game.shotsHit++;
        SFX.hit();
        for(let k = 0; k < 6; k++){
          const a = Math.random()*Math.PI*2;
          game.particles.push({ x:b.x, y:b.y, vx:Math.cos(a)*2, vy:Math.sin(a)*2, r:1.5, life:14, maxLife:14, color:'#ffffff' });
        }

        if(b.type !== 'rail') {
          if(b.pierce > 0) {
            b.pierce--;
          } else {
            game.bullets.splice(i,1);
          }
        }

        if(e.hp <= 0){
          if (e.type === 'boss') {
            handleBossDeath(e);
          } else {
            spawnExplosion(e.x, e.y, e.color, e.type === 'tank' ? 30 : 18, e.type === 'tank' ? 1.6 : 1);
            SFX.explode();

            if (e.type === 'exploder') {
              const dist = Math.hypot(p.x - e.x, p.y - e.y);
              if (dist < 100 && p.invuln <= 0) {
                p.hp -= e.damage;
                p.invuln = 30;
                flashDamage();
                SFX.damage();
                if(p.hp <= 0){ endGame(); return true; }
              }
              spawnExplosion(e.x, e.y, e.color, 40, 2.0);
            }

            if (e.type === 'splitter') {
              for(let s=0; s<3; s++) {
                const sa = (s / 3) * Math.PI * 2;
                game.enemies.push({
                  hp:8, r:7, speed:3.2, damage:6, score:50, color:'#ff00ff', sides:3,
                  x: e.x + Math.cos(sa)*20, y: e.y + Math.sin(sa)*20, maxHp: 8, type: 'swarmer', vx: 0, vy: 0,
                  angle: 0, rotSpeed: 0.1, shootCooldown: 0, hitFlash: 0, spawnTime: 15
                });
              }
            }

            if(game.kills >= game.nextPickupKills){
              game.nextPickupKills += 6 + Math.floor(Math.random()*5);
              const types = ['health','ammo','weapon'];
              const dropType = types[Math.floor(Math.random()*types.length)];
              game.pickups.push({ x:e.x, y:e.y, type: dropType, life: 600, r: 12 });
            }
          }
          const gained = Math.floor(e.score * game.combo);
          game.score += gained;
          game.kills++;
          spawnFloater(e.x, e.y, '+'+gained, e.color);
          game.combo = Math.min(8, game.combo + 1);
          game.comboTimer = 120;

          if(p.lifesteal > 0) {
            p.hp = Math.min(p.maxHp, p.hp + p.lifesteal);
          }
          game.enemies.splice(j,1);
        }
        break;
      }
    }
  }

  return false;
}
