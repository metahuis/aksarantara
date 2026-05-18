# Aksarantara

**aksarantara.org** — A digital archive for endangered Indonesian regional languages, powered by Gemma 4.

> *Aksara* (script) + *Nusantara* (the archipelago) — the bridge between a thousand islands and the scripts that record them.

---

## What it is

Indonesia is home to 700+ languages. Five are in active danger of disappearing within a generation: **Bugis**, **Massenrempulu**, **Konjo**, **Minangkabau**, and **Melayu Jambi**. The scripts that recorded these languages — Lontara, Jawi — are no longer readable even by the descendants of the people who wrote them.

Aksarantara is a foundation-led initiative to preserve these languages before they are lost. It combines a crowdsourced dictionary archive with AI-assisted tools that lower the barrier to contribution.

### Core features

- **Archive** — Searchable dictionary of words, phrases, peribahasa, pantun, stories, songs, and mantra across 5 pilot languages
- **Contribute** — Voice-to-entry wizard: record a word, Gemma 4 drafts the IPA, Indonesian gloss, and confidence score; contributor reviews and confirms
- **Scan** (`/scan`) — Upload a photo of a Lontara or Jawi manuscript; Gemma 4 vision returns transliteration, romanization, Indonesian translation, and a recognized-word list
- **Chat** (`/chat`) — Corpus-grounded conversational interface; answers cite the actual archive entries, admits when it doesn't know
- **Language pages** — Per-language landing pages with endangerment status, speaker stats, sample entries, and region maps
- **Speaker profiles** — Audio recordings attributed to named community speakers
- **Admin panel** — Entry moderation, user management, bulk import, audio upload

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Framer Motion 12 |
| Styling | Plain hand-written CSS, design tokens in `src/styles.css` |
| Backend | Supabase (Postgres + Auth + Storage) |
| AI | Gemma 4 via Gemini API (vision + text), Groq Whisper (ASR) |
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

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
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
├── app/            # Next.js App Router pages
│   ├── archive/    # Searchable dictionary listing
│   ├── contribute/ # Voice contribution wizard
│   ├── scan/       # Manuscript OCR (Gemma 4 vision)
│   ├── chat/       # Grounded corpus chat
│   ├── language/   # Per-language pages
│   ├── entry/      # Word/phrase detail
│   ├── suara/      # Speaker profiles
│   ├── admin/      # Admin panel
│   └── api/        # Server-only routes (audio upload, admin ops)
├── components/     # 24 reusable components
├── lib/
│   ├── supabase.js         # Browser client
│   ├── supabase-server.js  # Server client
│   ├── supabase-admin.js   # Service-role client (server only)
│   └── db/                 # Typed query helpers
├── styles.css      # Global styles + design tokens
├── data.js         # Static language metadata + fallback data
└── audio.js        # Web Audio pub-sub singleton
```

---

## Data model

**Supabase tables:**

- `entries` — dictionary records with `lang`, `type`, `primary_text`, `gloss`, `gloss_id`, `phonetic`, `status`, `audio_url`, and more
- `speakers` — community contributors with attribution metadata
- `profiles` — user accounts with roles (`user | mitra | coordinator | admin`)
- Storage bucket `recordings` — MP3 audio files

**Entry types:** `word · phrase · peribahasa · pantun · story · song · mantra`

**Entry status flow:** `pending → approved | rejected`

---

## Languages

| Language | Region | Script |
|---|---|---|
| Bugis | South Sulawesi | Lontara |
| Massenrempulu | South Sulawesi | Lontara / Latin |
| Konjo | South Sulawesi | Lontara / Latin |
| Minangkabau | West Sumatra | Jawi / Latin |
| Melayu Jambi | Jambi | Jawi / Latin |

---

## Contributing

This project is foundation-led and not open for general code contributions at this stage. Community language contributions are welcome through the in-app `/contribute` flow.

---

## License

Content in the archive belongs to its respective speaker-contributors and language communities. Code is proprietary — Dana Indonesiana / Aksarantara Foundation.
