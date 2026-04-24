# Codebase Overview

## Stack
- **Tauri 2** (Rust backend) + **Svelte 5** (SvelteKit frontend)
- Built with Vite, TypeScript, adapter-static

## Project Structure

### Frontend (`src/`)
- `routes/+page.svelte` — Main page (currently just a greeting form, boilerplate)
- `routes/+layout.ts` — Enables prerendering & disables SSR
- `app.html` — HTML shell

### Backend (`src-tauri/`)
- `src/main.rs` — Entry point, calls `run()` from lib
- `src/lib.rs` — `run()` function sets up Tauri app (greet command lives here)
- `tauri.conf.json` — App config (800x600 window, all targets)

### Config
- `package.json` — npm scripts, SvelteKit/Tauri dependencies
- `vite.config.js` — Vite configuration
- `svelte.config.js` — SvelteKit/adapter-static setup

### Frontend Design

When working on the frontend, the goal is minimal, clean, square. Colors that are easy on the eyes (pastel browns), but I would just have a theme section so colors and fonts can be easily changed. Inter for the font, since this is mostly information organization it needs to be very legible.

## Current State
Boilerplate only — a greeting form that calls `greet` Tauri command. Ready to add task functionality. The README.md includes info about the scope of the project (all features and requirements)
