<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <header class="top-nav">
      <NuxtLink to="/" class="brand">⚔ Character Forge</NuxtLink>
      <nav class="nav-links">
        <NuxtLink to="/" class="nav-link">Library</NuxtLink>
        <NuxtLink to="/encounters" class="nav-link">Encounters</NuxtLink>
        <NuxtLink to="/homebrew" class="nav-link">Homebrew</NuxtLink>
      </nav>
    </header>
    <NuxtPage />
  </div>
</template>

<style>
:root {
  --ink: #ece2c9;
  --ink-soft: #b9ad94;
  --ink-faint: #847a66;
  --bg: #14110c;
  --bg-soft: #1c1812;
  --bg-panel: #221d15;
  --bg-panel-2: #2a241a;
  --line: #3a3022;
  --line-soft: #2a2418;
  --rubric: #c75c4b;
  --rubric-deep: #8a3a2c;
  --gilt: #c9a155;
  --gilt-soft: #a87f2a;
  --moss: #6b8a5a;
  --shadow: rgba(0, 0, 0, 0.5);

  color: var(--ink);
  background: var(--bg);
  font-family: "EB Garamond", "Iowan Old Style", Georgia, serif;
  font-size: 17px;
  line-height: 1.55;
  color-scheme: dark;
}

* { box-sizing: border-box; }
body { margin: 0; }

a { color: var(--gilt); text-decoration: none; }
a:hover { color: var(--rubric); }

::selection { background: var(--gilt-soft); color: var(--bg); }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--line); border-radius: 999px; border: 2px solid var(--bg); }
::-webkit-scrollbar-thumb:hover { background: var(--gilt-soft); }

button, input, select, textarea { font: inherit; color: var(--ink); }

button, input, select, textarea {
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: var(--bg-soft);
}

button {
  padding: 0 16px;
  font-family: "IM Fell English SC", "EB Garamond", serif;
  font-size: 0.92rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: transform 120ms ease, background 200ms ease, border-color 200ms ease, color 200ms ease;
}

button:hover { background: var(--bg-panel-2); border-color: var(--gilt-soft); }
button:active { transform: translateY(1px); }

input, select, textarea {
  width: 100%;
  padding: 8px 12px;
  font-family: "EB Garamond", serif;
  font-size: 1rem;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--gilt);
  box-shadow: 0 0 0 2px rgba(201, 161, 85, 0.18);
}

label {
  display: grid;
  gap: 6px;
  color: var(--ink-soft);
  font-family: "IM Fell English SC", serif;
  font-size: 0.74rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(201, 161, 85, 0.08), transparent 60%),
    radial-gradient(ellipse at 80% 100%, rgba(199, 92, 75, 0.06), transparent 55%),
    var(--bg);
  position: relative;
}

.app-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.04 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.6;
  z-index: 0;
}

.page {
  position: relative;
  z-index: 1;
  width: min(100%, 920px);
  margin: 0 auto;
  padding: 28px 18px 80px;
}

.hero {
  padding: 18px 0 14px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--gilt);
  font-family: "IM Fell English SC", serif;
  font-size: 0.74rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

h1, h2, p, dl { margin-top: 0; }

h1 {
  margin: 4px 0 10px;
  font-family: "IM Fell English", "EB Garamond", serif;
  font-weight: 400;
  font-size: clamp(2.2rem, 8vw, 3.4rem);
  line-height: 1.05;
  color: var(--ink);
  letter-spacing: 0.005em;
  background: linear-gradient(180deg, var(--ink) 0%, var(--ink-soft) 130%);
  background-clip: text;
  -webkit-background-clip: text;
}

h2 {
  margin: 0;
  font-family: "IM Fell English", serif;
  font-weight: 400;
  font-size: 1.35rem;
  color: var(--ink);
}

.lede {
  max-width: 60ch;
  margin: 0;
  color: var(--ink-soft);
  font-size: 1rem;
}

.muted { color: var(--ink-faint); font-style: italic; }

.panel {
  position: relative;
  margin-top: 16px;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background:
    linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-soft) 100%);
  box-shadow: 0 8px 22px -12px var(--shadow);
  scroll-margin-top: 24px;
}

[id] { scroll-margin-top: 24px; }
.feature { scroll-margin-top: 70px; }
html { scroll-behavior: smooth; }

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  position: relative;
}

.section-heading::after {
  content: "";
  position: absolute;
  left: 0; bottom: -1px;
  width: 36px; height: 2px;
  background: var(--gilt);
}

.ghost-button {
  min-height: 36px;
  padding: 0 14px;
  font-size: 0.78rem;
  background: transparent;
  border-color: var(--line);
  color: var(--ink-soft);
}

.ghost-button:hover { color: var(--ink); border-color: var(--gilt-soft); }

.primary-button {
  background: var(--rubric);
  color: #1a0e0a;
  border-color: var(--rubric-deep);
  font-weight: 600;
}

.primary-button:hover { background: var(--rubric-deep); color: var(--ink); }

.form-grid, .spell-controls {
  display: grid;
  gap: 14px;
}

@media (min-width: 760px) {
  .page { padding-top: 40px; }
  .form-grid, .spell-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-family: "IM Fell English SC", serif;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.crumbs a { color: var(--ink-soft); }
.crumbs .sep { color: var(--gilt-soft); }

.top-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--line);
  background: rgba(20, 17, 12, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.brand {
  font-family: "IM Fell English SC", serif;
  font-size: 0.95rem;
  letter-spacing: 0.18em;
  color: var(--gilt) !important;
  text-decoration: none;
}
.brand:hover { color: var(--rubric) !important; }

.nav-links {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.nav-link {
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 3px;
  font-family: "IM Fell English SC", serif;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-soft) !important;
  text-decoration: none;
  transition: color 160ms ease, border-color 160ms ease, background 160ms ease;
}
.nav-link:hover { color: var(--ink) !important; border-color: var(--gilt-soft); background: var(--bg-soft); }
.nav-link.router-link-exact-active {
  color: var(--gilt) !important;
  border-color: var(--gilt-soft);
  background: rgba(201, 161, 85, 0.08);
}
</style>
