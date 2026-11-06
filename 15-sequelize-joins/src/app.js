import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';
export const app = express();
app.use(helmet());
app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);