/** Extrae IDs de emojis personalizados de mensajes, pies de foto y stickers. */
export function extraerEmojis(message) {
  const encontrados = [];

  for (const [texto, entidades] of [
    [message.text ?? '', message.entities ?? []],
    [message.caption ?? '', message.caption_entities ?? []]
  ]) {
    for (const entidad of entidades) {
      if (entidad.type !== 'custom_emoji' || !entidad.custom_emoji_id) continue;
      // Telegram y JavaScript usan índices UTF-16 para offsets/length.
      encontrados.push({
        id: String(entidad.custom_emoji_id),
        emoji: texto.slice(entidad.offset, entidad.offset + entidad.length) || '🙂'
      });
    }
  }

  if (message.sticker?.type === 'custom_emoji' && message.sticker.custom_emoji_id) {
    encontrados.push({
      id: String(message.sticker.custom_emoji_id),
      emoji: message.sticker.emoji || '🙂'
    });
  }

  return [...new Map(encontrados.map(item => [item.id, item])).values()];
}

export function escaparHTML(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function formatearEmoji({ id, emoji }) {
  const ejemplo = `<tg-emoji emoji-id="${id}">${emoji}</tg-emoji>`;
  return [
    `${escaparHTML(emoji)}  <b>ID del emoji:</b>`,
    `<code>${escaparHTML(id)}</code>`,
    '',
    '<b>HTML para usarlo en tu bot:</b>',
    `<code>${escaparHTML(ejemplo)}</code>`
  ].join('\n');
}
