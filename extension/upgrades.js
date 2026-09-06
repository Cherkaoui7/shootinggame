/* ============================================================
   upgrades.js — Upgrade definitions and upgrade selection logic
   ============================================================ */
import { game, setState, nextWave } from './main.js';
import { WEAPONS } from './player.js';
import { SFX } from './audio.js';
import { updateUpgradesHUD, updateWeaponPanel } from './ui.js';

export const UPGRADES = [
  { name: "OVERCHARGE", desc: "Weapon Damage +25%", glyph: "⚡", apply: (p) => WEAPONS.forEach(w => w.damage *= 1.25) },
  { name: "RAPID FIRE", desc: "Fire Rate +20%", glyph: "»", apply: (p) => WEAPONS.forEach(w => w.fireRate = Math.max(2, w.fireRate * 0.8)) },
  { name: "VELOCITY", desc: "Projectile Speed +30%", glyph: "➤", apply: (p) => WEAPONS.forEach(w => w.projectileSpeed *= 1.3) },
  { name: "REINFORCED", desc: "Max HP +30 & Full Heal", glyph: "✚", apply: (p) => { p.maxHp += 30; p.hp = p.maxHp; } },
  { name: "ION THRUST", desc: "Move Speed +15%", glyph: "➶", apply: (p) => p.speed *= 1.15 },
  { name: "QUICK DASH", desc: "Dash Cooldown -25%", glyph: "⟫", apply: (p) => p.dashMaxCooldown = Math.max(20, p.dashMaxCooldown * 0.75) },
  { name: "MULTI-SHOT", desc: "+1 Projectile per shot", glyph: "⁂", apply: (p) => WEAPONS.forEach(w => { w.count++; if(w.spread < 0.1) w.spread = 0.1; }) },
  { name: "MAGNETIC", desc: "Projectile Size +30%", glyph: "◎", apply: (p) => WEAPONS.forEach(w => w.projectileSize *= 1.3) },
  { name: "VAMPIRE", desc: "Heal 2 HP per kill", glyph: "♥", apply: (p) => p.lifesteal = (p.lifesteal || 0) + 2 },
  { name: "PIERCING", desc: "Bullets pierce +1 enemy", glyph: "↣", apply: (p) => WEAPONS.forEach(w => w.pierce = (w.pierce || 0) + 1) }
];

export function applyUpgrade(up) {
  up.apply(game.player);
  let existing = game.player.activeUpgrades.find(u => u.name === up.name);
  if (existing) {
    existing.stacks = (existing.stacks || 1) + 1;
  } else {
    game.player.activeUpgrades.push({ name: up.name, glyph: up.glyph, stacks: 1 });
  }
  updateUpgradesHUD();
}

export function showUpgradeScreen() {
  setState('paused');
  const screen = document.getElementById('upgrade-screen');
  screen.classList.remove('hidden');
  const cardsContainer = document.getElementById('upgrade-cards');
  cardsContainer.innerHTML = '';

  const pool = [...UPGRADES];
  const chosen = [];
  for(let i=0; i<3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool[idx]);
    pool.splice(idx, 1);
  }

  chosen.forEach(up => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    // SECURITY: built via textContent (not innerHTML) so upgrade data can never inject markup
    const glyph = document.createElement('div');
    glyph.className = 'glyph';
    glyph.textContent = up.glyph;
    const title = document.createElement('h3');
    title.textContent = up.name;
    const desc = document.createElement('p');
    desc.textContent = up.desc;
    card.append(glyph, title, desc);
    card.addEventListener('click', () => {
      SFX.upgrade();
      applyUpgrade(up);
      screen.classList.add('hidden');
      setState('playing');
      nextWave();
      updateWeaponPanel();
    });
    cardsContainer.appendChild(card);
  });
}
