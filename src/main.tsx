import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './store/AuthProvider';
import { ChatLiveProvider } from './chat/ChatLiveProvider';
import { PwaManager } from './pwa/PwaManager';
import './pwa/installEvent';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PwaManager>
            <ChatLiveProvider>
              <App />
              <Toaster richColors position="top-center" />
            </ChatLiveProvider>
          </PwaManager>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
