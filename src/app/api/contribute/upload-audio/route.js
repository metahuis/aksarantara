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

  if (!file || !path)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const supabase    = adminClient();
  const arrayBuffer = await file.arrayBuffer();

  // Strip codec params (e.g. "audio/webm;codecs=opus") — Supabase only accepts the base MIME.
  const rawType    = file.type || 'audio/webm';
  const cleanType  = rawType.split(';')[0].trim();

  const { error } = await supabase.storage
    .from('recordings')
    .upload(path, arrayBuffer, { upsert: false, contentType: cleanType });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
