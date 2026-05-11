import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">
          Configure parâmetros globais da impressora e do sistema
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Hardware</h2>
        </div>
        <div className="card-body">
          <p className="text-gray-600">Componentes serão adicionados aqui...</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Custos Gerais</h2>
        </div>
        <div className="card-body">
          <p className="text-gray-600">Componentes serão adicionados aqui...</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
