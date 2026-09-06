/* ============================================================
   render.js — All Canvas drawing functions (stars, grid,
   player, enemies, boss, pickups, particles, crosshair)
   ============================================================ */
import { game, state, W, H } from './main.js';
import { mouse } from './input.js';

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');

// ===== Parallax Stars =====
export function initStars() {
  const stars = [];
  for(let i=0; i<150; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.2,
      z: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  return stars;
}

export function updateStars(dx, dy) {
  if(!game) return;
  for(let s of game.bgStars) {
    s.x -= dx * s.z * 0.5;
    s.y -= dy * s.z * 0.5;
    s.twinkle += 0.05;
    if(s.x < 0) s.x += W;
    if(s.x > W) s.x -= W;
    if(s.y < 0) s.y += H;
    if(s.y > H) s.y -= H;
  }
}

export function drawStars() {
  if(!game) return;
  ctx.save();
  for(let s of game.bgStars) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(s.twinkle) * 0.2})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

export function render(){
  ctx.fillStyle = '#06030d';
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/2);
  grad.addColorStop(0, 'rgba(20,10,40,0.4)');
  grad.addColorStop(1, 'rgba(6,3,13,0.8)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  if(game && game.shake > 0.5){
    ctx.translate((Math.random()-0.5)*game.shake, (Math.random()-0.5)*game.shake);
  }

  if(game){
    drawStars();
    drawGrid();
    game.pickups.forEach(drawPickup);
    game.shockwaves.forEach(s => {
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = s.life / 20;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    game.bullets.forEach(b => {
      ctx.save();
      ctx.shadowBlur = 16;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
      if(b.type === 'rail'){
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(b.x - b.vx*1.5, b.y - b.vy*1.5);
        ctx.lineTo(b.x + b.vx*0.3, b.y + b.vy*0.3);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    });
    game.enemyBullets.forEach(b => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
    game.particles.forEach(pt => {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    game.enemies.forEach(drawEnemy);
    drawPlayer(game.player);
    game.floaters.forEach(f => {
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.life / 30);
      ctx.fillStyle = f.color;
      ctx.font = 'bold 18px Orbitron';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 12;
      ctx.shadowColor = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    });
  }

  ctx.restore();

  if(state === 'playing'){
    drawCrosshair();
  }
}

function drawGrid(){
  const size = 60;
  ctx.strokeStyle = 'rgba(0,240,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for(let x = 0; x < W; x += size){ ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for(let y = 0; y < H; y += size){ ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,240,255,0.12)';
  ctx.beginPath();
  for(let x = 0; x < W; x += size*5){ ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for(let y = 0; y < H; y += size*5){ ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

function drawPlayer(p){
  if(!p) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  if(p.dashTime > 0){
    ctx.fillStyle = 'rgba(0,240,255,0.3)';
    ctx.beginPath(); ctx.arc(0, 0, p.r + 12, 0, Math.PI*2); ctx.fill();
  }
  if(p.invuln > 0 && Math.floor(p.invuln/3) % 2 === 0){
    ctx.globalAlpha = 0.5;
  }
  ctx.rotate(p.angle);
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#00f0ff';
  ctx.fillStyle = '#0a1828';
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.r, 0);
  ctx.lineTo(-p.r*0.8, p.r*0.7);
  ctx.lineTo(-p.r*0.5, 0);
  ctx.lineTo(-p.r*0.8, -p.r*0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ff2e7e';
  const t = game.time * 30 % 6;
  ctx.beginPath();
  ctx.moveTo(-p.r*0.5, 2);
  ctx.lineTo(-p.r*0.5 - 6 - t, 0);
  ctx.lineTo(-p.r*0.5, -2);
  ctx.fill();
  ctx.restore();
}

function drawEnemy(e){
  ctx.save();
  ctx.translate(e.x, e.y);

  if (e.type === 'boss') {
    drawBoss(e);
  } else {
    if(e.spawnTime > 0){
      const t = 1 - e.spawnTime / 30;
      ctx.globalAlpha = t;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * (2 - t), 0, Math.PI*2);
      ctx.stroke();
      ctx.globalAlpha = t;
    }

    if (e.type === 'shielded') {
      ctx.save();
      ctx.rotate(e.angle);
      ctx.strokeStyle = '#00d2ff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00d2ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, e.r + 6, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.stroke();
      ctx.restore();
    }

    ctx.rotate(e.angle);
    const flash = e.hitFlash > 0;
    ctx.shadowBlur = 14;
    ctx.shadowColor = e.color;
    ctx.fillStyle = flash ? '#fff' : '#0a0612';
    ctx.strokeStyle = flash ? '#fff' : e.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sides = e.sides;
    for(let i = 0; i < sides; i++){
      const a = (i / sides) * Math.PI * 2;
      const r = i % 2 === 0 ? e.r : e.r * 0.75;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 6;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.restore();

  if(e.hp < e.maxHp && e.spawnTime <= 0 && e.type !== 'boss' && e.type !== 'swarmer'){
    const w = e.r * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(e.x - w/2, e.y - e.r - 10, w, 3);
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x - w/2, e.y - e.r - 10, w * (e.hp / e.maxHp), 3);
  }
}

function drawBoss(e) {
  if(e.spawnTime > 0){
    const t = 1 - e.spawnTime / 60;
    ctx.globalAlpha = t;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, e.r * (2 - t), 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = t;
  }

  const flash = e.hitFlash > 0;

  ctx.save();
  ctx.rotate(e.angle);
  ctx.shadowBlur = 24;
  ctx.shadowColor = e.color;
  ctx.strokeStyle = flash ? '#fff' : e.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for(let i = 0; i < 12; i++) {
    const a1 = (i / 12) * Math.PI * 2;
    const a2 = ((i + 0.5) / 12) * Math.PI * 2;
    ctx.arc(0, 0, e.r, a1, a2);
    ctx.moveTo(Math.cos(a2) * e.r, Math.sin(a2) * e.r);
  }
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.rotate(-e.angle * 2);
  ctx.fillStyle = flash ? '#fff' : '#0a0612';
  ctx.strokeStyle = flash ? '#fff' : e.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for(let i = 0; i < 6; i++){
    const a = (i / 6) * Math.PI * 2;
    const r = i % 2 === 0 ? e.r * 0.6 : e.r * 0.4;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 12;
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawPickup(pk){
  const colors = { health:'#7fff3a', ammo:'#ffae00', weapon:'#ff2e7e' };
  const c = colors[pk.type];
  const pulse = Math.sin(game.time * 6) * 0.3 + 1;
  ctx.save();
  ctx.translate(pk.x, pk.y);
  ctx.strokeStyle = c;
  ctx.shadowBlur = 16;
  ctx.shadowColor = c;
  ctx.lineWidth = 2;
  ctx.globalAlpha = pk.life < 60 ? (Math.floor(pk.life/6) % 2 === 0 ? 1 : 0.3) : 1;
  ctx.beginPath();
  ctx.arc(0, 0, pk.r * pulse, 0, Math.PI*2);
  ctx.stroke();
  ctx.fillStyle = c;
  ctx.globalAlpha *= 0.3;
  ctx.beginPath();
  ctx.arc(0, 0, pk.r * 0.6, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#06030d';
  ctx.font = 'bold 12px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pk.type === 'health' ? '+' : pk.type === 'ammo' ? 'A' : 'R', 0, 1);
  ctx.restore();
}

function drawCrosshair(){
  const x = mouse.x, y = mouse.y;
  ctx.save();
  ctx.strokeStyle = '#00f0ff';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#00f0ff';
  ctx.lineWidth = 1.5;
  const s = 10, g = 4;
  ctx.beginPath();
  ctx.moveTo(x - s, y); ctx.lineTo(x - g, y);
  ctx.moveTo(x + g, y); ctx.lineTo(x + s, y);
  ctx.moveTo(x, y - s); ctx.lineTo(x, y - g);
  ctx.moveTo(x, y + g); ctx.lineTo(x, y + s);
  ctx.stroke();
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
