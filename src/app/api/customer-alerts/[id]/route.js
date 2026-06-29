import { supabase } from '@/lib/supabase';

export async function GET(req, { params }) {
  const { id } = params;
  const viewer = req.headers.get('x-user-name') || 'unknown';
  const viewerRole = req.headers.get('x-user-role') || 'staff';

  const [alertRes, auditRes] = await Promise.all([
    supabase.from('customer_alerts').select('*').eq('id', id).single(),
    supabase.from('alert_audit_log').select('*').eq('alert_id', id).order('created_at', { ascending: false })
  ]);

  if (alertRes.error) return Response.json({ error: alertRes.error.message }, { status: 404 });

  await supabase.from('alert_audit_log').insert([{
    alert_id: id, action: 'viewed', changed_by: viewer, changed_by_role: viewerRole, notes: 'Alert record viewed'
  }]);

  return Response.json({ alert: alertRes.data, audit: auditRes.data || [] });
}

export async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const { changed_by, changed_by_role, ...updates } = body;

  const { data: current } = await supabase.from('customer_alerts').select('*').eq('id', id).single();

  const { data, error } = await supabase
    .from('customer_alerts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const changedFields = Object.keys(updates).filter(k => current[k] !== updates[k]);
  const notes = changedFields.map(k => {
    if (k === 'risk_level') return `Risk changed: ${current.risk_level} → ${updates.risk_level}`;
    if (k === 'status') return `Status changed: ${current.status} → ${updates.status}`;
    return `${k} updated`;
  }).join('; ');

  await supabase.from('alert_audit_log').insert([{
    alert_id: id,
    action: updates.status === 'removed' ? 'removed' : 'updated',
    changed_by: changed_by || 'unknown',
    changed_by_role: changed_by_role || 'staff',
    old_values: current, new_values: data, notes
  }]);

  return Response.json(data);
}

export async function DELETE(req, { params }) {
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const { changed_by, changed_by_role, notes } = body;

  const { data: current } = await supabase.from('customer_alerts').select('*').eq('id', id).single();

  await supabase.from('customer_alerts').update({ status: 'removed', updated_at: new Date().toISOString() }).eq('id', id);
  await supabase.from('alert_audit_log').insert([{
    alert_id: id, action: 'removed', changed_by: changed_by || 'unknown',
    changed_by_role: changed_by_role || 'staff', old_values: current, notes: notes || 'Alert removed'
  }]);

  return Response.json({ success: true });
}
