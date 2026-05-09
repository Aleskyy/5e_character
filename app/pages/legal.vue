<template>
  <main class="page">
    <nav class="crumbs">
      <NuxtLink to="/">Library</NuxtLink>
      <span class="sep">›</span>
      <span>Legal</span>
    </nav>

    <header class="hero">
      <p class="eyebrow">Disclosures</p>
      <h1>Legal, Attribution &amp; Takedown</h1>
      <p class="lede">Plain-language disclosures for this fan-made, non-commercial reference tool. If you are a rights holder and want something removed, see the <a href="#takedown">takedown</a> section — it will be honored promptly and without dispute.</p>
    </header>

    <section class="panel">
      <p class="eyebrow">No Affiliation</p>
      <h2>Unofficial fan tool</h2>
      <p>Character Forge is an unofficial, fan-made reference and play aid built by hobbyists for personal, at-the-table use. It is <strong>not affiliated with, licensed by, endorsed by, or sponsored by</strong> Wizards of the Coast LLC, Hasbro, Inc., or any of their parents, subsidiaries, or partners.</p>
      <p><em>Dungeons &amp; Dragons</em>, <em>D&amp;D</em>, the dragon ampersand, <em>Player's Handbook</em>, <em>Dungeon Master's Guide</em>, <em>Monster Manual</em>, and all related book titles, character names, places, art, logos, and other product identity are trademarks and/or copyrights of Wizards of the Coast LLC. All rights reserved by their respective owners. Their use here is purely nominative — to identify the game system this tool helps play — and implies no claim of ownership.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">Non-Commercial</p>
      <h2>No revenue, no monetization</h2>
      <p>This site is hosted at no charge to users. There is no advertising, no paid tier, no subscription, no telemetry, no affiliate links, and no sale of data. Hosting costs (if any) are absorbed personally by the maintainer. Any future change in this status will be reflected here before it takes effect.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">Game Data — Attribution</p>
      <h2>Open-license content (SRD)</h2>
      <p>Portions of the rules data shipped under <code>/public/data</code> are derived from material released by Wizards of the Coast under open licenses:</p>
      <ul>
        <li><strong>System Reference Document 5.1</strong> — © 2016 Wizards of the Coast LLC, available at <a href="https://dnd.wizards.com/resources/systems-reference-document" target="_blank" rel="noopener">dnd.wizards.com</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">Creative Commons Attribution 4.0 International (CC-BY 4.0)</a>.</li>
        <li><strong>System Reference Document 5.2 / 2024 Free Rules</strong> — © 2025 Wizards of the Coast LLC, licensed under CC-BY 4.0.</li>
      </ul>
      <p class="note">This work includes content derived from the SRD 5.1 and SRD 5.2.1, © Wizards of the Coast LLC, used and modified under the Creative Commons Attribution 4.0 International License. Modifications include reformatting for digital display, machine-readable structure, computed mechanics (modifiers, slot tables), and unrelated user-generated homebrew. Wizards of the Coast does not endorse this work.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">Game Data — Other Material</p>
      <h2>Material outside the SRD</h2>
      <p>The bundled dataset is derived from the community-maintained <strong>5etools</strong> project and may include references to mechanics, names, or descriptions from published <em>D&amp;D</em> supplements that are <strong>not</strong> part of the SRD. Such material remains the exclusive copyright of Wizards of the Coast LLC.</p>
      <p>Where such references appear, they are included in good faith for personal, non-commercial reference and play aid only, in a manner the maintainer believes to be analogous to fan tools and character sheets long tolerated by the publisher's community-content posture. <strong>No claim of ownership, license, or right to redistribute</strong> is asserted over any non-SRD material. Users are responsible for owning the source books for any non-SRD content they reference at their own table.</p>
      <p>If any inclusion exceeds what the rights holder considers acceptable, see <a href="#takedown">Takedown</a> below — it will be removed without argument.</p>
    </section>

    <section id="takedown" class="panel">
      <p class="eyebrow">Takedown / DMCA</p>
      <h2>Removing content</h2>
      <p>If you are a rights holder (or their authorized agent) and believe content on this site infringes your rights, please send a notice including:</p>
      <ul>
        <li>Identification of the copyrighted work or trademark claimed to be infringed.</li>
        <li>The specific URL(s) or data file(s) on this site to be removed.</li>
        <li>Your contact information (name, email, and authority to act).</li>
        <li>A good-faith statement that the use is not authorized.</li>
      </ul>
      <p>Send notices to: <strong><a href="mailto:alexandre@menata.fr">alexandre@menata.fr</a></strong>. Valid notices will be acted on promptly — typically within 72 hours — by removing or disabling access to the material identified, with no requirement of formal proceedings.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">User-Generated Content</p>
      <h2>Homebrew &amp; characters</h2>
      <p>Anything you create with this tool — characters, homebrew classes, encounters, monsters, item descriptions, uploaded images — remains <strong>yours</strong>. The site does not collect, transmit, or claim any rights over user content. Share codes and exports are generated locally; if you share them publicly, that is your choice and your responsibility.</p>
      <p>Do not upload images, names, or text you do not have the right to use. The maintainer is not responsible for user-supplied content.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">Privacy</p>
      <h2>Local-only, no tracking</h2>
      <p>All your data — characters, encounters, homebrew, uploaded images — is stored exclusively in your browser's <code>localStorage</code> on your own device. <strong>Nothing is sent to any server.</strong> The site has no analytics, no cookies for tracking, no third-party telemetry, and no account system. The host (currently Vercel) may retain standard server access logs (IP, user-agent, request path) per its own infrastructure policy; the maintainer does not access or process those logs.</p>
      <p>Clearing site data, switching browsers, or losing your device will erase your characters. Use the export feature to back up anything you want to keep.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">Application Code</p>
      <h2>Source &amp; warranty</h2>
      <p>The application source code (Vue/Nuxt frontend, utilities, and styles) is provided strictly <strong>as-is, without warranty of any kind</strong>, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement. Use at your own risk. The maintainer shall not be liable for any claim, damages, or other liability arising from use of this site or its code.</p>
    </section>

    <section class="panel">
      <p class="eyebrow">Fonts</p>
      <h2>Third-party assets</h2>
      <p>Display typography uses <em>IM Fell English</em> and <em>EB Garamond</em>, served via Google Fonts under the SIL Open Font License 1.1.</p>
    </section>

    <p class="muted small">Last updated: 2026-05-09. This page may be amended at any time; the version above governs the current build.</p>
  </main>
</template>

<style scoped>
.panel { display: grid; gap: 8px; scroll-margin-top: 80px; }
.panel h2 { margin: 0; }
.panel p, .panel ul { margin: 0; }
ul { padding-left: 20px; display: grid; gap: 4px; }
code { font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 0.9em; padding: 1px 6px; border: 1px solid var(--line); border-radius: 3px; background: var(--bg); }
.note { padding: 10px 14px; border-left: 2px solid var(--gilt-soft); background: rgba(201,161,85,0.06); color: var(--ink-soft); font-style: italic; }
.muted.small { font-size: 0.8rem; text-align: center; margin-top: 12px; }
a { word-break: break-word; }
</style>
