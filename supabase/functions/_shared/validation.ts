// Validation utilities for Edge Functions

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateUUID(id: string, fieldName: string = 'id'): string | null {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || typeof id !== 'string' || !uuidRegex.test(id)) {
    return `${fieldName} must be a valid UUID`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    return 'Invalid email address';
  }
  return null;
}

export function validateRequired(
  value: any,
  fieldName: string
): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateString(
  value: any,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): string | null {
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (minLength !== undefined && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  if (maxLength !== undefined && value.length > maxLength) {
    return `${fieldName} must be at most ${maxLength} characters`;
  }
  return null;
}

export function validateNumber(
  value: any,
  fieldName: string,
  min?: number,
  max?: number
): string | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return `${fieldName} must be a number`;
  }
  if (min !== undefined && value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (max !== undefined && value > max) {
    return `${fieldName} must be at most ${max}`;
  }
  return null;
}

export function validateBoolean(value: any, fieldName: string): string | null {
  if (typeof value !== 'boolean') {
    return `${fieldName} must be a boolean`;
  }
  return null;
}

export function validateEnum<T extends string>(
  value: any,
  fieldName: string,
  allowedValues: T[]
): string | null {
  if (!allowedValues.includes(value)) {
    return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
  }
  return null;
}

export function validatePhoneNumber(
  value: any,
  fieldName: string = 'phone_number'
): string | null {
  if (!value || typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return `${fieldName} must be 10-15 digits`;
  }
  return null;
}

export function collectErrors(...errors: (string | null)[]): string[] {
  return errors.filter((e): e is string => e !== null);
}

