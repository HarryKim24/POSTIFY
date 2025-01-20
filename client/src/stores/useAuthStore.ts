import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!localStorage.getItem('token'),
  login: () => set(() => ({ isLoggedIn: true })),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    set(() => ({ isLoggedIn: false }));
  },
}));
