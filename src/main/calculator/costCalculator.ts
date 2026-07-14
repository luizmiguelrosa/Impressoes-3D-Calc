import { CalculationInput, CalculationResult, Settings, Filament } from '../types';

class CostCalculator {
  /**
   * Calcula o custo de material
   * Custo Material = (PreçoKg / 1000) * PesoPeça
   */
  calculateMaterialCost(pricePerKg: number, weightG: number): number {
    return (pricePerKg / 1000) * weightG;
  }

  /**
   * Calcula o custo de acabamento
   * Custo Acabamento = CustoMaterial * MediaAcabamento%
   */
  calculateFinishingCost(
    materialCost: number,
    finishingPercentage: number,
    needsFinishing: boolean
  ): number {
    if (!needsFinishing) return 0;
    // Garantir que finishingPercentage existe e é válido
    const percentage = finishingPercentage || 0;
    return materialCost * percentage;
  }

  /**
   * Calcula o custo de energia
   * Custo Energia = (ConsumoWatts / 1000) * PreçoKWh * TempoHoras
   */
  calculateEnergyCost(
    consumerWatts: number,
    kwhPrice: number,
    timeHours: number
  ): number {
    return (consumerWatts / 1000) * kwhPrice * timeHours;
  }

  /**
   * Calcula o custo de depreciação
   * Custo Depreciação = (ValorMáquina / VidaUtilHoras) * TempoHoras
   */
  calculateDepreciationCost(
    printerCost: number,
    lifespanH: number,
    timeHours: number
  ): number {
    return (printerCost / lifespanH) * timeHours;
  }

  /**
   * Calcula o custo de ROI (Retorno de Investimento)
   * Custo ROI = (ValorMáquina / (MesesROI * 30 * 8)) * TempoHoras
   * Assumindo 30 dias/mês e 8 horas/dia de trabalho
   */
  calculateRoiCost(
    printerCost: number,
    roiMonths: number,
    timeHours: number
  ): number {
    if (roiMonths <= 0) return 0;
    const hoursPerMonth = 30 * 8; // 30 dias * 8 horas/dia = 240h/mês
    const totalHoursForRoi = roiMonths * hoursPerMonth;
    return (printerCost / totalHoursForRoi) * timeHours;
  }

  /**
   * Calcula o subtotal (soma de todos os custos)
   */
  calculateSubtotal(
    materialCost: number,
    energyCost: number,
    depreciationCost: number,
    roiCost: number,
    finishingCost: number
  ): number {
    return materialCost + energyCost + depreciationCost + roiCost + finishingCost;
  }

  /**
   * Calcula o preço final com margem de lucro
   * Preço Venda = (CustoTotal * MultiplicadorLucro) + TaxaSetup
   */
  calculateSalePrice(
    subtotal: number,
    profitMargin: number,
    setupFee: number
  ): number {
    return subtotal * profitMargin + setupFee;
  }

  /**
   * Calcula o preço da primeira unidade (com setup)
   */
  calculateFirstUnitPrice(
    subtotal: number,
    profitMargin: number,
    setupFee: number
  ): number {
    return this.calculateSalePrice(subtotal, profitMargin, setupFee);
  }

  /**
   * Calcula o preço das unidades adicionais (sem setup)
   */
  calculateAdditionalUnitPrice(
    subtotal: number,
    profitMargin: number
  ): number {
    return subtotal * profitMargin;
  }

  /**
   * Aplica desconto progressivo baseado na quantidade
   */
  applyVolumeDiscount(
    unitPrice: number,
    quantity: number
  ): { discountPercentage: number; discountedPrice: number } {
    // Regras de desconto progressivo
    const discountTiers = [
      { minQty: 100, discount: 0.15 },
      { minQty: 50, discount: 0.1 },
      { minQty: 20, discount: 0.05 },
      { minQty: 1, discount: 0 },
    ];

    let discountPercentage = 0;
    for (const tier of discountTiers) {
      if (quantity >= tier.minQty) {
        discountPercentage = tier.discount;
        break;
      }
    }

    const discountedPrice = unitPrice * (1 - discountPercentage);
    return { discountPercentage, discountedPrice };
  }

  /**
   * Realiza o cálculo completo
   */
  calculate(
    input: CalculationInput,
    filament: Filament,
    settings: Settings
  ): CalculationResult {
    // Custos individuais
    const materialCost = this.calculateMaterialCost(
      filament.pricePerKg,
      input.weightG
    );
    const energyCost = this.calculateEnergyCost(
      settings.printerWattage,
      settings.kwhPrice,
      input.timeHours
    );
    const depreciationCost = this.calculateDepreciationCost(
      settings.printerCost,
      settings.printerLifespanH,
      input.timeHours
    );
    const roiCost = this.calculateRoiCost(
      settings.printerCost,
      settings.roiMonths || 0,
      input.timeHours
    );
    const finishingCost = this.calculateFinishingCost(
      materialCost,
      filament.averageFinishingPercentage || 0,
      input.needsFinishing || false
    );

    // Subtotal
    const subtotal = this.calculateSubtotal(
      materialCost,
      energyCost,
      depreciationCost,
      roiCost,
      finishingCost
    );

    // Usar margem fornecida ou padrão
    const profitMargin = input.profitMarginMultiplier || settings.defaultProfitMargin;

    // Preços por unidade
    const firstUnitPrice = this.calculateFirstUnitPrice(
      subtotal,
      profitMargin,
      settings.setupFee
    );
    const additionalUnitPrice = this.calculateAdditionalUnitPrice(
      subtotal,
      profitMargin
    );

    // Calcular preço médio por unidade
    let unitPrice: number;
    if (input.quantity === 1) {
      unitPrice = firstUnitPrice;
    } else {
      // Média ponderada: primeira + adicionais
      unitPrice =
        (firstUnitPrice + additionalUnitPrice * (input.quantity - 1)) /
        input.quantity;
    }

    // Aplicar desconto progressivo
    const { discountPercentage, discountedPrice } =
      this.applyVolumeDiscount(unitPrice, input.quantity);

    // Total final (custo total * quantidade, sem aplicar a primeira margem ainda)
    const totalCost = subtotal * input.quantity;
    const finalPrice = discountedPrice * input.quantity;

    return {
      materialCost,
      energyCost,
      depreciationCost,
      roiCost,
      finishingCost,
      totalCost: subtotal, // custo unitário
      unitPrice: discountedPrice, // preço unitário após desconto
      finalPrice: finalPrice, // preço final para quantidade total
      discountApplied: discountPercentage,
      discountPercentage,
    };
  }
}

export default new CostCalculator();
