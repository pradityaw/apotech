# Sky Striker

A 1942-inspired 2D fighter jet arcade shooter built with pure HTML5 Canvas and
vanilla JavaScript — no frameworks, no build step, no backend, no assets.

## Run it

Open `index.html` in any modern browser. That's it.

## Controls

| Key | Action |
| --- | --- |
| `WASD` / Arrow Keys | Move |
| `Space` | Fire |
| `Enter` | Start / restart |

## Gameplay

- You start with **3 lives**. Shoot down enemy jets to score; the game ends
  when your lives run out.
- **3 enemy types**: fast diving *scouts* (10 pts), sine-weaving *weavers*
  that fire aimed shots (25 pts), and tanky *gunships* with spread fire (50 pts).
- Enemy bullets, and ramming into enemy jets, cost you a life. After a hit
  you respawn with ~2 seconds of blinking invulnerability.
- Destroyed enemies sometimes drop a **P power-up**: 15 seconds of rapid fire.
- Difficulty ramps over ~5 minutes: faster spawns, faster enemies, more
  aggressive fire.
- Your **high score** persists in `localStorage`.
- All sound effects are synthesized live with the Web Audio API.

## Code layout

| File | Purpose |
| --- | --- |
| `index.html` | Canvas + DOM UI (HUD, start/game-over overlays) |
| `style.css` | All UI styling |
| `game.js` | The entire game; see the architecture comment at the top of the file |
