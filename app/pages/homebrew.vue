<template>
  <main class="page">
    <nav class="crumbs">
      <NuxtLink to="/">Library</NuxtLink>
      <span class="sep">›</span>
      <span>Homebrew</span>
    </nav>

    <header class="hero">
      <p class="eyebrow">Forge</p>
      <h1>Homebrew Library</h1>
      <p class="lede">Custom spells, races, subraces, and classes — reusable across all characters.</p>
      <div class="hero-actions">
        <button type="button" class="ghost-button" @click="massOpen = true">Mass Import / Export</button>
      </div>
    </header>

    <div class="tabs">
      <button v-for="t in tabs" :key="t.key" :class="{ active: tab === t.key }" @click="tab = t.key">{{ t.label }}</button>
    </div>

    <section v-if="tab === 'items'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Inventory</p><h2>Custom Items ({{ items.length }})</h2></div>
        <button type="button" class="primary-button" @click="newItem">+ New Item</button>
      </div>
      <ul v-if="items.length" class="hb-list">
        <li v-for="it in items" :key="it.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ it.name }}</strong>
            <small>{{ it.type }}{{ it.type === 'weapon' && it.damage ? ` · ${it.damage}${it.damageType ? ' ' + it.damageType : ''}` : '' }}{{ it.acBonus ? ` · AC +${it.acBonus}` : '' }}{{ it.weight ? ` · ${it.weight} lb` : '' }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="shareEntity = it">Share</button>
            <button type="button" class="ghost-button" @click="editItem(it)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemoveItem(it.id, it.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew items yet. Create here or from any character's Inventory panel.</p>

      <div v-if="itemDraft" class="editor">
        <h3>{{ itemDraft.id ? "Edit" : "New" }} Item</h3>
        <div class="form-grid two">
          <label>Name <input v-model="itemDraft.name" type="text" /></label>
          <label>Type
            <select v-model="itemDraft.type">
              <option value="misc">Misc</option>
              <option value="weapon">Weapon</option>
              <option value="armor">Armor</option>
              <option value="container">Container</option>
              <option value="consumable">Consumable</option>
            </select>
          </label>
          <label>Weight (lb) <input v-model.number="itemDraft.weight" type="number" min="0" step="0.1" /></label>
          <label v-if="itemDraft.type === 'armor'">AC Bonus <input v-model.number="itemDraft.acBonus" type="number" /></label>
        </div>

        <template v-if="itemDraft.type === 'weapon'">
          <p class="eyebrow">Weapon</p>
          <div class="form-grid two">
            <label>Damage Dice <input v-model="itemDraft.damage" type="text" placeholder="1d8" /></label>
            <label>Damage Type <input v-model="itemDraft.damageType" type="text" placeholder="slashing" /></label>
            <label>Ability
              <select v-model="itemDraft.damageAbility">
                <option v-for="a in ABILITIES" :key="a" :value="a">{{ a.toUpperCase() }}</option>
              </select>
            </label>
          </div>
        </template>

        <template v-if="itemDraft.type === 'container'">
          <label class="check">
            <input type="checkbox" v-model="itemDraft.isExtraplanar" /> Extraplanar (contents weightless)
          </label>
        </template>

        <label class="full">Description <textarea v-model="itemDraft.description" rows="4"></textarea></label>

        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="itemDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveItem" :disabled="!itemDraft.name">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'spells'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Arcana</p><h2>Custom Spells ({{ spells.length }})</h2></div>
        <button type="button" class="primary-button" @click="newSpell">+ New Spell</button>
      </div>
      <ul v-if="spells.length" class="hb-list">
        <li v-for="s in spells" :key="s.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ s.name }}</strong>
            <small>{{ s.level === 0 ? "Cantrip" : `Lv ${s.level}` }} · {{ s.school || "—" }} · {{ componentLabel(s.components) }}{{ s.diceCount && s.diceFaces ? ` · ${s.diceCount}d${s.diceFaces}` : "" }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="shareEntity = s">Share</button>
            <button type="button" class="ghost-button" @click="editSpell(s)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemove(s.id, s.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew spells yet.</p>

      <div v-if="spellDraft" class="editor">
        <h3>{{ spellDraft.id ? "Edit" : "New" }} Spell</h3>
        <div class="form-grid two">
          <label>Name <input v-model="spellDraft.name" type="text" /></label>
          <label>Level
            <select v-model.number="spellDraft.level">
              <option :value="0">Cantrip</option>
              <option v-for="l in 9" :key="l" :value="l">Level {{ l }}</option>
            </select>
          </label>
          <label>School
            <select v-model="spellDraft.school">
              <option value="">—</option>
              <option v-for="s in SCHOOLS" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label>Range <input v-model="spellDraft.range" type="text" placeholder="60 ft / Touch / Self" /></label>
        </div>

        <div class="comp-row">
          <span class="eyebrow">Components</span>
          <label class="check"><input type="checkbox" v-model="compV" /> V</label>
          <label class="check"><input type="checkbox" v-model="compS" /> S</label>
          <label class="check"><input type="checkbox" v-model="compM" /> M</label>
          <input v-if="compM" v-model="compMText" type="text" placeholder="material (e.g. a pinch of dust)" class="comp-mat" />
        </div>

        <div class="form-grid two">
          <label>Dice count <input v-model.number="spellDraft.diceCount" type="number" min="0" placeholder="e.g. 3" /></label>
          <label>Die faces
            <select v-model.number="spellDraft.diceFaces">
              <option :value="undefined">—</option>
              <option v-for="d in [4,6,8,10,12,20]" :key="d" :value="d">d{{ d }}</option>
            </select>
          </label>
        </div>

        <label class="full">Description <textarea v-model="spellDraft.description" rows="6"></textarea></label>

        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="spellDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveSpell" :disabled="!spellDraft.name">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'races'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Heritage</p><h2>Custom Races ({{ races.length }})</h2></div>
        <button type="button" class="primary-button" @click="newRace">+ New Race</button>
      </div>
      <ul v-if="races.length" class="hb-list">
        <li v-for="r in races" :key="r.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ r.name }}</strong>
            <small>{{ r.size || "Medium" }} · Speed {{ r.speed || 30 }} · {{ abilityLabel(r.abilityBonuses) || "—" }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="shareEntity = r">Share</button>
            <button type="button" class="ghost-button" @click="editRace(r)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemove(r.id, r.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew races yet.</p>

      <div v-if="raceDraft" class="editor">
        <h3>{{ raceDraft.id ? "Edit" : "New" }} Race</h3>
        <div class="form-grid two">
          <label>Name <input v-model="raceDraft.name" type="text" /></label>
          <label>Size
            <select v-model="raceDraft.size">
              <option v-for="s in SIZES" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label>Speed (ft) <input v-model.number="raceDraft.speed" type="number" min="0" placeholder="30" /></label>
          <label>Darkvision (ft)
            <select v-model.number="raceDraft.darkvision">
              <option v-for="v in DARKVISION_OPTIONS" :key="v" :value="v">{{ v === 0 ? "None" : `${v} ft` }}</option>
            </select>
          </label>
          <label>Age <input v-model="raceDraft.age" type="text" placeholder="Adult ~20, lifespan ~80" /></label>
          <label>Alignment <input v-model="raceDraft.alignment" type="text" placeholder="Tendency, e.g. Often Neutral Good" /></label>
        </div>

        <p class="eyebrow">Ability Bonuses</p>
        <div class="ability-grid">
          <label v-for="ab in ABILITIES" :key="ab" class="ab-bonus">
            <span>{{ ab.toUpperCase() }}</span>
            <input type="number" :value="raceDraft.abilityBonuses?.[ab] ?? 0" @input="setRaceAbility(ab, ($event.target as HTMLInputElement).valueAsNumber)" />
          </label>
        </div>

        <p class="eyebrow">Languages</p>
        <div class="check-row">
          <label v-for="l in COMMON_LANGUAGES" :key="l" class="check">
            <input type="checkbox" :checked="(raceDraft.languages ?? []).includes(l)" @change="toggleRaceLang(l)" />
            {{ l }}
          </label>
        </div>
        <input class="full-input" type="text" placeholder="Custom languages (comma separated)" :value="customLangs(raceDraft.languages)" @change="setCustomRaceLangs(($event.target as HTMLInputElement).value)" />

        <div class="features-head">
          <p class="eyebrow">Racial Features</p>
          <button type="button" class="ghost-button" @click="addRaceFeature">+ Feature</button>
        </div>
        <div v-for="(f, idx) in raceDraft.features ?? []" :key="idx" class="feature-edit">
          <label>Name <input v-model="f.name" type="text" placeholder="e.g. Fey Ancestry" /></label>
          <textarea v-model="f.description" rows="3" placeholder="Description"></textarea>
          <button type="button" class="danger-button small" @click="removeRaceFeature(idx)">Remove</button>
        </div>

        <label class="full">Extra Notes <textarea v-model="raceDraft.traits" rows="3" placeholder="Free-form lore or rules notes"></textarea></label>
        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="raceDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveRace" :disabled="!raceDraft.name">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'subraces'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Lineage</p><h2>Custom Subraces ({{ subraces.length }})</h2></div>
        <button type="button" class="primary-button" @click="newSubrace">+ New Subrace</button>
      </div>
      <ul v-if="subraces.length" class="hb-list">
        <li v-for="r in subraces" :key="r.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ r.name }}</strong>
            <small>Parent: {{ parentRaceName(r.parentRaceId) }} · {{ abilityLabel(r.abilityBonuses) || "—" }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="shareEntity = r">Share</button>
            <button type="button" class="ghost-button" @click="editSubrace(r)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemove(r.id, r.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew subraces yet.</p>

      <div v-if="subraceDraft" class="editor">
        <h3>{{ subraceDraft.id ? "Edit" : "New" }} Subrace</h3>
        <div class="form-grid two">
          <label>Name <input v-model="subraceDraft.name" type="text" /></label>
          <label>Parent Race
            <select v-model="subraceDraft.parentRaceId">
              <option value="">—</option>
              <option v-for="r in raceChoices" :key="r.id" :value="r.id">{{ r.name }}{{ r.source ? ` (${r.source})` : "" }}</option>
            </select>
          </label>
          <label>Speed Override (ft) <input v-model.number="subraceDraft.speed" type="number" min="0" placeholder="leave blank to inherit" /></label>
          <label>Darkvision Override (ft)
            <select v-model.number="subraceDraft.darkvision">
              <option :value="undefined">Inherit</option>
              <option v-for="v in DARKVISION_OPTIONS" :key="v" :value="v">{{ v === 0 ? "None" : `${v} ft` }}</option>
            </select>
          </label>
        </div>
        <p class="eyebrow">Ability Bonuses (added to parent)</p>
        <div class="ability-grid">
          <label v-for="ab in ABILITIES" :key="ab" class="ab-bonus">
            <span>{{ ab.toUpperCase() }}</span>
            <input type="number" :value="subraceDraft.abilityBonuses?.[ab] ?? 0" @input="setSubraceAbility(ab, ($event.target as HTMLInputElement).valueAsNumber)" />
          </label>
        </div>

        <p class="eyebrow">Extra Languages</p>
        <div class="check-row">
          <label v-for="l in COMMON_LANGUAGES" :key="l" class="check">
            <input type="checkbox" :checked="(subraceDraft.languages ?? []).includes(l)" @change="toggleSubraceLang(l)" />
            {{ l }}
          </label>
        </div>
        <input class="full-input" type="text" placeholder="Custom languages (comma separated)" :value="customLangs(subraceDraft.languages)" @change="setCustomSubraceLangs(($event.target as HTMLInputElement).value)" />

        <div class="features-head">
          <p class="eyebrow">Subrace Features</p>
          <button type="button" class="ghost-button" @click="addSubraceFeature">+ Feature</button>
        </div>
        <div v-for="(f, idx) in subraceDraft.features ?? []" :key="idx" class="feature-edit">
          <label>Name <input v-model="f.name" type="text" /></label>
          <textarea v-model="f.description" rows="3"></textarea>
          <button type="button" class="danger-button small" @click="removeSubraceFeature(idx)">Remove</button>
        </div>

        <label class="full">Extra Notes <textarea v-model="subraceDraft.traits" rows="3"></textarea></label>
        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="subraceDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveSubrace" :disabled="!subraceDraft.name || !subraceDraft.parentRaceId">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'classes'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Discipline</p><h2>Custom Classes ({{ classes.length }})</h2></div>
        <button type="button" class="primary-button" @click="newClass">+ New Class</button>
      </div>
      <ul v-if="classes.length" class="hb-list">
        <li v-for="c in classes" :key="c.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ c.name }}</strong>
            <small>d{{ c.hitDieFaces }} · saves {{ c.savingThrowProficiencies.join(", ").toUpperCase() || "—" }} · {{ c.casterProgression ? `${c.casterProgression} caster` : "non-caster" }} · {{ c.features.length }} features</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="shareEntity = c">Share</button>
            <button type="button" class="ghost-button" @click="editClass(c)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemove(c.id, c.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew classes yet.</p>

      <div v-if="classDraft" class="editor">
        <h3>{{ classDraft.id ? "Edit" : "New" }} Class</h3>
        <div class="form-grid two">
          <label>Name <input v-model="classDraft.name" type="text" /></label>
          <label>Hit Die
            <select v-model.number="classDraft.hitDieFaces">
              <option v-for="d in [6,8,10,12]" :key="d" :value="d">d{{ d }}</option>
            </select>
          </label>
          <label>Caster Progression
            <select v-model="classDraft.casterProgression">
              <option :value="null">None</option>
              <option value="full">Full</option>
              <option value="1/2">Half</option>
              <option value="1/3">One-third</option>
              <option value="pact">Pact</option>
              <option value="artificer">Artificer</option>
            </select>
          </label>
          <label v-if="classDraft.casterProgression">Casting Ability
            <select v-model="classDraft.spellcastingAbility">
              <option v-for="a in ABILITIES" :key="a" :value="a">{{ a.toUpperCase() }}</option>
            </select>
          </label>
        </div>

        <p class="eyebrow">Saving Throw Proficiencies</p>
        <div class="check-row">
          <label v-for="ab in ABILITIES" :key="ab" class="check">
            <input type="checkbox" :checked="classDraft.savingThrowProficiencies.includes(ab)" @change="toggleSave(ab)" />
            {{ ab.toUpperCase() }}
          </label>
        </div>

        <p class="eyebrow">Cantrip Progression (per level 1–20, comma separated)</p>
        <input class="full-input" :value="(classDraft.cantripProgression ?? []).join(',')" placeholder="2,2,2,3,3,..." @change="setCantripProg(($event.target as HTMLInputElement).value)" />

        <p class="eyebrow">Spell Slot Progression (one row per level, semicolons between levels, commas between slot levels)</p>
        <textarea class="full-input" rows="4" :value="slotProgRaw" placeholder="L1=2;L2=3;L3=4,2;..." @change="setSlotProg(($event.target as HTMLTextAreaElement).value)"></textarea>

        <p class="eyebrow">ASI / Feat Levels</p>
        <p class="muted small">Toggle the levels at which the class grants an Ability Score Improvement (or feat).</p>
        <div class="check-row">
          <label v-for="lv in 20" :key="lv" class="check level-check">
            <input type="checkbox" :checked="(classDraft.asiLevels ?? []).includes(lv)" @change="toggleAsiLevel(lv)" />
            Lv {{ lv }}
          </label>
        </div>

        <div class="features-head">
          <p class="eyebrow">Features by Level</p>
          <button type="button" class="ghost-button" @click="addFeature">+ Feature</button>
        </div>
        <div v-for="grp in featuresByLevel" :key="grp.level" class="level-group">
          <div class="level-head"><strong>Level {{ grp.level }}</strong><span v-if="(classDraft.asiLevels ?? []).includes(grp.level)" class="asi-tag">ASI</span></div>
          <div v-for="f in grp.features" :key="f._idx" class="feature-edit">
            <div class="form-grid two">
              <label>Level <input v-model.number="f.level" type="number" min="1" max="20" /></label>
              <label>Name <input v-model="f.name" type="text" /></label>
            </div>
            <textarea v-model="f.description" rows="3" placeholder="Feature text"></textarea>
            <button type="button" class="danger-button small" @click="removeFeature(f._idx)">Remove</button>
          </div>
        </div>

        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="classDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveClass" :disabled="!classDraft.name">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'monsters'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Bestiary</p><h2>Custom Monsters ({{ customMonsters.length }})</h2></div>
        <button type="button" class="primary-button" @click="newMonster">+ New Monster</button>
      </div>
      <ul v-if="customMonsters.length" class="hb-list">
        <li v-for="m in customMonsters" :key="m.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ m.name }}</strong>
            <small>{{ m.size || "M" }} {{ m.type || "monster" }} · CR {{ m.cr || "?" }} · AC {{ m.ac }} · HP {{ m.hp }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="shareEntity = m">Share</button>
            <button type="button" class="ghost-button" @click="editMonster(m)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemoveMonster(m.id, m.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No custom monsters yet.</p>

      <div v-if="monsterDraft" class="editor">
        <h3>{{ monsterDraft.id ? "Edit" : "New" }} Monster</h3>

        <p class="eyebrow">Identity</p>
        <div class="form-grid two">
          <label>Name <input v-model="monsterDraft.name" type="text" /></label>
          <label>Type <input v-model="monsterDraft.type" type="text" placeholder="humanoid, beast..." /></label>
          <label>Size
            <select v-model="monsterDraft.size">
              <option v-for="s in MONSTER_SIZES" :key="s.code" :value="s.code">{{ s.label }}</option>
            </select>
          </label>
          <label>CR <input v-model="monsterDraft.cr" type="text" placeholder="1/4, 2..." /></label>
          <label>XP <input v-model.number="monsterDraft.xp" type="number" min="0" /></label>
        </div>

        <p class="eyebrow">Defenses & HP</p>
        <div class="form-grid two">
          <label>AC <input v-model.number="monsterDraft.ac" type="number" /></label>
          <label>HP (avg) <input v-model.number="monsterDraft.hp" type="number" /></label>
          <label>HP formula <input v-model="monsterDraft.hpFormula" type="text" placeholder="e.g. 8d10 + 16" /></label>
        </div>

        <p class="eyebrow">Ability Scores</p>
        <div class="ability-grid">
          <label v-for="ab in ABILITIES" :key="ab" class="ab-bonus">
            <span>{{ ab.toUpperCase() }}</span>
            <input type="number" v-model.number="monsterDraft.abilityScores[ab]" />
          </label>
        </div>

        <p class="eyebrow">Saving Throw Bonuses (optional, e.g. "+5")</p>
        <div class="form-grid two">
          <label v-for="ab in ABILITIES" :key="ab">{{ ab.toUpperCase() }}
            <input type="text" :value="monsterDraft.saves?.[ab] ?? ''" placeholder="—" @input="setSave(ab, ($event.target as HTMLInputElement).value)" />
          </label>
        </div>

        <p class="eyebrow">Speed (ft per turn)</p>
        <div class="form-grid two">
          <label>Walk <input type="number" min="0" :value="monsterDraft.speeds?.walk ?? monsterDraft.speed ?? 0" @input="setSpeed('walk', ($event.target as HTMLInputElement).valueAsNumber)" /></label>
          <label>Fly <input type="number" min="0" :value="monsterDraft.speeds?.fly ?? 0" @input="setSpeed('fly', ($event.target as HTMLInputElement).valueAsNumber)" /></label>
          <label>Swim <input type="number" min="0" :value="monsterDraft.speeds?.swim ?? 0" @input="setSpeed('swim', ($event.target as HTMLInputElement).valueAsNumber)" /></label>
          <label>Climb <input type="number" min="0" :value="monsterDraft.speeds?.climb ?? 0" @input="setSpeed('climb', ($event.target as HTMLInputElement).valueAsNumber)" /></label>
          <label>Burrow <input type="number" min="0" :value="monsterDraft.speeds?.burrow ?? 0" @input="setSpeed('burrow', ($event.target as HTMLInputElement).valueAsNumber)" /></label>
        </div>

        <p class="eyebrow">Senses & Passive</p>
        <div class="form-grid two">
          <label>Passive Perception <input v-model.number="monsterDraft.passivePerception" type="number" min="0" /></label>
        </div>
        <input class="full-input" type="text" placeholder='Senses (comma separated, e.g. "darkvision 60 ft", "tremorsense 30 ft")' :value="(monsterDraft.sensesList ?? []).join(', ')" @change="setList('sensesList', ($event.target as HTMLInputElement).value)" />

        <p class="eyebrow">Languages</p>
        <input class="full-input" type="text" placeholder='Comma separated (e.g. "Common, Draconic")' :value="(monsterDraft.languages ?? []).join(', ')" @change="setList('languages', ($event.target as HTMLInputElement).value)" />

        <p class="eyebrow">Skill Bonuses</p>
        <div class="trait-list">
          <div v-for="(row, i) in skillRows" :key="i" class="trait-row">
            <input type="text" placeholder="Skill (e.g. Stealth)" :value="row.k" @change="updateSkillKey(i, ($event.target as HTMLInputElement).value)" />
            <input type="text" placeholder="+5" :value="row.v" @change="updateSkillVal(i, ($event.target as HTMLInputElement).value)" />
            <button type="button" class="danger-button small" @click="removeSkill(i)">×</button>
          </div>
          <button type="button" class="ghost-button" @click="addSkill">+ Skill</button>
        </div>

        <details class="advanced">
          <summary>Damage / Condition Immunities & Resistances</summary>
          <div class="form-grid two">
            <label>Damage Immunities <input type="text" :value="(monsterDraft.damageImmune ?? []).join(', ')" placeholder="fire, poison" @change="setList('damageImmune', ($event.target as HTMLInputElement).value)" /></label>
            <label>Damage Resistances <input type="text" :value="(monsterDraft.damageResist ?? []).join(', ')" placeholder="cold" @change="setList('damageResist', ($event.target as HTMLInputElement).value)" /></label>
            <label>Damage Vulnerabilities <input type="text" :value="(monsterDraft.damageVulnerable ?? []).join(', ')" placeholder="thunder" @change="setList('damageVulnerable', ($event.target as HTMLInputElement).value)" /></label>
            <label>Condition Immunities <input type="text" :value="(monsterDraft.conditionImmune ?? []).join(', ')" placeholder="charmed, frightened" @change="setList('conditionImmune', ($event.target as HTMLInputElement).value)" /></label>
          </div>
        </details>

        <p class="eyebrow">Traits</p>
        <TraitListEditor :list="monsterDraft.traitsList ?? []" @update="(v) => monsterDraft && (monsterDraft.traitsList = v)" />

        <p class="eyebrow">Actions</p>
        <TraitListEditor :list="monsterDraft.actionsList ?? []" @update="(v) => monsterDraft && (monsterDraft.actionsList = v)" />

        <details class="advanced">
          <summary>Bonus Actions</summary>
          <TraitListEditor :list="monsterDraft.bonusActions ?? []" @update="(v) => monsterDraft && (monsterDraft.bonusActions = v)" />
        </details>
        <details class="advanced">
          <summary>Reactions</summary>
          <TraitListEditor :list="monsterDraft.reactions ?? []" @update="(v) => monsterDraft && (monsterDraft.reactions = v)" />
        </details>
        <details class="advanced">
          <summary>Legendary Actions</summary>
          <label class="full">Legendary Header <textarea v-model="monsterDraft.legendaryHeader" rows="2" placeholder="e.g. Can take 3 legendary actions..."></textarea></label>
          <TraitListEditor :list="monsterDraft.legendaryActions ?? []" @update="(v) => monsterDraft && (monsterDraft.legendaryActions = v)" />
        </details>
        <details class="advanced">
          <summary>Mythic Actions</summary>
          <TraitListEditor :list="monsterDraft.mythicActions ?? []" @update="(v) => monsterDraft && (monsterDraft.mythicActions = v)" />
        </details>
        <details class="advanced">
          <summary>Lair Actions</summary>
          <TraitListEditor :list="monsterDraft.lairActions ?? []" @update="(v) => monsterDraft && (monsterDraft.lairActions = v)" />
        </details>
        <details class="advanced">
          <summary>Regional Effects</summary>
          <TraitListEditor :list="monsterDraft.regionalEffects ?? []" @update="(v) => monsterDraft && (monsterDraft.regionalEffects = v)" />
        </details>
        <details class="advanced">
          <summary>Spellcasting</summary>
          <textarea v-model="monsterDraft.spellcasting" class="full-input" rows="4" placeholder="Spellcasting block as free text..."></textarea>
        </details>
        <details class="advanced">
          <summary>Source / Reference</summary>
          <div class="form-grid two">
            <label>Source <input v-model="monsterDraft.source" type="text" placeholder="Homebrew, MM, etc." /></label>
            <label>Page <input v-model.number="monsterDraft.page" type="number" min="0" /></label>
          </div>
        </details>

        <label class="full">Notes <textarea v-model="monsterDraft.notes" rows="2"></textarea></label>
        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="monsterDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveMonster" :disabled="!monsterDraft.name">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'npcs'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Cast</p><h2>NPCs ({{ npcs.length }})</h2></div>
        <button type="button" class="primary-button" @click="newNpc">+ New NPC</button>
      </div>
      <ul v-if="npcs.length" class="hb-list">
        <li v-for="n in npcs" :key="n.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ n.name }}</strong>
            <small>{{ n.race || "—" }}{{ n.description ? ` · ${n.description.slice(0, 80)}${n.description.length > 80 ? "…" : ""}` : "" }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="shareEntity = n">Share</button>
            <button type="button" class="ghost-button" @click="editNpc(n)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemove(n.id, n.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No NPCs yet.</p>

      <div v-if="npcDraft" class="editor">
        <h3>{{ npcDraft.id ? "Edit" : "New" }} NPC</h3>
        <div class="form-grid two">
          <label>Name <input v-model="npcDraft.name" type="text" /></label>
          <label>Race <input v-model="npcDraft.race" type="text" placeholder="Human, Elf, Tiefling..." /></label>
        </div>
        <label class="full">Description / Notes <textarea v-model="npcDraft.description" rows="5" placeholder="Personality, role, plot hooks..."></textarea></label>
        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="npcDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveNpc" :disabled="!npcDraft.name">Save</button>
        </div>
      </div>
    </section>

    <ShareEntityModal
      :open="!!shareEntity"
      :entity="shareEntity"
      :title="(shareEntity as any)?.name ?? ''"
      :kind-label="shareEntity ? entityKindLabel(shareEntity) : ''"
      @close="shareEntity = null"
    />
    <MassIOModal :open="massOpen" @close="massOpen = false" />
  </main>
</template>

<script setup lang="ts">
import type { Ability } from "~/types/rules";
import type { HBSpell, HBRace, HBSubrace, HBClass, HBClassFeature, HBComponents, HBRaceFeature, HBNpc } from "~/types/homebrew";
import type { CustomMonster } from "~/types/encounter";
type Ab = "str" | "dex" | "con" | "int" | "wis" | "cha";
import type { RulesEntity, RaceData } from "~/types/rules";
import type { CustomItem, ItemType } from "~/types/items";

const tabs = [
  { key: "items" as const, label: "Items" },
  { key: "spells" as const, label: "Spells" },
  { key: "races" as const, label: "Races" },
  { key: "subraces" as const, label: "Subraces" },
  { key: "classes" as const, label: "Classes" },
  { key: "monsters" as const, label: "Monsters" },
  { key: "npcs" as const, label: "NPCs" },
];
const tab = ref<typeof tabs[number]["key"]>("items");

const shareEntity = ref<unknown>(null);
const massOpen = ref(false);
const entityKindLabel = (e: unknown) => {
  const o = e as { kind?: string; type?: string };
  if (o.kind) return o.kind.charAt(0).toUpperCase() + o.kind.slice(1);
  if (o.type) return `Item · ${o.type}`;
  return "Entity";
};

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge"];
const COMMON_LANGUAGES = ["Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon", "Thieves' Cant", "Druidic"];
const DARKVISION_OPTIONS = [0, 30, 60, 90, 120];
const MONSTER_SIZES = [
  { code: "T", label: "Tiny" }, { code: "S", label: "Small" }, { code: "M", label: "Medium" },
  { code: "L", label: "Large" }, { code: "H", label: "Huge" }, { code: "G", label: "Gargantuan" },
];
const ABILITIES: Ability[] = ["str", "dex", "con", "int", "wis", "cha"];

const { spells, races, subraces, classes, npcs, load, upsert, remove } = useHomebrew();
const { items, load: loadItems, upsert: upsertItem, remove: removeItem } = useItemLibrary();
const { customMonsters, load: loadEnc, upsertMonster, removeMonster } = useEncounters();
const { data: officialRaces } = useFetch<RulesEntity<RaceData>[]>("/data/races.json", { default: () => [], server: false });

onMounted(() => { load(); loadItems(); loadEnc(); });

const raceChoices = computed(() => [
  ...races.value.map((r) => ({ id: r.id, name: r.name, source: "Homebrew" })),
  ...officialRaces.value.map((r) => ({ id: r.id, name: r.name, source: r.source })),
]);

const parentRaceName = (id: string) => raceChoices.value.find((r) => r.id === id)?.name ?? "—";

const componentLabel = (c?: HBComponents) => {
  if (!c) return "—";
  const parts = [];
  if (c.v) parts.push("V");
  if (c.s) parts.push("S");
  if (c.m) parts.push("M");
  return parts.join(", ") || "—";
};
const abilityLabel = (b?: Partial<Record<Ability, number>>) => {
  if (!b) return "";
  return Object.entries(b).filter(([_, v]) => v).map(([k, v]) => `${k.toUpperCase()} ${v! >= 0 ? "+" : ""}${v}`).join(", ");
};

const newId = (kind: string) => `hb:${kind}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;

const { confirm: askConfirm } = useConfirm();
const confirmRemove = async (id: string, name: string) => {
  if (await askConfirm({ title: `Delete "${name}"?`, message: "This cannot be undone.", confirmLabel: "Delete" })) remove(id);
};

const itemDraft = ref<CustomItem | null>(null);
const newItem = () => {
  itemDraft.value = {
    id: "", name: "", type: "misc", createdAt: new Date().toISOString(),
  };
};
const editItem = (it: CustomItem) => { itemDraft.value = JSON.parse(JSON.stringify(it)); };
const saveItem = () => {
  if (!itemDraft.value || !itemDraft.value.name) return;
  const id = itemDraft.value.id || newId("item");
  upsertItem({ ...itemDraft.value, id });
  itemDraft.value = null;
};
const confirmRemoveItem = async (id: string, name: string) => {
  if (await askConfirm({ title: `Delete "${name}"?`, message: "This cannot be undone.", confirmLabel: "Delete" })) removeItem(id);
};

const spellDraft = ref<HBSpell | null>(null);
const compV = computed({ get: () => !!spellDraft.value?.components?.v, set: (v) => spellDraft.value && (spellDraft.value.components = { ...spellDraft.value.components, v }) });
const compS = computed({ get: () => !!spellDraft.value?.components?.s, set: (v) => spellDraft.value && (spellDraft.value.components = { ...spellDraft.value.components, s: v }) });
const compM = computed({
  get: () => !!spellDraft.value?.components?.m,
  set: (v) => spellDraft.value && (spellDraft.value.components = { ...spellDraft.value.components, m: v ? (typeof spellDraft.value.components.m === "string" ? spellDraft.value.components.m : true) : false }),
});
const compMText = computed({
  get: () => typeof spellDraft.value?.components?.m === "string" ? spellDraft.value.components.m : "",
  set: (v) => spellDraft.value && (spellDraft.value.components = { ...spellDraft.value.components, m: v || true }),
});

const newSpell = () => {
  spellDraft.value = {
    id: "", kind: "spell", name: "", level: 0, school: "", range: "",
    components: {}, description: "", createdAt: new Date().toISOString(),
  };
};
const editSpell = (s: HBSpell) => { spellDraft.value = JSON.parse(JSON.stringify(s)); };
const saveSpell = () => {
  if (!spellDraft.value) return;
  const draft = { ...spellDraft.value, id: spellDraft.value.id || newId("spell") };
  upsert(draft);
  spellDraft.value = null;
};

const raceDraft = ref<HBRace | null>(null);
const newRace = () => {
  raceDraft.value = {
    id: "", kind: "race", name: "", size: "Medium", speed: 30,
    abilityBonuses: {}, languages: ["Common"], darkvision: 0,
    age: "", alignment: "", features: [], traits: "",
    createdAt: new Date().toISOString(),
  };
};
const editRace = (r: HBRace) => {
  raceDraft.value = {
    languages: ["Common"], darkvision: 0, features: [], age: "", alignment: "",
    ...JSON.parse(JSON.stringify(r)),
  };
};
const setRaceAbility = (ab: Ability, val: number) => {
  if (!raceDraft.value) return;
  raceDraft.value.abilityBonuses = { ...(raceDraft.value.abilityBonuses ?? {}), [ab]: Number.isFinite(val) ? val : 0 };
};
const toggleRaceLang = (lang: string) => {
  if (!raceDraft.value) return;
  const cur = raceDraft.value.languages ?? [];
  raceDraft.value.languages = cur.includes(lang) ? cur.filter((l) => l !== lang) : [...cur, lang];
};
const customLangs = (langs?: string[]) =>
  (langs ?? []).filter((l) => !COMMON_LANGUAGES.includes(l)).join(", ");
const setCustomRaceLangs = (raw: string) => {
  if (!raceDraft.value) return;
  const standard = (raceDraft.value.languages ?? []).filter((l) => COMMON_LANGUAGES.includes(l));
  const extras = raw.split(",").map((s) => s.trim()).filter(Boolean);
  raceDraft.value.languages = [...standard, ...extras];
};
const addRaceFeature = () => {
  if (!raceDraft.value) return;
  raceDraft.value.features = [...(raceDraft.value.features ?? []), { name: "", description: "" }];
};
const removeRaceFeature = (idx: number) => {
  if (!raceDraft.value) return;
  raceDraft.value.features = (raceDraft.value.features ?? []).filter((_, i) => i !== idx);
};
const saveRace = () => {
  if (!raceDraft.value) return;
  upsert({ ...raceDraft.value, id: raceDraft.value.id || newId("race") });
  raceDraft.value = null;
};

const subraceDraft = ref<HBSubrace | null>(null);
const newSubrace = () => {
  subraceDraft.value = {
    id: "", kind: "subrace", name: "", parentRaceId: "",
    abilityBonuses: {}, languages: [], features: [], traits: "",
    createdAt: new Date().toISOString(),
  };
};
const editSubrace = (r: HBSubrace) => {
  subraceDraft.value = {
    languages: [], features: [],
    ...JSON.parse(JSON.stringify(r)),
  };
};
const setSubraceAbility = (ab: Ability, val: number) => {
  if (!subraceDraft.value) return;
  subraceDraft.value.abilityBonuses = { ...(subraceDraft.value.abilityBonuses ?? {}), [ab]: Number.isFinite(val) ? val : 0 };
};
const toggleSubraceLang = (lang: string) => {
  if (!subraceDraft.value) return;
  const cur = subraceDraft.value.languages ?? [];
  subraceDraft.value.languages = cur.includes(lang) ? cur.filter((l) => l !== lang) : [...cur, lang];
};
const setCustomSubraceLangs = (raw: string) => {
  if (!subraceDraft.value) return;
  const standard = (subraceDraft.value.languages ?? []).filter((l) => COMMON_LANGUAGES.includes(l));
  const extras = raw.split(",").map((s) => s.trim()).filter(Boolean);
  subraceDraft.value.languages = [...standard, ...extras];
};
const addSubraceFeature = () => {
  if (!subraceDraft.value) return;
  subraceDraft.value.features = [...(subraceDraft.value.features ?? []), { name: "", description: "" }];
};
const removeSubraceFeature = (idx: number) => {
  if (!subraceDraft.value) return;
  subraceDraft.value.features = (subraceDraft.value.features ?? []).filter((_, i) => i !== idx);
};
const saveSubrace = () => {
  if (!subraceDraft.value) return;
  upsert({ ...subraceDraft.value, id: subraceDraft.value.id || newId("subrace") });
  subraceDraft.value = null;
};

const classDraft = ref<HBClass | null>(null);
const newClass = () => {
  classDraft.value = {
    id: "", kind: "class", name: "", hitDieFaces: 8,
    savingThrowProficiencies: [], spellcastingAbility: null, casterProgression: null,
    preparedSpellsFormula: "", cantripProgression: [], spellSlotProgression: [],
    asiLevels: [4, 8, 12, 16, 19],
    features: [], createdAt: new Date().toISOString(),
  };
};
const editClass = (c: HBClass) => {
  classDraft.value = { asiLevels: [4, 8, 12, 16, 19], ...JSON.parse(JSON.stringify(c)) };
};
watch(() => classDraft.value?.casterProgression, (prog) => {
  if (!classDraft.value) return;
  if (!prog) {
    classDraft.value.spellcastingAbility = null;
  } else if (!classDraft.value.spellcastingAbility) {
    classDraft.value.spellcastingAbility = "int";
  }
});

const toggleAsiLevel = (lv: number) => {
  if (!classDraft.value) return;
  const cur = classDraft.value.asiLevels ?? [];
  classDraft.value.asiLevels = cur.includes(lv) ? cur.filter((l) => l !== lv) : [...cur, lv].sort((a, b) => a - b);
};
const featuresByLevel = computed(() => {
  if (!classDraft.value) return [];
  const indexed = classDraft.value.features.map((f, _idx) => ({ ...f, _idx }));
  const map = new Map<number, typeof indexed>();
  for (const f of indexed) {
    if (!map.has(f.level)) map.set(f.level, [] as any);
    map.get(f.level)!.push(f);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([level, features]) => ({ level, features }));
});
const toggleSave = (ab: Ability) => {
  if (!classDraft.value) return;
  const set = new Set(classDraft.value.savingThrowProficiencies);
  if (set.has(ab)) set.delete(ab); else set.add(ab);
  classDraft.value.savingThrowProficiencies = [...set];
};
const setCantripProg = (raw: string) => {
  if (!classDraft.value) return;
  classDraft.value.cantripProgression = raw.split(",").map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
};
const slotProgRaw = computed(() =>
  (classDraft.value?.spellSlotProgression ?? []).map((row, i) => `L${i + 1}=${row.join(",")}`).join(";\n"),
);
const setSlotProg = (raw: string) => {
  if (!classDraft.value) return;
  const rows: number[][] = [];
  raw.split(/[;\n]+/).forEach((line) => {
    const m = line.match(/L\d+=([\d, ]+)/);
    if (m && m[1]) rows.push(m[1].split(",").map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite));
  });
  classDraft.value.spellSlotProgression = rows;
};
const addFeature = () => {
  if (!classDraft.value) return;
  classDraft.value.features = [...classDraft.value.features, { level: 1, name: "", description: "" }];
};
const removeFeature = (idx: number) => {
  if (!classDraft.value) return;
  classDraft.value.features = classDraft.value.features.filter((_, i) => i !== idx);
};
const saveClass = () => {
  if (!classDraft.value) return;
  upsert({ ...classDraft.value, id: classDraft.value.id || newId("class") });
  classDraft.value = null;
};

const monsterDraft = ref<CustomMonster | null>(null);
const newMonster = () => {
  monsterDraft.value = {
    id: "", name: "", size: "M", ac: 10, hp: 10, speed: 30,
    speeds: { walk: 30 },
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saves: {}, skillBonuses: {}, sensesList: [], languages: [],
    damageImmune: [], damageResist: [], damageVulnerable: [], conditionImmune: [],
    traitsList: [], actionsList: [], bonusActions: [], reactions: [],
    legendaryActions: [], mythicActions: [], lairActions: [], regionalEffects: [],
    createdAt: new Date().toISOString(),
  };
};
const editMonster = (m: CustomMonster) => {
  monsterDraft.value = {
    saves: {}, skillBonuses: {}, sensesList: [], languages: [],
    damageImmune: [], damageResist: [], damageVulnerable: [], conditionImmune: [],
    traitsList: [], actionsList: [], bonusActions: [], reactions: [],
    legendaryActions: [], mythicActions: [], lairActions: [], regionalEffects: [],
    speeds: { walk: m.speed ?? 30 },
    ...JSON.parse(JSON.stringify(m)),
  };
};
const saveMonster = () => {
  if (!monsterDraft.value) return;
  const id = monsterDraft.value.id || newId("cmon");
  const walk = monsterDraft.value.speeds?.walk;
  if (typeof walk === "number") monsterDraft.value.speed = walk;
  upsertMonster({ ...monsterDraft.value, id });
  monsterDraft.value = null;
};
const confirmRemoveMonster = async (id: string, name: string) => {
  if (await askConfirm({ title: `Delete "${name}"?`, message: "This cannot be undone.", confirmLabel: "Delete" })) removeMonster(id);
};

const setSave = (ab: Ab, val: string) => {
  if (!monsterDraft.value) return;
  const next = { ...(monsterDraft.value.saves ?? {}) };
  if (val.trim()) next[ab] = val.trim(); else delete next[ab];
  monsterDraft.value.saves = next;
};
const setSpeed = (key: "walk" | "fly" | "swim" | "climb" | "burrow", val: number) => {
  if (!monsterDraft.value) return;
  const next = { ...(monsterDraft.value.speeds ?? {}) };
  if (Number.isFinite(val) && val > 0) next[key] = val; else delete next[key];
  monsterDraft.value.speeds = next;
};
const setList = (
  key: "sensesList" | "languages" | "damageImmune" | "damageResist" | "damageVulnerable" | "conditionImmune",
  raw: string,
) => {
  if (!monsterDraft.value) return;
  const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
  (monsterDraft.value as Record<string, unknown>)[key] = arr;
};

const skillRows = computed(() => {
  if (!monsterDraft.value) return [];
  return Object.entries(monsterDraft.value.skillBonuses ?? {}).map(([k, v]) => ({ k, v }));
});
const writeSkills = (rows: { k: string; v: string }[]) => {
  if (!monsterDraft.value) return;
  const out: Record<string, string> = {};
  rows.forEach((r) => { if (r.k.trim()) out[r.k.trim()] = r.v; });
  monsterDraft.value.skillBonuses = out;
};
const addSkill = () => writeSkills([...skillRows.value, { k: "", v: "+0" }]);
const removeSkill = (i: number) => writeSkills(skillRows.value.filter((_, idx) => idx !== i));
const updateSkillKey = (i: number, k: string) => writeSkills(skillRows.value.map((r, idx) => idx === i ? { ...r, k } : r));
const updateSkillVal = (i: number, v: string) => writeSkills(skillRows.value.map((r, idx) => idx === i ? { ...r, v } : r));

const npcDraft = ref<HBNpc | null>(null);
const newNpc = () => {
  npcDraft.value = { id: "", kind: "npc", name: "", race: "", description: "", createdAt: new Date().toISOString() };
};
const editNpc = (n: HBNpc) => { npcDraft.value = JSON.parse(JSON.stringify(n)); };
const saveNpc = () => {
  if (!npcDraft.value) return;
  upsert({ ...npcDraft.value, id: npcDraft.value.id || newId("npc") });
  npcDraft.value = null;
};
</script>

<style scoped>
.tabs { display: flex; gap: 6px; margin-bottom: 14px; }
.tabs button { flex: 1; min-height: 38px; background: transparent; border-color: var(--line); color: var(--ink-soft); }
.tabs button.active { background: var(--bg-panel-2); border-color: var(--gilt); color: var(--gilt); }

.hb-list { list-style: none; margin: 0 0 14px; padding: 0; display: grid; gap: 8px; }
.hb-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }
.hb-main { display: grid; gap: 2px; }
.hb-main strong { font-family: "IM Fell English", serif; font-weight: 400; font-size: 1.1rem; }
.hb-main small { color: var(--ink-faint); font-style: italic; }
.hb-actions { display: flex; gap: 6px; }

.editor { margin-top: 16px; padding: 16px; border: 1px dashed var(--gilt); border-radius: 4px; background: rgba(201, 161, 85, 0.04); display: grid; gap: 12px; }
.editor h3 { margin: 0; font-family: "IM Fell English", serif; font-weight: 400; }

.form-grid.two { display: grid; gap: 10px; grid-template-columns: 1fr; }
@media (min-width: 520px) { .form-grid.two { grid-template-columns: 1fr 1fr; } }
.form-grid.two .full { grid-column: 1 / -1; }
.full { display: grid; }

.comp-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }
.comp-row .check { display: flex; align-items: center; gap: 6px; grid-template-columns: none; padding: 4px 10px; }
.comp-mat { flex: 1; min-width: 200px; }

.ability-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.ab-bonus { display: grid; gap: 4px; padding: 6px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); text-align: center; }
.ab-bonus span { font-family: "IM Fell English SC", serif; font-size: 0.7rem; letter-spacing: 0.14em; color: var(--gilt); }
.ab-bonus input { border: none; background: transparent; text-align: center; font-family: "IM Fell English", serif; font-size: 1.1rem; padding: 0; min-height: auto; }

.check-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 4px; }
.check { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 8px; align-items: center; padding: 5px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); cursor: pointer; font-size: 0.82rem; line-height: 1.2; overflow-wrap: anywhere; word-break: break-word; min-width: 0; }
.check input[type="checkbox"] { width: 14px; height: 14px; margin: 0; justify-self: center; }
@container (max-width: 160px) { .check { font-size: 0.72rem; } }

.full-input { width: 100%; padding: 8px; font-family: "EB Garamond", serif; }

.features-head { display: flex; justify-content: space-between; align-items: center; }
.feature-edit { padding: 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg); display: grid; gap: 8px; }
.danger-button.small { justify-self: flex-start; min-height: 30px; padding: 0 10px; font-size: 0.78rem; }

.editor-actions { display: flex; justify-content: flex-end; gap: 8px; }
.muted.small { font-size: 0.78rem; margin-top: -4px; }
.level-check { font-family: "IM Fell English SC", serif; letter-spacing: 0.08em; }
.level-group { display: grid; gap: 8px; padding: 10px; border: 1px solid var(--line); border-radius: 4px; background: rgba(201,161,85,0.04); }
.level-head { display: flex; align-items: center; gap: 8px; font-family: "IM Fell English", serif; }
.asi-tag { font-size: 0.7rem; padding: 1px 8px; border: 1px solid var(--gilt); border-radius: 999px; color: var(--gilt); letter-spacing: 0.12em; }
.advanced { padding: 8px 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); display: grid; gap: 8px; }
.advanced summary { cursor: pointer; font-family: "IM Fell English SC", serif; font-size: 0.78rem; letter-spacing: 0.14em; color: var(--gilt); }
.advanced[open] summary { margin-bottom: 4px; }
.trait-list { display: grid; gap: 8px; }
.trait-row { display: grid; grid-template-columns: 1fr 80px auto; gap: 6px; align-items: center; }
</style>
