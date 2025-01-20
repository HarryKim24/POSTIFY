/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const PostCreatePage = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await API.post('/posts', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setMessage('게시글이 성공적으로 작성되었습니다.');
      console.log(response.data);
      setFormData({ title: '', content: '', imageUrl: '' });
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      setMessage(error.response?.data?.error || '게시글 작성 중 문제가 발생했습니다.');
      console.error(error.response?.data);
    }
  };

  return (
    <div>
      <h1>게시글 작성</h1>
      {message && <p style={{ color: message.includes('성공') ? 'green' : 'red' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>제목</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>내용</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>이미지 URL (선택)</label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
          />
        </div>
        <button type="submit">작성하기</button>
      </form>
    </div>
  );
};

export default PostCreatePage;
