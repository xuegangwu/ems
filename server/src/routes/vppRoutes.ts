import { Router, Request, Response } from 'express';
import http from 'http';
import { vppController } from '../controllers/vppController.js';

const VPP_FLASK_URL = 'http://localhost:3003';

function flaskProxy(req: Request, res: Response, targetPath: string, method: 'GET' | 'POST' | 'DELETE' = 'GET') {
  const url = `${VPP_FLASK_URL}${targetPath}`;
  const body = method === 'POST' ? JSON.stringify(req.body) : undefined;
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (body) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = String(Buffer.byteLength(body));
  }

  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port: 3003,
    path: targetPath,
    method,
    headers,
    timeout: 8000,
  };

  const proxyReq = http.request(options, (flaskRes: http.IncomingMessage) => {
    let data = '';
    flaskRes.on('data', chunk => { data += chunk; });
    flaskRes.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch {
        res.status(502).json({ success: false, message: 'Invalid response from VPP market service' });
      }
    });
  });

  proxyReq.on('error', () => {
    res.status(503).json({ success: false, message: 'VPP market service unavailable (port 3003)' });
  });
  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.status(504).json({ success: false, message: 'VPP market service timeout' });
  });

  if (body) proxyReq.write(body);
  proxyReq.end();
}

export const vppRoutes = Router();

// ─── VPP Market Proxy (Flask on port 3003) ────────────────────────────────────
vppRoutes.get('/market/status', (req, res) => flaskProxy(req, res, '/api/vpp/market/status'));
vppRoutes.get('/report/daily', (req, res) => flaskProxy(req, res, '/api/vpp/report/daily'));
vppRoutes.post('/bid', (req, res) => flaskProxy(req, res, '/api/vpp/bid', 'POST'));
vppRoutes.post('/agc/dispatch', (req, res) => flaskProxy(req, res, '/api/vpp/agc/dispatch', 'POST'));

// ─── Resource Management (Flask) ────────────────────────────────────────────────
vppRoutes.get('/resources', (req, res) => flaskProxy(req, res, '/api/vpp/resources'));
vppRoutes.post('/resources', (req, res) => flaskProxy(req, res, '/api/vpp/resources', 'POST'));
vppRoutes.delete('/resources/:station_id', (req, res) => {
  flaskProxy(req, res, `/api/vpp/resources/${encodeURIComponent(req.params.station_id)}`, 'DELETE');
});

// ─── Dispatch Execution (Flask) ────────────────────────────────────────────────
vppRoutes.post('/dispatch/execute', (req, res) => flaskProxy(req, res, '/api/vpp/dispatch/execute', 'POST'));
vppRoutes.get('/dispatch/status', (req, res) => flaskProxy(req, res, '/api/vpp/dispatch/status'));

// ─── Legacy local endpoints (kept for compatibility) ───────────────────────────
vppRoutes.get('/overview', vppController.getOverview);
vppRoutes.get('/dispatch/orders', vppController.getOrders);
