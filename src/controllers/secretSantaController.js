const secretSantaService = require('../services/secretSantaService');
const { validate } = require('../middlewares/validator');
const CustomError = require('../utils/CustomError');

class SecretSantaController {
    async create(req, res, next) {
        try {
            const { name, date, budget, invitedFriends } = req.body;
            console.log('Dados recebidos no controller:', req.body);

            // Validações básicas
            if (!name || !date || !budget) {
                throw new CustomError('Todos os campos são obrigatórios', 400);
            }

            const secretSanta = await secretSantaService.create({
                name,
                date: new Date(date),
                budget: parseFloat(budget),
                organizerId: req.userId,
                invitedFriends: invitedFriends || []
            });
            
            res.status(201).json(secretSanta);
        } catch (error) {
            next(error);
        }
    }

    async draw(req, res, next) {
        try {
            const { id } = req.params;
            await secretSantaService.performDraw(id, req.userId);
            res.status(200).json({ message: 'Sorteio realizado com sucesso' });
        } catch (error) {
            next(error);
        }
    }

    async listMine(req, res, next) {
        try {
            const events = await secretSantaService.findByUser(req.userId);
            res.json(events);
        } catch (error) {
            next(error);
        }
    }

    async getOne(req, res, next) {
        try {
            const event = await secretSantaService.findById(req.params.id, req.userId);
            res.json(event);
        } catch (error) {
            next(error);
        }
    }

    async join(req, res, next) {
        try {
            const { id } = req.params;
            const { accept } = req.body;

            if (!accept) {
                // Se recusou, apenas marca a notificação como lida
                await prisma.notification.updateMany({
                    where: {
                        secretSantaId: id,
                        receiverId: req.userId,
                        type: 'EVENT_INVITE'
                    },
                    data: {
                        read: true
                    }
                });
                return res.json({ message: 'Convite recusado com sucesso' });
            }

            const result = await secretSantaService.join(id, req.userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async updateWishList(req, res, next) {
        try {
            await secretSantaService.updateWishList(req.params.id, req.userId, req.body.items);
            res.json({ message: 'Lista de desejos atualizada com sucesso' });
        } catch (error) {
            next(error);
        }
    }

    async getMyTarget(req, res, next) {
        try {
            const target = await secretSantaService.getTarget(req.params.id, req.userId);
            res.json(target);
        } catch (error) {
            next(error);
        }
    }

    async inviteParticipant(req, res, next) {
        try {
            const { id } = req.params;
            const { invitedUserId } = req.body;
            
            const result = await secretSantaService.inviteParticipant(
                id,
                req.userId,
                invitedUserId
            );
            
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await secretSantaService.delete(id, req.userId);
            res.status(200).json({ message: 'Evento excluído com sucesso' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SecretSantaController(); 