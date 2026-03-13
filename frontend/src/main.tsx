import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router/AppRouter';
import { useLanguageStore } from './stores/languageStore';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RootApp() {
  const locale = useLanguageStore((state) => state.locale);
  const antdLocale = locale === 'zh-CN' ? zhCN : enUS;

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={antdLocale}>
          <App>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </App>
        </ConfigProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<RootApp />);
