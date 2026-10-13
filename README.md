# Bot para extraer IDs de emojis Premium de Telegram

Mini bot en **Node.js 20.6+**, sin dependencias de npm. Recibe emojis personalizados, incluso varios por mensaje, y devuelve su `custom_emoji_id` y el código HTML para reutilizarlos en otro bot.

## Windows: iniciar en 4 pasos

1. Extrae el ZIP.
2. Instala Node.js 20.6 o superior si todavía no lo tienes.
3. Abre `iniciar.bat`. En el primer inicio se abrirá `.env` en el Bloc de notas; pega tu token en `BOT_TOKEN=...`, guarda y cierra el Bloc de notas.
4. Busca tu bot en Telegram, pulsa **Start** y envíale un emoji personalizado desde el selector de emojis. La ventana de la consola debe seguir abierta para que funcione.

**Ejemplo de respuesta:**

```text
✅ Emoji 1 de 1

👍  ID del emoji:
5368324170671202286

HTML para usarlo en tu bot:
<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji>
```

El ID anterior es solo ilustrativo; el bot detectará el real al recibir tu mensaje.

## Seguridad

El token da control sobre el bot. Si fue expuesto en un chat, se recomienda **revocarlo con @BotFather y utilizar el nuevo**. El ZIP no incluye ningún token real. El archivo `.env` está excluido de Git por `.gitignore`.

Por defecto, cualquier usuario que escriba al bot en privado puede pedir IDs. Para limitarlo a ti:
1. Envía `/miid` al bot.
2. Copia el ID numérico recibido.
3. Cierra la ventana del bot.
4. En `.env` cambia `OWNER_ID=` por `OWNER_ID=TU_ID`.
5. Vuelve a abrir `iniciar.bat`.

## Otros entornos

```bash
cp .env.example .env
# Edita .env y coloca BOT_TOKEN
node --env-file=.env bot.mjs
```

Detener: `Ctrl+C`. Para usarlo 24/7, ejecuta el proceso en un equipo o servidor que permanezca encendido.

## Notas

- Detecta entidades `custom_emoji` en textos y pies de foto, y stickers marcados como `custom_emoji`.
- Los emojis estándar Unicode no poseen un `custom_emoji_id`.
- No cambia los webhooks existentes. Si el bot ya tiene uno, tendrás que quitarlo o integrar el extractor con esa aplicación en lugar de usar polling.
- Para que **otro bot muestre** emojis personalizados con HTML, Telegram aplica requisitos propios de uso, como que el propietario del bot tenga Premium en mensajes enviados directamente por el bot.
