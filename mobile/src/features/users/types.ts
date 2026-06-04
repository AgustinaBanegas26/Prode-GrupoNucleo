export type UserRole = 'admin' | 'usuario';

export type AppUser = {
  id: string;
  numeroEmpleado: string;
  nombre: string;
  apellido: string;
  email?: string;
  empresa?: string;
  rol: UserRole;
  activo: boolean;
  createdAt: number;
  updatedAt: number;
};

export type StoredUser = AppUser & { password?: string };
