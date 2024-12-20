const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryUsers() {
    try {
        // Busca todos os usuários
        const users = await prisma.user.findMany();
        console.log('Usuários cadastrados:');
        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

queryUsers(); 