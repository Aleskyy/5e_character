<template>
  <div class="rule-entries">
    <template v-for="(entry, idx) in entries" :key="idx">
      <p v-if="typeof entry === 'string'" v-html="renderInline(entry)"></p>

      <div v-else-if="entry.type === 'list'" class="entry-list">
        <ul>
          <li v-for="(item, i) in entry.items ?? []" :key="i">
            <template v-if="item && typeof item === 'object'">
              <strong v-if="(item as any).name" class="item-name">{{ (item as any).name }}.</strong>
              <span v-if="(item as any).entry" v-html="' ' + renderInline(String((item as any).entry))"></span>
              <RuleEntries v-if="(item as any).entries" :entries="(item as any).entries" />
            </template>
            <span v-else v-html="renderInline(String(item))"></span>
          </li>
        </ul>
      </div>

      <div v-else-if="entry.type === 'item'" class="entry-item">
        <strong v-if="entry.name" class="item-name">{{ entry.name }}.</strong>
        <span v-if="(entry as any).entry" v-html="' ' + renderInline(String((entry as any).entry))"></span>
        <RuleEntries v-if="entry.entries" :entries="entry.entries" />
      </div>

      <div v-else-if="entry.type === 'table'" class="entry-table">
        <p v-if="entry.caption" class="entry-caption">{{ entry.caption }}</p>
        <table>
          <thead v-if="entry.colLabels?.length">
            <tr>
              <th v-for="(label, i) in entry.colLabels" :key="i" v-html="renderInline(String(label))"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in entry.rows ?? []" :key="ri">
              <td v-for="(cell, ci) in row" :key="ci">
                <RuleEntries v-if="cell && typeof cell === 'object'" :entries="[cell as any]" />
                <span v-else v-html="renderInline(String(cell ?? ''))"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="entry.entries" class="entry-block">
        <h4 v-if="entry.name" class="entry-heading">{{ entry.name }}</h4>
        <RuleEntries :entries="entry.entries" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Entry } from "~/utils/entries";
import { stripTags } from "~/utils/entries";

defineProps<{ entries: Entry[] }>();

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const renderInline = (raw: string): string => {
  let text = String(raw);
  text = text.replace(/\{@(?:b|bold)\s+([^}]+)\}/g, (_m, c) => `<strong>${escapeHtml(stripTags(c))}</strong>`);
  text = text.replace(/\{@(?:i|italic)\s+([^}]+)\}/g, (_m, c) => `<em>${escapeHtml(stripTags(c))}</em>`);
  text = text.replace(/\{@\w+\s+([^|}]+)(?:\|[^}]*)?\}/g, (_m, c) => escapeHtml(c));
  return text;
};
</script>

<style scoped>
.rule-entries p { margin: 0 0 8px; line-height: 1.6; }
.rule-entries p:last-child { margin-bottom: 0; }

.entry-block { margin: 10px 0; }

.entry-heading {
  margin: 0 0 6px;
  font-family: "IM Fell English", serif;
  font-weight: 400;
  font-size: 1.05rem;
  color: var(--gilt);
  letter-spacing: 0.02em;
}

.entry-list ul { margin: 0 0 8px; padding-left: 22px; }
.entry-list li { margin: 4px 0; line-height: 1.55; }

.item-name { color: var(--ink); font-weight: 600; }
.entry-item { margin: 6px 0; line-height: 1.55; }

.entry-table { margin: 10px 0; overflow-x: auto; }
.entry-caption {
  font-family: "IM Fell English SC", serif;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  color: var(--gilt);
  margin: 0 0 6px;
}
.entry-table table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
.entry-table th, .entry-table td {
  padding: 6px 10px;
  border: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}
.entry-table th { background: var(--bg-soft); font-family: "IM Fell English SC", serif; letter-spacing: 0.1em; font-weight: 400; color: var(--gilt); }
.entry-table tr:nth-child(odd) td { background: rgba(255, 255, 255, 0.02); }
</style>
