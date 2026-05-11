import Store from 'electron-store';
import { Config, Settings, Filament } from '../types';

const defaultConfig: Config = {
  settings: {
    kwhPrice: 1.03,
    printerWattage: 350,
    printerCost: 1386.0,
    printerLifespanH: 8000,
    defaultProfitMargin: 2.0,
    setupFee: 5.0,
  },
  filaments: [
    {
      id: '1',
      name: 'PLA Basic Branco',
      pricePerKg: 92.0,
      riskFactor: 0.1,
    },
  ],
};

class ConfigManager {
  private store: Store<Config>;

  constructor() {
    this.store = new Store<Config>({
      name: 'config',
      defaults: defaultConfig,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    });
  }

  getConfig(): Config {
    return this.store.store;
  }

  updateSettings(settings: Partial<Settings>): void {
    const current = this.store.get('settings');
    this.store.set('settings', {
      ...current,
      ...settings,
    });
  }

  updateFilaments(filaments: Filament[]): void {
    this.store.set('filaments', filaments);
  }

  getFilament(id: string): Filament | undefined {
    const filaments = this.store.get('filaments');
    return filaments.find((f) => f.id === id);
  }

  addFilament(filament: Filament): void {
    const filaments = this.store.get('filaments');
    this.store.set('filaments', [...filaments, filament]);
  }

  updateFilament(id: string, updates: Partial<Filament>): void {
    const filaments = this.store.get('filaments');
    const index = filaments.findIndex((f) => f.id === id);
    if (index !== -1) {
      filaments[index] = { ...filaments[index], ...updates };
      this.store.set('filaments', filaments);
    }
  }

  deleteFilament(id: string): void {
    const filaments = this.store.get('filaments');
    this.store.set(
      'filaments',
      filaments.filter((f) => f.id !== id)
    );
  }

  reset(): void {
    this.store.clear();
    this.store.store = defaultConfig;
  }
}

export default new ConfigManager();
