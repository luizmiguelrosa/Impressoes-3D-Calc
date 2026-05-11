declare global {
  interface Window {
    electron: {
      config: {
        getConfig: () => Promise<any>;
        addFilament: (filament: any) => Promise<void>;
        updateFilament: (id: string, filament: any) => Promise<void>;
        deleteFilament: (id: string) => Promise<void>;
        updateSettings: (settings: any) => Promise<void>;
      };
      calculator: {
        calculatePrice: (input: any) => any;
      };
      ipc: {
        send: (channel: string, data?: any) => void;
        on: (channel: string, callback: (data: any) => void) => void;
      };
    };
  }
}

export {};
