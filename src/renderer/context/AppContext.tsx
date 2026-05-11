import React, { createContext, useContext, useState, useCallback } from 'react';

export interface CalculationItem {
  id: string;
  filamentId: string;
  filamentName: string;
  weightG: number;
  timeHours: number;
  quantity: number;
  unitPrice: number;
  finalPrice: number;
  timestamp: number;
}

export interface AppContextType {
  // Histórico de Cálculos
  history: CalculationItem[];
  addToHistory: (item: Omit<CalculationItem, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  getHistoryTotal: () => number;

  // UI State
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Notificações
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<CalculationItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const addToHistory = useCallback(
    (item: Omit<CalculationItem, 'id' | 'timestamp'>) => {
      const newItem: CalculationItem = {
        ...item,
        id: `calc_${Date.now()}`,
        timestamp: Date.now(),
      };
      setHistory((prev) => [...prev, newItem]);
    },
    []
  );

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistoryTotal = useCallback(() => {
    return history.reduce((sum, item) => sum + item.finalPrice, 0);
  }, [history]);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpen(open);
  }, []);

  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
      console.log(`[${type.toUpperCase()}] ${message}`);
    },
    []
  );

  const value: AppContextType = {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryTotal,
    isSidebarOpen,
    setSidebarOpen,
    showNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};
