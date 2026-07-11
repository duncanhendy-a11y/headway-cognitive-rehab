import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

// POC BYPASS — auth disabled for demonstration. Re-enable by restoring the
// original AuthContext with supabase.auth calls and removing this mock block.
const POC_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'poc@headway.org.uk',
  user_metadata: { full_name: 'POC User' },
} as unknown as User;

const POC_SESSION = { user: POC_USER } as unknown as Session;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{
      session: POC_SESSION,
      user: POC_USER,
      loading: false,
      signInWithMagicLink: async () => ({ error: null }),
      signOut: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
