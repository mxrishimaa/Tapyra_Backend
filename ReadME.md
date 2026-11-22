# Tapyra Backend

API REST do Tapyra, uma aplicação para cadastro de moradores, acompanhamento de regiões e envio de avisos de queimadas por WhatsApp. O backend é feito em Node.js com Express, usa MySQL por meio do Sequelize e pode consultar focos de calor do serviço NASA FIRMS.

Este documento descreve o que está implementado no código. Alguns recursos planejados ou representados pelos modelos ainda não estão integrados aos fluxos da API; essas diferenças são destacadas abaixo.

## Índice

- [Visão geral para iniciantes](#visão-geral-para-iniciantes)
- [Tecnologias e estrutura](#tecnologias-e-estrutura)
- [Como executar localmente](#como-executar-localmente)
- [Configuração](#configuração)
- [Como a aplicação inicia](#como-a-aplicação-inicia)
- [Funcionalidades e endpoints](#funcionalidades-e-endpoints)
- [Dados e relacionamentos](#dados-e-relacionamentos)
- [Monitoramento e WhatsApp](#monitoramento-e-whatsapp)
- [Integração com o frontend: contratos importantes](#integração-com-o-frontend-contratos-importantes)
- [Cuidados e áreas sensíveis](#cuidados-e-áreas-sensíveis)
- [Testes](#testes)
- [Glossário](#glossário)

## Visão geral para iniciantes

Uma aplicação backend recebe pedidos HTTP do frontend, aplica regras de negócio, consulta ou altera dados no banco e devolve uma resposta, normalmente em JSON.

Neste projeto, o caminho básico é:

1. O frontend faz uma requisição para uma rota, como `POST /auth/login`.
2. O Express recebe a requisição e a encaminha para um arquivo de rotas.
3. A rota chama um controller, que valida os dados e executa a operação.
4. O controller usa os models do Sequelize para ler ou gravar no MySQL e, quando necessário, chama um service externo.
5. A API devolve um status HTTP e um corpo JSON ao frontend.

O servidor disponibiliza:

- Cadastro, login e consulta dos dados do usuário autenticado.
- Catálogo público de regiões e inscrição de usuários para acompanhar regiões.
- Preferências de alertas por WhatsApp e alteração de senha.
- Envio administrativo de mensagens pelo WhatsApp.
- Verificação automática periódica de focos de calor no Amazonas.
- Documentação interativa Swagger em `/docs` e verificação de saúde em `/health`.

## Tecnologias e estrutura

- **Node.js**: ambiente que executa JavaScript no servidor. O serviço usa `fetch` global, portanto utilize uma versão que o disponibilize (Node.js 18 ou superior).
- **Express 5**: servidor HTTP e organização das rotas.
- **Sequelize 6 e MySQL2**: comunicação com o banco MySQL.
- **bcrypt**: criação e comparação de hashes de senha.
- **jsonwebtoken (JWT)**: emissão e validação dos tokens de autenticação.
- **node-cron**: agendamento da consulta automática de focos de calor.
- **Swagger**: documentação HTTP interativa.
- **Cypress**: testes de integração da API.

```text
config/                 Configuração do banco e do Swagger
controllers/            Validação e regras de negócio das rotas
middlewares/            Autenticação JWT e autorização por função
models/                 Definições Sequelize das tabelas e relações
routes/                 Endpoints HTTP e, em algumas rotas, anotações Swagger
services/               Integrações com NASA FIRMS e provedores de WhatsApp
utils/                  Formatação de dados públicos e telefone
cypress/e2e/             Testes de integração
index.js                 Configuração e inicialização do servidor
.env.example             Exemplo de variáveis de ambiente
```

## Como executar localmente

Pré-requisitos: Node.js 18 ou superior, npm e um banco MySQL acessível.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz usando `.env.example` como referência. Preencha as credenciais do MySQL e crie um `JWT_SECRET` aleatório e privado.
3. Prepare o banco MySQL e as tabelas necessárias antes de iniciar (veja [Dados e relacionamentos](#dados-e-relacionamentos)).
4. Inicie em modo de desenvolvimento:

   ```bash
   npm run dev
   ```

   Ou inicie sem o `nodemon`:

   ```bash
   npm start
   ```

Por padrão, a API usa a porta `3000`. Verifique `GET http://localhost:3000/health` e abra `http://localhost:3000/docs`.

> O servidor só começa a escutar depois de conseguir autenticar-se no MySQL. A ausência de `JWT_SECRET`, uma configuração de banco incompleta ou falha de conexão impede a inicialização.

## Configuração

O arquivo `.env.example` contém uma configuração mínima. O arquivo `.env` real não deve ser compartilhado nem enviado ao Git; o `.gitignore` exclui `.env` e arquivos `.sql`.

| Variável | Obrigatória? | Finalidade |
|---|---:|---|
| `PORT` | Não | Porta HTTP; padrão `3000`. |
| `FRONTEND_URL` | Não | Origem do frontend autorizada por CORS. O padrão é `http://localhost:5173`. |
| `FRONTEND_URLS` | Não | Lista de origens CORS separadas por vírgula; quando definida, tem prioridade sobre `FRONTEND_URL`. |
| `JWT_SECRET` | Sim | Chave privada para assinar e validar tokens. A aplicação encerra se ela não estiver definida. |
| `JWT_EXPIRES_IN` | Não | Prazo de validade do token; padrão `1d`. |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Sim, se não houver URL | Dados de conexão MySQL. A porta padrão é `3306`. |
| `DB_DIALECT` | Não | Dialeto Sequelize; padrão `mysql`. |
| `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` | Alternativa | Nomes alternativos aceitos para as configurações individuais do banco. |
| `DATABASE_URL` ou `MYSQL_URL` | Alternativa | URL de conexão completa; `DATABASE_URL` tem prioridade se ambas existirem. |
| `FIRMS_MAP_KEY` | Não | Chave de acesso da NASA FIRMS. Sem ela, o monitoramento automático é ignorado. |
| `WHATSAPP_PROVIDER` | Não | Provedor de envio: `meta` (padrão) ou `zapi`. |
| `WHATSAPP_API_VERSION` | Não | Versão da API Meta; padrão `v21.0`. |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN` | Para Meta | Identificador do número e token de acesso da API WhatsApp Cloud da Meta. |
| `WHATSAPP_USE_TEXT` | Não | Com valor `true`, usa mensagem de texto na Meta; caso contrário, usa template. |
| `ZAPI_SEND_URL` | Para Z-API, alternativa | URL de envio. |
| `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN` | Para Z-API, alternativa | Identificadores usados para montar a URL de envio quando `ZAPI_SEND_URL` não é fornecida. |
| `ZAPI_CLIENT_TOKEN` | Não | Token de cliente usado em determinadas configurações Z-API. |

Para CORS, configure a origem do navegador exatamente como ela aparece, incluindo protocolo e porta quando aplicável. Em `FRONTEND_URLS`, separe várias origens por vírgulas. A API não libera qualquer origem por padrão.

## Como a aplicação inicia

O arquivo `index.js` carrega as variáveis de ambiente, configura CORS e JSON, registra `/health`, `/docs` e os grupos de rotas. Em seguida, autentica a conexão Sequelize com o MySQL. Só após essa autenticação inicia o servidor HTTP e agenda o monitoramento automático.

As respostas de erro gerais são:

- `404` com `{"erro":"Rota não encontrada."}` para caminhos sem rota.
- `400` com `{"erro":"JSON inválido."}` para corpo JSON malformado.
- `500` com `{"erro":"Erro interno do servidor."}` para erros não tratados.

Os controllers também respondem com mensagens específicas em `erro` para validações, autenticação e recursos inexistentes.

## Funcionalidades e endpoints

Os corpos e respostas abaixo mostram os formatos implementados. Salvo indicação contrária, os corpos enviados devem ser JSON (`Content-Type: application/json`). As rotas marcadas como **autenticadas** exigem `Authorization: Bearer <token>`.

### Saúde e documentação

| Método e caminho | Acesso | Descrição |
|---|---|---|
| `GET /health` | Público | Retorna `{"ok":true}` se o processo está respondendo. Não testa o funcionamento de todas as integrações externas. |
| `GET /docs` | Público | Abre a interface Swagger. As anotações existentes não cobrem necessariamente todos os endpoints. |

### Autenticação — `/auth`

| Método e caminho | Acesso | Descrição |
|---|---|---|
| `POST /auth/cadastro` | Público | Cria uma conta de morador e retorna `token` e `usuario`. |
| `POST /auth/login` | Público | Valida e-mail e senha e retorna `token` e `usuario`. |
| `GET /auth/me` | Autenticado | Retorna os dados públicos do usuário associado ao token. |

Exemplo de cadastro:

```json
{
  "nome": "Maria Souza",
  "email": "maria@email.com",
  "senha": "uma-senha-segura",
  "telefone": "(92) 99999-0000",
  "aceitaWhatsapp": true
}
```

O telefone é opcional quando o usuário não aceita alertas por WhatsApp. Para aceitar, precisa informar um telefone brasileiro válido (DDD e 8 ou 9 dígitos, com ou sem código `55`). Senhas precisam ter pelo menos 8 caracteres e no máximo 72 bytes. O e-mail é normalizado para minúsculas. A função de conta criada pelo cadastro é sempre `morador`; ela não é aceita do cliente.

Em caso de sucesso, cadastro retorna `201` e login retorna `200`:

```json
{
  "token": "<JWT>",
  "usuario": {
    "id": 1,
    "nome": "Maria Souza",
    "email": "maria@email.com",
    "telefone": "5592999990000",
    "funcao": "morador",
    "whatsapp_opt_in": true,
    "whatsapp_opt_in_em": "2026-01-01T12:00:00.000Z",
    "criado_em": "2026-01-01T12:00:00.000Z"
  }
}
```

O formato de data mostrado é ilustrativo. A senha nunca faz parte do objeto público `usuario`. Login com e-mail inexistente e login com senha errada usam a mesma resposta `401` para não revelar se uma conta existe.

### Regiões — `/regioes`

| Método e caminho | Acesso | Descrição |
|---|---|---|
| `GET /regioes` | Público | Lista o catálogo de regiões em `{ "regioes": [...] }`. Ordena por estado e nome. |
| `GET /regioes/minhas` | Autenticado | Lista as inscrições da conta em `{ "inscricoes": [...] }`. |
| `POST /regioes/inscricao` | Autenticado | Cria uma inscrição em uma região. |
| `PATCH /regioes/inscricao/:regiaoId` | Autenticado | Altera o nível mínimo e/ou pausa ou reativa a inscrição. |
| `DELETE /regioes/inscricao/:regiaoId` | Autenticado | Remove a inscrição; sucesso retorna `204` sem corpo. |

Exemplo de inscrição:

```json
{
  "regiaoId": 1,
  "nivelMinimo": "atencao"
}
```

`nivelMinimo` aceita somente `atencao`, `alerta` ou `critico`; se omitido na criação, o padrão é `atencao`. A propriedade `ativo` deve ser booleana (`true` ou `false`). A inscrição pertence ao usuário autenticado: a consulta, atualização e remoção são limitadas à sua própria conta.

### Usuários — `/usuarios`

| Método e caminho | Acesso | Descrição |
|---|---|---|
| `PATCH /usuarios/me/whatsapp` | Autenticado | Registra ou revoga o consentimento para receber mensagens. |
| `PATCH /usuarios/me/senha` | Autenticado | Altera a senha após validar a senha atual. |

Para atualizar o consentimento, envie `{"aceita":true,"telefone":"(92) 99999-0000"}`. Para revogar, envie `{"aceita":false}`. A revogação limpa o consentimento e sua data, mas não apaga o número de telefone. Para aceitar, é obrigatório haver um telefone válido. A nova senha segue os mesmos limites de tamanho do cadastro.

### Notificações administrativas — `/notificacoes`

As duas rotas exigem token válido **e** usuário com `funcao` igual a `admin`.

| Método e caminho | Acesso | Descrição |
|---|---|---|
| `POST /notificacoes/whatsapp/:id` | Admin | Envia uma mensagem para o usuário indicado pelo ID. Corpo: `{"mensagem":"...","nivel":"Alerta","regiao":"..."}`. |
| `POST /notificacoes/broadcast` | Admin | Envia uma mensagem a todos os usuários que aceitaram WhatsApp e têm telefone cadastrado. Corpo: `{"mensagem":"...","nivel":"Alerta","regiao":"..."}`. |

`mensagem` é obrigatória. `nivel` e `regiao` são opcionais; o endpoint individual usa valores padrão se forem omitidos. O broadcast informa o total de destinatários, quantos envios foram concluídos e mensagens de erro dos envios que falharam.

### Respostas de erro comuns

O status depende do endpoint, mas os principais significados são:

- `400`: dados ausentes, formato inválido ou valor fora das opções aceitas.
- `401`: token ausente/inválido/expirado, ou credenciais de login inválidas.
- `403`: usuário autenticado sem a função exigida.
- `404`: rota, usuário, região ou inscrição não encontrada.
- `409`: tentativa de cadastrar e-mail existente ou duplicar uma inscrição.

## Dados e relacionamentos

Os models descrevem as tabelas MySQL; não substituem a criação do banco. As tabelas atualmente representadas são:

- **`usuario`** (`Usuario`): `id`, `nome`, `email`, `senha` (hash), `telefone`, `funcao`, `whatsapp_opt_in`, `whatsapp_opt_in_em` e `criado_em`. O e-mail é único; a função padrão é `morador`.
- **`regiao`** (`Regiao`): `id`, `estado`, `codigo_estado`, `nome_regiao`, `latitude`, `longitude` e `raio_km`.
- **`usuario_regiao`** (`UsuarioRegiao`): `id`, `usuario_id`, `regiao_id`, `nivel_minimo` e `ativo`. Os níveis aceitos são `atencao`, `alerta` e `critico`.
- **`alerta_fogo`** (`AlertaFogo`): `id`, `regiao_id`, coordenadas, `gravidade`, `qtd_focos`, `distancia_km`, `fonte`, `data_deteccao`, `status` e `criado_em`. A gravidade aceita `atencao`, `alerta` e `critico`; o status é `ativo` ou `encerrado`.
- **`notificacao`** (`Notificacao`): `id`, `usuario_id`, `alerta_fogo_id`, `canal`, `status`, `data_envio`, `wa_message_id` e `erro`. Os canais modelados são `whatsapp`, `telegram`, `sms` e `email`; os status são `pendente`, `enviada`, `entregue`, `lida` e `falhou`.

Um usuário pode acompanhar várias regiões e uma região pode ser acompanhada por vários usuários; essa relação muitos-para-muitos passa por `usuario_regiao`. Regiões podem ter alertas de fogo, e alertas/notificações podem ser relacionados conforme as associações dos models.

Apesar de os models `AlertaFogo` e `Notificacao` existirem, não há endpoints para consultar ou administrar alertas de fogo ou notificações. A tabela de alertas não é preenchida pelo monitoramento automático atual.

**Importante:** o código não executa `sequelize.sync()` e o repositório não contém diretórios de migrations ou seeders. Portanto, iniciar a API não cria nem atualiza tabelas e não popula o catálogo de regiões. O banco e suas tabelas/dados iniciais precisam ser provisionados por um processo externo compatível com os models. Confira o esquema real antes de alterar nomes de tabelas, colunas, tipos ou enums.

## Monitoramento e WhatsApp

### Monitoramento de focos de calor

Após conectar ao banco, a aplicação agenda uma verificação a cada 15 minutos. O serviço consulta a API NASA FIRMS para uma área aproximada do Amazonas e considera os focos de alta confiança ou com potência radiativa (FRP) de pelo menos 15 MW. Para cada ciclo, seleciona o foco de maior FRP e tenta notificar usuários com `whatsapp_opt_in = true` e telefone cadastrado.

Observações sobre a implementação atual:

- Sem `FIRMS_MAP_KEY`, a consulta automática é ignorada, com aviso no log.
- A aplicação não grava esses focos na tabela `alerta_fogo`; o fluxo de monitoramento envia notificações diretamente.
- Embora existam inscrições por região e nível mínimo, esse serviço não as usa para filtrar os destinatários nem o nível enviado: seleciona usuários pelo consentimento WhatsApp.
- A lista de focos já processados fica em memória. Ela ajuda a evitar repetição durante a execução atual, mas não persiste após reiniciar o processo.
- Se não houver destinatários elegíveis, o ciclo não envia mensagens.

### Envio por WhatsApp

O serviço `whatsappService` formata o texto e normaliza telefones para o formato internacional brasileiro. O provedor é selecionado por `WHATSAPP_PROVIDER`:

- `meta` (padrão): usa a API WhatsApp Cloud; requer `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_TOKEN`.
- `zapi`: usa a configuração Z-API (`ZAPI_SEND_URL` ou `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN`).

Na integração Meta, se `WHATSAPP_USE_TEXT` não for exatamente `true`, o código envia o template `hello_world` no idioma `en_US`; o texto montado para o alerta não é passado como variável desse template. Confirme se esse template atende ao uso real. Com `WHATSAPP_USE_TEXT=true`, o texto formatado é enviado como mensagem de texto. O envio pela Z-API usa o texto formatado.

O envio individual tenta salvar um registro em `notificacao`, mas não impede a resposta se o histórico falhar. O broadcast administrativo não registra histórico nessa tabela. No envio individual, a leitura do identificador retornado pelo provedor usa a propriedade `messaId`, enquanto o service retorna `messageId`; por isso, o ID da mensagem não é preenchido por esse caminho.

Credenciais de provedores são segredos: mantenha-as apenas no ambiente de execução, nunca em código, commits, exemplos públicos ou logs compartilhados. O envio real deve ser validado com credenciais e destinatários de teste controlados.

## Integração com o frontend: contratos importantes

O frontend depende não apenas das URLs, mas também dos nomes e formatos dos dados. Antes de alterar a API, verifique os consumidores do frontend e atualize ambos os lados de forma coordenada.

1. **Caminhos e métodos HTTP:** por exemplo, `PATCH /usuarios/me/whatsapp` não é equivalente a `POST /usuarios/me/whatsapp`.
2. **Formato da resposta:** login e cadastro retornam `{ token, usuario }`; catálogo retorna `{ regioes }`; regiões do usuário retornam `{ inscricoes }`. Não remover ou renomear esses envelopes sem adaptar o cliente.
3. **Nomes e grafia:** há campos em português e snake_case, como `whatsapp_opt_in`, `nivel_minimo`, `regiao_id` e `criado_em`. O cadastro usa `aceitaWhatsapp`, enquanto a atualização de consentimento usa `aceita`.
4. **Enums:** valores válidos incluem `atencao`, `alerta`, `critico`, além de status específicos em notificações e alertas. O frontend pode comparar esses valores literalmente.
5. **Autenticação:** endpoints protegidos esperam `Authorization: Bearer <token>`. O token contém o ID (`sub`) e a função (`funcao`); alterar as claims ou o cabeçalho exige mudança coordenada no cliente e no middleware.
6. **Tipos de dados:** as coordenadas de região são convertidas para números antes da resposta, embora MySQL/Sequelize possa retorná-las como texto.
7. **Status HTTP:** clientes podem depender de `201`, `204`, `401`, `403`, `404` ou `409`, e não somente do corpo da resposta.

As anotações Swagger são mantidas junto às rotas, mas nem todas as rotas têm anotações. `/docs` é uma ajuda para exploração, não uma garantia de que todo contrato esteja documentado ali.

## Cuidados e áreas sensíveis

- **Senhas:** o banco armazena hash bcrypt, nunca senha em texto. Preserve o scope padrão que exclui `senha` e exponha a senha somente nos fluxos internos que precisam validá-la.
- **JWT:** mantenha `JWT_SECRET` privado, forte e consistente entre instâncias da API. Trocar a chave invalida tokens existentes. A função no token controla o acesso administrativo.
- **Função `admin`:** cadastro público sempre cria `morador`. A promoção administrativa é responsabilidade operacional no banco; não aceite `funcao` diretamente do frontend.
- **WhatsApp e privacidade:** consentimento é armazenado na conta. O endpoint de broadcast respeita `whatsapp_opt_in`; já o endpoint administrativo de envio individual verifica telefone, mas não verifica esse consentimento. Considere esse comportamento ao operar a rota e ao alterar regras de privacidade.
- **Envios externos:** mensagens podem gerar custo, atingir pessoas reais e estar sujeitas a limites/erros do provedor. Proteja endpoints administrativos e confirme o destino antes de executar envios amplos.
- **Integrações:** falha de NASA FIRMS ou do provedor pode impedir o envio; monitore os logs da aplicação e as respostas do provedor.
- **Esquema do banco:** alterações de models, tabelas, colunas, nomes de associações ou enums podem quebrar a API ou divergir do banco instalado. Não há migrações neste repositório para aplicar mudanças automaticamente.
- **CORS:** liberar uma origem indevida pode permitir que sites não autorizados tentem interagir com a API no navegador. Configure apenas as origens necessárias.
- **Testes automatizados:** o Cypress usa como `baseUrl` padrão um endereço hospedado externamente, e o teste de autenticação cadastra uma conta. Não execute `npm test` sem confirmar o ambiente alvo; para testes locais, altere a configuração do Cypress para `http://localhost:3000` conscientemente.
- **Monitoramento:** o cron é iniciado junto com cada processo backend. Em uma implantação com várias instâncias, cada instância pode executar o mesmo ciclo e tentar enviar os mesmos avisos.

## Testes

Com a API e o banco preparados, é possível abrir o Cypress:

```bash
npm run cy:open
```

Ou executar os testes em modo headless:

```bash
npm run cy:run
```

`npm test` também executa `cypress run`. Os testes existentes verificam `/health`, disponibilidade de `/docs`, cadastro/login/consulta de usuário e listagem de regiões. Eles dependem de uma API e banco funcionais; o teste de cadastro cria dados persistentes e não os remove ao final.

## Glossário

- **API REST:** conjunto de URLs e regras HTTP que permite a comunicação entre frontend e backend.
- **Controller:** código que recebe a requisição, valida os dados, chama as operações necessárias e monta a resposta.
- **Endpoint/rota:** combinação de método HTTP e caminho, como `GET /regioes`.
- **Model:** representação de uma tabela e de seus dados no Sequelize.
- **Middleware:** função executada durante o processamento da requisição; neste projeto, o middleware de autenticação valida o JWT.
- **JWT:** token assinado que comprova a autenticação e carrega informações necessárias ao backend.
- **Hash:** resultado irreversível usado para verificar uma senha sem guardar a senha original.
- **CORS:** regra do navegador que controla quais origens podem fazer chamadas à API.
- **Opt-in:** consentimento explícito para receber mensagens; neste projeto é registrado em `whatsapp_opt_in`.
- **FRP:** estimativa da potência radiativa de um foco de calor, usada pelo monitoramento como medida de intensidade.