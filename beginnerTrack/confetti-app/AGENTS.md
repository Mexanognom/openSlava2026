# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project

React 18 + TypeScript + Vite welcome page for OpenSlava 2026. No backend, no router, no state library.

## Commands

```bash
npm run dev       # Vite dev server (default: http://localhost:5173)
npm run build     # tsc (type-check only, noEmit) then vite build → dist/
npm run preview   # Serve dist/ locally
```

No test runner is configured.

## TypeScript strictness

`tsconfig.json` enforces `strict`, `noUnusedLocals`, and `noUnusedParameters`. The compiler is run via `tsc` during `build` but does **not** emit files (`noEmit: true`) — Vite handles transpilation independently.

## Architecture

```
src/main.tsx          → mounts <App /> into #root
src/App.tsx           → thin shell, renders <WelcomePage />
src/components/
  WelcomePage.tsx     → layout; imports welcome.css, renders <Confetti />
  Confetti.tsx        → imperative DOM animation; no external library
src/styles/
  welcome.css         → global reset + BEM component styles
  confetti.css        → keyframes; particle variance set via inline JS
```

## Key conventions

- CSS uses BEM naming: `.welcome-page`, `.welcome-page__heading`, `.welcome-page__subtitle`.
- Each component imports its own CSS file directly (no CSS modules, no Tailwind).
- Confetti particle customisation (size, colour, drift, duration) is applied as **inline styles** by `spawnParticles()` in `Confetti.tsx`; the CSS only defines the keyframe. The `--drift` CSS custom property is the bridge between JS and `@keyframes confetti-fall`.
- The confetti overlay self-destructs from the DOM once all particles finish (`overlay.remove()` when `remaining === 0`).
- No linter config (ESLint/Prettier) is present — TypeScript strictness is the only automated style enforcement.
