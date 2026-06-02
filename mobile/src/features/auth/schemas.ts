import { z } from 'zod';

const customerNumber = z
  .string()
  .trim()
  .min(1, 'Ingresá tu número de cliente')
  .regex(/^\d+$/, 'Usá solo números');

const password = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

export const loginSchema = z.object({
  customerNumber,
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const firstAccessSchema = z
  .object({
    customerNumber,
    email: z.string().trim().email('Ingresá un email válido'),
    password,
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export type FirstAccessFormValues = z.infer<typeof firstAccessSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Ingresá un email válido'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email('Ingresá un email válido'),
    code: z.string().trim().min(4, 'Ingresá el código'),
    password,
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

