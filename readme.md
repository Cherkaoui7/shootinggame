
# 🌌 VOID PROTOCOL

A fast-paced, top-down neon arena shooter built entirely with vanilla HTML5, CSS, and JavaScript. Survive endless waves of geometric enemies, defeat massive multi-phase bosses, and collect roguelite-style upgrades to forge an unstoppable build.

![Status](https://img.shields.io/badge/Status-Complete-brightgreen)![License](https://img.shields.io/badge/License-MIT-blue)![Tech](<https://img.shields.io/badge/Tech-HTML5%20%2F%20Vanilla%20JS-ff69b4>)

---

## 📋 Table of Contents

1. [About the Game](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#-about-the-game)
2. [Features](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#-features)
3. [Controls](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#-controls)
4. [Gameplay Mechanics](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#-gameplay-mechanics)
   * [Weapons](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#weapons)
   * [Enemies](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#enemies)
   * [Bosses](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#bosses)
   * [Upgrades](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#upgrades)
5. [Project Structure](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#-project-structure)
6. [Technical Highlights](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#-technical-highlights)
7. [How to Run](https://chat.z.ai/c/8cd7b1d6-c57d-4d70-9481-498e57ee0a98#-how-to-run)

---

## 🎮 About the Game

You are a lone pilot trapped in the  **VOID** . With no escape, your only option is to survive as long as possible against an endless onslaught of hostile entities. Every 5 waves, a massive **VOID WARDEN** descends upon the arena. Defeat it, harvest its energy, and upgrade your ship to push further into the abyss.

## ✨ Features

* **Roguelite Upgrade System** : Choose 1 of 3 random augmentations after every wave. Stack them to create overpowered combos.
* **Procedural Audio Engine** : All sounds (shooting, explosions, UI clicks) are synthesized in real-time using the Web Audio API. No audio files needed.
* **Dynamic Visuals** : Parallax starfields, screen shake, particle explosions, scanlines, and a low-HP pulsing vignette.
* **Local High Score Tracking** : Your best score and furthest wave are saved to your browser's LocalStorage.
* **Zero Dependencies** : Pure vanilla code. No frameworks, no libraries, no build steps.

---

## ⌨️ Controls

| Input                                  | Action                                  |
| -------------------------------------- | --------------------------------------- |
| **W A S D**/**Arrow Keys** | Pilot movement                          |
| **Mouse**                        | Aim direction                           |
| **Left Click**(Hold)             | Fire weapon                             |
| **Shift**                        | Burst Dash (i-frames + cooldown)        |
| **1 , 2 , 3**                    | Switch weapons (Pulse, Spread, Railgun) |
| **P**/**Esc**              | Pause game                              |

---

## ⚙️ Gameplay Mechanics

### Weapons

* **PULSE** `[1]`: Infinite ammo, rapid-fire single shot.
* **SPREAD** `[2]`: Fires a 5-projectile spread. Limited ammo.
* **RAILGUN** `[3]`: High damage, pierces all enemies. Very limited ammo.

### Enemies

* **Grunt** : Standard chaser.
* **Fast** : Low HP, high speed.
* **Tank** : High HP, slow, heavy contact damage.
* **Shooter** : Keeps distance and fires purple projectiles.
* **Exploder** : Kamikaze unit. Flashes red and detonates an AoE blast if it gets close.
* **Shielded** : Has a frontal energy shield that deflects bullets. Must be flanked.
* **Splitter** : Breaks into 3 fast Swarmers when killed.
* **Swarmer** : Tiny, very fast, spawned by Splitters.

### Bosses

Every 5th wave (Wave 5, 10, 15...) triggers a  **BOSS WAVE** .

* **Void Warden** : A massive entity with 3 attack patterns: Radial bullet hell, minion summoning, and a high-speed telegraphed charge.
* **Phase 2** : At 50% HP, the boss enrages (turns amber), speeds up, and summons more minions. Drops guaranteed loot on death.

### Upgrades

Clearing a wave pauses the game and presents 3 random cards:

1. **Overcharge** : Weapon Damage +25%
2. **Rapid Fire** : Fire Rate +20%
3. **Velocity** : Projectile Speed +30%
4. **Reinforced** : Max HP +30 & Full Heal
5. **Ion Thrust** : Move Speed +15%
6. **Quick Dash** : Dash Cooldown -25%
7. **Multi-Shot** : +1 Projectile per shot
8. **Magnetic** : Projectile Size +30%
9. **Vampire** : Heal 2 HP per kill
10. **Piercing** : Bullets pierce +1 enemy

---

## 📁 Project Structure

The codebase is organized into ES6 modules (using native `import`/`export`) so no single file becomes unwieldy:

```
shooting game/
├── index.html      # HTML structure only; loads styles.css and main.js as a module
├── styles.css      # All CSS styling (HUD, screens, upgrade cards, effects)
├── main.js         # Entry point: game loop, shared state, wave flow, initialization
├── input.js        # Keyboard, mouse, and touch event listeners
├── audio.js        # Web Audio API sound synthesis + SFX object
├── player.js       # Player movement, dash, weapons, and firing mechanics
├── enemies.js      # Enemy spawning, AI, and standard enemy types
├── boss.js         # Boss spawning, attack patterns, and phase logic
├── upgrades.js     # Upgrade definitions and upgrade selection screen
├── render.js       # All Canvas drawing functions (stars, grid, entities, crosshair)
├── ui.js           # DOM updates (HUD, health bars, menus, weapon panel)
└── storage.js      # LocalStorage persistence for high scores
```

**How the modules connect:**

* `main.js` owns the shared mutable state (`game`, `state`, viewport size) and shares it via ES module live bindings; a `setState()` helper lets other modules change the game state.
* `update()` in `main.js` coordinates per-frame work by delegating to `updatePlayer`/`updateBullets` (player.js), `updateEnemies`/`updateEnemyBullets` (enemies.js, which delegates boss behavior to boss.js), and `updateHUD` (ui.js).
* `render.js` defines the canvas and all drawing; it reads the same shared state each frame.

---

## 💻 Technical Highlights

* **HTML5 Canvas API** : Used for rendering the entire game world, particles, and UI elements at 60fps.
* **ES6 Modules** : The single-file game is split into a clean multi-file architecture using native `import`/`export` — no bundler required.
* **Web Audio API** : A custom audio engine generates `OscillatorNode` and `BufferSource` noise to create retro 8-bit sound effects dynamically.
* **LocalStorage** : Utilized for persistent high-score tracking without requiring a backend database.
* **Object-Oriented JS** : Clean state management (`menu`, `playing`, `paused`, `gameover`) and array-based entity management for enemies, bullets, and particles.

---

## 🚀 How to Run

Because the game uses native **ES6 modules**, it must be served over HTTP — browsers block module loading from `file://` URLs.

1. Download or clone the repository.
2. Start any static file server from the project folder, e.g.:
   * Python: `python -m http.server 8000`
   * Node: `npx serve`
   * VS Code: the "Live Server" extension
3. Open `http://localhost:8000` (or the server's URL) in your browser (Chrome, Firefox, Edge, Safari).

*Note: For the best experience, play on a desktop with a mouse and keyboard. Ensure your browser window is large enough to see the full arena.*
