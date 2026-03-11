import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router/AppRouter';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </App>
    </QueryClientProvider>
  </React.StrictMode>,
);
