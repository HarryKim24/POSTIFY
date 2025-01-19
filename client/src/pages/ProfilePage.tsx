/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
}

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      try {
        const response = await API.get('/auth/me');
        setUser(response.data.user);
      } catch (error: any) {
        setMessage(error.response?.data?.error || '사용자 정보를 가져올 수 없습니다.');
        console.error(error.response?.data);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말로 계정을 삭제하시겠습니까?')) {
      return;
    }
  
    try {
      const response = await API.delete('/auth/delete-account');
      alert('계정이 성공적으로 삭제되었습니다.');
      localStorage.removeItem('token');
      navigate('/register');
    } catch (error: any) {
      alert(error.response?.data?.error || '계정을 삭제하지 못했습니다.');
      console.error(error.response?.data);
    }
  };

  return (
    <div>
      <h1>프로필</h1>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      {user ? (
        <div>
          <p><strong>사용자 이름:</strong> {user.username}</p>
          <p><strong>이메일:</strong> {user.email}</p>
          <button onClick={handleLogout}>로그아웃</button>
          <button onClick={handleDeleteAccount} style={{ color: 'red' }}>
          회원 탈퇴
          </button>
        </div>
      ) : (
        !message && <p>로딩 중...</p>
      )}
    </div>
  );
};

export default ProfilePage;
