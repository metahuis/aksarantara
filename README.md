# Aksarantara

**Live demo:** [aksarantara.org](https://aksarantara.org)

> *Aksara* (script) + *Nusantara* (the archipelago) — preserving the languages of a thousand islands before they disappear.

A foundation-led digital archive for endangered Indonesian regional languages, powered by **Gemma 4**.

---

## The Problem

Indonesia is home to 700+ languages. Five are in active danger of disappearing within a generation: **Bugis**, **Massenrempulu**, **Konjo**, **Minangkabau**, and **Melayu Jambi**. The scripts that recorded these languages — Lontara, Jawi — are no longer readable even by the descendants of the people who wrote them.

Existing digitization efforts are fragmented, inaccessible on mobile, and rely entirely on formal linguists. Aksarantara lowers the barrier by pairing a crowdsourced dictionary archive with AI-assisted tools that let community members contribute their own knowledge.

---

## Gemma 4 Integration

Aksarantara uses **Gemma 4** (`gemma-4-26b-a4b-it` via Gemini API) across three surfaces:

| Feature | Model | What Gemma does |
|---|---|---|
| `/contribute` | Gemma 4 text | Drafts IPA phonetic notation, Indonesian gloss, and confidence score from a recorded or typed word |
| `/scan` | Gemma 4 vision | Reads a manuscript photo → outputs romanization, Indonesian translation, and a per-word glossary |
| `/chat` | Gemma 4 text | Answers questions grounded in real archive entries; generates vocabulary quizzes on demand |

**Audio pipeline (`/contribute`):** Browser records → Groq Whisper large-v3 transcribes to text → Gemma 4 generates IPA + gloss + example sentences. Gemma operates on text in both the voice and typed paths.

**Vision pipeline (`/scan`):** Image is resized to 1600 × 1600 px lossless PNG → sent alongside the full Lontara character reference chart to Gemma 4 vision → response is romanization-first (Unicode Lontara optional). This prioritizes reliable output over character-perfect Unicode.

**Chat pipeline (`/chat`):** User message → intent classified (quiz / lookup / open chat) → matching entries fetched from Supabase → entries + message sent to Gemma 4 → response rendered as text, word card, or interactive quiz stack.

---

## Features

- **Archive** — Searchable dictionary of words, phrases, peribahasa, pantun, stories, songs, and mantra across 5 pilot languages. Filter by language, type, and status.
- **Contribute** (`/contribute`) — Voice-to-entry wizard: record a word, Gemma 4 drafts IPA + gloss + confidence; contributor reviews and submits for moderation.
- **Scan** (`/scan`) — Upload a photo of a Lontara or Jawi manuscript; Gemma 4 vision returns transliteration, romanization, Indonesian translation, and a recognized-word list that can be saved directly to the archive.
- **Chat** (`/chat`) — Corpus-grounded conversational interface powered by Gemma 4. Answers cite real archive entries. Type "Kuis 10 kata Bugis" for an interactive quiz.
- **Language pages** — Per-language landing pages with endangerment status (Badan Bahasa scale), speaker statistics, sample entries, and regional maps.
- **Speaker profiles** — Audio recordings attributed to named community speakers with village and demographic metadata.
- **Admin panel** — Entry moderation, user management, bulk import (CSV), audio upload, and mitra (partner) management.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Framer Motion 12 |
| Styling | Plain hand-written CSS, design tokens in `src/styles.css` |
| Backend | Supabase (Postgres + Auth + Storage) |
| AI — text/vision | Gemma 4 via Gemini API (`gemma-4-26b-a4b-it`) |
| AI — speech | Groq Whisper large-v3 (ASR) |
| Package manager | pnpm |
| Language | JavaScript (no TypeScript) |
| Deployment | Vercel |

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- A Supabase project with the schema applied
- A `.env.local` file (see below)

### Environment variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=                   # server-only, never exposed to the browser

# AI
GEMINI_API_KEY=                        # Google AI Studio — Gemma 4 text + vision
GROQ_API_KEY=                          # Groq — Whisper large-v3 ASR
GEMINI_MODEL=gemma-4-26b-a4b-it        # optional override
```

### Run locally

```bash
pnpm install
pnpm dev        # Turbopack dev server at localhost:3000
```

### Other commands

```bash
pnpm build      # Production build
pnpm start      # Serve production build
pnpm lint       # ESLint
pnpm seed       # Seed Supabase with sample data
```

---

## Project structure

```
src/
├── app/
│   ├── contribute/     # Voice contribution wizard (auth required)
│   ├── scan/           # Manuscript OCR — Gemma 4 vision
│   ├── chat/           # Corpus-grounded chat — Gemma 4 text
│   ├── archive/        # Searchable dictionary listing
│   ├── language/[id]/  # Per-language pages
│   ├── entry/[lang]/[word]/  # Word/phrase detail
│   ├── suara/[slug]/   # Speaker profiles
│   ├── admin/          # Admin panel
│   └── api/
│       ├── ai/lontara-ocr/     # Gemma 4 vision — manuscript OCR
│       ├── ai/transcribe-draft/ # Whisper + Gemma 4 — voice contribution
│       ├── ai/tutor-chat/      # Gemma 4 — grounded chat + quiz
│       ├── admin/              # Entry moderation, bulk import, audio upload
│       └── contribute/         # Audio upload (authenticated)
├── components/         # 24 reusable UI components
├── lib/
│   ├── gemma.js              # Gemma 4 + Groq Whisper API wrappers
│   ├── supabase.js           # Browser client
│   ├── supabase-server.js    # Server client (cookies-based)
│   ├── supabase-admin.js     # Service-role client (server only)
│   └── db/                   # Query helpers (entries, languages, profiles)
├── proxy.js            # Route protection (Next.js 16 — replaces middleware.js)
├── styles.css          # Global styles + design tokens (~5 200 lines)
├── data.js             # Static language metadata + fallback data
└── audio.js            # Web Audio pub-sub singleton
```

---

## Data model

**Supabase tables:**

- `entries` — dictionary records: `lang`, `type`, `primary_text`, `gloss`, `gloss_id`, `phonetic`, `status`, `audio_url`, `speaker_id`, and more
- `speakers` — community contributors with attribution metadata
- `profiles` — user accounts with roles (`user | mitra | coordinator | admin`)
- Storage bucket `recordings` — MP3 audio files

**Entry types:** `word · phrase · peribahasa · pantun · story · song · mantra`

**Moderation flow:** `pending → approved | rejected`

---

## Languages

| Language | Region | Script | Endangerment |
|---|---|---|---|
| Bugis | South Sulawesi | Lontara | Vulnerable |
| Massenrempulu | South Sulawesi | Lontara / Latin | Endangered |
| Konjo | South Sulawesi | Lontara / Latin | Vulnerable |
| Minangkabau | West Sumatra | Jawi / Latin | Vulnerable |
| Melayu Jambi | Jambi | Jawi / Latin | Endangered |

Endangerment levels follow the official Badan Bahasa (Indonesian Language Agency) six-level classification scale.

---

## Architecture notes

- **Auth:** Supabase SSR via `@supabase/ssr`. Route protection handled in `src/proxy.js` (Next.js 16 convention — `middleware.js` is deprecated in v16). `/contribute` requires login; `/scan` and `/chat` are intentionally public for demo access.
- **Rate limiting:** In-memory per-user rate limiter on all AI routes (10 req/min). Resets on server restart — production should use Redis or Supabase-backed counters.
- **AI security:** `GEMINI_API_KEY` and `GROQ_API_KEY` are server-only. Never referenced in client components or `NEXT_PUBLIC_*` vars.
- **Service role:** `supabase-admin.js` (service-role key) is restricted to `/api/admin/*` routes only.

---

## Contributing

This project is foundation-led and not open for general code contributions at this stage. Community language contributions are welcome through the in-app `/contribute` flow.

---

## License

Content in the archive belongs to its respective speaker-contributors and language communities. Code is proprietary — Dana Indonesiana / Aksarantara Foundation.
