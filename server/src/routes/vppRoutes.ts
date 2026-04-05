import { Router } from 'express';
import { vppController } from '../controllers/vppController.js';
import { get } from 'http';

const VPP_FLASK_URL = 'http://localhost:3003';

function proxyToFlask(targetPath: string, req: any, res: any) {
  const url = `${VPP_FLASK_URL}${targetPath}`;
  const options = {
    headers: { 'Accept': 'application/json' },
    timeout: 5000,
  };
  get(url, options, (flaskRes) => {
    let data = '';
    flaskRes.on('data', chunk => data += chunk);
    flaskRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch {
        res.json({ success: false, message: 'Invalid response from VPP market service' });
      }
    });
  }).on('error', () => {
    res.status(503).json({ success: false, message: 'VPP market service unavailable (port 3003)' });
  });
}

export const vppRoutes = Router();

vppRoutes.get('/overview', vppController.getOverview);
vppRoutes.get('/resources', vppController.getResources);
vppRoutes.post('/resources', vppController.registerResource);
vppRoutes.delete('/resources/:id', vppController.removeResource);
vppRoutes.post('/dispatch', vppController.createDispatch);
vppRoutes.get('/dispatch/orders', vppController.getOrders);

// ─── VPP Market Proxy (Flask on port 3003) ────────────────────────────────────
vppRoutes.get('/market/status', (req, res) => proxyToFlask('/api/vpp/market/status', req, res));
vppRoutes.get('/report/daily', (req, res) => proxyToFlask('/api/vpp/report/daily', req, res));
vppRoutes.post('/bid', (req, res) => proxyToFlask('/api/vpp/bid', req, res));
vppRoutes.post('/agc/dispatch', (req, res) => proxyToFlask('/api/vpp/agc/dispatch', req, res));
