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
};

contextBridge.exposeInMainWorld('electron', electronAPI);
