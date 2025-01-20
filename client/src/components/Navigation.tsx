import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

const Navigation = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: '#f4f4f4' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>게시글 목록</Link>
      {isLoggedIn ? (
        <>
          <Link to="/posts/create" style={{ textDecoration: 'none', color: '#007bff' }}>게시글 작성</Link>
          <Link to="/profile" style={{ textDecoration: 'none', color: '#007bff' }}>내 프로필</Link>
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
          <Link to="/login" style={{ textDecoration: 'none', color: '#007bff' }}>로그인</Link>
          <Link to="/register" style={{ textDecoration: 'none', color: '#007bff' }}>회원가입</Link>
        </>
      )}
    </nav>
  );
};

export default Navigation;
