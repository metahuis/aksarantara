import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request) {
  const formData  = await request.formData();
  const file      = formData.get('file');
  const path      = formData.get('path');
  const entryId   = formData.get('entryId');

  if (!file || !path || !entryId)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const supabase    = adminClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from('recordings')
    .upload(path, arrayBuffer, { upsert: true, contentType: file.type });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(path);

  await supabase.from('entries').update({ audio_url: urlData.publicUrl }).eq('id', entryId);

  return NextResponse.json({ url: urlData.publicUrl });
}
