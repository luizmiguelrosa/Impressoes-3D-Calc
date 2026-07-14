import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Config, Settings as SettingsType } from "../../main/types";
import { useRef, useEffect } from "react";
import { validateSettings, formatErrorMessage } from "../utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<SettingsType> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(
    new Map(),
  );

  // Fetch config
  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      try {
        const result = await window.electron.config.getConfig();
        return result as Config;
      } catch (err) {
        throw new Error(formatErrorMessage(err));
      }
    },
  });

  // Initialize settings when config loads
  useEffect(() => {
    if (config?.settings) {
      setSettings(config.settings);
      setHasChanges(false);
      setFieldErrors(new Map());
    }
  }, [config]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<SettingsType>) => {
      // Validar antes de enviar
      const errors = validateSettings(newSettings);
      if (errors.length > 0) {
        const errMap = new Map(errors.map((e) => [e.field, e.message]));
        setFieldErrors(errMap);
        throw new Error(errors.map((e) => e.message).join(", "));
      }

      try {
        await window.electron.config.updateSettings(newSettings);
      } catch (err) {
        throw new Error(formatErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      setHasChanges(false);
      setFieldErrors(new Map());
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    },
  });

  const handleSave = () => {
    if (!settings) return;

    // Validar localmente primeiro
    const errors = validateSettings(settings);
    if (errors.length > 0) {
      const errMap = new Map(errors.map((e) => [e.field, e.message]));
      setFieldErrors(errMap);
      toast({
        variant: "destructive",
        title: "Configurações inválidas",
        description: errors.map((e) => e.message).join(", "),
      });
      return;
    }

    setFieldErrors(new Map());
    updateMutation.mutate(settings);
  };

  const handleReset = () => {
    if (config?.settings) {
      setSettings(config.settings);
      setHasChanges(false);
      setFieldErrors(new Map());
    }
  };

  const handleChange = (field: keyof SettingsType, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpar erro do campo ao editar
    const newErrors = new Map(fieldErrors);
    newErrors.delete(field);
    setFieldErrors(newErrors);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>Carregando configurações...</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error || !config || !settings) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{formatErrorMessage(error)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Configurações de Hardware
      </h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Parâmetros de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Consumo da Impressora
              </h2>

              <Alert className="mb-4">
                <AlertDescription>
                  O consumo em Watts define quanto de energia a impressora utiliza durante a impressão. Você pode encontrar esse valor nas especificações técnicas do seu equipamento.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="printer-wattage">Consumo (Watts)</Label>
                <div className="flex items-center gap-2 max-w-md">
                  <Input
                    id="printer-wattage"
                    type="number"
                    value={settings.printerWattage || ""}
                    onChange={(e) =>
                      handleChange("printerWattage", parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    step={10}
                    placeholder="350"
                    className={fieldErrors.has("printerWattage") ? "border-red-500" : ""}
                  />
                  <span className="text-sm text-gray-500">W</span>
                </div>
                {fieldErrors.has("printerWattage") && (
                  <p className="text-xs text-red-500">
                    {fieldErrors.get("printerWattage")}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Padrão comum: 350W (deve ser maior que 0)
                </p>
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Custo da Energia
              </h2>

              <Alert className="mb-4 bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  O preço do kWh você pode encontrar na sua conta de luz. Varia por região e fornecedor.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="kwh-price">Preço do kWh (R$)</Label>
                <div className="flex items-center gap-2 max-w-md">
                  <span className="text-sm text-gray-500">R$</span>
                  <Input
                    id="kwh-price"
                    type="number"
                    value={settings.kwhPrice || ""}
                    onChange={(e) =>
                      handleChange("kwhPrice", parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    step={0.01}
                    placeholder="1.03"
                    className={fieldErrors.has("kwhPrice") ? "border-red-500" : ""}
                  />
                </div>
                {fieldErrors.has("kwhPrice") && (
                  <p className="text-xs text-red-500">
                    {fieldErrors.get("kwhPrice")}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Padrão comum: R$ 1,03/kWh (deve ser maior que 0)
                </p>
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Depreciação da Máquina
              </h2>

              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  A depreciação é calculada baseada no valor da máquina e sua vida útil em horas.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="printer-cost">Valor da Máquina (R$)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">R$</span>
                    <Input
                      id="printer-cost"
                      type="number"
                      value={settings.printerCost || ""}
                      onChange={(e) =>
                        handleChange("printerCost", parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      step={100}
                      placeholder="1386.00"
                      className={fieldErrors.has("printerCost") ? "border-red-500" : ""}
                    />
                  </div>
                  {fieldErrors.has("printerCost") && (
                    <p className="text-xs text-red-500">
                      {fieldErrors.get("printerCost")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="printer-lifespan">Vida Útil (horas)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="printer-lifespan"
                      type="number"
                      value={settings.printerLifespanH || ""}
                      onChange={(e) =>
                        handleChange("printerLifespanH", parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      step={100}
                      placeholder="8000"
                      className={fieldErrors.has("printerLifespanH") ? "border-red-500" : ""}
                    />
                    <span className="text-sm text-gray-500">h</span>
                  </div>
                  {fieldErrors.has("printerLifespanH") && (
                    <p className="text-xs text-red-500">
                      {fieldErrors.get("printerLifespanH")}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Padrão: 8000h (deve ser maior que 0)
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Margens e Taxas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="profit-margin">Multiplicador de Lucro (padrão)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="profit-margin"
                      type="number"
                      value={settings.defaultProfitMargin || ""}
                      onChange={(e) =>
                        handleChange("defaultProfitMargin", parseFloat(e.target.value) || 1)
                      }
                      min={1}
                      step={0.1}
                      placeholder="2.0"
                      className={fieldErrors.has("defaultProfitMargin") ? "border-red-500" : ""}
                    />
                    <span className="text-sm text-gray-500">x</span>
                  </div>
                  {fieldErrors.has("defaultProfitMargin") && (
                    <p className="text-xs text-red-500">
                      {fieldErrors.get("defaultProfitMargin")}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    2.0x = Duplica o custo | 2.5x = Aumenta 150% (mín. 1.0x)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setup-fee">Taxa de Setup (R$)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">R$</span>
                    <Input
                      id="setup-fee"
                      type="number"
                      value={settings.setupFee || ""}
                      onChange={(e) =>
                        handleChange("setupFee", parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      step={0.5}
                      placeholder="5.00"
                      className={fieldErrors.has("setupFee") ? "border-red-500" : ""}
                    />
                  </div>
                  {fieldErrors.has("setupFee") && (
                    <p className="text-xs text-red-500">
                      {fieldErrors.get("setupFee")}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Adicionado apenas na primeira unidade
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Retorno de Investimento (ROI)
              </h2>

              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  Define em quantos meses você deseja recuperar o investimento da máquina. Um custo adicional por hora será calculado e somado ao preço final.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="roi-months">Tempo desejado de ROI (meses)</Label>
                <div className="flex items-center gap-2 max-w-md">
                  <Input
                    id="roi-months"
                    type="number"
                    value={settings.roiMonths || ""}
                    onChange={(e) =>
                      handleChange("roiMonths", parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    step={1}
                    placeholder="12"
                    className={fieldErrors.has("roiMonths") ? "border-red-500" : ""}
                  />
                  <span className="text-sm text-gray-500">meses</span>
                </div>
                {fieldErrors.has("roiMonths") && (
                  <p className="text-xs text-red-500">
                    {fieldErrors.get("roiMonths")}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Padrão: 12 meses (0 = desabilita ROI)
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              onClick={handleReset}
              variant="secondary"
              disabled={!hasChanges || updateMutation.isPending}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>

          {hasChanges && (
            <Alert>
              <AlertDescription>
                Existem mudanças não salvas. Clique em 'Salvar Configurações' para aplicar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Resumo das Configurações Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Consumo</p>
              <p className="font-semibold text-gray-900">
                {settings.printerWattage} W
              </p>
            </div>
            <div>
              <p className="text-gray-600">Custo kWh</p>
              <p className="font-semibold text-gray-900">
                R$ {settings.kwhPrice ? settings.kwhPrice.toFixed(2) : '0.00'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Valor Máquina</p>
              <p className="font-semibold text-gray-900">
                R$ {settings.printerCost ? settings.printerCost.toFixed(2) : '0.00'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Vida Útil</p>
              <p className="font-semibold text-gray-900">
                {settings.printerLifespanH}h
              </p>
            </div>
            <div>
              <p className="text-gray-600">Margem Padrão</p>
              <p className="font-semibold text-gray-900">
                {settings.defaultProfitMargin ? settings.defaultProfitMargin.toFixed(1) : '0.0'}x
              </p>
            </div>
            <div>
              <p className="text-gray-600">Taxa Setup</p>
              <p className="font-semibold text-gray-900">
                R$ {settings.setupFee ? settings.setupFee.toFixed(2) : '0.00'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">ROI Desejado</p>
              <p className="font-semibold text-gray-900">
                {settings.roiMonths || 0} meses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
