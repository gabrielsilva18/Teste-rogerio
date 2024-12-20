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

    async performDraw(secretSantaId, userId) {
        try {
            const event = await prisma.secretSanta.findUnique({
                where: { id: secretSantaId },
                include: {
                    participants: true
                }
            });

            if (!event) {
                throw new CustomError('Evento não encontrado', 404);
            }

            console.log('\n=== VERIFICAÇÃO DE PERMISSÃO DETALHADA ===');
            console.log({
                evento: {
                    id: event.id,
                    nome: event.name,
                    organizadorId: event.organizerId
                },
                usuario: {
                    id: userId,
                    tipo: typeof userId
                },
                comparacao: {
                    organizadorIdTipo: typeof event.organizerId,
                    usuarioIdTipo: typeof userId,
                    saoIguais: event.organizerId === userId,
                    organizadorString: String(event.organizerId),
                    usuarioString: String(userId),
                    saoIguaisString: String(event.organizerId) === String(userId)
                }
            });

            if (String(event.organizerId) !== String(userId)) {
                throw new CustomError('Apenas o organizador pode realizar o sorteio', 403);
            }

            if (event.participants.some(p => p.targetUserId !== null)) {
                throw new CustomError('Sorteio já foi realizado', 400);
            }

            if (event.participants.length < 3) {
                throw new CustomError('É necessário pelo menos 3 participantes', 400);
            }

            // 2. Realiza o sorteio
            const participants = event.participants.map(p => p.userId);
            let targets = [...participants];

            // Embaralha os alvos
            for (let i = targets.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [targets[i], targets[j]] = [targets[j], targets[i]];
            }

            // Verifica se alguém tirou a si mesmo
            let hasSelfDraw;
            do {
                hasSelfDraw = false;
                for (let i = 0; i < participants.length; i++) {
                    if (participants[i] === targets[i]) {
                        hasSelfDraw = true;
                        const nextIndex = (i + 1) % participants.length;
                        [targets[i], targets[nextIndex]] = [targets[nextIndex], targets[i]];
                    }
                }
            } while (hasSelfDraw);

            // Log do resultado do sorteio
            console.log('\n=== RESULTADO DO SORTEIO ===');
            participants.forEach((p, i) => {
                console.log(`${p} -> ${targets[i]}`);
            });

            // 3. Salva o resultado
            await Promise.all(participants.map((userId, index) => 
                prisma.participant.updateMany({
                    where: {
                        secretSantaId,
                        userId
                    },
                    data: {
                        targetUserId: targets[index]
                    }
                })
            ));

            return { message: 'Sorteio realizado com sucesso' };
        } catch (error) {
            console.error('Erro ao realizar sorteio:', error);
            if (error instanceof CustomError) throw error;
            throw new CustomError('Erro ao realizar sorteio', 500);
        }
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

    async join(secretSantaId, userId) {
        try {
            // Verifica se o evento existe
            const secretSanta = await prisma.secretSanta.findUnique({
                where: { id: secretSantaId },
                include: {
                    participants: true
                }
            });

            if (!secretSanta) {
                throw new CustomError('Amigo oculto não encontrado', 404);
            }

            // Verifica se o usuário já é participante
            const isParticipant = secretSanta.participants.some(p => p.userId === userId);
            if (isParticipant) {
                throw new CustomError('Você já é participante deste amigo oculto', 400);
            }

            // Adiciona o usuário como participante
            await prisma.participant.create({
                data: {
                    secretSantaId,
                    userId
                }
            });

            // Marca a notificação como lida
            await prisma.notification.updateMany({
                where: {
                    secretSantaId,
                    receiverId: userId,
                    type: 'EVENT_INVITE'
                },
                data: {
                    read: true
                }
            });

            return { message: 'Você foi adicionado ao amigo oculto com sucesso!' };
        } catch (error) {
            console.error('Erro ao entrar no amigo oculto:', error);
            if (error instanceof CustomError) throw error;
            throw new CustomError('Erro ao entrar no amigo oculto', 500);
        }
    }

    async getTarget(secretSantaId, userId) {
        try {
            console.log('Buscando alvo para:', { secretSantaId, userId });
            const participant = await prisma.participant.findFirst({
                where: {
                    secretSantaId,
                    userId,
                    NOT: {
                        targetUserId: null
                    }
                },
                include: {
                    secretSanta: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

            console.log('Participante encontrado:', participant);

            if (!participant) {
                throw new CustomError('Participante não encontrado ou sorteio não realizado', 404);
            }

            // Busca o usuário alvo em uma consulta separada
            const targetUser = await prisma.user.findUnique({
                where: {
                    id: participant.targetUserId
                },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });

            if (!targetUser) {
                throw new CustomError('Usuário alvo não encontrado', 404);
            }

            return {
                target: targetUser,
                event: participant.secretSanta
            };
        } catch (error) {
            console.error('Erro ao buscar amigo secreto:', error);
            if (error instanceof CustomError) throw error;
            throw new CustomError('Erro ao buscar amigo secreto', 500);
        }
    }

    async delete(secretSantaId, userId) {
        try {
            // Verifica se o evento existe
            const event = await prisma.secretSanta.findUnique({
                where: { id: secretSantaId }
            });

            if (!event) {
                throw new CustomError('Evento não encontrado', 404);
            }

            // Verifica se o usuário é o organizador
            if (event.organizerId !== userId) {
                throw new CustomError('Apenas o organizador pode excluir o evento', 403);
            }

            // Exclui os participantes primeiro
            await prisma.participant.deleteMany({
                where: { secretSantaId }
            });

            // Exclui o evento
            await prisma.secretSanta.delete({
                where: { id: secretSantaId }
            });

            return { message: 'Evento excluído com sucesso' };
        } catch (error) {
            console.error('Erro ao excluir evento:', error);
            if (error instanceof CustomError) throw error;
            throw new CustomError('Erro ao excluir evento', 500);
        }
    }
}

module.exports = new SecretSantaService(); 