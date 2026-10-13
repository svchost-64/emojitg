import { timingSafeEqual } from 'node:crypto';
import { extraerEmojis, formatearEmoji } from '../emoji.mjs';

const token = process.env.BOT_TOKEN?.trim();
const secret = process.env.SETUP_KEY?.trim();
const owner = process.env.OWNER_ID?.trim();

function coincide(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function enviar(chatId, text, messageId, parseMode) {
  const respuesta = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...(parseMode ? { parse_mode: parseMode } : {}),
      reply_parameters: { message_id: messageId, allow_sending_without_reply: true }
    })
  });
  const resultado = await respuesta.json();
  if (!resultado.ok) throw new Error(`Telegram: ${resultado.description || respuesta.status}`);
}

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ ok: true, service: 'Premium Emoji ID Bot', method: 'webhook' });
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  if (!token || !secret) return res.status(503).json({ ok: false, error: 'Configuración incompleta' });
  if (!coincide(req.headers['x-telegram-bot-api-secret-token'], secret)) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }

  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const message = update?.message ?? update?.edited_message;
    if (!message || message.chat?.type !== 'private' || !message.from) return res.status(200).json({ ok: true });
    if (owner && String(message.from.id) !== owner) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const messageId = message.message_id;
    const texto = message.text || '';

    if (/^\/(start|help|ayuda)(?:@\w+)?(?:\s|$)/i.test(texto)) {
      await enviar(chatId, '👋 Envíame uno o varios emojis Premium para obtener sus IDs. También acepto stickers de tipo emoji personalizado. Usa /miid para ver tu ID de Telegram.', messageId);
    } else if (/^\/miid(?:@\w+)?(?:\s|$)/i.test(texto)) {
      await enviar(chatId, `Tu ID de Telegram es: ${message.from.id}`, messageId);
    } else {
      const emojis = extraerEmojis(message);
      if (!emojis.length) {
        await enviar(chatId, '🔎 No detecté un emoji personalizado. Envíalo desde el selector de emojis Premium.', messageId);
      } else {
        for (const [index, emoji] of emojis.entries()) {
          await enviar(chatId, `✅ Emoji ${index + 1} de ${emojis.length}\n\n${formatearEmoji(emoji)}`, messageId, 'HTML');
        }
      }
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error al procesar el webhook:', error);
    return res.status(500).json({ ok: false, error: 'No se pudo procesar el mensaje' });
  }
}
