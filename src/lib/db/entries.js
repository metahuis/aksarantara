import { createClient } from '../supabase.js';

export async function getEntries({ lang, type, search, page = 1, limit = 30 } = {}) {
  const supabase = createClient();
  let query = supabase
    .from('entries')
    .select('*, speaker:speakers(*)', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (lang)   query = query.eq('lang', lang);
  if (type)   query = query.eq('type', type);
  if (search) query = query.or(`primary_text.ilike.%${search}%,gloss_id.ilike.%${search}%,gloss.ilike.%${search}%`);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count, page, limit, totalPages: Math.ceil(count / limit) };
}

export async function getEntry(lang, word) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('entries')
    .select('*, speaker:speakers(*)')
    .eq('id', word)
    .eq('status', 'approved')
    .single();
  if (error) throw error;
  return data;
}

export async function getEntriesByLang(langId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('entries')
    .select('*, speaker:speakers(*)')
    .eq('lang', langId)
    .eq('status', 'approved')
    .order('type');
  if (error) throw error;
  return data;
}

export async function submitEntry(entry) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('entries')
    .insert({ ...entry, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPendingEntries() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('entries')
    .select('*, speaker:speakers(*)')
    .eq('status', 'pending')
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function updateEntryStatus(id, status) {
  const supabase = createClient();
  const { error } = await supabase
    .from('entries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function getUserEntries(supabase, userId) {
  const { data, error } = await supabase
    .from('entries')
    .select('*, speaker:speakers(*)')
    .eq('contributor_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateEntry(supabase, id, fields) {
  const { data, error } = await supabase
    .from('entries')
    .update({ ...fields, status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEntry(supabase, id) {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
