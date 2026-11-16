'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const db = require('./models');
const swaggerSpec = require('./config/swagger');

if (!process.env.JWT_SECRET) {
  console.error('Defina JWT_SECRET no .env antes de iniciar.');
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', require('./routes/authRoutes'));
app.use('/regioes', require('./routes/regiaoRoutes'));
app.use('/usuarios', require('./routes/usuarioRoutes'));
app.use('/notificacoes', require('./routes/notificacaoRoutes'));

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Express 5 já encaminha para cá os erros de handlers async
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;

db.sequelize
  .authenticate()
  .then(() => {
    console.log('MySQL conectado');
    app.listen(PORT, () => console.log(`API em http://localhost:${PORT} (docs em /docs)`));
  })
  .catch((e) => {
    console.error('Falha ao conectar no banco:', e.message);
    process.exit(1);
  });
