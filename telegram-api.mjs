import https from 'node:https';

/** HTTPS nativo con IPv4 para conexiones serverless hacia el Bot API. */
export function solicitarTelegram(token, metodo, parametros, timeoutMs = 6500) {
  if (!/^[0-9]+:[A-Za-z0-9_-]+$/.test(token || '')) {
    const error = new Error('Formato de BOT_TOKEN incorrecto');
    error.code = 'INVALID_BOT_TOKEN';
    return Promise.reject(error);
  }

  const cuerpo = JSON.stringify(parametros);
  return new Promise((resolve, reject) => {
    const solicitud = https.request({
      protocol: 'https:',
      hostname: 'api.telegram.org',
      port: 443,
      family: 4,
      method: 'POST',
      path: `/bot${token}/${metodo}`,
      timeout: timeoutMs,
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(cuerpo),
        accept: 'application/json'
      }
    }, respuesta => {
      let texto = '';
      respuesta.setEncoding('utf8');
      respuesta.on('data', parte => {
        texto += parte;
        if (texto.length > 100000) {
          const error = new Error('Respuesta demasiado grande de Telegram');
          error.code = 'TELEGRAM_RESPONSE_TOO_LARGE';
          solicitud.destroy(error);
        }
      });
      respuesta.on('error', reject);
      respuesta.on('end', () => {
        try {
          const data = JSON.parse(texto);
          resolve({ data, status: respuesta.statusCode });
        } catch {
          const error = new Error('Telegram no devolvió JSON válido');
          error.code = 'TELEGRAM_INVALID_RESPONSE';
          error.status = respuesta.statusCode;
          reject(error);
        }
      });
    });
    solicitud.on('timeout', () => {
      const error = new Error('La conexión con Telegram excedió el tiempo de espera');
      error.code = 'ETIMEDOUT';
      solicitud.destroy(error);
    });
    solicitud.on('error', reject);
    solicitud.end(cuerpo);
  });
}

export function diagnosticoSeguro(error) {
  return String(error?.code || error?.cause?.code || 'ERROR_DESCONOCIDO').slice(0, 64);
}
