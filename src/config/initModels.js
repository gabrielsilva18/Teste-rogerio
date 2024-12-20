const prisma = require('./prisma');

const initModels = async () => {
    try {
        // Testa a conexão com o banco
        await prisma.$connect();
        console.log('Banco de dados conectado com sucesso');
        
        return prisma;
    } catch (error) {
        console.error('Erro ao conectar com o banco de dados:', error);
        throw error;
    }
};

module.exports = initModels; 