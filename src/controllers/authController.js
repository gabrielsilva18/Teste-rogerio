const authService = require('../services/authService');
const CustomError = require('../utils/CustomError');

class AuthController {
    /**
     * Registra um novo usuário
     */
    async register(req, res, next) {
        try {
            // Log para debug
            console.log('Dados recebidos:', req.body);

            const { name, email, password } = req.body;

            // Validação dos dados recebidos
            if (!name || !email || !password) {
                throw new CustomError('Todos os campos são obrigatórios', 400);
            }

            // Validação básica de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new CustomError('Email inválido', 400);
            }

            const user = await authService.register({ name, email, password });
            
            // Log para debug
            console.log('Usuário criado:', user);

            res.status(201).json(user);
        } catch (error) {
            // Log para debug
            console.error('Erro no registro:', error);

            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({ 
                    message: error.message 
                });
            }
            next(error);
        }
    }

    /**
     * Realiza o login do usuário
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new CustomError('Email e senha são obrigatórios', 400);
            }

            const result = await authService.login(email, password);
            res.json(result);
        } catch (error) {
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({ 
                    message: error.message 
                });
            }
            next(error);
        }
    }

    /**
     * Atualiza o token usando refresh token
     */
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new CustomError('Refresh token não fornecido', 400);
            }

            const tokens = await authService.refreshToken(refreshToken);
            res.json(tokens);
        } catch (error) {
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({ 
                    message: error.message 
                });
            }
            next(error);
        }
    }

    /**
     * Realiza o logout do usuário
     */
    async logout(req, res) {
        res.json({ message: 'Logout realizado com sucesso' });
    }
}

module.exports = new AuthController(); 