export interface ValidationRule<T> {
  field: keyof T;
  validate: (value: any, data: T) => boolean;
  message: string;
}

export type Schema<T> = ValidationRule<T>[];

export interface ValidationResult {
  success: boolean;
  firstError?: string;
  errors?: Record<string, string>;
}

export function validateSchema<T extends Record<string, any>>(
  schema: Schema<T>,
  data: T
): ValidationResult {
  const errors: Record<string, string> = {};
  let firstError: string | undefined;

  for (const rule of schema) {
    const value = data[rule.field];
    if (!rule.validate(value, data)) {
      if (!firstError) {
        firstError = rule.message;
      }
      errors[rule.field as string] = rule.message;
    }
  }

  if (firstError) {
    return {
      success: false,
      firstError,
      errors,
    };
  }

  return { success: true };
}

export interface PasswordLoginData {
  emailOrPhone: string;
  password: string;
}

export const passwordLoginSchema: Schema<PasswordLoginData> = [
  {
    field: 'emailOrPhone',
    validate: (val: string) => Boolean(val && val.trim().length > 0),
    message: 'Email or Mobile Number is required.',
  },
  {
    field: 'password',
    validate: (val: string) => Boolean(val && val.trim().length > 0),
    message: 'Password is required.',
  },
];

export interface OtpLoginData {
  phone: string;
  otp: string;
}

export const otpLoginSchema: Schema<OtpLoginData> = [
  {
    field: 'phone',
    validate: (val: string) => Boolean(val && /^[0-9+\s-]{10,15}$/.test(val.trim())),
    message: 'Please enter a valid mobile number.',
  },
  {
    field: 'otp',
    validate: (val: string) => Boolean(val && val.trim().length >= 4),
    message: 'Please enter a valid OTP code.',
  },
];
