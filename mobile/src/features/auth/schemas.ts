import { z } from 'zod';

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

