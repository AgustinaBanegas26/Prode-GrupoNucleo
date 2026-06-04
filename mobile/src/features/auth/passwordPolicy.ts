import { z } from 'zod';

export const strongPasswordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-ZÁÉÍÓÚÑ]/, 'Debe incluir al menos una mayúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número');

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'El email es requerido')
  .email('Ingresá un email válido');
