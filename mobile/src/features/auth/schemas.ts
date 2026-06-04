import { z } from 'zod';

import { emailSchema, strongPasswordSchema } from './passwordPolicy';

const numeroEmpleado = z
  .string()
  .trim()
  .min(1, 'Ingresá tu número de empleado')
  .regex(/^\d+$/, 'Usá solo números');

export const loginSchema = z.object({
  numeroEmpleado,
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const forceChangePasswordSchema = resetPasswordSchema;

export type ForceChangePasswordFormValues = z.infer<typeof forceChangePasswordSchema>;

export const firstAccessSchema = z
  .object({
    customerNumber: z.string().trim().min(1, 'Ingresá tu número de cliente'),
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export type FirstAccessFormValues = z.infer<typeof firstAccessSchema>;
