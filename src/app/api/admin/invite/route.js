import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { invited_as: 'moderator' },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Assign moderator role after invite
  if (data?.user?.id) {
    await supabase.from('user_roles').upsert({
      user_id: data.user.id,
      role: 'moderator',
    });
  }

  return NextResponse.json({ success: true });
}
