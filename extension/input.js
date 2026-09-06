/* ============================================================
   input.js — Mouse and keyboard event listeners
   ============================================================ */
import { initAudio } from './audio.js';
import { togglePause } from './main.js';
import { switchWeapon } from './player.js';

export const keys = {};
export const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, down: false };

export function initInput(canvas) {
  window.addEventListener('keydown', e => {
    initAudio();
    keys[e.code] = true;
    if(e.code === 'KeyP' || e.code === 'Escape'){ togglePause(); }
    if(e.code === 'Digit1') switchWeapon(0);
    if(e.code === 'Digit2') switchWeapon(1);
    if(e.code === 'Digit3') switchWeapon(2);
  });
  window.addEventListener('keyup', e => keys[e.code] = false);
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mousedown', e => { if(e.button === 0) mouse.down = true; });
  window.addEventListener('mouseup',   e => { if(e.button === 0) mouse.down = false; });
  window.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('touchstart', e => { mouse.down = true; const t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; e.preventDefault(); }, {passive:false});
  canvas.addEventListener('touchmove',  e => { const t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; }, {passive:false});
  canvas.addEventListener('touchend',   () => mouse.down = false);
}
