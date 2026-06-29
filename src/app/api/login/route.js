import { supabase } from '@/lib/supabase';

export async function POST(req) {
  const { username, password } = await req.json();

  const { data, error } = await supabase
    .from('ia_staff')
    .select('id, name, username, role')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  return Response.json(data);
}
