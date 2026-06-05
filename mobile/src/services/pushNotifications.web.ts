/** Web: push nativo no disponible — no-op */
export async function registerPushToken(_params: {
  userRole: 'client' | 'admin';
  clienteId?: string;
  adminId?: string;
}): Promise<void> {
  // sin push en web
}
