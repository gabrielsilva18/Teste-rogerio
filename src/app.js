/**
 * Arquivo principal da aplicação
 * Configura o servidor Express e define as rotas principais
 */

require('dotenv').config(); // Carrega variáveis de ambiente
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const secretSantaRoutes = require('./routes/secretSanta.routes');
const initModels = require('./config/initModels');
const prisma = require('./config/prisma');
const friendshipRoutes = require('./routes/friendship.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// Configuração de middlewares globais
app.use(cors()); // Permite requisições cross-origin
app.use(express.json()); // Parse do corpo das requisições como JSON
app.use(express.static(path.join(__dirname, '../public'))); // Serve arquivos estáticos

// Rota principal - Serve a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rotas da API
app.use('/api/auth', authRoutes); // Rotas de autenticação
app.use('/api/secret-santa', secretSantaRoutes); // Rotas do amigo oculto
app.use('/api/friends', friendshipRoutes);
app.use('/api/notifications', notificationRoutes);

// Middleware de tratamento de erros global
app.use(errorHandler);

/**
 * Inicia o servidor na porta especificada
 * Se a porta estiver em uso, tenta a próxima porta
 */
const startServer = async (port) => {
    try {
        await initModels(); // Inicializa conexão com o banco
        app.listen(port, () => {
            console.log(`Servidor rodando na porta http://localhost:${port}`);
        });
    } catch (error) {
        if (error.code === 'EADDRINUSE') {
            console.log(`Porta ${port} em uso, tentando próxima porta...`);
            startServer(port + 1);
        } else {
            console.error('Erro ao inicializar o servidor:', error);
            process.exit(1);
        }
    }
};

const PORT = process.env.PORT || 3000;
startServer(PORT);

// Limpeza de recursos ao encerrar a aplicação
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit();
}); 