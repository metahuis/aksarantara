import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { transcribeAudio, generateDraft } from '../../../../lib/gemma.js';
import { LANGUAGES } from '../../../../data.js';

// In-memory rate limiter: 10 requests per user per minute
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

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Sesi Anda telah berakhir. Silakan login kembali.' }, { status: 401 });

    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' }, { status: 429 });
    }

    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { word, audioBase64, mimeType, lang } = body;
    if (!lang) return NextResponse.json({ error: 'Missing field: lang' }, { status: 400 });

    const language = LANGUAGES.find(l => l.id === lang);
    const langName = language?.name ?? lang;

    // Audio path (Whisper + Gemma 4) or text path (Gemma 4 only)
    const result = audioBase64
      ? await transcribeAudio({ audioBase64, mimeType, langName })
      : await generateDraft({ word, langName });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[transcribe-draft]', err.message);
    // Whisper model still loading — tell client to retry
    if (err.message === 'MODEL_LOADING') {
      return NextResponse.json({ error: 'Model sedang dimuat, coba lagi dalam 20 detik.' }, { status: 503 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
