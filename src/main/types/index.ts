// Tipos compartilhados entre main e renderer

export interface Settings {
  kwhPrice: number;
  printerWattage: number;
  printerCost: number;
  printerLifespanH: number;
  defaultProfitMargin: number;
  setupFee: number;
  roiMonths: number;
}

export interface Filament {
  id: string;
  name: string;
  pricePerKg: number;
  riskFactor: number;
  averageFinishingPercentage: number;
  density?: number;
}

export interface Config {
  settings: Settings;
  filaments: Filament[];
}

export interface CalculationInput {
  filamentId: string;
  weightG: number;
  timeHours: number;
  quantity: number;
  profitMarginMultiplier?: number;
  needsFinishing?: boolean;
}

export interface CalculationResult {
  materialCost: number;
  energyCost: number;
  depreciationCost: number;
  roiCost: number;
  finishingCost: number;
  totalCost: number;
  unitPrice: number;
  finalPrice: number;
  discountApplied: number;
  discountPercentage: number;
}

export interface DiscountRule {
  minQuantity: number;
  discountPercentage: number;
}

export interface IElectronAPI {
  ipc: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    on: (channel: string, listener: (...args: any[]) => void) => void;
    removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  };
  config: {
    getConfig: () => Promise<Config>;
    addFilament: (filament: Filament) => Promise<void>;
    updateFilament: (id: string, filament: Filament) => Promise<void>;
    deleteFilament: (id: string) => Promise<void>;
    updateSettings: (settings: Partial<Settings>) => Promise<void>;
  };
  calculator: {
    calculatePrice: (input: CalculationInput) => Promise<CalculationResult>;
  };
  history: {
    getHistory: () => Promise<CalculationHistoryItem[]>;
    addToHistory: (item: CalculationHistoryItem) => Promise<void>;
    removeFromHistory: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    getHistoryTotal: () => Promise<number>;
  };
}

export interface CalculationHistoryItem {
  id: string;
  filamentId: string;
  filamentName: string;
  weightG: number;
  timeHours: number;
  quantity: number;
  unitPrice: number;
  finalPrice: number;
  materialCost: number;
  energyCost: number;
  depreciationCost: number;
  roiCost: number;
  finishingCost: number;
  totalCost: number;
  timestamp: number;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
