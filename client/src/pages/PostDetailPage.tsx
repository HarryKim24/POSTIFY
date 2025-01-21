/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import CommentList from '../components/CommentList';

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/posts/${postId}`);
        setPost(response.data);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || '게시글을 불러오는데 실패했습니다.';
        setMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const currentUserId = localStorage.getItem('userId');

  const handleDelete = async () => {
    if (!window.confirm('정말로 게시글을 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      await API.delete(`/posts/${postId}`);
      setMessage('게시글이 성공적으로 삭제되었습니다.');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '게시글 삭제에 실패했습니다.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  return (
    <div>
      <h1>게시글 상세</h1>
      {message && <p style={{ color: message.includes('성공') ? 'green' : 'red' }}>{message}</p>}
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <img
        src={
          post.imageUrl.startsWith('http') 
            ? post.imageUrl
            : `http://localhost:3000${post.imageUrl}`
        }
        alt={post.title}
        style={{
          maxWidth: '300px',
          maxHeight: '300px',
          objectFit: 'cover',
        }}
      />
      <p>작성자: {post.user?.username || '알 수 없음'}</p>

      {post.user?._id === currentUserId && (
        <div>
          <button onClick={() => navigate(`/posts/edit/${postId}`)}>수정</button>
          <button onClick={handleDelete} style={{ marginLeft: '10px' }}>
            삭제
          </button>
        </div>
      )}

      <CommentList postId={postId!} />
    </div>
  );
};

export default PostDetailPage;
