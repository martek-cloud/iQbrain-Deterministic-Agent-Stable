import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat';
import { healthRouter } from './routes/health';
import { modelsRouter } from './routes/models';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:80'] }));
app.use(express.json());

app.use('/api/chat', chatRouter);
app.use('/api/health', healthRouter);
app.use('/api/models', modelsRouter);

app.listen(PORT, () => {
  console.log(`[server] IQBrain API listening on http://localhost:${PORT}`);
});

export { app };
