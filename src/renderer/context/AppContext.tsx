import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CalculationHistoryItem } from '../../main/types';

export type CalculationItem = CalculationHistoryItem;

export interface AppContextType {
  // Histórico de Cálculos
  history: CalculationItem[];
  addToHistory: (item: Omit<CalculationItem, 'id' | 'timestamp'>) => Promise<void>;
  removeFromHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
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

  // Carregar histórico ao iniciar
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await window.electron.history.getHistory();
        setHistory(savedHistory);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    };
    loadHistory();
  }, []);

  const addToHistory = useCallback(
    async (item: Omit<CalculationItem, 'id' | 'timestamp'>) => {
      const newItem: CalculationItem = {
        ...item,
        id: `calc_${Date.now()}`,
        timestamp: Date.now(),
      };
      
      try {
        await window.electron.history.addToHistory(newItem);
        setHistory((prev) => [...prev, newItem]);
      } catch (error) {
        console.error('Erro ao adicionar ao histórico:', error);
        throw error;
      }
    },
    []
  );

  const removeFromHistory = useCallback(async (id: string) => {
    try {
      await window.electron.history.removeFromHistory(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Erro ao remover do histórico:', error);
      throw error;
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await window.electron.history.clearHistory();
      setHistory([]);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      throw error;
    }
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
