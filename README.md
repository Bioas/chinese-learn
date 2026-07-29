# Chinese Learn · 中文学习

A bilingual (English / Thai) Chinese-vocabulary learning app built around the
**HSK** curriculum + topical word lists. Vocabulary lives in the bundle;
progress (study history, statuses, saved words, theme + language) lives in
the user's `localStorage` and syncs to **Supabase** so it follows them
across devices.

The app is a **Vite + React 18 SPA**. It works fully offline against
`localStorage`; when Supabase credentials are wired in, the same progress
syncs to the cloud and merges cleanly between devices. A built-in
**demo mode** lets you preview the logged-in flow without touching Supabase.

Live: <https://sh-chinese.vercel.app>

---

## Features

| Page | Path | What it does |
|---|---|---|
| **Dashboard** (`Dashboard.jsx`) | `/` | Study streak, today's count, contribution calendar, Quick Study cards drawn from Vocabulary, jump into everything else. |
| **Vocabulary** (`Vocabulary.jsx`) | `/vocabulary` | Browse all ~3,150 words. Free-text search across Chinese / pinyin / English / Thai, category + subcategory chips, status filter (new / learning / reviewing / mastered), saved toggle, listen/printer buttons, click-to-popup detail. |
| **Word Map** (`WordMap.jsx`) | `/wordmap` | Graph-of-words view — each card lists the **shared Chinese characters** it has with other words. Search, category + subcategory filters; the connection graph itself is global (not filter-scoped) so it always agrees with the popup view. |
| **Sentences** (`Sentences.jsx`) | `/sentences` | Example sentences (`examples[]`) lifted from Vocabulary and grouped by their parent word's category. Each card shows **From: `<parent word>`** so you see which vocabulary entry the sentence belongs to. |
| **Flashcards** (`Flashcards.jsx`) | `/flashcards` | Spaced-recall flashcard session with status advancement (`new → learning → reviewing → mastered`). |
| **Quiz** (`Quiz.jsx`) | `/quiz` | Multiple-choice quiz with shimmer-free answer feedback. |
| **Login** (`Login.jsx`) | overlay | Email/password + Google OAuth via Supabase Auth. |

Cross-cutting:

- **Theme** — light / dark toggle, persisted in cloud.
- **Language** — English / Thai (`useTranslation` reads `src/lang/{en,th}.js`).
- **Pinyin toggle** — show / hide pinyin everywhere.
- **Speak** — `SpeechSynthesis` (`useSpeech.js`) with zh-CN voice fallback to en-US.
- **Supabase cloud sync** — debounced 3 s push, realtime pull on other-device edits, deep-merge for arrays / statuses / history (see `AppContext.jsx` for the merge strategy).
- **Demo Mode** — `import.meta.env.DEV` + `VITE_DEMO_MODE=true` + no Supabase = a fake user is set on login so you can preview navbar / avatar flows without an auth backend.

---

## Tech stack

| Layer | Choice |
|---|---|
| Build / dev | **Vite 6** + `@vitejs/plugin-react` |
| Framework | **React 18** + `react-router-dom` 6 |
| Styling | **Tailwind CSS 3** (`darkMode: 'class'`, custom `primary` / `accent` tokens, custom keyframes — `slide-up`, `fade-in`, `bounce-in`, `icon-spin`) |
| Backend (cloud) | **Supabase**: auth (`supabase.auth`) + a single `user_progress` row per user holding their portable JSON state |
| Stroke order | `hanzi-writer` 3 |
| Icons | `boxicons` 2 (+ a few in-house SVGs in `Icon.jsx`) |
| Testing | `playwright` (dev-time only) |

Fonts loaded from Google Fonts:

- **Noto Sans SC** — Chinese characters
- **Noto Sans Thai** — Thai script
- **Inter** — UI sans-serif

---

## Project layout

```
.
├── chinese-learn-vite/                 ← Vite root (the actual app)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vercel.json                     ← build / SPA rewrites
│   └── src/
│       ├── App.jsx                     ← Routes + ThemeSplash + scroll-to-top
│       ├── main.jsx
│       ├── index.css                   ← CSS vars (light/dark theme tokens) + tailwind base
│       ├── components/                 ← Navigation, ParticleBackground, ThemeSplash,
│       │                                 ThemeToggle, LanguageToggle, SpeakButton,
│       │                                 StrokeOrder, Icon, InkParticles,
│       │                                 ContributionCalendar
│       ├── pages/                      ← Dashboard, Vocabulary, WordMap, Sentences,
│       │                                 Flashcards, Quiz, Login
│       ├── hooks/                      ← useTranslation, useSpeech, useWordMap
│       ├── context/                    ← AppContext, AuthContext
│       ├── data/vocabulary.js          ← EXPORT_NAME: VOCABULARY + CATEGORIES
│       ├── lang/{en,th}.js             ← i18n strings, organised by page section
│       └── lib/supabase.js             ← createClient() guarded by env presence
├── chinese-learn/                      ← Old Next.js folder (kept for git history only)
└── vercel.json                         ← Tells Vercel the rootDirectory is chinese-learn-vite
```

---

## Word & Sentence data shape

`VOCABULARY` is a flat array. Each entry:

```js
{
  id:        'hsk1-035',                    // unique, "<subcategory>-<seq>"
  chinese:   '汉语',                        // the headword
  pinyin:    'Hàn yǔ',                      // tone-marked
  meaning:   'Chinese language',            // English gloss
  meaningThai: 'ภาษาจีน',                    // Thai gloss
  category:  'hsk',                         // one of the CATEGORIES ids
  subcategory: 'hsk1',                      // a subcategory id
  hskLevel:  1,                             // 1-6, only meaningful for HSK entries
  status:    'new',                         // new | learning | reviewing | mastered
  examples:  [{                              // 1+ example sentence(s)
    chinese:     '我学汉语。',
    pinyin:      'Wǒ xué Hàn yǔ.',
    meaning:     'I study Chinese.',
    meaningThai: 'ฉันเรียนภาษาจีน',
  }],
}
```

A single `chinese` text can appear under multiple HSK levels with **different
IDs** (e.g. 可爱 as `hsk3-108` AND `hsk4-058`). Everything that filters for
display dedupes by `chinese` so the user sees one card; everything that
exposes progress (saved, statuses) uses `id` so resolution stays per-record.

Categories and subcategories live in `data/vocabulary.js` (`CATEGORIES` →
`subcategories[]`). Each sub has an icon name that resolves via the
`SUBCATEGORY_ICONS` map → rendered by `Icon.jsx` (an in-house SVG registry).

---

## Routes

| URL | Component | Notes |
|---|---|---|
| `/` | `Dashboard` | Default landing |
| `/vocabulary` | `Vocabulary` | Full browse + search |
| `/wordmap` | `WordMap` | Shared-character graph |
| `/sentences` | `Sentences` | Example sentences, parent-attributed |
| `/flashcards` | `Flashcards` | SRS review session |
| `/quiz` | `Quiz` | Multiple-choice test |

Vercel rewrites every path to `index.html` (`vercel.json` → `chinese-learn-vite/vercel.json`) so direct-link refreshes work.

---

## Environment variables

Create `chinese-learn-vite/.env.local` (Vite picks up anything prefixed with
`VITE_`). To force production builds to inline, use `VITE_*` only.

| Var | Required? | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Optional | Your project's URL from the Supabase dashboard. Without it, the app runs **offline-mode** using only `localStorage`. |
| `VITE_SUPABASE_ANON_KEY` | Optional | The `anon` public key — safe to ship in the bundle. Used for Auth + Realtime + the `user_progress` table. |
| `VITE_DEMO_MODE` | Optional (`'true'`) | When set + dev mode + Supabase not configured, the login flow fakes a user so the navbar/avatar UI is still demonstrable. Never enabled in production. |

If both Supabase vars are missing, browser console prints:

```
Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
Create a free project at https://supabase.com ...
```

… and the avatar dropdown shows **Offline** until you wire credentials.

---

## Supabase setup (one-time)

You'll need a free Supabase project for cloud sync.

### 1. Auth providers

In **Authentication → Providers**:

- Enable **Email** (signups + magic link / password reset).
- Enable **Google**: paste your Google OAuth client ID + secret, set
  callback URL to `https://<your-domain>/` (Vite app receives the code at
  `/` — Supabase handles the exchange).

### 2. `user_progress` table

Run once in **SQL editor**:

```sql
create table public.user_progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Realtime must be on for cross-device sync to fire
alter publication supabase_realtime add table public.user_progress;

-- Row-Level Security (each user only sees their own row)
alter table public.user_progress enable row level security;

create policy "read own row"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "upsert own row"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "update own row"
  on public.user_progress for update
  using (auth.uid() = user_id);
```

The app writes one row per user, upserted by `user_id`. Portable state shape
(see `pickPortable` in `AppContext.jsx`):

```jsonc
{
  "studiedToday":      3,
  "streak":            5,
  "pinnedSubcategories": ["hsk1", "hsk2"],
  "showPinyin":        true,
  "savedWordIds":      ["hsk1-001", "hsk2-007"],
  "learningHistory":   { "2026-07-29": 12, "2026-07-28": 7 },
  "wordStatuses":      { "hsk1-001": "learning", "hsk1-002": "reviewing" },
  "lastStudyDate":     "2026-07-29",
  "theme":             "light",
  "language":          "en"
}
```

### 3. Deploy-time env

If you deploy to Vercel (see below), add the three `VITE_*` vars in
**Project Settings → Environment Variables** so Vite inlines them into
the production bundle.

---

## Scripts

From `chinese-learn-vite/`:

```
npm install            # install deps
npm run dev            # vite dev server (default port 5173)
npm run build          # production build → dist/
npm run preview        # serve the built dist/ locally
```

The build is fast (≈ 7 s) and emits:

- `dist/index.html` (~ 1.5 kB)
- `dist/assets/index-*.css` (~ 58 kB / 11 kB gzip)
- `dist/assets/index-*.js` (~ 1.5 MB / 360 kB gzip — the vocabulary payload dominates; code-split if you ship past ~360 kB gzip threshold)

---

## Internationalisation

Two flat string maps: `src/lang/en.js` and `src/lang/th.js`. Both export a
single object keyed by `{section}.{key}`, e.g.:

```js
{
  app:    { name: 'Chinese', tagline: 'Learn Chinese with confidence' },
  nav:    { dashboard: 'Dashboard', vocabulary: 'Vocabulary', ... },
  vocab:  { title: 'Vocabulary', subtitle: '...', searchPlaceholder: 'Search words...' },
  wordmap:{ title: 'Word Map', noConnections: 'This word has no shared characters', ... },
  // ... quiz / flashcards / sentences / common / etc.
}
```

`useTranslation()` (`src/hooks/useTranslation.js`) selects the right map from
`state.language` (set in `AppContext`) and returns `{ t, meaning }`. The
`meaning(word)` helper looks up Thai vs English meaning based on the user's
language preference, so a single word entry serves both audiences.

To add a string:

1. Drop it in both files (same key).
2. Call `t('section.key')` from the component.
3. Rebuild — Vite picks the strings up via static import.

---

## How the cloud sync works

`AppContext.jsx` runs three effects in concert:

1. **Local persistence** — every state change writes JSON to
   `localStorage` under `chinese-learn-state`.
2. **Cloud push** — when the user is signed in, change-driven effect
   debounces 3 s then `upsert`s the `pickPortable(state)` snapshot into
   `user_progress`.
3. **Cloud pull** — on login it does an initial `select('data').maybeSingle()`,
   then subscribes to `postgres_changes UPDATE` on the same row to
   receive other devices' edits in realtime.

Merge strategy (`mergeProgress`):

| Field | Strategy |
|---|---|
| `savedWordIds`, `pinnedSubcategories` | Union (Set dedupe) |
| `learningHistory[date]` | `max(local, remote)` — keep the higher count |
| `wordStatuses[id]` | Keep the more advanced status (`new < learning < reviewing < mastered`) |
| `streak` | `max` |
| `studiedToday` | Recomputed from merged `learningHistory[today]` |
| `lastStudyDate` | Most recent |
| `theme`, `language`, `showPinyin` | Remote wins (the device the user last used has the latest preference) |

The pull-after-login routine **suppresses the next push** so the merged
state doesn't immediately echo back to the server.

Status indicators surfaced to the navbar avatar:

| State | Badge | Meaning |
|---|---|---|
| `idle` | grey dot | No pending changes |
| `saving` | spinner | Debounce window active / push in flight |
| `saved` | green dot | Confirmed by Supabase (or simulated in demo-mode) |
| `offline` | red dot | Supabase unreachable OR credentials missing |
| `error` | red dot | Supabase rejected the row (tooltip shows the message) |

---

## Deploying to Vercel

The repo root contains `vercel.json`:

```json
{ "rootDirectory": "chinese-learn-vite" }
```

So Vercel picks `chinese-learn-vite/` as the project root, runs
`npm run build`, and serves `dist/`. SPA rewrites (`vercel.json` inside the
root) map any unknown path to `index.html`.

Recommended Vercel project settings:

- **Framework preset:** Vite (auto-detected from `vite.config.js`)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`
- **Environment variables (Production + Preview):**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

The git repo's `master` branch auto-deploys; PR previews work the same way.

---

## Local development without Supabase

Skip the Supabase section entirely if you just want to see the UI:

1. `cd chinese-learn-vite && npm install`
2. `npm run dev`
3. Open http://localhost:5173

`localStorage` carries everything in this mode — your data lives only in the
browser. Two things behave differently:

- The avatar dropdown shows **Offline** and the sync badge stays red.
- If you click **Sign In** the form will refuse with `Supabase not configured`.

To preview the *logged-in* UI without backend, opt into demo mode:

```bash
# chinese-learn-vite/.env.local
VITE_DEMO_MODE=true
```

Dev-mode-only, and only effective when Supabase is also absent. Production
builds ignore it.

---

## Conventions

- **State** via `useReducer` (`AppContext.jsx`) — actions: `STUDY_WORD`,
  `TOGGLE_PINNED`, `TOGGLE_PINYIN`, `SET_THEME`, `SET_LANGUAGE`,
  `SET_FLASHCARD_WORDS`, `NEXT_FLASHCARD`, `PREV_FLASHCARD`,
  `SET_QUIZ_WORDS`, `QUIZ_ANSWER`, `RESET_QUIZ`, `SET_SEARCH`,
  `TOGGLE_SAVED_WORD`, `UPDATE_WORD_STATUS`, `LOAD_STATE`.
- **Enums** defined once near the relevant reducer.
- **i18n keys** are camelCase kebab-style (`noMatches`, `searchPlaceholder`).
- **Color tokens** live as CSS variables in `index.css` (`--accent-from`,
  `--accent-to`, `--bg-primary`, `--bg-card`, `--border-color`, …) — both
  themes work without rebuilding Tailwind.
- **Components** import icons by **string name** (`<Icon name="wordmap" />`)
  so they're easy to add and theme-safe.
- **One feature per page** — `useWordMap` (`hooks/useWordMap.js`)
  encapsulates the shared-character graph so `WordMap.jsx` stays declarative.

---

## Known gaps / roadmap

Things deliberately left for future work, in rough priority:

- **Extract shared components** — `<ChipRow>` (the horizontal-scroll +
  edge-fade filter bar) and `<PaginationBar>` (desktop / mobile variants)
  are copied across Vocabulary / WordMap / Sentences and would benefit
  from a single source of truth.
- **Shared search util** — the four-field
  (chinese / pinyin / meaning / meaningThai) low-case search filter is
  duplicated in `useWordMap.js` and `Vocabulary.jsx`; worth extracting to
  `src/lib/searchVocab.js`.
- **Popup reuses the global char index** — the WordMap detail popup could
  consume the same dedup-by-chinese lookup the card uses instead of
  re-deriving from `VOCABULARY` directly.
- **Code-splitting** — the vocab payload pushes the bundle past the 500 kB
  minification warning; consider `import()`-per-category for the heavy
  pages.
- **Tests** — `playwright` is installed but unused; a minimal happy-path
  spec covering auth + sync roundtrip would catch regressions like the
  card-vs-popup disjoint scopes that motivated this README.

---

## License

Personal project, no license declared. Vocabulary data is curated HSK +
topical material; treat it as study aid, not a reference corpus.
