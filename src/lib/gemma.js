// AI Draft pipeline — server-only, never import in client components

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
//
// Audio path (Step 2 — after recording):
//   Groq Whisper large-v3  →  raw transcription  (free, ~1s)
//   Gemma 4 A4B (Gemini API)  →  IPA + Indonesian gloss
//
// Text path (Step 1 — word typed, no audio yet):
//   Gemma 4 A4B (Gemini API)  →  IPA + Indonesian gloss

const GEMMA_MODEL = process.env.GEMINI_MODEL || 'gemma-4-26b-a4b-it';

// ── Gemma 4 NLP ────────────────────────────────────────────────────────────

const NLP_PROMPT = (word, langName) =>
  `You are a linguist specializing in ${langName}, a regional language of Indonesia. ` +
  `Provide the IPA phonetic transcription and Indonesian translation for this ${langName} word or phrase: "${word}". ` +
  `Output ONLY valid JSON with exactly these three fields: ` +
  `{"phonetic": "<standard IPA>", "gloss_id": "<Indonesian translation>", "confidence": <number 0-1>}. ` +
  `Use standard IPA notation with appropriate diacritics. ` +
  `If uncertain about a field, use an empty string. No other text outside the JSON.`;

async function gemma4Nlp(word, langName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: NLP_PROMPT(word, langName) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 256 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemma 4 error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const result = extractJson(text);
  if (!result) throw new Error('Tidak dapat membaca respons Gemma 4');
  return result;
}

// ── Groq Whisper ASR ───────────────────────────────────────────────────────

async function groqWhisperAsr(audioBuffer, mimeType) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('GROQ_API_KEY is not set');

  const ext = mimeType?.includes('mp4') || mimeType?.includes('m4a') ? 'm4a'
    : mimeType?.includes('mp3') ? 'mp3'
    : mimeType?.includes('wav') ? 'wav'
    : 'webm';

  const form = new FormData();
  form.append('file', new Blob([audioBuffer], { type: mimeType || 'audio/webm' }), `audio.${ext}`);
  form.append('model', 'whisper-large-v3');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqKey}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq Whisper error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.text?.trim() ?? '';
}

// ── Public API ─────────────────────────────────────────────────────────────

// Audio path: buffer → Groq Whisper → Gemma 4
export async function transcribeAudio({ audioBase64, mimeType, langName }) {
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const transcription = await groqWhisperAsr(audioBuffer, mimeType);
  if (!transcription) throw new Error('Transkripsi audio kosong — coba rekam ulang');
  const result = await gemma4Nlp(transcription, langName);
  return { ...result, transcription };
}

// Text path: typed word → Gemma 4
export async function generateDraft({ word, langName }) {
  return gemma4Nlp(word, langName);
}
