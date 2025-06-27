'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message = '로딩 중...', className = '' }: LoadingOverlayProps) {
  return (
    <div className={`absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <LoadingSpinner size="lg" className="text-blue-600" />
        <p className="text-sm text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingState({ isLoading, message, children, className = '' }: LoadingStateProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && <LoadingOverlay message={message} />}
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({ 
  isLoading = false, 
  loadingText = '처리 중...', 
  children, 
  disabled,
  className = '',
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`relative ${className} ${isLoading ? 'cursor-not-allowed' : ''}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" className="text-current" />
          {loadingText && (
            <span className="ml-2">{loadingText}</span>
          )}
        </div>
      )}
      <div className={isLoading ? 'invisible' : ''}>
        {children}
      </div>
    </button>
  );
}

// 페이지 전체 로딩
export function PageLoading({ message = '페이지를 불러오는 중...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="text-blue-600 mx-auto mb-4" />
        <p className="text-lg text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

// 카드 내 로딩
export function CardLoading({ message = '데이터를 불러오는 중...' }: { message?: string }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
      <LoadingSpinner size="lg" className="text-blue-600 mx-auto mb-3" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

// 테이블 로딩
export function TableLoading({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="animate-pulse">
        {/* 테이블 헤더 */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-300 rounded flex-1"></div>
            ))}
          </div>
        </div>
        
        {/* 테이블 행들 */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-gray-200 px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingSpinner; 