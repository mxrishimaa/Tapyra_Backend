'use strict';

const cron = require('node-cron');
const { Usuario, Notificacao } = require('../models');
const { enviarAlertaWhatsApp } = require('./whatsappService');

// Guarda IDs/chaves de focos já notificados nesta execução para evitar spam
const focosNotificados = new Set();

async function buscarFocosCriticosAmazonas() {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) {
    console.warn('[Monitoramento] FIRMS_MAP_KEY não definida no .env; verificação automática ignorada.');
    return [];
  }

  // Bounding box aproximado do Amazonas: oeste, sul, leste, norte (-74, -10, -56, 3)
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/-74,-10,-56,3/1`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`NASA FIRMS HTTP ${res.status}`);
  }

  const csv = await res.text();
  const linhas = csv.trim().split('\n');
  if (linhas.length <= 1) return [];

  const cabecalho = linhas[0].split(',');
  const idxLat = cabecalho.indexOf('latitude');
  const idxLon = cabecalho.indexOf('longitude');
  const idxConf = cabecalho.indexOf('confidence');
  const idxFrp = cabecalho.indexOf('frp');
  const idxDate = cabecalho.indexOf('acq_date');
  const idxTime = cabecalho.indexOf('acq_time');

  const criticos = [];

  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(',');
    const lat = parseFloat(cols[idxLat]);
    const lon = parseFloat(cols[idxLon]);
    const conf = (cols[idxConf] || '').toLowerCase();
    const frp = parseFloat(cols[idxFrp] || '0');
    const chave = `${cols[idxDate]}_${cols[idxTime]}_${lat.toFixed(3)}_${lon.toFixed(3)}`;

    // Filtra apenas focos de alta confiança ou alta intensidade (FRP >= 15 MW) ainda não notificados
    if ((conf === 'h' || conf === 'high' || frp >= 15) && !focosNotificados.has(chave)) {
      criticos.push({
        chave,
        lat,
        lon,
        frp,
        nivel: frp >= 30 ? 'Crítico' : 'Alerta',
        regiao: `Amazonas (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
        mensagem: `Foco de calor detectado por satélite (intensidade ${frp.toFixed(1)} MW) nas coordenadas ${lat.toFixed(4)}, ${lon.toFixed(4)}. Acompanhe o mapa no Tapyra.`,
      });
    }
  }

  return criticos;
}

async function verificarEDispararAlertas() {
  try {
    const focos = await buscarFocosCriticosAmazonas();
    if (focos.length === 0) return;

    const usuarios = await Usuario.findAll({
      where: { whatsapp_opt_in: true },
      attributes: ['id', 'nome', 'telefone'],
    });

    const inscritos = usuarios.filter((u) => u.telefone);
    if (inscritos.length === 0) return;

    // Pega o foco mais intenso do ciclo para não disparar dezenas de mensagens de uma vez
    const focoPrincipal = focos.sort((a, b) => b.frp - a.frp)[0];
    
    // Marca todos os focos deste ciclo como notificados
    focos.forEach((f) => focosNotificados.add(f.chave));

    console.log(
      `[Monitoramento] Disparando alerta automático (${focoPrincipal.nivel}) para ${inscritos.length} inscrito(s)...`
    );

    for (const usuario of inscritos) {
      try {
        await enviarAlertaWhatsApp({
          telefone: usuario.telefone,
          nome: usuario.nome,
          nivel: focoPrincipal.nivel,
          regiao: focoPrincipal.regiao,
          mensagem: focoPrincipal.mensagem,
        });

        if (Notificacao) {
          try {
            await Notificacao.create({
              usuario_id: usuario.id,
              alerta_fogo_id: null,
              canal: 'whatsapp',
              status: 'enviada',
              data_envio: new Date(),
              wa_message_id: null,
              erro: null,
            });
          } catch (e) {
            console.warn('[Notificacao] Falha ao salvar histórico:', e.message);
          }
        }
      } catch (err) {
        console.error(
          `[Monitoramento] Erro ao enviar alerta para ${usuario.telefone}:`,
          err.message
        );
      }
    }
  } catch (err) {
    console.error('[Monitoramento] Erro na verificação automática:', err.message);
  }
}

function iniciarMonitoramentoAutomatico() {
  // Roda a cada 15 minutos
  cron.schedule('*/15 * * * *', verificarEDispararAlertas);
  console.log('Monitoramento automático de focos ativo (intervalo: 15 min)');
}

module.exports = {
  iniciarMonitoramentoAutomatico,
  verificarEDispararAlertas,
};