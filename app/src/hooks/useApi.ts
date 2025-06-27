'use client';

import { useState, useCallback } from 'react';
import { handleApiResponse, showErrorToast, showSuccessToast } from '@/lib/error-handler';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const {
    onSuccess,
    onError,
    showSuccessToast: showSuccess = false,
    showErrorToast: showError = true,
    successMessage,
  } = options;

  const execute = useCallback(
    async (apiCall: () => Promise<Response>) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall();
        const data = await handleApiResponse<T>(response);

        setState({
          data,
          loading: false,
          error: null,
        });

        if (showSuccess && successMessage) {
          showSuccessToast(successMessage);
        }

        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (error: any) {
        const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        if (showError) {
          showErrorToast(error);
        }

        if (onError) {
          onError(error);
        }

        throw error;
      }
    },
    [onSuccess, onError, showSuccess, showError, successMessage]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// 간단한 fetch 래퍼
export function useSimpleApi() {
  const [loading, setLoading] = useState(false);

  const call = useCallback(async <T>(
    url: string,
    options: RequestInit = {},
    config: {
      showSuccess?: boolean;
      showError?: boolean;
      successMessage?: string;
      errorTitle?: string;
    } = {}
  ): Promise<T | null> => {
    const {
      showSuccess = false,
      showError = true,
      successMessage,
      errorTitle,
    } = config;

    setLoading(true);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await handleApiResponse<T>(response);

      if (showSuccess && successMessage) {
        showSuccessToast(successMessage);
      }

      return data;
    } catch (error) {
      if (showError) {
        showErrorToast(error, errorTitle);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading };
} 