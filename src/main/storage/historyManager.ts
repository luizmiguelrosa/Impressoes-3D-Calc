import Store from 'electron-store';

export interface CalculationItem {
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

interface HistoryStore {
  history: CalculationItem[];
}

class HistoryManager {
  private store: Store<HistoryStore>;

  constructor() {
    this.store = new Store<HistoryStore>({
      name: 'history',
      defaults: {
        history: [],
      },
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    });
  }

  getHistory(): CalculationItem[] {
    return this.store.get('history');
  }

  addToHistory(item: CalculationItem): void {
    const history = this.store.get('history');
    this.store.set('history', [...history, item]);
  }

  removeFromHistory(id: string): void {
    const history = this.store.get('history');
    this.store.set(
      'history',
      history.filter((item) => item.id !== id)
    );
  }

  clearHistory(): void {
    this.store.set('history', []);
  }

  getHistoryTotal(): number {
    const history = this.store.get('history');
    return history.reduce((sum, item) => sum + item.finalPrice, 0);
  }
}

export default new HistoryManager();
