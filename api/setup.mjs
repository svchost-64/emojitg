import { timingSafeEqual } from 'node:crypto';

function coincide(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');

  const token = process.env.BOT_TOKEN?.trim();
  const key = process.env.SETUP_KEY?.trim();
  if (!token || !key || !/^[A-Za-z0-9_-]{16,256}$/.test(key)) {
    return res.status(503).json({ ok: false, error: 'Configura BOT_TOKEN y SETUP_KEY (16+ caracteres alfanuméricos)' });
  }

  const raw = new URL(req.url || '/api/setup', 'https://vercel.example');
  if (!coincide(raw.searchParams.get('key'), key)) return res.status(401).json({ ok: false, error: 'Clave inválida' });

  const rawHost = req.headers['x-forwarded-host'] || req.headers.host;
  const host = String(Array.isArray(rawHost) ? rawHost[0] : rawHost || '').toLowerCase();
  if (!/^[a-z0-9.-]+(?::443)?$/.test(host)) return res.status(400).json({ ok: false, error: 'Host inválido' });

  const webhookUrl = `https://${host.replace(/:443$/, '')}/api/webhook`;
  try {
    const respuesta = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ url: webhookUrl, secret_token: key, allowed_updates: ['message', 'edited_message'] })
    });
    const data = await respuesta.json();
    if (!data.ok) return res.status(502).json({ ok: false, error: data.description || 'Telegram rechazó el webhook' });
    return res.status(200).json({ ok: true, mensaje: 'Webhook de Telegram activado', webhook: webhookUrl });
  } catch (error) {
    console.error('No se pudo activar el webhook:', error);
    return res.status(502).json({ ok: false, error: 'Falló la conexión con Telegram' });
  }
}
