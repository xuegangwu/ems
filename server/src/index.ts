import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { stationRoutes } from './routes/stationRoutes.js';
import { monitoringRoutes } from './routes/monitoringRoutes.js';
import { tradeRoutes } from './routes/tradeRoutes.js';
import { alertRoutes } from './routes/alertRoutes.js';
import { authRoutes } from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/api/stations', stationRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`EMS Server running on port ${PORT}`);
});

export default app;
