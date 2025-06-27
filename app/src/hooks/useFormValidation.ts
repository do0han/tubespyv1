'use client';

import { useState, useCallback, useEffect } from 'react';

type ValidationRule<T> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  message?: string;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isValidating, setIsValidating] = useState(false);

  // 단일 필드 검증
  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required 검증
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return rules.message || `${String(name)}은(는) 필수 항목입니다.`;
    }

    // 값이 없으면 다른 검증은 건너뜀 (required가 아닌 경우)
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // 최소 길이 검증
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      return rules.message || `${String(name)}은(는) 최소 ${rules.minLength}자 이상이어야 합니다.`;
    }

    // 최대 길이 검증
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      return rules.message || `${String(name)}은(는) 최대 ${rules.maxLength}자까지 입력 가능합니다.`;
    }

    // 패턴 검증
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return rules.message || `${String(name)}의 형식이 올바르지 않습니다.`;
    }

    // 커스텀 검증
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }, [validationRules]);

  // 전체 폼 검증
  const validateForm = useCallback((): boolean => {
    setIsValidating(true);
    const newErrors: ValidationErrors<T> = {};
    let isValid = true;

    Object.keys(values).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setIsValidating(false);
    return isValid;
  }, [values, validateField]);

  // 필드 값 업데이트
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // 이미 터치된 필드나 에러가 있는 필드는 실시간 검증
    if (touched[name] || errors[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }
  }, [touched, errors, validateField]);

  // 여러 필드 값 일괄 업데이트
  const updateValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // 필드 터치 처리
  const setFieldTouched = useCallback((name: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));

    // 터치될 때 검증 실행
    if (isTouched) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }
  }, [values, validateField]);

  // 모든 필드 터치 처리
  const setAllFieldsTouched = useCallback(() => {
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(values).forEach(key => {
      allTouched[key as keyof T] = true;
    });
    setTouched(allTouched);
  }, [values]);

  // 폼 리셋
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValidating(false);
  }, [initialValues]);

  // 에러 클리어
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // 특정 필드 에러 클리어
  const clearFieldError = useCallback((name: keyof T) => {
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  // 폼 유효성 상태
  const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0;
  const hasErrors = Object.keys(errors).length > 0;

  // 입력 핸들러 생성
  const getFieldProps = useCallback((name: keyof T) => ({
    value: values[name] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValue(name, e.target.value);
    },
    onBlur: () => setFieldTouched(name),
    error: errors[name],
    isInvalid: !!errors[name],
  }), [values, errors, setValue, setFieldTouched]);

  // 체크박스 핸들러 생성
  const getCheckboxProps = useCallback((name: keyof T) => ({
    checked: !!values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, e.target.checked);
    },
    onBlur: () => setFieldTouched(name),
    error: errors[name],
    isInvalid: !!errors[name],
  }), [values, errors, setValue, setFieldTouched]);

  return {
    values,
    errors,
    touched,
    isValidating,
    isValid,
    hasErrors,
    setValue,
    updateValues,
    setFieldTouched,
    setAllFieldsTouched,
    validateForm,
    validateField,
    resetForm,
    clearErrors,
    clearFieldError,
    getFieldProps,
    getCheckboxProps,
  };
}

// 공통 검증 규칙들
export const validationRules = {
  required: (message?: string): ValidationRule<any> => ({
    required: true,
    message,
  }),

  email: (message?: string): ValidationRule<string> => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || '올바른 이메일 주소를 입력해주세요.',
  }),

  minLength: (length: number, message?: string): ValidationRule<string> => ({
    minLength: length,
    message,
  }),

  maxLength: (length: number, message?: string): ValidationRule<string> => ({
    maxLength: length,
    message,
  }),

  phone: (message?: string): ValidationRule<string> => ({
    pattern: /^[0-9-+().\s]+$/,
    message: message || '올바른 전화번호를 입력해주세요.',
  }),

  url: (message?: string): ValidationRule<string> => ({
    pattern: /^https?:\/\/.+/,
    message: message || '올바른 URL을 입력해주세요.',
  }),

  number: (message?: string): ValidationRule<string> => ({
    pattern: /^\d+$/,
    message: message || '숫자만 입력해주세요.',
  }),

  custom: <T>(validator: (value: T) => string | null): ValidationRule<T> => ({
    custom: validator,
  }),
};

export default useFormValidation; 