import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { AuthContext, type AuthContextType } from './auth-context';

export const AuthProvider = ({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: AuthContextType 
}) => {
  const { user, userRole, setShowLoginModal } = value;
  const stableValue = useMemo(
    () => ({ user, userRole, setShowLoginModal }),
    [user, userRole, setShowLoginModal]
  );

  return (
    <AuthContext.Provider value={stableValue}>
      {children}
    </AuthContext.Provider>
  );
};