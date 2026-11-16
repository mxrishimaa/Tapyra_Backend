'use strict';

function normalizarTelefone(tel) {
  const digitos = String(tel).replace(/\D/g, '');
  return digitos.startsWith('55') ? digitos : `55${digitos}`;
}

async function enviarViaMeta(telefone, texto, template = 'hello_world', idioma = 'en_US') {
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneId || !token) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_TOKEN não definidos no .env');
  }

  // Se WHATSAPP_USE_TEXT=true (janela de 24h aberta), envia texto livre; senão envia template
  const payload =
    process.env.WHATSAPP_USE_TEXT === 'true'
      ? {
          messaging_product: 'whatsapp',
          to: telefone,
          type: 'text',
          text: { body: texto },
        }
      : {
          messaging_product: 'whatsapp',
          to: telefone,
          type: 'template',
          template: {
            name: template,
            language: { code: idioma },
          },
        };

  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[WhatsApp Meta] Erro detalhado:', JSON.stringify(data, null, 2));
    throw new Error(data.error?.message || `Meta HTTP ${res.status}`);
  }

  return { provedor: 'meta', messageId: data.messages?.[0]?.id, raw: data };
}

async function enviarViaZApi(telefone, texto) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN; // opcional, caso ative na Z-API

  if (!instanceId || !token) {
    throw new Error('ZAPI_INSTANCE_ID ou ZAPI_TOKEN não definidos no .env');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (clientToken) headers['Client-Token'] = clientToken;

  const res = await fetch(
    `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: telefone,
        message: texto,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    console.error('[WhatsApp Z-API] Erro:', JSON.stringify(data, null, 2));
    throw new Error(data.error || data.message || `Z-API HTTP ${res.status}`);
  }

  return { provedor: 'zapi', messageId: data.zapiMessageId || data.messageId, raw: data };
}

async function enviarAlertaWhatsApp({ telefone, nome, nivel, regiao, mensagem }) {
  const destino = normalizarTelefone(telefone);
  const texto =
    `🔥 *Alerta Tapyra (${nivel || 'Atenção'})*\n` +
    `Olá, ${nome || 'morador'}!\n` +
    `*Região:* ${regiao || 'Amazonas'}\n` +
    `${mensagem}\n\n` +
    `_Emergência: Bombeiros 193 · Defesa Civil 199_`;

  const provider = (process.env.WHATSAPP_PROVIDER || 'meta').toLowerCase();

  if (provider === 'zapi') {
    return enviarViaZApi(destino, texto);
  }
  return enviarViaMeta(destino, texto);
}

module.exports = { enviarAlertaWhatsApp, normalizarTelefone };