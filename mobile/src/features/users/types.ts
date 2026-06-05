export type AppUser = {
  /** bigint en DB (se maneja como string en UI para evitar problemas) */
  id: string;
  /** clientes.cliente_id */
  clienteId: string;
  /** clientes.nombre */
  nombre: string;
  /** clientes.email (opcional, requerido para recovery) */
  email?: string | null;
  /** clientes.habilitado */
  activo: boolean;
  /** clientes.primer_login */
  primerLogin: boolean;
  /** clientes.ultimo_acceso */
  ultimoAcceso?: number | null;
  /** clientes.created_at */
  createdAt?: number | null;
  /** clientes.avatar_url */
  avatarUrl?: string | null;
};
