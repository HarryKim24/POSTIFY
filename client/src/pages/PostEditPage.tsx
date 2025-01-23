/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';

const PostEditPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    image: File | null;
  }>({
    title: '',
    content: '',
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/posts/${postId}`);
        const { title, content } = response.data;
        setFormData({ title, content, image: null });
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image ? '' : undefined;

      if (formData.image) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', formData.image);

        const uploadResponse = await API.post('/upload', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        imageUrl = uploadResponse.data.imageUrl;
      }

      const postPayload = {
        title: formData.title,
        content: formData.content,
        ...(imageUrl !== undefined && { imageUrl }),
      };

      await API.put(`/posts/${postId}`, postPayload);

      setMessage('게시글이 성공적으로 수정되었습니다.');
      setTimeout(() => navigate(`/posts/${postId}`), 1500);
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
          <label>이미지 업로드</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
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
