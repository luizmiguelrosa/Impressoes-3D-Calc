import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";
import type {
  Config,
  CalculationInput,
  CalculationResult,
} from "../../main/types";
import {
  validateCalculationInput,
  formatErrorMessage,
} from "../utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export const CalculatorPage: React.FC = () => {
  const { toast } = useToast();
  const { addToHistory } = useApp();
  const [calculationName, setCalculationName] = useState<string>("");
  const [selectedFilament, setSelectedFilament] = useState<string | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [profitMargin, setProfitMargin] = useState<number | null>(null);
  const [needsFinishing, setNeedsFinishing] = useState<boolean>(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const {
    data: config,
    isLoading: configLoading,
    error: configError,
  } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      try {
        const result = await window.electron.config.getConfig();
        return result as Config;
      } catch (error) {
        const message = formatErrorMessage(error);
        throw new Error(message);
      }
    },
  });

  const filamentOptions = useMemo(() => {
    if (!config?.filaments) return [];
    return config.filaments.map((f) => ({
      label: f.name,
      value: f.id,
    }));
  }, [config]);

  const selectedFilamentData = useMemo(() => {
    if (!config?.filaments || !selectedFilament) return null;
    return config.filaments.find((f) => f.id === selectedFilament) || null;
  }, [config, selectedFilament]);

  // Use useQuery for actual calculation with IPC
  const {
    data: calculation,
    isLoading: calcLoading,
    error: queryError,
  } = useQuery({
    queryKey: [
      "calculate",
      selectedFilament,
      weight,
      time,
      quantity,
      profitMargin,
    ],
    queryFn: async () => {
      if (
        !selectedFilamentData ||
        weight === null ||
        time === null ||
        !config
      ) {
        return null;
      }

      const input: CalculationInput = {
        filamentId: selectedFilament!,
        weightG: weight,
        timeHours: time,
        quantity: Math.max(1, quantity || 1),
        profitMarginMultiplier:
          profitMargin ?? config.settings.defaultProfitMargin,
      } as any;

      // Validar entrada antes de enviar para IPC
      const validationErrors = validateCalculationInput(input);
      if (validationErrors.length > 0) {
        const errorMsg = validationErrors.map((e) => e.message).join(", ");
        setCalcError(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        setCalcError(null);
        const result = await window.electron.calculator.calculatePrice(input);
        return result;
      } catch (error) {
        const message = formatErrorMessage(error);
        setCalcError(message);
        console.error("Cálculo error:", error);
        throw new Error(message);
      }
    },
    enabled: !!selectedFilamentData && weight !== null && time !== null,
    retry: false,
  });

  const handleAddToCart = useCallback(() => {
    if (!calculation || !selectedFilamentData) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para adicionar ao histórico",
      });
      return;
    }

    try {
      addToHistory({
        filamentId: selectedFilament!,
        filamentName: calculationName || selectedFilamentData.name,
        weightG: weight!,
        timeHours: time!,
        quantity,
        unitPrice: calculation.unitPrice,
        finalPrice: calculation.finalPrice,
      });

      toast({
        title: "Adicionado ao histórico",
        description: `${quantity} unidade(s) de ${selectedFilamentData.name} por R$ ${calculation.finalPrice.toFixed(2)}`,
      });

      // Reset form
      setCalculationName("");
      setSelectedFilament(null);
      setWeight(null);
      setTime(null);
      setQuantity(1);
      setProfitMargin(null);
      setCalcError(null);
    } catch (error) {
      const message = formatErrorMessage(error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar",
        description: message,
      });
    }
  }, [
    calculation,
    selectedFilamentData,
    selectedFilament,
    weight,
    time,
    quantity,
    calculationName,
    addToHistory,
    toast,
  ]);

  if (configLoading) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>Carregando configurações...</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (configError || !config) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{formatErrorMessage(configError)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Calculadora de Custos
      </h1>

      <div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Identificação do Cálculo
          </h2>
          <div className="space-y-2">
            <Label htmlFor="calculation-name">Nome/Descrição (opcional)</Label>
            <Input
              id="calculation-name"
              value={calculationName}
              onChange={(e) => setCalculationName(e.target.value)}
              placeholder="Ex: Peça para cliente X, Protótipo A, etc..."
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Selecione o Filamento
          </h2>

          <div className="space-y-2">
            <Label htmlFor="filament-select">Filamento</Label>
            <Select
              value={selectedFilament || undefined}
              onValueChange={(value) => {
                setSelectedFilament(value);
                setCalcError(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha um filamento..." />
              </SelectTrigger>
              <SelectContent>
                {filamentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFilamentData && (
            <div className="bg-blue-50 border border-blue-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Filamento:</span>
                  <span className="text-gray-900">
                    {selectedFilamentData.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Preço:</span>
                  <span className="text-gray-900">
                    R$ {selectedFilamentData.pricePerKg.toFixed(2)}/kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    Fator de Risco:
                  </span>
                  <span className="text-gray-900">
                    {(selectedFilamentData.riskFactor * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (g)</Label>
              <Input
                id="weight"
                type="number"
                value={weight || ""}
                onChange={(e) => {
                  setWeight(e.target.value ? parseFloat(e.target.value) : null);
                  setCalcError(null);
                }}
                min={0}
                step={0.1}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">Deve ser maior que 0</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Tempo (horas)</Label>
              <Input
                id="time"
                type="number"
                value={time || ""}
                onChange={(e) => {
                  setTime(e.target.value ? parseFloat(e.target.value) : null);
                  setCalcError(null);
                }}
                min={0}
                step={0.1}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">Deve ser maior que 0</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Quantidade e Preço
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                  setCalcError(null);
                }}
                min={1}
                step={1}
              />
              <p className="text-xs text-gray-500">Mínimo 1 unidade</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profit-margin">Margem de Lucro (x)</Label>
              <Input
                id="profit-margin"
                type="number"
                value={profitMargin || ""}
                onChange={(e) => {
                  setProfitMargin(e.target.value ? parseFloat(e.target.value) : null);
                  setCalcError(null);
                }}
                min={1}
                step={0.1}
                placeholder={`${config.settings.defaultProfitMargin.toFixed(1)}`}
              />
              <p className="text-xs text-gray-500">
                Padrão: {config.settings.defaultProfitMargin.toFixed(1)}x
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">
            Acabamento Necessário
          </h2>

          <div className="flex items-center gap-3">
            <Checkbox
              checked={needsFinishing}
              onCheckedChange={(checked) => {
                setNeedsFinishing(checked === true);
                setCalcError(null);
              }}
              id="finishing-checkbox"
            />
            <Label
              htmlFor="finishing-checkbox"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Este produto requer acabamento pós-impressão (alisamento, pintura,
              etc.)
            </Label>
          </div>

          {needsFinishing && (
            <Alert>
              <AlertDescription>
                Custo de mão de obra será adicionado ao preço final. Verifique as configurações de margem de lucro.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {calcLoading && (
        <Alert>
          <AlertDescription>Calculando...</AlertDescription>
        </Alert>
      )}

      {calculation && !calcError && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-green-700">
              Resumo do Cálculo
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">
                  Custo de Material (unit.):
                </span>
                <span className="font-semibold">
                  R$ {calculation.materialCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Custo de Energia (unit.):</span>
                <span className="font-semibold">
                  R$ {calculation.energyCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">
                  Custo de Depreciação (unit.):
                </span>
                <span className="font-semibold">
                  R$ {calculation.depreciationCost.toFixed(2)}
                </span>
              </div>

              <div className="border-t my-2" />

              <div className="flex justify-between">
                <span className="text-gray-700">Custo Total (unit.):</span>
                <span className="font-semibold text-lg">
                  R$ {calculation.totalCost.toFixed(2)}
                </span>
              </div>

              {quantity > 1 && (
                <div className="flex justify-between text-blue-600">
                  <span>Desconto Volume ({quantity} unid.):</span>
                  <span className="font-semibold">
                    -
                    {(
                      (((calculation.totalCost - calculation.unitPrice) *
                        quantity) /
                        (calculation.totalCost * quantity)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              )}

              <div className="border-t my-2" />

              <div className="flex justify-between text-lg font-bold text-green-700">
                <span>
                  {quantity === 1
                    ? "Preço de Venda"
                    : `Preço de Venda (${quantity} unid.)`}
                  :
                </span>
                <span>R$ {calculation.finalPrice.toFixed(2)}</span>
              </div>

              {quantity > 1 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Por unidade:</span>
                  <span>
                    R$ {(calculation.finalPrice / quantity).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="border-t my-2" />

              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Margem de Lucro:</span>
                <span className="font-semibold text-green-600">
                  R${" "}
                  {(
                    calculation.finalPrice -
                    calculation.totalCost * quantity
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              className="w-full bg-green-600 hover:bg-green-700 mt-4"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar no Histórico
            </Button>
          </div>
        </div>
      )}

      {!calculation &&
        !calcError &&
        (selectedFilament || weight !== null || time !== null) && (
          <Alert>
            <AlertDescription>
              Preencha todos os campos (Filamento, Peso e Tempo) para ver o cálculo
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
};
