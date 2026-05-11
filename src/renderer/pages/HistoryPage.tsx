import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Trash2, Eye, Trash } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { history, removeFromHistory, clearHistory } = useApp();
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleRemove = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmRemove = () => {
    if (confirmDeleteId) {
      removeFromHistory(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const handleClear = () => {
    setConfirmClear(true);
  };

  const confirmClearHistory = () => {
    clearHistory();
    setConfirmClear(false);
  };

  if (history.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Histórico de Cálculos</h1>
        <Alert>
          <AlertDescription>Nenhum cálculo no histórico. Use a calculadora para gerar cálculos.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Histórico de Cálculos</h1>
        <Button
          variant="destructive"
          onClick={handleClear}
        >
          <Trash className="mr-2 h-4 w-4" />
          Limpar Histórico
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filamento/Descrição</TableHead>
                <TableHead>Preço Unit.</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.filamentName} ({item.weightG}g, {item.timeHours}h, x{item.quantity})
                  </TableCell>
                  <TableCell>R$ {item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>R$ {item.finalPrice.toFixed(2)}</TableCell>
                  <TableCell>{new Date(item.timestamp).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCalculation(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar remoção</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja remover este cálculo do histórico?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear History Confirmation Dialog */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar limpeza</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja limpar todo o histórico de cálculos?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmClearHistory}>
              Limpar Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculation Details Dialog */}
      <Dialog open={!!selectedCalculation} onOpenChange={() => setSelectedCalculation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Cálculo</DialogTitle>
          </DialogHeader>
          {selectedCalculation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Filamento/Descrição</span>
                  <p className="text-lg font-semibold text-gray-900">{selectedCalculation.filamentName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Data/Hora</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(selectedCalculation.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="border-t my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Peso</span>
                  <p className="text-lg font-semibold text-gray-900">{selectedCalculation.weightG}g</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Tempo</span>
                  <p className="text-lg font-semibold text-gray-900">{selectedCalculation.timeHours}h</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Quantidade</span>
                  <p className="text-lg font-semibold text-gray-900">{selectedCalculation.quantity} unidade(s)</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">ID do Filamento</span>
                  <p className="text-lg font-semibold text-gray-900">{selectedCalculation.filamentId}</p>
                </div>
              </div>

              <div className="border-t my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Preço Unit.</span>
                  <p className="text-lg font-semibold text-blue-600">R$ {selectedCalculation.unitPrice.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Preço Total</span>
                  <p className="text-lg font-semibold text-green-600">R$ {selectedCalculation.finalPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedCalculation(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
