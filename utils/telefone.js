'use strict';

// Converte "(85) 98211-3303", "85982113303" ou "+55 85 98211-3303" em "5585982113303".
// Retorna null se não for um telefone brasileiro válido (DDD + 8 ou 9 dígitos).
function normalizarTelefone(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '');

  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return digitos;
  return null;
}

module.exports = { normalizarTelefone };
