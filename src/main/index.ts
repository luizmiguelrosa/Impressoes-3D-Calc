import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
  IpcMainInvokeEvent,
} from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import configManager from './storage/configManager';
import historyManager from './storage/historyManager';
import costCalculator from './calculator/costCalculator';
import { CalculationInput, Filament } from './types';
import type { CalculationItem } from './storage/historyManager';

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Carregar app
  const devPort = process.env.DEV_PORT || 3000;
  const startUrl = isDev
    ? `http://localhost:${devPort}`
    : `file://${path.join(__dirname, '../renderer/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// IPC Handlers - Config
ipcMain.handle('config:get', () => {
  try {
    return configManager.getConfig();
  } catch (error) {
    console.error('[IPC ERROR] config:get', error);
    throw new Error('Falha ao carregar configurações');
  }
});

ipcMain.handle('config:updateSettings', (_event: IpcMainInvokeEvent, settings) => {
  try {
    if (!settings) {
      throw new Error('Configurações são obrigatórias');
    }
    configManager.updateSettings(settings);
  } catch (error) {
    console.error('[IPC ERROR] config:updateSettings', error);
    throw new Error(
      `Falha ao atualizar configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
});

ipcMain.handle(
  'config:updateFilaments',
  (_event: IpcMainInvokeEvent, filaments) => {
    try {
      if (!Array.isArray(filaments)) {
        throw new Error('Filamentos devem ser um array');
      }
      configManager.updateFilaments(filaments);
    } catch (error) {
      console.error('[IPC ERROR] config:updateFilaments', error);
      throw new Error(
        `Falha ao atualizar filamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }
);

// IPC Handlers - Calculator
ipcMain.handle(
  'calculator:calculate',
  (_event: IpcMainInvokeEvent, input: CalculationInput) => {
    try {
      if (!input || !input.filamentId) {
        throw new Error('Filamento é obrigatório');
      }

      if (!input.weightG || input.weightG <= 0) {
        throw new Error('Peso deve ser maior que 0');
      }

      if (!input.timeHours || input.timeHours <= 0) {
        throw new Error('Tempo deve ser maior que 0');
      }

      if (!input.quantity || input.quantity < 1) {
        throw new Error('Quantidade deve ser no mínimo 1');
      }

      const config = configManager.getConfig();
      const filament = config.filaments.find((f) => f.id === input.filamentId);

      if (!filament) {
        throw new Error('Filamento não encontrado');
      }

      const result = costCalculator.calculate(
        input,
        filament,
        config.settings
      );
      return result;
    } catch (error) {
      console.error('[IPC ERROR] calculator:calculate', error);
      throw new Error(
        `Erro ao calcular: ${error instanceof Error ? error.message : 'Desconhecido'}`
      );
    }
  }
);

// IPC Handlers - Config (CRUD de filamentos)
ipcMain.handle(
  'config:addFilament',
  (_event: IpcMainInvokeEvent, filament: Filament) => {
    try {
      if (!filament) {
        throw new Error('Filamento é obrigatório');
      }

      if (!filament.name || filament.name.trim() === '') {
        throw new Error('Nome do filamento é obrigatório');
      }

      if (!filament.pricePerKg || filament.pricePerKg <= 0) {
        throw new Error('Preço por kg deve ser maior que 0');
      }

      configManager.addFilament(filament);
    } catch (error) {
      console.error('[IPC ERROR] config:addFilament', error);
      throw new Error(
        `Falha ao adicionar filamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }
);

ipcMain.handle(
  'config:updateFilament',
  (_event: IpcMainInvokeEvent, id: string, filament: Filament) => {
    try {
      if (!id) {
        throw new Error('ID do filamento é obrigatório');
      }

      if (!filament) {
        throw new Error('Filamento é obrigatório');
      }

      if (!filament.name || filament.name.trim() === '') {
        throw new Error('Nome do filamento é obrigatório');
      }

      if (!filament.pricePerKg || filament.pricePerKg <= 0) {
        throw new Error('Preço por kg deve ser maior que 0');
      }

      configManager.updateFilament(id, filament);
    } catch (error) {
      console.error('[IPC ERROR] config:updateFilament', error);
      throw new Error(
        `Falha ao atualizar filamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }
);

ipcMain.handle(
  'config:deleteFilament',
  (_event: IpcMainInvokeEvent, id: string) => {
    try {
      if (!id) {
        throw new Error('ID do filamento é obrigatório');
      }
      configManager.deleteFilament(id);
    } catch (error) {
      console.error('[IPC ERROR] config:deleteFilament', error);
      throw new Error(
        `Falha ao deletar filamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }
);

// IPC Handlers - History
ipcMain.handle('history:get', () => {
  try {
    return historyManager.getHistory();
  } catch (error) {
    console.error('[IPC ERROR] history:get', error);
    throw new Error('Falha ao carregar histórico');
  }
});

ipcMain.handle(
  'history:add',
  (_event: IpcMainInvokeEvent, item: CalculationItem) => {
    try {
      if (!item) {
        throw new Error('Item é obrigatório');
      }
      historyManager.addToHistory(item);
    } catch (error) {
      console.error('[IPC ERROR] history:add', error);
      throw new Error(
        `Falha ao adicionar ao histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }
);

ipcMain.handle('history:remove', (_event: IpcMainInvokeEvent, id: string) => {
  try {
    if (!id) {
      throw new Error('ID é obrigatório');
    }
    historyManager.removeFromHistory(id);
  } catch (error) {
    console.error('[IPC ERROR] history:remove', error);
    throw new Error(
      `Falha ao remover do histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
});

ipcMain.handle('history:clear', () => {
  try {
    historyManager.clearHistory();
  } catch (error) {
    console.error('[IPC ERROR] history:clear', error);
    throw new Error('Falha ao limpar histórico');
  }
});

ipcMain.handle('history:getTotal', () => {
  try {
    return historyManager.getHistoryTotal();
  } catch (error) {
    console.error('[IPC ERROR] history:getTotal', error);
    throw new Error('Falha ao calcular total do histórico');
  }
});

// Menu
const createMenu = (): void => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Sair',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Desfazer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Refazer', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Colar', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// App events
app.on('ready', () => {
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

export default app;
