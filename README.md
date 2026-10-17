# Pearl's Sparkle Kingdom

A tablet-first learning game for a 4-year-old pre-reader. She plays short, audio-led adventures with Pearl the mermaid princess to learn:

- Dolch pre-primer sight words
- counting, with a focus on 11–20

Learning earns dress-up items and decoration stickers. She uses them in a dress-up studio and to decorate three undersea scenes.

**No reading is ever required.** Every instruction is spoken, every control is a picture, and any visible text is either the word being learned or for grown-ups.

This is a static web app/PWA, a sibling of [Word Quest](https://jrmorgan18.github.io/word-quest/), and uses the same architecture:

- React, TypeScript, Vite, and Tailwind
- a Zustand + Immer store
- pure, unit-tested engine modules
- IndexedDB with schema versioning
- a PIN-gated parent area
- the sticker-scene editor
- Playwright tests with a controllable clock

There's no backend, no accounts, no ads, no purchases, and no external services.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 (add --host to open it from a tablet on your Wi-Fi)
npm test             # 75 unit tests (Vitest)
npx playwright install chromium webkit   # one-time
npm run test:e2e     # 12 browser tests × 2 devices: Android tablet (Chromium) + iPad (WebKit)
npm run build        # static site in dist/
npm run preview      # serve dist/ locally
```

## Deploying

`.github/workflows/deploy.yml` runs the unit tests, builds, and publishes `dist/` to GitHub Pages on every push to `main`.

One-time setup: in the repository, go to **Settings → Pages → Source** and choose **GitHub Actions**.

The build uses relative paths and hash routing, so `dist/` also works from any static host or sub-folder. HTTPS is required for offline use, install, and microphone recording (localhost is exempt).

**On the iPad:** open the site in Safari → Share → **Add to Home Screen**. After the first load, the game works offline.

## How a session works

1. **Home** has one big **Play** button, plus **Dress Up** and **Decorate**. A small lock in the corner leads to the grown-ups area, which is protected by a PIN gate.
2. **The first Play is a placement check**, presented as a normal adventure:
   - count 6 jewels and say what comes next, to confirm the 1–10 baseline
   - a run of missing-pearl necklaces for 12, 13, 14, 15, 17, and 19
   - meet the first two sight words

   Missed teens become "shaky" and get extra weight from then on. If the baseline is missed, 1–10 come back into focus.
3. **Each adventure** has 3, 4, or 6 mini-games (set by the 3/5/8-minute setting), alternating sight words and numbers. Then:
   - a treasure chest opens for each reward
   - Pearl says *"Pearl is tired. See you tomorrow!"*
4. After **2 adventures a day** (adjustable), Play shows Pearl sleeping. Dress-up and decorating stay open.

**Mini-games**

| Sight words | Counting |
|---|---|
| **Shell Search**: "Find the word *see*"; the right clam opens to show a pearl | **Pearl Necklace**: "13, 14, *hmm?*, 16"; the number after the gap is always one of the choices, so skips are detected |
| **Bubble Pop**: words drift slowly in bubbles; motion pauses after 12 s without a touch, when the tablet is hidden, and in calm mode | **Count the Jewels**: tap each jewel (up to 20) in rows of five; each lights up and is counted exactly once; then "How many?" |
| **Royal Invitation**: a sentence is read word by word, each word lighting up as it's spoken; then she taps the target word | **Ten-Frame Treasure**: "Ten and four makes fourteen!", then pick 14; or *build* a number by tapping or dragging shells into the second frame |
| **Word Match**: 4–6 face-down cards; each word is read aloud when flipped (exposure only, not scored) | **Treasure Shop**: "Give the queen 14 pearls"; tap or drag pearls into the basket while the running total is spoken; the check button tests it |
| | **What Comes Next**: a seahorse on numbered rocks; pick the next (or previous) rock |

**Errorless-leaning feedback:**

- A wrong tap gently wiggles the item and replays the prompt.
- A second miss makes the correct answer glow.
- There's never a red X, the word "wrong", or a lost point.
- Only the *first* tap of each question counts toward learning.
- Choices start at 2, become 3 while an item is being practiced, and go up to 4 once it's learned.

## Mastery and adaptivity (`src/engine/`)

All of this lives in pure, unit-tested modules: `mastery.ts`, `selection.ts`, `session.ts`, `play.ts`, `rewards.ts`, `weeks.ts`, and `parent.ts`.

- **Skill records** are kept for every sight word, and for every number 0–max under three separate skills:
  - sequence (`n:seq:14`)
  - counting objects (`n:count:14`)
  - numeral recognition (`n:numeral:14`)
- **Learned** means a right-on-the-first-try answer on **2 different calendar days**. Several right answers on the same day count once.
- **Spaced review:** learned items come back after about **1, 3, 7, and 14 days**.
  - A miss steps the schedule back and makes the item due tomorrow.
  - Nothing is ever un-learned, and rewards are never touched.
- **Session mix:** about **60% focus** (unlearned current-week words, unlearned teens), **25% review** (due or recently learned), and **15% easy wins** (1–10, long-learned words). An easy win always comes first.
  - Every unlearned current-week word appears in each session.
- **Prioritization:** each item has a miss weight that grows with first-try misses and shrinks with successes. Teen skips (for example, picking 16 for "14, 15, __") add extra weight.
- **Weeks:** the next week unlocks automatically when the current week's words are all learned. A parent can switch this off, unlock early, or relock (a relock sticks).

## Rewards

- **When:** one reward per finished adventure, and one per newly learned item. Never for tapping alone.
- **Cap:** at most 3 learn-rewards are revealed per adventure, so the ending stays short. The rest wait in a "reward bank" for next time, so every learned item is eventually rewarded.
- **Catalog:**
  - **53 dress-up items** (12 dresses, 9 mermaid tails, 10 crowns, 7 shoes, 7 necklaces, 8 wands), including a unicorn horn headband, sea-unicorn tail, unicorn dress, rainbow tiara, and rainbow sneakers
  - **35 stickers**, including unicorns, a sea unicorn, a rainbow cloud, and a rainbow heart
  - Unicorn and rainbow pieces come first in the reward order, so they show up early
  - Once everything is owned, rewards become bonus stars.
- **Dress-up studio:**
  - three original characters: Pearl (a mermaid, so tails), Rosie (a land princess), and Gigi (a designer)
  - tap or drag items on, tap again to take one off
  - twirl in the mirror, save up to 6 looks, and save a look as a picture
- **Decorate:** Word Quest's scene editor with picture-only controls, across four scenes: Undersea Castle, Royal Ballroom, Seashell Lagoon, and Rainbow Cloud Kingdom. You can:
  - drag stickers, or tap one and then tap the scene to place it
  - resize, layer, flip, and remove them
  - reset the scene (asks for confirmation)
  - save the scene as a picture
- **Collection** (the treasure-chest button in Dress Up): earned items in full color, the rest as sparkly silhouettes.

All art is original SVG bundled with the app. The characters, outfits, and scenes are not based on any trademarked character.

## Recording voices

Grown-ups → **Record voices** lists every clip the game uses, 121 with the default curriculum:

- each sight word
- the numbers 0–20 (up to 30 if you extend the counting range)
- each instruction ("Find the word", "How many?", "Which number comes next?", "hmm?")
- the praise phrases
- the other words used in the example sentences

To record:

- Tap **● Record**, say the clip, then tap **■ Stop**. Clips stop automatically after 8 seconds.
- **▶ Play** to listen, and **Re-record** or **Delete** as needed.
- The progress bar shows "*N* of *M* clips recorded".

Tips:

- Say each clip clearly, with a short pause before and after.
- Record single words *without* sentence intonation, because they get joined: "Find the word" + "see".

How playback works:

- **Prompts are built by joining clips**, so a small set of recordings covers every line in the game.
- Royal Invitation reads its sentence one word clip at a time, which is what lets each word light up as it's spoken.
- **Fallback:** anything not yet recorded uses the browser's speech synthesis. It picks the best English voice available (Samantha/Ava on iPad, Google/Microsoft voices elsewhere) at a slightly slow speed, adjustable in Settings. If speech synthesis isn't available, unrecorded prompts are silent and the game still works.
- If microphone permission is denied, the recording screen says so and the game keeps using the built-in voice.
- The game never uses speech recognition and never asks her to speak.

## Grown-ups area

Tap the small lock on Home.

- **Gate:** a 4–8 digit PIN, stored as a salted hash. After 3 wrong tries, entry pauses for 30 seconds. Until you set a PIN, the gate asks a two-digit × two-digit multiplication question. **Forgot the PIN?** solves a harder problem and removes the PIN; progress is not affected. This is a family gate, not security.
- **Overview:**
  - current week and words learned
  - adventures today, and items due for review
  - teen numbers to watch (skips and misses)
  - placement results
  - treasure counts, and voice clips recorded
- **Mastery:**
  - every word, with status, first-try right/attempts, days right, next review, and **Mark learned**
  - a 0–max × 3-skill number grid with skip counts
  - mark any number learned
- **Sessions:** history of every adventure, with games played, first-try score, minutes, items learned, and rewards given.
- **Weeks & words:**
  - unlock or relock a week, or mark a whole week learned
  - edit any word's example sentence and picture
  - add, replace, remove, and reorder words, or move a word to another week
  - reorder weeks, add weeks, delete empty weeks
  - turn auto-unlock on or off
  - Edits never erase learning history: a re-added word gets its old record back.
- **Record voices:** see above.
- **Settings:**
  - name (only used to name saved pictures)
  - adventure length (3/5/8 min)
  - adventures per day (1/2/3/no limit)
  - counting range (up to 20/25/30)
  - sound effects and spoken prompts
  - voice speed
  - animations (follow device / calm / full)
  - PIN
- **Backup:** export/import (including recordings), "ask the browser to keep data", and **Reset everything**, which asks for confirmation twice and lets you choose whether to keep your recordings.

Parent **Mark learned** does not give a reward. Rewards come only from her own learning.

## Persistence and backups

- **Progress is stored per browser, per device. It does not sync.** Two tablets, or Safari and Chrome on the same iPad, each have their own progress.
- **Where it's stored:**
  - The game state is one versioned JSON document in IndexedDB. It falls back to `localStorage` if IndexedDB is unavailable.
  - Saves are debounced and flushed when the tab is hidden or closed.
  - Voice recordings are stored as Blobs in a separate IndexedDB store.
- **Backups:** Backup → **Export** saves one `.json` file with all progress *and every recording* (base64). It warns you when the file will be over about 15 MB. **Import** on another device replaces everything there.
- **Eviction:** Safari can evict data from websites that haven't been used in a while. Installing to the Home Screen avoids this, and the Backup tab can request persistent storage. Exporting a backup occasionally is still wise.
- **Schema migrations** (`src/engine/migrations.ts`): documents carry `schemaVersion` and are upgraded step by step on load or import, then normalized.
- **Curriculum updates:** when `CURRICULUM_VERSION` is bumped, new built-in words and weeks are merged in. Parent-edited words, placed words, and all progress are preserved.

## Project layout

```
src/
  data/         curriculum (Dolch pre-primer), pictures, reward catalog
  engine/       pure logic + unit tests: mastery, selection, session, play, rewards, weeks, parent, looks, scenes, backup, migrations
  audio/        clip catalog & prompt joining (pure), playback (recordings → speech synthesis), MediaRecorder
  persistence/  IndexedDB (state document + voice clip Blobs)
  store/        Zustand + Immer store (from Word Quest)
  art/          original SVG: characters & outfits, stickers, scenes, game pieces, icons
  components/   kid controls (picture buttons, hear-again, errorless choice logic), parent UI
  screens/      Home, Adventure, games/*, DressUp, Collection, Decorate, parent/*
tests/e2e/      Playwright specs (iPad WebKit + Android tablet Chromium, touch, page.clock)
scripts/        icon generator; shots*.mjs dev helpers for screenshots against `vite preview --port 4180`
```

## Testing notes

- **Unit tests (75):**
  - curriculum integrity
  - session composition and the category mix
  - prioritization of missed items
  - the two-day rule
  - spaced review
  - reward awarding, the cap and bank, and never removing rewards
  - teen-skip tracking and placement
  - parent overrides and curriculum editing
  - clip joining and voice-clip IndexedDB storage
  - backup round trips including audio
  - schema migrations
  - PIN hashing
- **Browser tests (12 per device):**
  - first launch and the placement check
  - a full adventure through rewards and the daily rest
  - learning a word across two days with `page.clock`
  - Pearl Necklace (wiggle, replayed prompt, glow on the second miss, skip tracking)
  - Count the Jewels
  - earning and equipping a dress-up item, and saving a look
  - decorating a scene
  - reload persistence
  - the PIN gate
  - microphone-denied fallback
  - parent overrides
  - no horizontal overflow, with child touch targets of at least 72px
- **Lessons carried over from Word Quest:**
  - enter-only transitions (no exit-animation gating)
  - drag positions read from refs
  - test helpers wait on explicit `data-phase` / `data-game-index` / `data-round` signals, never on animations
- **Run settings:** the browser tests run with `reducedMotion: 'reduce'`, because gently pulsing buttons never count as "stable" to Playwright. This also exercises calm mode. Voice is turned off in most tests to keep them fast; spoken lines are still checked through `window.__sparkleSpoken`.

## Known limitations / not verified

- **Not tested on a real iPad or Android tablet.** Everything was verified in Playwright's WebKit (iPad viewport) and Chromium (Galaxy Tab viewport) with touch emulation. Please try it on the actual tablet, especially:
  - audio unlocking on the first tap
  - speech-synthesis voice quality
  - recording and playing back clips in Safari (MP4/AAC)
  - storing Blobs in IndexedDB on your iOS version
  - pinch/long-press suppression
  - installing to the Home Screen
- **Recording was not exercised in automated tests.** No microphone is available in CI. Only the permission-denied path is covered.
- **Speech synthesis varies a lot by device.** Some Android tablets ship no English voice offline. Recording your voice avoids this.
- **The 15% "easy wins" are thin early on.** Before anything is long-learned, the first session's easy slots are filled with words she already answers well, or with 1–10.
- **Word Match doesn't count toward learning.** Memory-matching taps aren't a reliable signal, so it's exposure only.
- **The daily limit (2 adventures) is a product decision,** made to avoid endless loops. Change it in Settings.
- **The child's name** defaults to "Ella" (taken from the project folder name). It's only used to name saved pictures; change it in Settings.
