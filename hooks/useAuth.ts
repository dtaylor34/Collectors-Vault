import { useState, useEffect } from 'react';
import { onAuthChange, signIn, signUp, signOut, type User } from '../lib/db/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setState({ user, loading: false, error: null });
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const user = await signIn(email, password);
      setState({ user, loading: false, error: null });
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const user = await signUp(email, password);
      setState({ user, loading: false, error: null });
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setState({ user: null, loading: false, error: null });
  };

  return {
    ...state,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };
}
