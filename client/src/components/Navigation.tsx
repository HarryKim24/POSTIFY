import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useEffect } from 'react';
import API from '../utils/api';

const Navigation = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BASE_URL || '';

  useEffect(() => {
    const checkAuthStatus = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          await API.get('/auth/me');
          login();
        } catch (error) {
          console.error('토큰 검증 실패:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    };
    checkAuthStatus();
  }, [login]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await API.post('/auth/logout', { refreshToken });
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: '#f4f4f4' }}>
      <Link to={`${baseURL}/`} style={{ textDecoration: 'none', color: '#007bff' }}>게시글 목록</Link>
      {isLoggedIn ? (
        <>
          <Link to={`${baseURL}/posts/create`} style={{ textDecoration: 'none', color: '#007bff' }}>게시글 작성</Link>
          <Link to={`${baseURL}/profile`} style={{ textDecoration: 'none', color: '#007bff' }}>내 프로필</Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            로그아웃
          </button>
        </>
      ) : (
        <>
          <Link to={`${baseURL}/login`} style={{ textDecoration: 'none', color: '#007bff' }}>로그인</Link>
          <Link to={`${baseURL}/register`} style={{ textDecoration: 'none', color: '#007bff' }}>회원가입</Link>
        </>
      )}
    </nav>
  );
};

export default Navigation;
