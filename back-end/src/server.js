require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDatabase, isFallback } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const productsRoutes = require('./routes/productsRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares essenciais
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Flora Acessórios API',
    version: '4.0.0',
    mode: isFallback() ? 'resilient-embedded' : 'mysql-connected',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', productsRoutes);
app.use('/api/v1', ordersRoutes);
app.use('/api/v1', dashboardRoutes);

// Suporte a Deploy no Render / Produção (Serviço Unificado)
// Se a pasta 'dist' do front-end existir, o back-end serve as telas automaticamente
const frontendDist = path.join(__dirname, '../../front-end/dist');
app.use(express.static(frontendDist));

// Se nenhuma rota de API casou, serve o frontend (SPA Fallback)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Flora API</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:3rem;">
          <h2>Flora API v4.0 ativa!</h2>
          <p>Endpoints disponíveis em <code>/api/v1</code>.</p>
          <p>Para desenvolvimento local com Hot-Reload, acesse o front-end em <a href="http://127.0.0.1:5173">http://127.0.0.1:5173</a>.</p>
        </body>
        </html>
      `);
    }
  });
});

// Inicialização do Servidor
async function startServer() {
  await connectDatabase();

  return app.listen(PORT, '0.0.0.0', () => {
    console.log('================================================================');
    console.log(`Flora API em http://127.0.0.1:${PORT}/api/v1`);
    console.log(`Status do Banco: ${isFallback() ? 'Persistência Híbrida/Nuvem Ativa' : 'MySQL Conectado'}`);
    console.log('================================================================');
  });
}

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
