import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from './components/Navigation';
import { CalculatorPage } from './pages/CalculatorPage';
import { FilamentsPage } from './pages/FilamentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HistoryPage } from './pages/HistoryPage';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

export type Page = 'calculator' | 'filaments' | 'settings' | 'history';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('calculator');

  const renderPage = () => {
    switch (currentPage) {
      case 'calculator':
        return <CalculatorPage />;
      case 'filaments':
        return <FilamentsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'history':
        return <HistoryPage />;
      default:
        return <CalculatorPage />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-50">
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
