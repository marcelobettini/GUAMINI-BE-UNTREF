import express from 'express';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';
export const app = express();
app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);