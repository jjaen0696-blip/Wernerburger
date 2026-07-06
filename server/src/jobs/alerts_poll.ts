import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function pollAlerts() {
  try {
    const { data, error } = await supabase.rpc('get_alerts');
    if (error) throw error;
    if (data && data.length > 0) {
      console.log('ALERTS:', data);
      // Aquí puedes conectar un webhook, Slack, correo, o enviar push
      const webhook = process.env.ALERTS_WEBHOOK_URL;
      if (webhook) {
        await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ alerts: data }) });
      }
    } else {
      console.log('No alerts');
    }
  } catch (err: any) {
    console.error('Failed polling alerts:', err.message || err);
  }
}

if (require.main === module) {
  // Ejecutar una vez
  pollAlerts();
}

export { pollAlerts };
