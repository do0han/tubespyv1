import { toast } from '@/components/ui/toast';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  public status: number;
  public code: string;
  public details?: any;

  constructor(message: string, status: number = 500, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// API 응답 에러 처리
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = '서버 오류가 발생했습니다.';
    let errorCode = 'SERVER_ERROR';
    let details;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.code || errorCode;
      details = errorData.details;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다.';
        errorCode = 'UNAUTHORIZED';
      } else if (response.status === 403) {
        errorMessage = '접근 권한이 없습니다.';
        errorCode = 'FORBIDDEN';
      } else if (response.status === 404) {
        errorMessage = '요청한 리소스를 찾을 수 없습니다.';
        errorCode = 'NOT_FOUND';
      } else if (response.status === 429) {
        errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        errorCode = 'RATE_LIMIT';
      } else if (response.status >= 500) {
        errorMessage = '서버 내부 오류가 발생했습니다.';
        errorCode = 'INTERNAL_SERVER_ERROR';
      }
    }

    throw new AppError(errorMessage, response.status, errorCode, details);
  }

  return response.json();
}

// 네트워크 에러 처리
export function handleNetworkError(error: Error): AppError {
  if (error.message.includes('fetch')) {
    return new AppError(
      '네트워크 연결을 확인해주세요.',
      0,
      'NETWORK_ERROR'
    );
  }
  
  if (error.message.includes('timeout')) {
    return new AppError(
      '요청 시간이 초과되었습니다.',
      408,
      'TIMEOUT_ERROR'
    );
  }

  return new AppError(
    error.message || '알 수 없는 오류가 발생했습니다.',
    500,
    'UNKNOWN_ERROR'
  );
}

// 에러 메시지 표시
export function showErrorToast(error: unknown, title?: string) {
  let message = '알 수 없는 오류가 발생했습니다.';
  
  if (error instanceof AppError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  toast.error(message, title);
}

// 성공 메시지 표시
export function showSuccessToast(message: string, title?: string) {
  toast.success(message, title);
}

// 경고 메시지 표시
export function showWarningToast(message: string, title?: string) {
  toast.warning(message, title);
}

// 정보 메시지 표시
export function showInfoToast(message: string, title?: string) {
  toast.info(message, title);
}

// API 호출 래퍼 (자동 에러 처리)
export async function apiCall<T>(
  apiFunction: () => Promise<T>,
  options: {
    loadingMessage?: string;
    successMessage?: string;
    errorTitle?: string;
    showSuccess?: boolean;
    showError?: boolean;
  } = {}
): Promise<T | null> {
  const {
    loadingMessage,
    successMessage,
    errorTitle,
    showSuccess = true,
    showError = true,
  } = options;

  let loadingToast: string | undefined;

  try {
    if (loadingMessage) {
      loadingToast = toast.loading(loadingMessage);
    }

    const result = await apiFunction();

    if (loadingToast) {
      toast.dismiss(loadingToast);
    }

    if (successMessage && showSuccess) {
      showSuccessToast(successMessage);
    }

    return result;
  } catch (error) {
    if (loadingToast) {
      toast.dismiss(loadingToast);
    }

    if (showError) {
      showErrorToast(error, errorTitle);
    }

    // 에러 로깅
    console.error('API call failed:', error);
    
    return null;
  }
}

// Promise 기반 토스트 (자동 로딩/성공/에러 처리)
export function promiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: any) => string);
  }
): Promise<T> {
  return toast.promise(promise, messages);
}

// 유효성 검사 에러 처리
export function handleValidationErrors(errors: Record<string, string[]>) {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
  
  showErrorToast(errorMessages, '입력 오류');
}

// 전역 에러 핸들러
export function setupGlobalErrorHandler() {
  // 처리되지 않은 Promise 거부
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (process.env.NODE_ENV === 'development') {
      showErrorToast(
        event.reason?.message || '처리되지 않은 오류가 발생했습니다.',
        '개발 모드 에러'
      );
    }
    
    // 기본 동작 방지 (콘솔 에러 메시지 표시 방지)
    event.preventDefault();
  });

  // JavaScript 런타임 에러
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    if (process.env.NODE_ENV === 'development') {
      showErrorToast(
        event.error?.message || '런타임 오류가 발생했습니다.',
        '개발 모드 에러'
      );
    }
  });
}

export default {
  handleApiResponse,
  handleNetworkError,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
  apiCall,
  promiseToast,
  handleValidationErrors,
  setupGlobalErrorHandler,
}; 