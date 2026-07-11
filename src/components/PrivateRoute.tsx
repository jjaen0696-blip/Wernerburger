import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
  onUnauthorized?: () => void;
}

export default function PrivateRoute({ children, allowedRoles, onUnauthorized }: Props) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && onUnauthorized) {
      onUnauthorized();
    }
  }, [loading, user, onUnauthorized]);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!user) return <div className="p-6">Acceso restringido. Redirigiendo...</div>;

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user.user_metadata?.role || user.role || '').toString();
    if (!allowedRoles.includes(role)) {
      return <div className="p-6">No tienes permisos para ver esta página.</div>;
    }
  }
  return <>{children}</>;
}
