/* ============================================================
   ui.js — DOM updates (HUD, score, health bars, menu screens)
   ============================================================ */
import { game } from './main.js';
import { WEAPONS, switchWeapon } from './player.js';
import { getBestScore, getBestWave } from './storage.js';

export function updateWeaponPanel(){
  const panel = document.getElementById('weapon-panel');
  panel.innerHTML = '';
  WEAPONS.forEach((w, i) => {
    const slot = document.createElement('div');
    slot.className = 'weapon-slot' + (i === game.player.currentWeapon ? ' active' : '');
    // SECURITY: built via textContent (not innerHTML) so weapon data can never inject markup
    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = `[${i+1}]`;
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = w.name;
    const ammo = document.createElement('div');
    ammo.className = 'ammo';
    ammo.textContent = w.ammo === Infinity ? '∞' : w.ammo;
    slot.append(num, name, ammo);
    slot.addEventListener('click', () => switchWeapon(i));
    panel.appendChild(slot);
  });
}

export function updateUpgradesHUD() {
  const container = document.getElementById('active-upgrades-list');
  container.innerHTML = '';
  game.player.activeUpgrades.forEach(up => {
    const div = document.createElement('div');
    div.className = 'upgrade-icon';
    div.title = up.name;
    // SECURITY: textContent instead of innerHTML — upgrade glyphs/names are constants today,
    // but this keeps the sink safe if they ever come from external data
    div.textContent = up.glyph;
    if (up.stacks > 1) {
      const stacks = document.createElement('span');
      stacks.className = 'stacks';
      stacks.textContent = up.stacks;
      div.appendChild(stacks);
    }
    container.appendChild(div);
  });
}

export function updateBestStatsMenu() {
  document.getElementById('menu-best-score').textContent = getBestScore();
  document.getElementById('menu-best-wave').textContent = getBestWave();
}

export function flashDamage(){
  const f = document.getElementById('damage-flash');
  f.style.opacity = '1';
  setTimeout(() => f.style.opacity = '0', 100);
}

export function updateLowHpVignette(p) {
  const lowHpVig = document.getElementById('low-hp-vignette');
  if (p.hp / p.maxHp < 0.3) {
    lowHpVig.style.opacity = 1;
  } else {
    lowHpVig.style.opacity = 0;
  }
}

export function updateHUD(){
  const p = game.player;
  document.getElementById('score').textContent = Math.floor(game.score);
  document.getElementById('wave').textContent = game.wave;
  document.getElementById('combo').textContent = 'x' + game.combo;
  document.getElementById('kills').textContent = game.kills;
  document.getElementById('accuracy').textContent = (game.shotsFired === 0 ? 0 : Math.round(game.shotsHit / game.shotsFired * 100)) + '%';
  const m = Math.floor(game.elapsed / 3600), s = Math.floor((game.elapsed / 60) % 60);
  document.getElementById('time').textContent = m + ':' + String(s).padStart(2,'0');
  document.getElementById('hp-fill').style.width = Math.max(0, p.hp / p.maxHp * 100) + '%';
  document.getElementById('hp-text').textContent = Math.max(0, Math.floor(p.hp));
  document.getElementById('dash-fill').style.width = (1 - p.dashCooldown / p.dashMaxCooldown) * 100 + '%';
  document.getElementById('dash-text').textContent = p.dashCooldown <= 0 ? 'READY' : Math.ceil(p.dashCooldown/60*10)/10 + 's';

  if (game.bossActive && game.enemies.length > 0 && game.enemies[0].type === 'boss') {
    const boss = game.enemies[0];
    document.getElementById('boss-hp-fill').style.width = Math.max(0, boss.hp / boss.maxHp * 100) + '%';
  }
}
