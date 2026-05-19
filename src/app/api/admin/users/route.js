import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET — list all auth users merged with profile + role data
export async function GET() {
  const supabase = adminClient();

  // Source of truth: auth.users (always has every registered user)
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

  const authUsers = authData?.users ?? [];
  const ids = authUsers.map(u => u.id);

  // Enrich with profile rows and roles (may be empty for new users)
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids),
    supabase.from('user_roles').select('user_id, role').in('user_id', ids),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
  const roleMap    = Object.fromEntries((roles    ?? []).map(r => [r.user_id, r.role]));

  const users = authUsers
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(u => ({
      id:           u.id,
      email:        u.email,
      username:     profileMap[u.id]?.username     ?? null,
      display_name: profileMap[u.id]?.display_name ?? null,
      avatar_url:   profileMap[u.id]?.avatar_url   ?? null,
      created_at:   u.created_at,
      user_roles:   roleMap[u.id] ? [{ role: roleMap[u.id] }] : [],
    }));

  return NextResponse.json({ users });
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
