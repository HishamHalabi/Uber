import joi from "joi";
import { BadRequest } from "../Utils/error.utils.js";

export const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            const messages = error.details.map(err => err.message);
            return next(new BadRequest(messages.join(", ")));
        }
        next();
    };
};

export const schemas = {
    SignUpUser: joi.object({
        name: joi.string().min(3).max(50).required(),
        email: joi.string().email().required(),
        password: joi.string().min(8).max(30).required(),
        phoneNumber: joi.string().pattern(/^[0-9]{10,15}$/).required(),
        role: joi.string().valid('user').required()
    }),

    SignUpDriver: joi.object({
        name: joi.string().min(3).max(50).required(),
        email: joi.string().email().required(),
        password: joi.string().min(8).max(30).required(),
        phoneNumber: joi.string().pattern(/^[0-9]{10,15}$/).required(),
        role: joi.string().valid('driver').required(),
        NationalId: joi.string().length(14).required(),
        carNo: joi.string().min(2).max(10).required()
    }),

    SignIn: joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    }),

    VerifyEmail: joi.object({
        email: joi.string().email().required(),
        otp: joi.string().length(9).required()
    }),

    SendOtp: joi.object({
        email: joi.string().email().required()
    }),

    UpdateData: joi.object({
        name: joi.string().min(3).max(50),
        phoneNumber: joi.string().pattern(/^[0-9]{10,15}$/)
    }).min(1),

    AddFeedback: joi.object({
        trip_id: joi.number().integer().positive().required(),
        uContent: joi.string().max(500).allow(""),
        dContent: joi.string().max(500).allow(""),
        uRating: joi.number().integer().min(1).max(5),
        dRating: joi.number().integer().min(1).max(5)
    }).or('uRating', 'dRating')
};

export const validateSocket = (schema, handler) => {
    return async (...args) => {
        const callback = args[args.length - 1];
        const { error } = schema.validate(args.slice(0, -1), { abortEarly: false, stripUnknown: true });

        if (error) {
            const messages = error.details.map(err => err.message).join(", ");
            if (typeof callback === 'function') {
                return callback({ success: false, err: messages });
            }
            return;
        }

        return await handler(...args);
    };
};

export const socketSchemas = {
    findADriver: joi.array().ordered(
        joi.number().min(-90).max(90).required(),
        joi.number().min(-180).max(180).required(),
        joi.number().min(-90).max(90).required(),
        joi.number().min(-180).max(180).required(),
        joi.number().integer().min(1).max(10).optional(),
        joi.string().required()
    ),
    acceptRide: joi.array().ordered(
        joi.number().integer().required(),
        joi.number().min(-90).max(90).required(),
        joi.number().min(-180).max(180).required(),
        joi.number().min(-90).max(90).required(),
        joi.number().min(-180).max(180).required(),
        joi.number().required(),
        joi.string().required()
    ),
    updateLocation: joi.array().ordered(
        joi.array().items(joi.object({
            lat: joi.number().min(-90).max(90).required(),
            lng: joi.number().min(-180).max(180).required()
        })).min(1).required(),
        joi.number().integer().allow(null).optional().label("Trip ID")
    ),
    updateTripStatus: joi.array().ordered(
        joi.number().integer().required(),
        joi.string().required()
    ),
    getPayment: joi.array().ordered(
        joi.number().integer().required()
    ),
    retryPayment: joi.array().ordered(
        joi.number().integer().required(),
        joi.string().required()
    ),
    cancel: joi.array().ordered(
        joi.number().integer().required(),
        joi.string().required(),
        joi.number().valid(0, 1).optional()
    )
};
