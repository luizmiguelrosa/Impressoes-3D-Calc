// Tipos compartilhados entre main e renderer

export interface Settings {
  kwhPrice: number;
  printerWattage: number;
  printerCost: number;
  printerLifespanH: number;
  defaultProfitMargin: number;
  setupFee: number;
}

export interface Filament {
  id: string;
  name: string;
  pricePerKg: number;
  riskFactor: number;
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
}

export interface CalculationResult {
  materialCost: number;
  energyCost: number;
  depreciationCost: number;
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
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
