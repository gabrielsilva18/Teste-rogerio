const friendshipService = require('../services/friendshipService');
const CustomError = require('../utils/CustomError');

class FriendshipController {
    async sendRequest(req, res, next) {
        try {
            console.log('Recebendo requisição de amizade:', {
                body: req.body,
                userId: req.userId
            });

            const { email } = req.body;
            
            if (!email) {
                throw new CustomError('Email é obrigatório', 400);
            }

            if (!req.userId) {
                throw new CustomError('Usuário não autenticado', 401);
            }

            const friendship = await friendshipService.sendFriendRequest(req.userId, email);
            
            console.log('Amizade criada:', friendship);
            res.status(201).json(friendship);
        } catch (error) {
            console.error('Erro no controller de amizade:', error);
            
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({ 
                    message: error.message 
                });
            }
            
            next(error);
        }
    }

    async respondToRequest(req, res, next) {
        try {
            const { friendshipId } = req.params;
            const { accept } = req.body;
            const result = await friendshipService.respondToFriendRequest(
                req.userId,
                friendshipId,
                accept
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getFriends(req, res, next) {
        try {
            const friends = await friendshipService.getFriends(req.userId);
            res.json(friends);
        } catch (error) {
            next(error);
        }
    }

    async cleanupOldRequests(req, res, next) {
        try {
            const result = await friendshipService.cleanupOldRequests();
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getPendingRequests(req, res, next) {
        try {
            const requests = await friendshipService.getPendingRequests(req.userId);
            res.json(requests);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FriendshipController(); 