import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase-server.js';

export async function POST(request) {
  try {
    const { draftId, vote } = await request.json();
    if (!vote || !['yes', 'no'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Store feedback — silently skip if table doesn't exist yet (non-blocking)
    try {
      await supabase.from('ai_draft_feedback').insert({
        draft_id:     draftId || null,
        vote,
        user_id:      user?.id ?? null,
        created_at:   new Date().toISOString(),
      });
    } catch {
      // Non-critical: feedback table may not exist during hackathon build
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
