export interface PowerStation {
  id: string;
  name: string;
  type: 'solar' | 'storage' | 'solar_storage';
  capacity: number;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  installedCapacity: number;
  peakPower: number;
  gridConnectionDate: string;
  owner: string;
  contact: string;
}

export interface MonitoringData {
  stationId: string;
  timestamp: string;
  pvPower: number;
  pvEnergy: number;
  batteryPower: number;
  batterySoc: number;
  batteryEnergy: number;
  gridPower: number;
  loadPower: number;
  gridEnergy: number;
  loadEnergy: number;
  efficiency: number;
  temperature: number;
}

export interface Alert {
  id: string;
  stationId: string;
  type: 'fault' | 'warning' | 'info';
  level: 'critical' | 'major' | 'minor';
  code: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface OperationLog {
  id: string;
  stationId: string;
  operator: string;
  action: string;
  beforeValue?: string;
  afterValue?: string;
  timestamp: string;
  result: 'success' | 'failed';
}

export interface TradeOrder {
  id: string;
  stationId: string;
  type: 'buy' | 'sell';
  power: number;
  price: number;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  timestamp: string;
  matchedOrders?: string[];
}

export interface ElectricityPrice {
  id: string;
  timestamp: string;
  peakPrice: number;
  valleyPrice: number;
  flatPrice: number;
  region: string;
}

export interface StationTrade {
  id: string;
  stationId: string;
  tradeType: 'capacity_auction' | 'ancillary_service' | 'capacity_contract';
  capacity: number;
  price: number;
  totalAmount: number;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  buyer?: string;
  seller?: string;
}
