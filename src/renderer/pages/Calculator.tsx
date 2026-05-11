import React from 'react';

const Calculator: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calculadora de Custos</h1>
        <p className="text-gray-600 mt-2">
          Calcule o custo de impressão baseado em filamento, peso, tempo e quantidade
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Cálculo de Custo</h2>
        </div>
        <div className="card-body">
          <p className="text-gray-600">Componentes serão adicionados aqui...</p>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
