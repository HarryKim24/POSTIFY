/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';

const PostEditPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/posts/${postId}`);
        const { title, content, imageUrl } = response.data;
        setFormData({ title, content, imageUrl });
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || '게시글 정보를 가져오는데 실패했습니다.';
        setMessage(errorMessage);
        console.error('게시글 가져오기 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put(`/posts/${postId}`, formData);
      setMessage('게시글이 성공적으로 수정되었습니다.');
      navigate(`/posts/${postId}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '게시글 수정에 실패했습니다.';
      setMessage(errorMessage);
      console.error('게시글 수정 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>게시글 수정</h1>
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
            disabled={loading}
          />
        </div>
        <div>
          <label>내용</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            disabled={loading}
          ></textarea>
        </div>
        <div>
          <label>이미지 URL</label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '수정 중...' : '수정 완료'}
        </button>
      </form>
    </div>
  );
};

export default PostEditPage;
