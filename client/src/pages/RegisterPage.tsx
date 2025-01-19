/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
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
      const response = await API.post('/auth/register', formData);
      setMessage('회원가입이 성공적으로 완료되었습니다.');
      console.log(response.data);

      setFormData({ username: '', email: '', password: '' });

      setTimeout(() => navigate('/login'), 1000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || '회원가입에 실패했습니다.');
      console.error(error.response?.data);
    }
  };

  return (
    <div>
      <h1>회원가입</h1>
      {message && <p style={{ color: message.includes('성공') ? 'green' : 'red' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>사용자 이름</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
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
        <button type="submit">회원가입</button>
      </form>
    </div>
  );
};

export default RegisterPage;
