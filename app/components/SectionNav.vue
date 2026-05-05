<template>
  <nav class="section-nav" :class="{ open }">
    <button type="button" class="nav-toggle" @click="open = !open" :aria-expanded="open">
      <span>{{ open ? "Close" : "Jump" }}</span>
      <span class="nav-icon">{{ open ? "×" : "☰" }}</span>
    </button>
    <ul v-show="open" class="nav-list">
      <li v-for="link in links" :key="link.id">
        <a :href="`#${link.id}`" @click="open = false">{{ link.label }}</a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ links: { id: string; label: string }[] }>();
const open = ref(false);
</script>

<style scoped>
.section-nav {
  position: fixed;
  right: 14px;
  bottom: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.nav-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  min-height: 44px;
  border: 1px solid var(--gilt);
  background: var(--bg-panel);
  color: var(--ink);
  font-family: "IM Fell English SC", serif;
  letter-spacing: 0.14em;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
}

.nav-icon { font-size: 1.1rem; color: var(--gilt); }

.nav-list {
  list-style: none;
  margin: 0;
  padding: 8px;
  border: 1px solid var(--gilt);
  border-radius: 4px;
  background: var(--bg-panel);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
  display: grid;
  gap: 2px;
  max-height: 60vh;
  overflow-y: auto;
  min-width: 220px;
}

.nav-list a {
  display: block;
  padding: 8px 12px;
  border-radius: 3px;
  font-family: "IM Fell English", serif;
  font-size: 1rem;
  color: var(--ink);
  text-decoration: none;
}

.nav-list a:hover { background: var(--bg-soft); color: var(--gilt); }
</style>
