import { HttpError } from '../utils/httpError.js';
export function validate(schema) {
    return (req, res, next) => {
        const rawBody = req.body ?? {};
        console.log(rawBody);
        const result = schema.safeParse(rawBody);
        if (result.success) {
            req.body = result.data;
            return next();
        }

        next(new HttpError(400, result.error.issues[0].message));
    };
}

