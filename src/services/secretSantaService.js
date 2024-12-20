const prisma = require('../config/prisma');
const CustomError = require('../utils/CustomError');

class SecretSantaService {
    async create(data) {
        try {
            // Adicione logs para debug
            console.log('Dados recebidos no serviço:', data);
            console.log('invitedFriends:', data.invitedFriends);

            // Verifica se invitedFriends existe e é um array
            if (!Array.isArray(data.invitedFriends)) {
                throw new CustomError('Lista de amigos inválida', 400);
            }

            if (data.invitedFriends.length < 2) {
                throw new CustomError('Selecione pelo menos 2 amigos para criar o amigo oculto (mínimo de 3 participantes incluindo você)', 400);
            }

            // Cria o evento primeiro
            const secretSanta = await prisma.secretSanta.create({
                data: {
                    name: data.name,
                    date: data.date,
                    budget: data.budget,
                    organizerId: data.organizerId,
                    participants: {
                        create: {
                            userId: data.organizerId
                        }
                    }
                },
                include: {
                    organizer: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    participants: true
                }
            });

            // Envia convites para todos os amigos selecionados
            try {
                console.log('Enviando convites para:', data.invitedFriends);
                await Promise.all(data.invitedFriends.map(friendId =>
                    prisma.notification.create({
                        data: {
                            type: 'EVENT_INVITE',
                            content: `Você foi convidado para participar do amigo oculto: ${secretSanta.name}`,
                            read: false,
                            senderId: data.organizerId,
                            receiverId: friendId,
                            secretSantaId: secretSanta.id
                        }
                    })
                ));
                console.log('Convites enviados com sucesso');
            } catch (notificationError) {
                console.error('Erro ao criar notificações:', notificationError);
                // Mesmo se falhar ao criar notificações, o evento foi criado
            }

            return secretSanta;
        } catch (error) {
            console.error('Erro detalhado:', error);
            if (error instanceof CustomError) throw error;
            throw new CustomError('Erro ao criar amigo oculto', 500);
        }
    }

    async findByUser(userId) {
        const events = await prisma.secretSanta.findMany({
            where: {
                OR: [
                    { organizerId: userId },
                    {
                        participants: {
                            some: {
                                userId: userId
                            }
                        }
                    }
                ]
            },
            include: {
                organizer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        return events.map(event => ({
            ...event,
            budget: Number(event.budget)
        }));
    }

    async findById(id, userId) {
        const event = await prisma.secretSanta.findUnique({
            where: { id },
            include: {
                organizer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!event) {
            throw new CustomError('Amigo oculto não encontrado', 404);
        }

        const isParticipant = event.participants.some(p => p.userId === userId);
        if (event.organizerId !== userId && !isParticipant) {
            throw new CustomError('Não autorizado', 403);
        }

        return event;
    }

    async performDraw(secretSantaId, organizerId) {
        const secretSanta = await prisma.secretSanta.findUnique({
            where: { id: secretSantaId },
            include: {
                participants: true
            }
        });

        if (!secretSanta) {
            throw new CustomError('Amigo oculto não encontrado', 404);
        }

        if (secretSanta.organizerId !== organizerId) {
            throw new CustomError('Não autorizado', 403);
        }

        const participants = secretSanta.participants;
        if (participants.length < 3) {
            throw new CustomError('Número insuficiente de participantes', 400);
        }

        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        
        const updates = shuffled.map((participant, index) => {
            const nextIndex = (index + 1) % shuffled.length;
            return prisma.participant.update({
                where: { id: participant.id },
                data: { targetUserId: shuffled[nextIndex].userId }
            });
        });

        await prisma.$transaction(updates);
    }

    async inviteParticipant(secretSantaId, userId, invitedUserId) {
        try {
            // Verifica se o evento existe e se o usuário é o organizador
            const secretSanta = await prisma.secretSanta.findFirst({
                where: {
                    id: secretSantaId,
                    organizerId: userId
                }
            });

            if (!secretSanta) {
                throw new CustomError('Evento não encontrado ou você não é o organizador', 404);
            }

            // Verifica se o convidado já é participante
            const existingParticipant = await prisma.participant.findFirst({
                where: {
                    secretSantaId,
                    userId: invitedUserId
                }
            });

            if (existingParticipant) {
                throw new CustomError('Usuário já é participante deste evento', 400);
            }

            // Cria a notificação de convite
            await prisma.notification.create({
                data: {
                    type: 'EVENT_INVITE',
                    senderId: userId,
                    receiverId: invitedUserId,
                    content: `Você foi convidado para participar do amigo oculto: ${secretSanta.name}`,
                    secretSantaId: secretSantaId
                }
            });

            return { message: 'Convite enviado com sucesso' };
        } catch (error) {
            console.error('Erro ao enviar convite:', error);
            if (error instanceof CustomError) throw error;
            throw new CustomError('Erro ao enviar convite', 500);
        }
    }
}

module.exports = new SecretSantaService(); 