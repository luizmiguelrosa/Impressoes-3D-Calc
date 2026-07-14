import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from './types';

// Expor APIs seguras via ContextBridge
const electronAPI: IElectronAPI = {
  ipc: {
    invoke: (channel: string, ...args: any[]) =>
      ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (...args: any[]) => void) => {
      const subscription = (_event: any, ...args: any[]) => listener(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, listener);
    },
  },
  config: {
    getConfig: () => ipcRenderer.invoke('config:get'),
    addFilament: (filament) => ipcRenderer.invoke('config:addFilament', filament),
    updateFilament: (id, filament) =>
      ipcRenderer.invoke('config:updateFilament', id, filament),
    deleteFilament: (id) => ipcRenderer.invoke('config:deleteFilament', id),
    updateSettings: (settings) =>
      ipcRenderer.invoke('config:updateSettings', settings),
  },
  calculator: {
    calculatePrice: (input) =>
      ipcRenderer.invoke('calculator:calculate', input),
  },
  history: {
    getHistory: () => ipcRenderer.invoke('history:get'),
    addToHistory: (item) => ipcRenderer.invoke('history:add', item),
    removeFromHistory: (id) => ipcRenderer.invoke('history:remove', id),
    clearHistory: () => ipcRenderer.invoke('history:clear'),
    getHistoryTotal: () => ipcRenderer.invoke('history:getTotal'),
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
