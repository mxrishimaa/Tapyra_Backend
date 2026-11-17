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
  const baseUrl = (process.env.ZAPI_SEND_URL || '').replace(/\/+$/, '');
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  const isOmni = baseUrl.includes('omni.z-api.io');

  let urlFinal;
  if (baseUrl) {
    // Remove /hermitage caso tenha vindo copiado da URL base do painel
    const urlLimpa = isOmni ? baseUrl.replace('/hermitage/', '/') : baseUrl;
    urlFinal = isOmni && !urlLimpa.endsWith('/messages') ? `${urlLimpa}/messages` : urlLimpa;
  } else if (instanceId && token) {
    urlFinal = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
  } else {
    throw new Error('Defina ZAPI_SEND_URL (ou ZAPI_INSTANCE_ID e ZAPI_TOKEN) no .env');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (isOmni && token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (clientToken) {
    headers['Client-Token'] = clientToken;
  }

  const bodyPayload = isOmni
    ? {
        recipient: {
          identifier: telefone,
        },
        content: {
          type: 'TEXT',
          body: {
            message: texto,
          },
        },
      }
    : {
        phone: telefone,
        message: texto,
      };  

  const res = await fetch(urlFinal, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[WhatsApp Z-API] Erro:', JSON.stringify(data, null, 2));
    throw new Error(data.error || data.message || `Z-API HTTP ${res.status}`);
  }

  return { provedor: 'zapi', messageId: data.id || data.messageId || data.zapiMessageId, raw: data };
}

async function enviarAlertaWhatsApp({ telefone, nome, nivel, regiao, mensagem }) {
  const destino = normalizarTelefone(telefone);
  const texto =
    `🚨 *TAPYRA · ALERTA DE QUEIMADA (${(nivel || 'ATENÇÃO').toUpperCase()})*\n\n` +
    `Olá, *${nome || 'morador'}*.\n` +
    `Detectamos risco ambiental próximo à sua área monitorada:\n\n` +
    `📍 *Região:* ${regiao || 'Amazonas'}\n` +
    `📋 *Detalhes:* ${mensagem}\n\n` +
    `⚠️ *Recomendações:* Evite áreas de fumaça densa e siga as orientações das autoridades locais.\n` +
    `📞 *Emergência:* Bombeiros *193* | Defesa Civil *199*\n\n` +
    `_Mensagem automática enviada pelo Sistema Tapyra._`;

  const provider = (process.env.WHATSAPP_PROVIDER || 'meta').toLowerCase();

  if (provider === 'zapi') {
    return enviarViaZApi(destino, texto);
  }
  return enviarViaMeta(destino, texto);
}

module.exports = { enviarAlertaWhatsApp, normalizarTelefone };