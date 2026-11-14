'use strict';

// Só estes campos do usuário saem para o cliente. A senha nunca.
function usuarioPublico(u) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    telefone: u.telefone,
    funcao: u.funcao,
    whatsapp_opt_in: u.whatsapp_opt_in,
    whatsapp_opt_in_em: u.whatsapp_opt_in_em,
    criado_em: u.criado_em,
  };
}

module.exports = { usuarioPublico };
