import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('ia_staff')
    .select('id, name, username, role, created_at')
    .order('created_at', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req) {
  const { name, username, password, role } = await req.json();

  if (!name || !username || !password) {
    return Response.json({ error: 'Name, username and password are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('ia_staff')
    .insert([{ name, username, password, role: role || 'staff' }])
    .select('id, name, username, role, created_at')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function DELETE(req) {
  const { id } = await req.json();
  const { error } = await supabase.from('ia_staff').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
