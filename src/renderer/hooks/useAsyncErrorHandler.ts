import { useCallback } from 'react';
import { useRef } from 'react';
import { Toast } from 'primereact/toast';
import { formatErrorMessage } from '../utils/validation';

export interface UseAsyncErrorHandlerOptions {
  onSuccess?: (message?: string) => void;
  onError?: (message: string) => void;
  successMessage?: string;
  errorSummary?: string;
}

export const useAsyncErrorHandler = (options: UseAsyncErrorHandlerOptions = {}) => {
  const toastRef = useRef<Toast>(null);

  const execute = useCallback(
    async <T,>(fn: () => Promise<T>, opts?: UseAsyncErrorHandlerOptions) => {
      const finalOpts = { ...options, ...opts };

      try {
        const result = await fn();

        if (finalOpts.successMessage) {
          toastRef.current?.show({
            severity: 'success',
            summary: 'Sucesso',
            detail: finalOpts.successMessage,
            life: 3000,
          });
        }

        finalOpts.onSuccess?.();
        return result;
      } catch (error) {
        const message = formatErrorMessage(error);
        console.error('[ASYNC ERROR]', message, error);

        toastRef.current?.show({
          severity: 'error',
          summary: finalOpts.errorSummary || 'Erro',
          detail: message,
          life: 4000,
        });

        finalOpts.onError?.(message);
        throw error;
      }
    },
    [options]
  );

  return { toastRef, execute };
};
