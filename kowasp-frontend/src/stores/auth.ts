import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  _id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      login: (token, user) => {
        Cookies.set('kowasp-auth', token, { path: '/' });
        set({ token, user });
      },
      logout: () => {
        Cookies.remove('kowasp-auth');
        set({ token: null, user: null });
      },
    }),
    {
      name: 'kowasp-auth',
      onRehydrateStorage: () => {
        setTimeout(() => {
          useAuthStore.setState({ hydrated: true });
        }, 0);
      },
    }
  )
); 