/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const PostCreatePage = () => {
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    image: File | null;
  }>({
    title: '',
    content: '',
    image: null,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';

      if (formData.image) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', formData.image);

        const uploadResponse = await API.post('/upload', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        imageUrl = uploadResponse.data.imageUrl;
      }

      const postPayload = {
        title: formData.title,
        content: formData.content,
        imageUrl,
      };

      await API.post('/posts', postPayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      setMessage('게시글이 성공적으로 작성되었습니다.');
      setFormData({ title: '', content: '', image: null });
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '게시글 작성 중 문제가 발생했습니다.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
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
          <label>이미지 업로드</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '작성 중...' : '작성하기'}
        </button>
      </form>
    </div>
  );
};

export default PostCreatePage;
