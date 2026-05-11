import React from 'react';
import { Page } from '../App';
import { useApp } from '../context/AppContext';

interface NavigationProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { history } = useApp();

  const navItems: Array<{ id: Page; label: string; icon: string }> = [
    { id: 'calculator', label: 'Calculadora', icon: 'pi-calculator' },
    { id: 'filaments', label: 'Filamentos', icon: 'pi-list' },
    { id: 'settings', label: 'Configurações', icon: 'pi-cog' },
  ];

  return (
    <nav className="w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-500">3D Calc</h1>
        <p className="text-xs text-gray-500 mt-1">Calculadora de Impressões</p>
      </div>

      <div className="px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentPage === item.id
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <i className={`pi ${item.icon}`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        <button
          onClick={() => onPageChange('history')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
            currentPage === 'history'
              ? 'bg-primary-500 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <i className="pi pi-history"></i>
          <span className="font-medium">Histórico</span>
          {history.length > 0 && (
            <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
              currentPage === 'history'
                ? 'bg-white text-primary-500'
                : 'bg-blue-500 text-white'
            }`}>
              {history.length}
            </span>
          )}
        </button>
      </div>

      <div className="absolute bottom-6 left-4 right-4 text-xs text-gray-500">
        <p>v1.0.0</p>
      </div>
    </nav>
  );
};

export default Navigation;
