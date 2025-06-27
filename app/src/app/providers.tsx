'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/toast';
import { setupGlobalErrorHandler } from '@/lib/error-handler';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // 전역 에러 핸들러 설정
    setupGlobalErrorHandler();
  }, []);

  return (
    <SessionProvider>
      <ErrorBoundary>
        {children}
        <ToastProvider />
      </ErrorBoundary>
    </SessionProvider>
  );
} 