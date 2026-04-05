import { Router } from 'express';
import { get, request } from 'http';
import { vppController } from '../controllers/vppController.js';

const VPP_FLASK_URL = 'http://localhost:3003';

function proxyToFlask(targetPath: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', req?: any, res?: any) {
  const url = `${VPP_FLASK_URL}${targetPath}`;
  const options: any = {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    timeout: 8000,
    method,
  };

  const proxyReq = get(url, options, (flaskRes: any) => {
    let data = '';
    flaskRes.on('data', (chunk: any) => data += chunk);
    flaskRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        res?.json(json);
      } catch {
        res?.status(502).json({ success: false, message: 'Invalid response from VPP market service' });
      }
    });
  }).on('error', () => {
    res?.status(503).json({ success: false, message: 'VPP market service unavailable (port 3003)' });
  });

  if (method === 'POST' && req?.body) {
    proxyReq.write(JSON.stringify(req.body));
  }
  proxyReq.end();
}

function proxyPostToFlask(targetPath: string, req: any, res: any) {
  const url = `${VPP_FLASK_URL}${targetPath}`;
  const body = JSON.stringify(req.body);
  const options: any = {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    timeout: 8000,
    method: 'POST',
  };

  const proxyReq = request(url, options, (flaskRes: any) => {
    let data = '';
    flaskRes.on('data', (chunk: any) => data += chunk);
    flaskRes.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch {
        res.status(502).json({ success: false });
      }
    });
  }).on('error', () => {
    res.status(503).json({ success: false, message: 'VPP market service unavailable' });
  });
  proxyReq.write(body);
  proxyReq.end();
}

export const vppRoutes = Router();

// ─── VPP Market Proxy (Flask on port 3003) ────────────────────────────────────
vppRoutes.get('/market/status', (req, res) => proxyToFlask('/api/vpp/market/status'));
vppRoutes.post('/bid', (req, res) => proxyPostToFlask('/api/vpp/bid', req, res));
vppRoutes.get('/report/daily', (req, res) => proxyToFlask('/api/vpp/report/daily'));
vppRoutes.post('/agc/dispatch', (req, res) => proxyPostToFlask('/api/vpp/agc/dispatch', req, res));

// ─── Resource Management (Flask) ────────────────────────────────────────────────
vppRoutes.get('/resources', (req, res) => proxyToFlask('/api/vpp/resources'));
vppRoutes.post('/resources', (req, res) => proxyPostToFlask('/api/vpp/resources', req, res));
vppRoutes.delete('/resources/:station_id', (req, res) => {
  const stationId = encodeURIComponent(req.params.station_id);
  const url = `${VPP_FLASK_URL}/api/vpp/resources/${stationId}`;
  const options: any = { headers: { 'Accept': 'application/json' }, timeout: 5000, method: 'DELETE' };
  request(url, options, (flaskRes: any) => {
    let data = '';
    flaskRes.on('data', (c: any) => data += c);
    flaskRes.on('end', () => { try { res.json(JSON.parse(data)); } catch { res.json({ success: true }); } });
  }).on('error', () => res.status(503).json({ success: false })).end();
});

// ─── Dispatch Execution (Flask) ────────────────────────────────────────────────
vppRoutes.post('/dispatch/execute', (req, res) => proxyPostToFlask('/api/vpp/dispatch/execute', req, res));
vppRoutes.get('/dispatch/status', (req, res) => proxyToFlask('/api/vpp/dispatch/status'));

// ─── Legacy local endpoints (kept for compatibility) ───────────────────────────
vppRoutes.get('/overview', vppController.getOverview);
vppRoutes.get('/dispatch/orders', vppController.getOrders);
