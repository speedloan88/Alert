import { supabase } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ic = searchParams.get('ic');
  const passport = searchParams.get('passport');
  const name = searchParams.get('name');
  const status = searchParams.get('status') || 'active';

  let query = supabase
    .from('customer_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (status !== 'all') query = query.eq('status', status);
  if (ic) query = query.ilike('ic_number', `%${ic}%`);
  else if (passport) query = query.ilike('passport_number', `%${passport}%`);
  else if (name) query = query.ilike('customer_name', `%${name}%`);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const { customer_name, ic_number, passport_number, risk_level, reason, description, review_date, added_by, added_by_role } = body;

  if (!customer_name || !risk_level || !reason || !added_by) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('customer_alerts')
    .insert([{ customer_name, ic_number, passport_number, risk_level, reason, description, review_date: review_date || null, added_by, added_by_role, status: 'active', updated_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabase.from('alert_audit_log').insert([{
    alert_id: data.id, action: 'created', changed_by: added_by, changed_by_role: added_by_role,
    new_values: data, notes: `Alert created — Risk: ${risk_level}`
  }]);

  return Response.json(data, { status: 201 });
}
