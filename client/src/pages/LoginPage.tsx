/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await API.post('/auth/login', formData);

      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('userId', response.data.user.id);

      setMessage('로그인에 성공했습니다!');
      console.log('로그인 성공:', response.data);

      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || '로그인에 실패했습니다.');
      console.error('로그인 에러:', error.response?.data);
    }
  };

  return (
    <div>
      <h1>로그인</h1>
      {message && <p style={{ color: message.includes('성공') ? 'green' : 'red' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">로그인</button>
      </form>
    </div>
  );
};

export default LoginPage;
