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

// VPP - Virtual Power Plant types
export type ResourceType = 'battery' | 'ev_charger' | 'heat_pump' | 'flexible_load';
export type ResourceStatus = 'online' | 'offline' | 'dispatching' | 'standby';

export interface DistributedResource {
  id: string;
  name: string;
  type: ResourceType;
  capacity: number; // kW
  currentPower: number; // kW
  status: ResourceStatus;
  stationId: string;
  location: string;
  dispatchable: boolean;
  responseTime: number; // seconds
}

export interface VPP聚合 {
  id: string;
  name: string;
  totalCapacity: number; // kW
  availableCapacity: number; // kW
  dispatchingCapacity: number; // kW
  resourceCount: number;
  regions: string[];
  status: 'active' | 'inactive' | 'dispatching';
}

export interface DispatchOrder {
  id: string;
  vppId: string;
  direction: 'charge' | 'discharge';
  power: number; // kW
  duration: number; // minutes
  reason: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: string;
}

export interface ElectricityPrice {
  id: string;
  timestamp: string;
  peakPrice: number;
  valleyPrice: number;
  flatPrice: number;
  region: string;
  // Real-time fields
  currentPrice?: number;
  priceTrend?: 'rising' | 'falling' | 'stable';
  nextPeakTime?: string;
  nextValleyTime?: string;
  arbitrageSuggestion?: string;
}

// Price prediction
export interface PricePrediction {
  timestamp: string;
  predictedPrice: number;
  confidence: number; // 0-1
  reason: string;
}
