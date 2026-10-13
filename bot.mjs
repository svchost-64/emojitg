import { extraerEmojis, formatearEmoji } from './emoji.mjs';

const TOKEN = process.env.BOT_TOKEN?.trim();
const OWNER_ID = process.env.OWNER_ID?.trim(); // Opcional: permite solo a tu cuenta.

if (!TOKEN || !/^\d+:[\w-]+$/.test(TOKEN)) {
  console.error('Falta BOT_TOKEN o no tiene el formato esperado. Revisa el archivo .env');
  process.exit(1);
}

const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));

async function telegram(metodo, datos = {}) {
  const respuesta = await fetch(`https://api.telegram.org/bot${TOKEN}/${metodo}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
    signal: AbortSignal.timeout(30_000)
  });

  const json = await respuesta.json();
  if (!json.ok) {
    throw new Error(`Telegram ${json.error_code ?? respuesta.status}: ${json.description ?? 'Error desconocido'}`);
  }
  return json.result;
}

async function responder(chatId, texto, messageId, parseMode) {
  return telegram('sendMessage', {
    chat_id: chatId,
    text: texto,
    ...(parseMode ? { parse_mode: parseMode } : {}),
    reply_parameters: { message_id: messageId, allow_sending_without_reply: true }
  });
}

async function procesar(message) {
  if (!message?.chat || message.chat.type !== 'private' || !message.from) return;
  if (OWNER_ID && String(message.from.id) !== OWNER_ID) return;

  const chatId = message.chat.id;
  const mensajeId = message.message_id;
  const texto = message.text ?? '';

  if (/^\/(start|help|ayuda)(?:@\w+)?(?:\s|$)/i.test(texto)) {
    await responder(chatId,
      '👋 Envíame uno o varios emojis Premium de Telegram.\n' +
      'Te responderé con sus IDs y el HTML listo para usarlos en otro bot.\n\n' +
      'También puedo detectar emojis en pies de foto y stickers de tipo custom emoji.\n' +
      'Comando /miid: muestra tu ID de usuario para restringir el acceso.', mensajeId);
    return;
  }

  if (/^\/miid(?:@\w+)?(?:\s|$)/i.test(texto)) {
    await responder(chatId, `Tu ID de Telegram: ${message.from.id}\nPuedes poner OWNER_ID=${message.from.id} en .env`, mensajeId);
    return;
  }

  const encontrados = extraerEmojis(message);
  if (!encontrados.length) {
    await responder(chatId,
      '🔎 No detecté un emoji Premium en ese mensaje.\n' +
      'Abre el selector de emojis de Telegram y envía un emoji personalizado (no uno Unicode normal).',
      mensajeId);
    return;
  }

  for (const [indice, emoji] of encontrados.entries()) {
    await responder(chatId, `✅ Emoji ${indice + 1} de ${encontrados.length}\n\n${formatearEmoji(emoji)}`, mensajeId, 'HTML');
  }
  console.log(`${new Date().toLocaleString()}: ${encontrados.length} ID(s) entregado(s) a ${message.from.id}`);
}

async function iniciar() {
  const bot = await telegram('getMe');
  console.log(`✅ Conectado: @${bot.username}`);

  const webhook = await telegram('getWebhookInfo');
  if (webhook.url) {
    console.error('❌ Este bot ya tiene un webhook activo. Detén esa integración y quita el webhook antes de usar polling.');
    process.exitCode = 1;
    return;
  }

  console.log('🟢 Escuchando mensajes. Envíame un emoji Premium en Telegram.');
  console.log('⏹ Pulsa Ctrl+C para detener.');
  let offset;

  while (true) {
    try {
      const updates = await telegram('getUpdates', {
        offset,
        timeout: 20,
        allowed_updates: ['message', 'edited_message']
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        try {
          await procesar(update.message ?? update.edited_message);
        } catch (error) {
          console.error(`Error al responder: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error de recepción: ${error.message}`);
      if (/Telegram 409:/.test(error.message)) {
        console.error('Hay otra instancia escuchando o un webhook activo. Cierra la otra instancia.');
        process.exitCode = 1;
        return;
      }
      if (/Telegram 401:/.test(error.message)) {
        console.error('El token no es válido. Reemplázalo por el nuevo token de @BotFather.');
        process.exitCode = 1;
        return;
      }
      await esperar(3000);
    }
  }
}

iniciar().catch(error => {
  console.error(`No se pudo iniciar: ${error.message}`);
  process.exitCode = 1;
});
