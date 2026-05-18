# VIDEO.md — Aksarantara Demo Video Production Guide

> Final reference for the 3-minute Gemma 4 Good Hackathon submission video.
> Deadline: **2026-05-19 06:59 AM GMT+7** (11:59 PM UTC May 18).

---

## 1. Specs

| | |
|---|---|
| **Length** | ≤ 3 minutes (target: 2:50) |
| **Resolution** | 1920 × 1080 (1080p) |
| **Format** | MP4 (H.264) |
| **Aspect** | 16:9 |
| **Audio** | 48 kHz stereo, peak −6 dB |
| **Platform** | YouTube — **Public**, not Unlisted |
| **Subtitles** | Burned-in English + uploaded `.srt` for YouTube auto-captions |

---

## 2. Story arc

| Time | Beat | Source |
|---|---|---|
| 0:00 – 0:15 | Hook — manuscript that can't be read | **Flow** |
| 0:15 – 0:35 | Problem — 5 dying languages, scripts forgotten | **Flow + text overlays** |
| 0:35 – 1:15 | Demo S1 — `/scan` manuscript OCR (the WOW) | **Real screen recording** |
| 1:15 – 1:50 | Demo A1 — `/contribute` voice → dictionary draft | **Real screen recording** |
| 1:50 – 2:15 | Demo A2 — `/chat` grounded corpus chat | **Real screen recording** |
| 2:15 – 2:45 | Vision — fine-tune, village node, growing archive | **Flow + diagram** |
| 2:45 – 3:00 | Close — name reveal, tagline | **Flow** |

---

## 3. Full script — shot by shot

### 0:00 – 0:15 · HOOK

**Visual:** Close-up of weathered hands gently unrolling an old palm-leaf manuscript with Lontara Bugis script. Warm window light, dust particles, shallow depth of field.

**VO (Bahasa Indonesia):**
> "Ini surat dari nenek buyut saya. Saya tidak bisa membacanya. Tidak ada anggota keluarga yang masih bisa."

**Subtitle (English):**
> "This is my great-grandmother's letter. I can't read it. No one in my family can anymore."

---

### 0:15 – 0:35 · PROBLEM

**Visual:** B-roll of Indonesian village scenes, palm-leaf manuscripts in baskets, an elderly speaker in soft light. Text overlays appear in sequence:
- "Indonesia — 700+ languages"
- "Bugis · Massenrempulu · Konjo · Minangkabau · Melayu Jambi"
- "Endangered. Some critically."

**VO (BI):**
> "Indonesia kehilangan bahasa setiap generasi. Aksara yang dulu mencatatnya — Lontara, Jawi — kini bahkan keturunan pemiliknya tidak bisa membaca. Yang tidak terbaca, akan hilang."

**Subtitle (EN):**
> "Indonesia loses a language every generation. The scripts that once recorded them — Lontara, Jawi — even the descendants of the manuscripts' owners can no longer read them. What stays unread, dies."

---

### 0:35 – 1:15 · DEMO S1 — Manuscript OCR

**Visual:** Screen recording of `/scan`:
1. Open page (clean, hero strip visible)
2. Upload a real Lontara manuscript photo
3. Click **✦ Baca Manuskrip**
4. Loading animation (Gemma reading)
5. Result appears — show all four tabs:
   - **Transliterasi** (Lontara Unicode)
   - **Romanisasi** (Latin)
   - **Terjemahan** (Indonesian)
   - **Entri** (recognized words list)
6. Zoom-in on one recognized word card

**VO (BI):**
> "Aksarantara menggunakan Gemma 4 vision untuk membaca apa yang sudah tidak bisa dibaca keluarga. Satu foto. Beberapa detik. Tiga lapisan: aksara asli, romanisasi, dan terjemahan ke Bahasa Indonesia."

**Subtitle (EN):**
> "Aksarantara uses Gemma 4 vision to read what families can no longer read. One photograph. A few seconds. Three layers: original script, romanization, and Indonesian translation."

---

### 1:15 – 1:50 · DEMO A1 — Voice → Dictionary Entry

**Visual:** Screen recording of `/contribute`:
1. Land on contribute page
2. Tap **Record voice**
3. Speak a Bugis word out loud (real or pre-recorded clip)
4. Stop recording
5. AI badge animates — **Gemma 4 generating draft**
6. Result fills in: word, IPA, Indonesian gloss, confidence
7. User accepts → entry saved

**VO (BI):**
> "Dulu mencatat satu kata butuh ahli bahasa, paham IPA, ketik transliterasi yang benar. Sekarang: tekan rekam, ucapkan, konfirmasi. Gemma 4 menyusun draft-nya. Kontributor tetap menjadi ahli."

**Subtitle (EN):**
> "Recording a word used to require a linguist, IPA knowledge, and correct Latin transcription. Now: press record, speak, confirm. Gemma 4 drafts the entry. The contributor stays the expert."

---

### 1:50 – 2:15 · DEMO A2 — Grounded Chat

**Visual:** Screen recording of `/chat`:
1. Empty state — "Ngobrol sama Aksarantara"
2. Type: *"Apa arti siri'?"*
3. Tool chip appears — "📚 Membaca arsip…"
4. Grounded entry card returns with: word, IPA, gloss, language source
5. Type follow-up: *"Buatkan kuis 5 kata Bugis"*
6. Quiz cards appear

**VO (BI):**
> "Tanya pertanyaan, dapat jawaban yang bersumber dari arsip nyata. Kalau Gemma 4 tidak tahu, dia mengakuinya. Tidak ada warisan yang dikarang-karang."

**Subtitle (EN):**
> "Ask a question, get an answer backed by the actual archive. When Gemma 4 doesn't know, it says so. No invented heritage."

---

### 2:15 – 2:45 · VISION

**Visual:** Mix of Flow B-roll + on-screen diagrams:
1. Map of Indonesian archipelago (Flow)
2. Diagram: mini-PC + Ollama + Gemma 4 E4B — "village node"
3. Text overlay: "Roadmap: Lontara LoRA fine-tune · Offline village deployment · Pantun, peribahasa, mantra"
4. Coordinator silhouette walking into a village (Flow)

**VO (BI):**
> "Hari ini sebuah aplikasi web. Besok sebuah node luring di desa, model vision yang di-fine-tune untuk Lontara, dan arsip hidup yang tumbuh dari setiap suara yang direkam dan setiap manuskrip yang dibaca."

**Subtitle (EN):**
> "Today it's a web app. Tomorrow it's an offline village node, a fine-tuned vision model for Lontara, and a living archive that grows with every voice recorded and every manuscript read."

---

### 2:45 – 3:00 · CLOSE

**Visual:** Slow fade from hero shot (Lontara glyph glowing) to clean text card on warm cream background:

```
        Aksarantara
   talk to your archive
```

Then logo + URL `aksarantara.org`.

**VO (BI):**
> "Aksara adalah tulisan. Nusantara adalah seribu pulau. Aksarantara adalah jembatan di antaranya — diterangi oleh Gemma 4."

**Subtitle (EN):**
> "Aksara is a script. Nusantara is a thousand islands. Aksarantara is the bridge between them — lit by Gemma 4."

---

## 4. Flow prompts (B-roll, generate at 16:9)

### Prompt 1 — Opening hook (0:00–0:15)

```
Slow cinematic close-up of weathered Indonesian hands gently
unrolling an old palm-leaf manuscript with horizontal rows of
script characters, warm window light from the left, shallow
depth of field, fine dust particles drifting through the light,
documentary photography aesthetic, aged ivory and deep indigo
tones, 16:9 cinematic, no readable text, no faces.
```

### Prompt 2 — Village scene (0:15–0:25)

```
Wide cinematic shot of an elderly Indonesian woman sitting on a
wooden porch in a Sulawesi village at golden hour, palm trees
and traditional Bugis architecture in the background, soft warm
light, slow gentle camera push-in, documentary style, shallow
depth of field, 16:9, no clear faces.
```

### Prompt 3 — Manuscripts in storage (0:25–0:35)

```
Top-down cinematic shot of old palm-leaf manuscripts wrapped in
cloth, stored in a rattan basket on a wooden table in a traditional
Indonesian home, soft window light from the side, warm sepia tones,
dust motes, intimate documentary aesthetic, 16:9, no readable text.
```

### Prompt 4 — Archipelago aerial (2:15–2:25)

```
Aerial drone shot flying slowly over the Indonesian archipelago
at sunset, hundreds of small green islands scattered across blue
sea, gentle camera movement, warm golden hour colors, cinematic
documentary style, 16:9, no text overlays.
```

### Prompt 5 — Village node concept (2:25–2:35)

```
Cinematic shot of a small modern mini-computer sitting on a
wooden desk in a rural Indonesian schoolroom, glowing soft blue
light from the device, warm afternoon sunlight from the window,
shallow depth of field, hopeful and quiet mood, 16:9, no text.
```

### Prompt 6 — Closing hero (2:45–3:00)

```
Lontara Bugis script characters glowing softly on weathered
parchment paper, slowly transforming into modern Latin letters
through abstract particle effects, indigo and warm amber color
palette, slow-motion, cinematic, 16:9, no specific readable text.
```

---

## 5. Screen recording shots — what to capture

Use **OBS Studio** at 1920×1080, 60 fps. Record cursor visibly. Slow your clicks deliberately — viewer needs to follow.

### Shot SR1 — `/scan` manuscript OCR (target ~40s clip)
- Start on empty `/scan` page
- Drag-drop a real Lontara manuscript image into the dropzone
- Wait for thumbnail to appear, click **✦ Baca Manuskrip**
- Let the loading animation play (don't cut it — sells the AI work)
- Show results appearing, click through all 4 tabs slowly
- Zoom into one recognized word card

### Shot SR2 — `/contribute` AI Draft (target ~35s clip)
- Start on `/contribute`, language already selected (e.g., Bugis)
- Click record button, speak a real word for 2-3 seconds
- Stop recording
- Let AI badge animate, draft fields fill in
- Show IPA, gloss, confidence

### Shot SR3 — `/chat` grounded answer (target ~25s clip)
- Start on empty `/chat`
- Type "Apa arti siri'?" — slow enough to read
- Show tool chip appear, then grounded entry card
- Optional: follow-up "Kuis 5 kata Bugis" → quiz cards

**Tip:** Record each shot 3 times, pick the cleanest take. Don't pause — re-record if you fumble.

---

## 6. Editing notes

### Music
- YouTube Audio Library, search **"documentary piano"** or **"ambient strings"**
- Keep music BELOW the voiceover (-18 dB while VO plays, -10 dB during silent transitions)
- Suggested tracks: anything by Kevin MacLeod marked "Inspirational" or "Calm"

### Color grade
- Apply warm LUT across the whole video — slight orange-blue split tone
- Keeps Flow B-roll and screen recordings looking like the same project

### Subtitles
- Burn English subtitles into the video (in case judges watch without sound)
- ALSO upload `.srt` to YouTube so accessibility/translation works
- Font: **Inter** or **Plus Jakarta Sans**, white with 80% black box, 28-32px
- Position: bottom 1/6 of frame

### Transitions
- Use plain cuts, not flashy wipes
- 0.3s fade between sections is plenty
- Sync hard cuts to music beats where possible

---

## 7. Voiceover

### Option A — Record yourself (recommended for emotional weight)
- Phone in a quiet room, mic 5cm from your mouth
- Read each section 2x, pick best take
- Edit out breaths and mouth clicks in audacity (free)

### Option B — AI voice (faster, less authentic)
- ElevenLabs Indonesian voices: search "Indonesian male/female natural"
- Or Google NotebookLM's TTS (free)
- Drawback: AI Indonesian voices still sound flat, judges will sense it

**Recommendation:** Your own voice. Even with an accent, it adds authenticity that AI cannot fake.

---

## 8. Upload checklist (YouTube)

- [ ] Title: `Aksarantara — Reading Indonesia's Dying Languages with Gemma 4`
- [ ] Description: First line is project URL `https://aksarantara.org`. Then paste a 3-paragraph summary from the writeup.
- [ ] Tags: `Gemma 4`, `Gemma 4 Good Hackathon`, `Indonesia`, `endangered languages`, `Lontara`, `OCR`, `AI for good`
- [ ] **Visibility: Public** (NOT Unlisted — hackathon requires no-login access)
- [ ] Category: Science & Technology
- [ ] Thumbnail: same hero image used for Kaggle cover
- [ ] End screen: link to `aksarantara.org`
- [ ] Captions: upload `.srt` after upload completes
- [ ] Verify the video plays on incognito (proves no-login access)

---

## 9. Final production order (timeboxed)

| Step | Tool | Time |
|---|---|---|
| 1. Fix `fetch failed` bug | Cursor / terminal | 30 min |
| 2. Deploy `submission-gemma4` to Vercel | git + Vercel | 10 min |
| 3. Screen recordings (SR1, SR2, SR3) | OBS Studio | 45 min |
| 4. Generate 6 Flow B-roll clips | Flow | 30 min |
| 5. Record voiceover takes | Phone + Audacity | 30 min |
| 6. Edit timeline | CapCut / DaVinci | 60 min |
| 7. Add subtitles | CapCut auto + manual fix | 20 min |
| 8. Export + upload to YouTube | — | 15 min |
| 9. Generate cover image | Flow / Gemini | 15 min |
| 10. Take Kaggle gallery screenshots | OBS still mode | 15 min |
| 11. Final Kaggle paste + submit | Kaggle | 15 min |

**Total: ~4.5 hours.** Start by 02:00 GMT+7 to have a 30-min buffer before 06:59 deadline.

---

## 10. Quick reference — what to never do

- ❌ Don't AI-generate the product demos (S1, A1, A2) — judges verify against the repo
- ❌ Don't show the `fetch failed` error in the video
- ❌ Don't use copyrighted music
- ❌ Don't set the video to Unlisted — must be Public
- ❌ Don't go over 3:00 — submission may be penalized
- ❌ Don't show real user PII or any private Supabase data
