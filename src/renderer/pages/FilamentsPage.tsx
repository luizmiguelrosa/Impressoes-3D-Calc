import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Filament, Config } from '../../main/types';
import { validateFilament, formatErrorMessage } from '../utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const FilamentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, id: string | null}>({show: false, id: null});
  const [formData, setFormData] = useState<Partial<Filament>>({
    name: '',
    pricePerKg: 0,
    riskFactor: 0.1,
  });
  const [formErrors, setFormErrors] = useState<Map<string, string>>(new Map());

  // Fetch all filaments
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      try {
        const result = await window.electron.config.getConfig();
        return result as Config;
      } catch (err) {
        throw new Error(formatErrorMessage(err));
      }
    },
  });

  // Add/Update filament mutation
  const saveMutation = useMutation({
    mutationFn: async (filament: Partial<Filament>) => {
      // Validar antes de salvar
      const errors = validateFilament(filament);
      if (errors.length > 0) {
        const errMap = new Map(errors.map((e) => [e.field, e.message]));
        setFormErrors(errMap);
        throw new Error(errors.map((e) => e.message).join(', '));
      }

      try {
        if (editingId) {
          await window.electron.config.updateFilament(editingId, filament as Filament);
        } else {
          const newId = `fil_${Date.now()}`;
          await window.electron.config.addFilament({
            id: newId,
            ...filament,
          } as Filament);
        }
      } catch (err) {
        throw new Error(formatErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      toast({
        title: editingId ? 'Filamento atualizado' : 'Filamento criado',
        description: editingId
          ? 'O filamento foi atualizado com sucesso!'
          : 'O novo filamento foi adicionado com sucesso!',
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar filamento',
        variant: 'destructive',
      });
    },
  });

  // Delete filament mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await window.electron.config.deleteFilament(id);
      } catch (err) {
        throw new Error(formatErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      toast({
        title: 'Filamento deletado',
        description: 'O filamento foi removido com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar filamento',
        variant: 'destructive',
      });
    },
  });

  const handleOpenDialog = (filament?: Filament) => {
    if (filament) {
      setEditingId(filament.id);
      setFormData(filament);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        pricePerKg: 0,
        riskFactor: 0.1,
      });
    }
    setFormErrors(new Map());
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({
      name: '',
      pricePerKg: 0,
      riskFactor: 0.1,
    });
    setFormErrors(new Map());
  };

  const handleSave = () => {
    // Validar localmente primeiro
    const errors = validateFilament(formData);
    if (errors.length > 0) {
      const errMap = new Map(errors.map((e) => [e.field, e.message]));
      setFormErrors(errMap);
      toast({
        title: 'Campos inválidos',
        description: errors.map((e) => e.message).join(', '),
        variant: 'destructive',
      });
      return;
    }

    setFormErrors(new Map());
    saveMutation.mutate(formData);
  };

  const handleDelete = (filament: Filament) => {
    setConfirmDelete({show: true, id: filament.id});
  };

  const confirmDeleteFilament = () => {
    if (confirmDelete.id) {
      deleteMutation.mutate(confirmDelete.id);
      setConfirmDelete({show: false, id: null});
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>Carregando filamentos...</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error || !config) {
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Filamentos</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Filamento
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          {config.filaments.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum filamento cadastrado. Clique em 'Novo Filamento' para começar!
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Fator Risco</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.filaments.map((filament) => (
                  <TableRow key={filament.id}>
                    <TableCell>{filament.name}</TableCell>
                    <TableCell>R$ {filament.pricePerKg.toFixed(2)}/kg</TableCell>
                    <TableCell>{(filament.riskFactor * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(filament)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(filament)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete.show} onOpenChange={(open) => setConfirmDelete({show: open, id: null})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja deletar este filamento?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete({show: false, id: null})}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFilament}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Filamento' : 'Novo Filamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome*</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  const newErrors = new Map(formErrors);
                  newErrors.delete('name');
                  setFormErrors(newErrors);
                }}
                placeholder="Ex: PLA Branco"
                className={formErrors.has('name') ? 'border-red-500' : ''}
              />
              {formErrors.has('name') && (
                <p className="text-xs text-red-500 mt-1">{formErrors.get('name')}</p>
              )}
            </div>

            <div>
              <Label htmlFor="pricePerKg">Preço por kg (R$)*</Label>
              <Input
                id="pricePerKg"
                type="number"
                value={formData.pricePerKg || 0}
                onChange={(e) => {
                  setFormData({ ...formData, pricePerKg: parseFloat(e.target.value) || 0 });
                  const newErrors = new Map(formErrors);
                  newErrors.delete('pricePerKg');
                  setFormErrors(newErrors);
                }}
                min={0}
                step={0.01}
                placeholder="0.00"
                className={formErrors.has('pricePerKg') ? 'border-red-500' : ''}
              />
              {formErrors.has('pricePerKg') && (
                <p className="text-xs text-red-500 mt-1">{formErrors.get('pricePerKg')}</p>
              )}
            </div>

            <div>
              <Label htmlFor="riskFactor">Fator de Risco (0-1)*</Label>
              <Input
                id="riskFactor"
                type="number"
                value={formData.riskFactor || 0}
                onChange={(e) => {
                  setFormData({ ...formData, riskFactor: parseFloat(e.target.value) || 0 });
                  const newErrors = new Map(formErrors);
                  newErrors.delete('riskFactor');
                  setFormErrors(newErrors);
                }}
                min={0}
                max={1}
                step={0.01}
                placeholder="0.1"
                className={formErrors.has('riskFactor') ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">Entre 0 e 1 (ex: 0.1 = 10% de risco)</p>
              {formErrors.has('riskFactor') && (
                <p className="text-xs text-red-500 mt-1">{formErrors.get('riskFactor')}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
