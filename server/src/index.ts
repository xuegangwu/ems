import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { stationRoutes } from './routes/stationRoutes.js';
import { monitoringRoutes } from './routes/monitoringRoutes.js';
import { tradeRoutes } from './routes/tradeRoutes.js';
import { alertRoutes } from './routes/alertRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { electricityRoutes } from './routes/electricityRoutes.js';
import { vppRoutes } from './routes/vppRoutes.js';
import { predictRoutes } from './routes/predictRoutes.js';
import { scheduleRoutes } from './routes/scheduleRoutes.js';
import { tradingRoutes } from './routes/tradingRoutes.js';
import { historyRoutes } from './routes/historyRoutes.js';
import { mqttRoutes } from './routes/mqttRoutes.js';
import { orchestratorRoutes } from './routes/orchestratorRoutes.js';
import { marketRoutes } from './routes/marketRoutes.js';
import { default as storeRoutes } from './routes/storeRoutes.js';
import { realtimeRoutes } from './routes/realtimeRoutes.js';

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
app.use('/api/electricity', electricityRoutes);
app.use('/api/vpp', vppRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/vpp/trading', tradingRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/mqtt', mqttRoutes);
app.use('/api/agents', orchestratorRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/realtime', realtimeRoutes);

// ─── Swagger API Documentation ──────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ripple EnOS API',
      version: '1.0.0',
      description: '## Ripple EnOS — 新能源资产智能管理平台 API\n\n提供分时电价、电站监控、AI调度、VPP交易等接口。\n\n**Base URL**: `https://enos.solaripple.com`',
      contact: { name: 'Solaripple', url: 'https://solaripple.com' },
    },
    servers: [
      { url: 'https://enos.solaripple.com', description: '生产环境' },
      { url: 'http://localhost:8080', description: '本地开发' },
    ],
    tags: [
      { name: '市场数据', description: '分时电价、现货市场、光伏自用分析' },
      { name: '电站管理', description: '电站注册、监控、告警' },
      { name: 'AI调度', description: 'LSTM预测、AI调度、VPP策略' },
      { name: '交易', description: '电力交易、VPP订单' },
    ],
    paths: {
      '/api/market/provinces': {
        get: {
          summary: '支持的省份列表',
          tags: ['市场数据'],
          responses: { 200: { description: '省份列表' } },
        },
      },
      '/api/market/pricing/{province}': {
        get: {
          summary: '获取省份分时电价',
          tags: ['市场数据'],
          parameters: [{
            name: 'province',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['ZJ', 'GD', 'SH'] },
          }],
          responses: { 200: { description: '分时电价数据' } },
        },
      },
      '/api/market/compare': {
        get: {
          summary: '省间电价对比',
          tags: ['市场数据'],
          parameters: [
            { name: 'p1', in: 'query', schema: { type: 'string' } },
            { name: 'p2', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: '对比结果' } },
        },
      },
      '/api/market/solar-overlap': {
        get: {
          summary: '光伏-电价叠加分析',
          tags: ['市场数据'],
          parameters: [{ name: 'province', in: 'query', schema: { type: 'string' } }],
          responses: { 200: { description: '分析结果' } },
        },
      },
      '/api/stations': {
        get: {
          summary: '电站列表',
          tags: ['电站管理'],
          responses: { 200: { description: '电站列表' } },
        },
      },
      '/api/predict/lstm': {
        get: {
          summary: 'LSTM预测（负荷+电价）',
          tags: ['AI调度'],
          responses: { 200: { description: '预测数据' } },
        },
      },
    },
  },
  apis: [],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ripple EnOS API 文档',
  swaggerOptions: { persistAuthorization: true },
}));

// 原始JSON格式的OpenAPI规范
app.get('/openapi.json', (req, res) => {
  res.json(swaggerSpec);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`EMS Server running on port ${PORT}`);
  // Warmup LSTM models on startup so first request isn't delayed
  console.log('[Warmup] Preparing AI models...');
  try {
    const { initModels } = await import('./controllers/predictController.js');
    await initModels();
    console.log('[Warmup] AI models ready');
  } catch (e) {
    console.warn('[Warmup] AI models skipped:', (e as Error).message);
  }
});

export default app;
