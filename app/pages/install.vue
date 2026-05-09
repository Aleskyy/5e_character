<template>
  <main class="page">
    <nav class="crumbs">
      <NuxtLink to="/">Library</NuxtLink>
      <span class="sep">›</span>
      <span>Install</span>
    </nav>

    <header class="hero">
      <p class="eyebrow">Progressive Web App</p>
      <h1>Install Character Forge</h1>
      <p class="lede">Add Character Forge to your phone or desktop to launch it from the home screen, run it in its own window, and use it offline (since everything is local anyway).</p>
    </header>

    <section v-if="alreadyInstalled" class="panel ok">
      <p class="eyebrow">Status</p>
      <h2>Already installed ✓</h2>
      <p>You're using Character Forge in standalone mode. Nothing else to do.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">Android · Chrome / Edge / Brave / Samsung</p>
      <h2>One-tap install</h2>
      <p v-if="canPrompt">Your browser supports direct install:</p>
      <button v-if="canPrompt" type="button" class="primary-button wide" @click="installNow">⬇ Install now</button>
      <p v-if="installResult" class="muted">{{ installResult }}</p>
      <p v-if="!canPrompt && !alreadyInstalled" class="muted">No prompt available right now. Either it's already installed, your browser doesn't support it, or it's still loading. You can also use the browser menu:</p>
      <ol>
        <li>Tap the <strong>⋮ menu</strong> (top right).</li>
        <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
        <li>Confirm. The icon appears on your home screen.</li>
      </ol>
    </section>

    <section class="panel">
      <p class="eyebrow">iPhone / iPad · Safari</p>
      <h2>Manual install</h2>
      <p>Apple does not let websites trigger install — you have to do it from the Share sheet. It only takes a few seconds:</p>
      <ol>
        <li>Open this site in <strong>Safari</strong> (not Chrome — Chrome on iOS can't install web apps).</li>
        <li>Tap the <strong>Share button</strong> <span class="ico">[ ⬆ ]</span> at the bottom of the screen (or top right on iPad).</li>
        <li>Scroll the share sheet and tap <strong>Add to Home Screen</strong>.</li>
        <li>Edit the name if you want, then tap <strong>Add</strong> (top right).</li>
        <li>Launch from the new home-screen icon — it opens in its own window with no Safari chrome.</li>
      </ol>
      <p class="note">Heads up: iOS stores PWA data per-app in a sandbox. If you delete the home-screen icon, your characters go with it. Export anything you want to keep before uninstalling.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">Desktop · Chrome / Edge / Brave</p>
      <h2>One-click install</h2>
      <p v-if="canPrompt">Use the same install button above, or:</p>
      <ol>
        <li>Look for the <strong>install icon</strong> (⊕ or ⬇) at the right end of the address bar.</li>
        <li>Click it → <strong>Install</strong>.</li>
        <li>The app gets a launcher entry (Start menu / Dock / Applications) and opens in its own window.</li>
      </ol>
    </section>

    <section class="panel">
      <p class="eyebrow">Firefox</p>
      <h2>Limited support</h2>
      <p>Firefox desktop does not currently support installing PWAs. On Android, Firefox can add a shortcut via menu → <strong>Install</strong>, but the experience is browser-tab-style. Use Chromium browsers for the full standalone experience.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">What you get</p>
      <h2>Once installed</h2>
      <ul>
        <li>Home-screen icon, no browser bar.</li>
        <li>Works <strong>offline</strong> — assets are cached on first load. Open the app on a plane, your characters are still there.</li>
        <li>Faster launches; behaves like a native app.</li>
        <li>All data stays on the device. Uninstalling clears it (export first if you care).</li>
      </ul>
    </section>
  </main>
</template>

<script setup lang="ts">
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const deferred = ref<BIPEvent | null>(null);
const installResult = ref("");
const alreadyInstalled = ref(false);
const canPrompt = computed(() => !!deferred.value);

const onBeforeInstall = (e: Event) => {
  e.preventDefault();
  deferred.value = e as BIPEvent;
};

const onInstalled = () => {
  alreadyInstalled.value = true;
  deferred.value = null;
  installResult.value = "Installed.";
};

onMounted(() => {
  if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone) {
    alreadyInstalled.value = true;
  }
  window.addEventListener("beforeinstallprompt", onBeforeInstall);
  window.addEventListener("appinstalled", onInstalled);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  window.removeEventListener("appinstalled", onInstalled);
});

const installNow = async () => {
  if (!deferred.value) return;
  await deferred.value.prompt();
  const choice = await deferred.value.userChoice;
  installResult.value = choice.outcome === "accepted" ? "Installing…" : "Install dismissed.";
  deferred.value = null;
};
</script>

<style scoped>
.panel { display: grid; gap: 8px; }
.panel h2 { margin: 0; }
.panel.ok { border-color: var(--gilt); background: rgba(201,161,85,0.06); }
ol, ul { padding-left: 22px; display: grid; gap: 4px; margin: 0; }
.ico { display: inline-block; padding: 0 6px; border: 1px solid var(--line); border-radius: 3px; font-family: ui-monospace, monospace; font-size: 0.85em; color: var(--gilt); }
.wide { width: 100%; font-family: "IM Fell English SC", serif; letter-spacing: 0.16em; }
.note { padding: 10px 14px; border-left: 2px solid var(--gilt-soft); background: rgba(201,161,85,0.06); color: var(--ink-soft); font-style: italic; }
.muted { color: var(--ink-faint); font-style: italic; margin: 0; }
</style>
