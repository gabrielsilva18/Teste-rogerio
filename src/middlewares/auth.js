const jwt = require('jsonwebtoken');
const CustomError = require('../utils/CustomError');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('Auth Header:', authHeader);

        if (!authHeader) {
            throw new CustomError('Token não fornecido', 401);
        }

        const [, token] = authHeader.split(' ');
        console.log('Token:', token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded);

        req.userId = decoded.id;
        console.log('User ID definido:', req.userId);

        next();
    } catch (error) {
        console.error('Erro de autenticação:', error);
        next(new CustomError('Token inválido', 401));
    }
}; 