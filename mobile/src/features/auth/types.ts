export type EmployeeNumber = string;

export type AuthUser = {
  id: string;
  numeroEmpleado: EmployeeNumber;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'usuario';
  activo: boolean;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type LoginInput = {
  numeroEmpleado: EmployeeNumber;
  password: string;
};

