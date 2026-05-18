import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST — invite / create new user with role
export async function POST(request) {
  const { email, role } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = adminClient();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.user?.id && role) {
    await supabase.from('user_roles').upsert({ user_id: data.user.id, role });
  }

  return NextResponse.json({ success: true, user_id: data?.user?.id });
}

// PATCH — update role (pass role: null to remove)
export async function PATCH(request) {
  const { user_id, role } = await request.json();
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const supabase = adminClient();

  if (!role) {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from('user_roles').upsert({ user_id, role });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
