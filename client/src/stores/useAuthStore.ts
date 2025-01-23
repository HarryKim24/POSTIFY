import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ID_KEY = 'userId';

interface AuthState {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!localStorage.getItem(ACCESS_TOKEN_KEY),
  login: () => {
    set(() => ({ isLoggedIn: true }));
  },
  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    set(() => ({ isLoggedIn: false }));
  },
  checkAuth: () => {
    const tokenExists = !!localStorage.getItem(ACCESS_TOKEN_KEY);
    set(() => ({ isLoggedIn: tokenExists }));
  },
}));

window.addEventListener('storage', () => {
  const authStore = useAuthStore.getState();
  authStore.checkAuth();
});
