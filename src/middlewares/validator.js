const Joi = require('joi');

const schemas = {
    secretSanta: Joi.object({
        name: Joi.string().required().min(3).max(100),
        date: Joi.date().greater('now').required(),
        budget: Joi.number().positive().required(),
        participants: Joi.array().items(Joi.string().uuid()).min(3)
    }),

    user: Joi.object({
        name: Joi.string().required().min(3).max(100),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(6)
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    wishList: Joi.object({
        items: Joi.array().items(Joi.string()).min(1).required()
    })
};

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(err => ({
                field: err.path[0],
                message: err.message
            }));
            return res.status(400).json({ errors });
        }
        
        next();
    };
};

module.exports = { validate, schemas }; 