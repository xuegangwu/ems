import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const stationService = {
  getList: () => apiClient.get('/stations'),
  getById: (id: string) => apiClient.get(`/stations/${id}`),
  create: (data: any) => apiClient.post('/stations', data),
  update: (id: string, data: any) => apiClient.put(`/stations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/stations/${id}`),
};

export const monitoringService = {
  getRealTimeData: (stationId: string) => apiClient.get(`/monitoring/${stationId}/realtime`),
  getHistoricalData: (stationId: string, params: any) => apiClient.get(`/monitoring/${stationId}/history`, { params }),
};

export const tradeService = {
  getOrders: (params?: any) => apiClient.get('/trades/orders', { params }),
  createOrder: (data: any) => apiClient.post('/trades/orders', data),
  cancelOrder: (orderId: string) => apiClient.delete(`/trades/orders/${orderId}`),
  getPrices: () => apiClient.get('/trades/prices'),
};

export const alertService = {
  getList: (params?: any) => apiClient.get('/alerts', { params }),
  acknowledge: (alertId: string) => apiClient.post(`/alerts/${alertId}/acknowledge`),
  acknowledgeBatch: (alertIds: string[]) => apiClient.post('/alerts/acknowledge-batch', { alertIds }),
  delete: (alertId: string) => apiClient.delete(`/alerts/${alertId}`),
};

export default apiClient;
