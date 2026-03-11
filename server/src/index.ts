import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat';
import { healthRouter } from './routes/health';
import { modelsRouter } from './routes/models';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { requireAuth } from './auth/middleware';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'] }));
app.use(express.json());

// Public routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/chat', requireAuth, chatRouter);
app.use('/api/models', requireAuth, modelsRouter);
app.use('/api/admin', adminRouter); // requireAuth applied inside the router

app.listen(PORT, () => {
  console.log(`[server] IQBrain API listening on http://localhost:${PORT}`);
});

export { app };
