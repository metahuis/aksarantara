import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const maxDuration = 120;

// Robustly extract the first complete JSON object from a string.
// Handles: trailing text, markdown code fences, and greedy regex failures.
function extractJson(text) {
  try { return JSON.parse(text); } catch {}
  const stripped = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const start = stripped.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < stripped.length; i++) {
    const c = stripped[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) {
      try { return JSON.parse(stripped.slice(start, i + 1)); } catch { return null; }
    }
  }
  return null;
}

const GEMMA_MODEL = process.env.GEMINI_MODEL || 'gemma-4-26b-a4b-it';

const rateLimits = new Map();
function checkRateLimit(userId) {
  const now = Date.now();
  const record = rateLimits.get(userId) ?? { count: 0, reset: now + 60_000 };
  if (now > record.reset) { record.count = 0; record.reset = now + 60_000; }
  record.count++;
  rateLimits.set(userId, record);
  return record.count <= 10;
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Complete Lontara Bugis character reference (23 consonants + vowel diacritics).
// Included verbatim in the prompt so Gemma 4 can match glyphs it sees in the image.
const LONTARA_CHART = `
LONTARA BUGIS REFERENCE CHART — use this to identify every character in the manuscript:

Base consonants (inherent vowel = a):
 1. ᨀ = ka   2. ᨁ = ga   3. ᨂ = nga   4. ᨃ = ngka  5. ᨄ = pa
 6. ᨅ = ba   7. ᨆ = ma   8. ᨇ = mpa   9. ᨈ = ta   10. ᨉ = da
11. ᨊ = na  12. ᨋ = nra  13. ᨌ = ca   14. ᨍ = ja   15. ᨎ = nya
16. ᨏ = nca 17. ᨐ = ya   18. ᨑ = ra   19. ᨒ = la   20. ᨓ = wa
21. ᨔ = sa  22. ᨕ = a    23. ᨖ = ha

Vowel diacritics (modify the base consonant):
  ᨗ = +i  (above the letter)
  ᨘ = +u  (below the letter)
  ᨙ = +é  (enak — after the letter)
  ᨚ = +o  (after + below)
  ᨛ = +e' (pepet — before the letter)
  (no diacritic) = +a (inherent)

Final consonant (huruf mati): written without inherent vowel, last glyph of syllable.
Word separator: ᨞ (pattala)

Notes: Lontara is written left-to-right. f, q, v, x, z do not exist in Bugis.
`.trim();

const OCR_PROMPT = (langHint, hasChartImage) =>
  (hasChartImage
    ? `The FIRST image is a Lontara Bugis alphabet reference chart. The SECOND image is the manuscript to analyze. Use the chart to identify characters. `
    : `Lontara Bugis character reference:\n\n${LONTARA_CHART}\n\n`) +
  `You are an expert in Indonesian regional scripts. Analyze this manuscript image.\n\n` +
  `The script is ${langHint ? `likely ${langHint} (` : ''}Lontara (Bugis/Makassar) or Jawi (Malay Arabic)${langHint ? ')' : ''}, written in an Indonesian regional language.\n\n` +
  `OUTPUT PRIORITY (most important first):\n` +
  `1. romanization — Latin transliteration of everything readable (REQUIRED — always provide your best reading)\n` +
  `2. entries — individual words with Indonesian meanings (REQUIRED — extract at least 5 words)\n` +
  `3. notes — overall meaning/translation in Indonesian (REQUIRED)\n` +
  `4. transcription — original script Unicode characters (OPTIONAL — only include if you are confident; leave empty string if unsure)\n\n` +
  `RULES:\n` +
  `- romanization must always have content. Give your best Latin reading even if uncertain.\n` +
  `- In entries, use romanized Latin text as primary_text — do NOT use Unicode script characters.\n` +
  `- Extract every distinct word you can identify as a separate entry.\n` +
  `- transcription may be an empty string if you cannot reliably output the script Unicode.\n` +
  `- Preserve line breaks in romanization as "\\n".\n\n` +
  `Output ONLY valid JSON:\n` +
  `{"script":"lontara"|"jawi"|"mixed"|"unknown","transcription":"<Unicode script characters, or empty string>","romanization":"<Latin transliteration — required>",` +
  `"entries":[{"primary_text":"<romanized word in Latin>","gloss_id":"<Indonesian meaning>","phonetic":"<IPA if known, else empty>","lang":"bugis"|"massenrempulu"|"konjo"|"minangkabau"|"melayu_jambi"}],` +
  `"confidence":<0-1>,"notes":"<overall Indonesian translation or context>"}`;

// Read chart image from public/ if present (enables two-image mode)
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function getChartImageData() {
  const chartPath = join(process.cwd(), 'public', 'lontara-chart.jpg');
  const pngPath   = join(process.cwd(), 'public', 'lontara-chart.png');
  if (existsSync(chartPath)) return { data: readFileSync(chartPath).toString('base64'), mimeType: 'image/jpeg' };
  if (existsSync(pngPath))   return { data: readFileSync(pngPath).toString('base64'),  mimeType: 'image/png' };
  return null;
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    const rateLimitKey = user?.id ?? (request.headers.get('x-forwarded-for') ?? 'anon');

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' }, { status: 429 });
    }

    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { imageBase64, mimeType, lang } = body;
    if (!imageBase64) return NextResponse.json({ error: 'Missing field: imageBase64' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const langName   = lang ? (lang.charAt(0).toUpperCase() + lang.slice(1)) : null;
    const chartImage = getChartImageData();

    // Build parts: [prompt text] + optional chart + manuscript
    const parts = [
      { text: OCR_PROMPT(langName, !!chartImage) },
      ...(chartImage ? [{ inlineData: { mimeType: chartImage.mimeType, data: chartImage.data } }] : []),
      { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
    ];

    const payload = JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
    });

    let res;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 110_000);
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent?key=${apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: controller.signal, body: payload }
        );
      } finally {
        clearTimeout(timeoutId);
      }
      if (res.ok || res.status !== 500) break;
      const errPreview = await res.clone().text();
      console.warn(`[lontara-ocr] attempt ${attempt} → 500:`, errPreview.slice(0, 120));
      if (attempt < 3) await new Promise(r => setTimeout(r, 1500 * attempt));
    }

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemma 4 vision error ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await res.json();
    const responseParts = data.candidates?.[0]?.content?.parts ?? [];
    const text = responseParts.find(p => !p.thought)?.text ?? '';

    if (!text) {
      const reason = data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason ?? 'empty response';
      console.error('[lontara-ocr] empty text from Gemma. reason:', reason, JSON.stringify(data).slice(0, 400));
      throw new Error(`Gemma tidak mengembalikan teks (${reason})`);
    }

    const result = extractJson(text);
    if (!result) {
      console.error('[lontara-ocr] extractJson failed. raw:', text.slice(0, 400));
      throw new Error('Tidak dapat membaca respons Gemma 4');
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[lontara-ocr]', err.message, err.cause ?? '');
    return NextResponse.json({ error: err.message, cause: String(err.cause ?? '') }, { status: 500 });
  }
}
