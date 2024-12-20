const prisma = require('../config/prisma');
const CustomError = require('../utils/CustomError');

class FriendshipService {
    async sendFriendRequest(senderId, receiverEmail) {
        try {
            console.log('Iniciando envio de solicitação de amizade...');
            
            // Verifica se o prisma está funcionando
            console.log('Prisma instance:', !!prisma);
            console.log('Prisma models:', Object.keys(prisma));

            // Verifica se o sender existe
            const sender = await prisma.user.findUnique({
                where: { id: senderId }
            });

            if (!sender) {
                throw new CustomError('Remetente não encontrado', 404);
            }

            // Busca o receiver
            const receiver = await prisma.user.findUnique({
                where: { email: receiverEmail }
            });

            if (!receiver) {
                throw new CustomError('Usuário não encontrado', 404);
            }

            if (receiver.id === senderId) {
                throw new CustomError('Você não pode enviar solicitação para si mesmo', 400);
            }

            // Verifica se já existe uma amizade ou solicitação pendente
            const existingFriendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        {
                            AND: [
                                { senderId: senderId },
                                { receiverId: receiver.id }
                            ]
                        },
                        {
                            AND: [
                                { senderId: receiver.id },
                                { receiverId: senderId }
                            ]
                        }
                    ]
                }
            });

            if (existingFriendship) {
                if (existingFriendship.status === 'PENDING') {
                    throw new CustomError('Já existe uma solicitação de amizade pendente', 400);
                } else if (existingFriendship.status === 'ACCEPTED') {
                    throw new CustomError('Vocês já são amigos', 400);
                } else {
                    // Se foi rejeitada, deleta para permitir nova solicitação
                    await prisma.friendship.delete({
                        where: { id: existingFriendship.id }
                    });
                }
            }

            // Cria a nova solicitação
            const friendship = await prisma.friendship.create({
                data: {
                    senderId,
                    receiverId: receiver.id,
                    status: 'PENDING'
                }
            });

            // Cria a notificação
            await prisma.notification.create({
                data: {
                    type: 'FRIEND_REQUEST',
                    senderId,
                    receiverId: receiver.id,
                    content: `${sender.name} enviou uma solicitação de amizade`,
                    friendshipId: friendship.id
                }
            });

            return friendship;
        } catch (error) {
            console.error('Erro no serviço de amizade:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Erro ao processar solicitação de amizade', 500);
        }
    }

    async respondToFriendRequest(userId, friendshipId, accept) {
        try {
            console.log('Processando resposta:', { userId, friendshipId, accept });

            const friendship = await prisma.friendship.findFirst({
                where: {
                    id: friendshipId,
                    receiverId: userId,
                    status: 'PENDING'
                },
                include: {
                    sender: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            console.log('Amizade encontrada:', friendship);

            if (!friendship) {
                throw new CustomError('Solicitação de amizade não encontrada', 404);
            }

            // Usa uma transação para garantir que todas as operações sejam realizadas
            await prisma.$transaction(async (tx) => {
                if (accept) {
                    // Atualiza o status da amizade
                    await tx.friendship.update({
                        where: { id: friendshipId },
                        data: { status: 'ACCEPTED' }
                    });
                } else {
                    // Se recusou, deleta a amizade
                    await tx.friendship.delete({
                        where: { id: friendshipId }
                    });
                }

                // Deleta a notificação antiga
                await tx.notification.deleteMany({
                    where: {
                        friendshipId: friendshipId
                    }
                });

                // Cria uma nova notificação para o remetente
                await tx.notification.create({
                    data: {
                        type: 'FRIEND_REQUEST',
                        senderId: userId,
                        receiverId: friendship.senderId,
                        content: `Sua solicitação de amizade foi ${accept ? 'aceita' : 'recusada'}`,
                        read: false
                    }
                });
            });

            return { message: `Solicitação de amizade ${accept ? 'aceita' : 'recusada'} com sucesso` };
        } catch (error) {
            console.error('Erro ao responder solicitação:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Erro ao processar resposta de amizade', 500);
        }
    }

    async getFriends(userId) {
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ],
                status: 'ACCEPTED'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return friendships.map(friendship => {
            const friend = friendship.senderId === userId ? 
                friendship.receiver : friendship.sender;
            return friend;
        });
    }

    async cleanupOldRequests() {
        try {
            // Deleta notificações antigas de solicitações de amizade
            await prisma.notification.deleteMany({
                where: {
                    type: 'FRIEND_REQUEST',
                    friendshipId: null
                }
            });

            // Deleta amizades rejeitadas
            await prisma.friendship.deleteMany({
                where: {
                    status: 'REJECTED'
                }
            });

            // Limpa notificações órfãs (sem friendshipId correspondente)
            const notifications = await prisma.notification.findMany({
                where: {
                    type: 'FRIEND_REQUEST',
                    NOT: {
                        friendshipId: null
                    }
                }
            });

            for (const notification of notifications) {
                const friendship = await prisma.friendship.findUnique({
                    where: { id: notification.friendshipId }
                });

                if (!friendship) {
                    await prisma.notification.delete({
                        where: { id: notification.id }
                    });
                }
            }

            return { message: 'Limpeza concluída com sucesso' };
        } catch (error) {
            console.error('Erro ao limpar solicitações antigas:', error);
            throw new CustomError('Erro ao limpar solicitações antigas', 500);
        }
    }

    async getPendingRequests(userId) {
        return prisma.friendship.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    }
}

module.exports = new FriendshipService(); 