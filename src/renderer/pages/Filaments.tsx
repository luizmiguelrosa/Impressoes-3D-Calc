import React from 'react';

const Filaments: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Filamentos</h1>
        <p className="text-gray-600 mt-2">
          Adicione, edite e remova filamentos disponíveis para cálculo
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Filamentos Cadastrados</h2>
        </div>
        <div className="card-body">
          <p className="text-gray-600">Componentes serão adicionados aqui...</p>
        </div>
      </div>
    </div>
  );
};

export default Filaments;
