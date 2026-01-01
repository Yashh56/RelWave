import { createRoot } from 'react-dom/client';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DatabaseDetail from './pages/DatabaseDetails';
import NotFound from './pages/NotFound';
import ERDiagram from './pages/ERDiagram';
import QueryBuilder from './pages/QueryBuilder';
import { ThemeProvider } from './components/common/ThemeProvider';
import SchemaExplorer from './pages/SchemaExplorer';
import Settings from './pages/Settings';
import { useBridgeInit } from "@/hooks/useBridgeInit";
import { useEffect } from 'react';

const queryClient = new QueryClient();

function BridgeInitializer() {
  useBridgeInit();
  return null;
}

function ThemeVariantInitializer() {
  useEffect(() => {
    // Initialize theme variant from localStorage on mount
    const savedVariant = localStorage.getItem('db-studio-theme-variant');
    if (savedVariant) {
      document.documentElement.setAttribute('data-theme-variant', savedVariant);
    } else {
      document.documentElement.setAttribute('data-theme-variant', 'blue');
    }
  }, []);
  return null;
}


function AppRoot() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <BridgeInitializer />
        <ThemeVariantInitializer />
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/:id" element={<DatabaseDetail />} />
              <Route path="/database/:id/query-builder" element={<QueryBuilder />} />
              <Route path="/database/:id/er-diagram" element={<ERDiagram />} />
              <Route path='/database/:id/schema-explorer' element={<SchemaExplorer />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(<AppRoot />);
