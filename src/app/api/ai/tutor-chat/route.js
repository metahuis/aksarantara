import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// In-memory rate limiter: 20 requests per user per minute
const rateLimits = new Map();
function checkRateLimit(key) {
  const now = Date.now();
  const rec = rateLimits.get(key) ?? { count: 0, reset: now + 60_000 };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + 60_000; }
  rec.count++;
  rateLimits.set(key, rec);
  return rec.count <= 20;
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

// ── Corpus function tools (called by Gemma reasoning) ────────────────

async function lookupEntry(supabase, { word, lang }) {
  if (!word) return null;
  const safe = word.replace(/[%_,]/g, '');
  const q = supabase
    .from('entries')
    .select('primary_text, phonetic, gloss_id, lang, audio_url, slug')
    .eq('status', 'approved');
  if (lang) q.eq('lang', lang);
  // Search both the native word (primary_text) and the Indonesian gloss
  const { data } = await q.or(`primary_text.ilike.%${safe}%,gloss_id.ilike.%${safe}%`).limit(1);
  return data?.[0] ?? null;
}

async function randomEntries(supabase, { lang, n = 10 }) {
  const q = supabase
    .from('entries')
    .select('primary_text, phonetic, gloss_id, lang, audio_url, slug')
    .eq('status', 'approved')
    .eq('type', 'word');
  if (lang) q.eq('lang', lang);
  const { data } = await q.limit(n * 3);
  if (!data?.length) return [];
  return data.sort(() => Math.random() - 0.5).slice(0, n);
}

// ── Intent classifier (simple keyword heuristics) ───────────────────

function classifyIntent(text) {
  const t = text.toLowerCase().trim();
  // Quiz intent
  if (/\b(kuis|quiz|latih|test)\b/.test(t)) return 'quiz';
  // Explicit lookup keywords
  if (/\b(arti|bilang|apa\s*itu|cari|terjemah(?:kan)?)\b/.test(t)) return 'lookup';
  // Bracket pattern: "word [lang]" or "word [melayu jambi]"
  if (/^\S+\s*\[[^\]]+\]/.test(text.trim())) return 'lookup';
  // "word dalam <lang>" pattern
  if (/\bdalam\s+(bugis|konjo|massenrempulu|minang|melayu|jambi)/i.test(t)) return 'lookup';
  // Short query (1-3 words) without question markers — treat as lookup
  // because the user has a language chip selected, so the natural intent is "look up this word"
  const wordCount = t.split(/\s+/).filter(Boolean).length;
  const isQuestion = /\?/.test(t) || /\b(bagaimana|kenapa|mengapa|gimana|kapan|dimana|siapa)\b/.test(t);
  if (wordCount > 0 && wordCount <= 3 && !isQuestion) return 'lookup';
  return 'chat';
}

function extractWord(text) {
  const trimmed = text.trim();
  // Bracket pattern: "word [lang]" — extract just the word part
  const bracket = trimmed.match(/^(\S+)\s*\[/);
  if (bracket) return bracket[1];
  // Quoted: "word" or 'word'
  const quoted = trimmed.match(/[""'](.+?)[""']/);
  if (quoted) return quoted[1];
  // After keyword: arti/bilang/cari/terjemah <word>
  const afterKw = trimmed.match(/\b(?:arti|bilang|cari|terjemah(?:kan)?|apa\s*itu)\s+([A-Za-z'À-ÿ]+)/i);
  if (afterKw) return afterKw[1];
  // Fallback: first content word that isn't a stopword or language name
  const stopwords = new Set([
    'dalam','untuk','yang','adalah','dan','atau','di','ke','dari','ini','itu','sebuah','dengan',
    'bagaimana','kenapa','mengapa','siapa','kapan','dimana','apa',
    'saya','aku','kamu','anda','dia','mereka','kita','kami',
    'ya','tidak','mau','bisa','tolong','mohon','ok','oke',
    'bugis','konjo','massenrempulu','minang','minangkabau','jambi','melayu',
  ]);
  const words = trimmed
    .split(/\s+/)
    .map(w => w.replace(/[^A-Za-z'À-ÿ]/g, ''))
    .filter(w => w.length >= 2 && !stopwords.has(w.toLowerCase()));
  return words[0] || '';
}

const LANG_IDS = {
  bugis: 'bugis',
  konjo: 'konjo',
  minang: 'minang',
  minangkabau: 'minang',
  massenrempulu: 'massenrempulu',
  melayu: 'melayu',
  jambi: 'melayu',
};

const LANG_NAMES = {
  bugis: 'Bugis',
  konjo: 'Konjo',
  minang: 'Minangkabau',
  massenrempulu: 'Massenrempulu',
  melayu: 'Melayu Jambi',
};

function extractLang(text, defaultLang) {
  for (const [k, v] of Object.entries(LANG_IDS)) {
    if (text.toLowerCase().includes(k)) return v;
  }
  return defaultLang;
}

// ── Main handler ─────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const user = await getAuthUser();
    const rateLimitKey = user?.id ?? (request.headers.get('x-forwarded-for') ?? 'anon');

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' }, { status: 429 });
    }

    const body = await request.json();
    const { messages = [], lang = 'bugis' } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return NextResponse.json({ text: 'Silakan kirim pertanyaan.' });

    const userText = lastUserMsg.content || '';
    const intent = classifyIntent(userText);
    const langForQuery = extractLang(userText, lang);

    // ── Quiz intent ───────────────────────────────────────────────
    if (intent === 'quiz') {
      const entries = await randomEntries(supabase, { lang: langForQuery, n: 10 });
      if (!entries.length) {
        return NextResponse.json({ text: 'Belum ada entri di arsip untuk kuis. Yuk kontribusi dulu!' });
      }
      const quizItems = entries.map(e => ({ word: e.primary_text, gloss: e.gloss_id || '?' }));
      return NextResponse.json({
        text: `Siap! Kuis ${quizItems.length} kata${langForQuery !== lang ? ` dalam bahasa ${langForQuery}` : ''}. Ketuk kartu untuk lihat artinya.`,
        entries: quizItems,
        quiz: true,
      });
    }

    // ── Lookup intent ────────────────────────────────────────────
    if (intent === 'lookup') {
      const word = extractWord(userText);
      if (!word) {
        return NextResponse.json({ text: 'Kata apa yang ingin Anda cari? Coba: "Apa arti \'bola\' dalam Bugis?"' });
      }
      const entry = await lookupEntry(supabase, { word, lang: langForQuery });
      if (!entry) {
        const langDisplay = LANG_NAMES[langForQuery] ?? langForQuery;
        return NextResponse.json({
          text: `Kata "${word}" belum ada di arsip${langForQuery ? ` ${langDisplay}` : ''}. Coba kata lain atau pilih bahasa berbeda.`,
        });
      }
      const langDisplay = LANG_NAMES[entry.lang] ?? entry.lang;
      return NextResponse.json({
        text: `Di arsip ${langDisplay}, ditemukan:`,
        entry: {
          word: entry.primary_text,
          ipa: entry.phonetic,
          gloss: entry.gloss_id || '(arti belum tersedia)',
          lang: entry.lang,
          audioUrl: entry.audio_url,
          slug: entry.slug,
        },
      });
    }

    // ── Generic chat ─────────────────────────────────────────────
    // Build a Gemma 4 prompt via Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    const model  = process.env.GEMINI_MODEL || 'gemma-4-26b-a4b-it';

    if (!apiKey) {
      return NextResponse.json({ text: 'Maaf, layanan AI tidak tersedia saat ini.' });
    }

    const systemPrompt = `Kamu adalah asisten Aksarantara — arsip digital bahasa daerah Indonesia (Bugis, Konjo, Massenrempulu, Minangkabau, Melayu Jambi). Jawab dalam Bahasa Indonesia. Jujur jika tidak tahu — jangan membuat-buat kata atau arti. Jika ditanya tentang kata tertentu, sarankan user mengetik "Cari [kata] dalam [bahasa]" agar sistem bisa mencari di arsip.`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt + '\n\nPercakapan dimulai.' }] },
      { role: 'model', parts: [{ text: 'Siap! Saya di sini untuk membantu Anda menjelajahi arsip bahasa daerah Aksarantara.' }] },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content || '' }],
      })),
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    let res;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.6, maxOutputTokens: 512 },
          }),
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      return NextResponse.json({ text: 'Maaf, Gemma tidak bisa menjawab saat ini.' });
    }

    const data  = await res.json();
    const responseParts = data.candidates?.[0]?.content?.parts ?? [];
    const reply = responseParts.find(p => !p.thought)?.text ?? 'Maaf, tidak ada respons dari Gemma.';
    return NextResponse.json({ text: reply });

  } catch (err) {
    console.error('tutor-chat error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
