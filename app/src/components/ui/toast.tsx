'use client';

import { Toaster, toast as hotToast, Toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// 커스텀 토스트 컴포넌트
const CustomToast = ({ t, type, title, message }: {
  t: Toast;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full ${backgrounds[type]} border rounded-lg shadow-lg pointer-events-auto flex p-4`}
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className="ml-3 flex-1">
        {title && (
          <p className="text-sm font-medium text-gray-900">
            {title}
          </p>
        )}
        <p className={`text-sm ${title ? 'text-gray-500' : 'text-gray-900'}`}>
          {message}
        </p>
      </div>
      <div className="ml-4 flex-shrink-0 flex">
        <button
          className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => hotToast.dismiss(t.id)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// 토스트 함수들
export const toast = {
  success: (message: string, title?: string) => {
    hotToast.custom((t) => (
      <CustomToast t={t} type="success" title={title} message={message} />
    ), {
      duration: 4000,
    });
  },

  error: (message: string, title?: string) => {
    hotToast.custom((t) => (
      <CustomToast t={t} type="error" title={title} message={message} />
    ), {
      duration: 6000,
    });
  },

  warning: (message: string, title?: string) => {
    hotToast.custom((t) => (
      <CustomToast t={t} type="warning" title={title} message={message} />
    ), {
      duration: 5000,
    });
  },

  info: (message: string, title?: string) => {
    hotToast.custom((t) => (
      <CustomToast t={t} type="info" title={title} message={message} />
    ), {
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return hotToast.loading(message, {
      style: {
        borderRadius: '8px',
        background: '#f3f4f6',
        color: '#374151',
      },
    });
  },

  dismiss: (toastId?: string) => {
    hotToast.dismiss(toastId);
  },

  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => {
    return hotToast.promise(promise, msgs, {
      style: {
        borderRadius: '8px',
        minWidth: '250px',
      },
      success: {
        duration: 4000,
      },
      error: {
        duration: 6000,
      },
    });
  },
};

// ToastProvider 컴포넌트
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerClassName="top-16"
      toastOptions={{
        className: '',
        duration: 4000,
        style: {
          background: '#fff',
          color: '#363636',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      }}
    />
  );
}

export default ToastProvider; 