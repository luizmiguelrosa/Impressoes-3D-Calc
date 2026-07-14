// Validações de entrada
export interface ValidationError {
  field: string;
  message: string;
}

export const validateFilament = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Nome é obrigatório' });
  } else if (data.name.length < 2) {
    errors.push({ field: 'name', message: 'Nome deve ter no mínimo 2 caracteres' });
  }

  if (!data.pricePerKg || data.pricePerKg <= 0) {
    errors.push({ field: 'pricePerKg', message: 'Preço por kg deve ser maior que 0' });
  }

  if (data.riskFactor !== undefined) {
    if (data.riskFactor < 0 || data.riskFactor > 1) {
      errors.push({
        field: 'riskFactor',
        message: 'Fator de risco deve estar entre 0 e 1',
      });
    }
  }

  if (data.averageFinishingPercentage !== undefined) {
    if (data.averageFinishingPercentage < 0 || data.averageFinishingPercentage > 1) {
      errors.push({
        field: 'averageFinishingPercentage',
        message: 'Média de acabamento deve estar entre 0 e 1',
      });
    }
  }

  if (data.density !== undefined && data.density < 0) {
    errors.push({ field: 'density', message: 'Densidade não pode ser negativa' });
  }

  return errors;
};

export const validateSettings = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.printerWattage || data.printerWattage <= 0) {
    errors.push({ field: 'printerWattage', message: 'Consumo deve ser maior que 0' });
  }

  if (!data.kwhPrice || data.kwhPrice <= 0) {
    errors.push({ field: 'kwhPrice', message: 'Preço kWh deve ser maior que 0' });
  }

  if (!data.printerCost || data.printerCost < 0) {
    errors.push({ field: 'printerCost', message: 'Valor da máquina deve ser maior que 0' });
  }

  if (!data.printerLifespanH || data.printerLifespanH <= 0) {
    errors.push({ field: 'printerLifespanH', message: 'Vida útil deve ser maior que 0' });
  }

  if (!data.defaultProfitMargin || data.defaultProfitMargin < 1) {
    errors.push({
      field: 'defaultProfitMargin',
      message: 'Multiplicador de lucro deve ser no mínimo 1.0x',
    });
  }

  if (data.setupFee < 0) {
    errors.push({ field: 'setupFee', message: 'Taxa de setup não pode ser negativa' });
  }

  if (data.roiMonths !== undefined && data.roiMonths < 0) {
    errors.push({ field: 'roiMonths', message: 'Tempo de ROI não pode ser negativo' });
  }

  return errors;
};

export const validateCalculationInput = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.filamentId) {
    errors.push({ field: 'filamentId', message: 'Selecione um filamento' });
  }

  if (!data.weightG || data.weightG <= 0) {
    errors.push({ field: 'weightG', message: 'Peso deve ser maior que 0' });
  }

  if (!data.timeHours || data.timeHours <= 0) {
    errors.push({ field: 'timeHours', message: 'Tempo deve ser maior que 0' });
  }

  if (!data.quantity || data.quantity < 1) {
    errors.push({ field: 'quantity', message: 'Quantidade deve ser no mínimo 1' });
  }

  return errors;
};

// Error Handler Service
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleAsyncError = async (fn: () => Promise<any>) => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[ERROR]', message, error);
    throw new AppError('UNKNOWN_ERROR', message, error);
  }
};

export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro desconhecido. Tente novamente.';
};
