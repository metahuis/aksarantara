import { createClient } from '../supabase.js';

export async function getLanguages() {
  const supabase = createClient();
  const { data, error } = await supabase.from('languages').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function getLanguage(id) {
  const supabase = createClient();
  const { data, error } = await supabase.from('languages').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
