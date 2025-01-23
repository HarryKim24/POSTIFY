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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
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
    if (!window.confirm('정말로 게시글을 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      await API.delete(`/posts/${postId}`);
      setMessage('게시글이 성공적으로 삭제되었습니다.');
      setTimeout(() => navigate('/'), 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '게시글 삭제에 실패했습니다.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    try {
      const response = await API.put(`/posts/${postId}/${reactionType}`);
      setPost({ ...post, likes: response.data.likes, dislikes: response.data.dislikes });
    } catch (error: any) {
      console.error(`${reactionType === 'like' ? '좋아요' : '싫어요'} 요청 에러:`, error.response?.data || error.message);
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  return (
    <div>
      <h1>게시글 상세</h1>
      {message && <p style={{ color: message.includes('성공') ? 'green' : 'red' }}>{message}</p>}

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        {post.user?.profileImage ? (
          <img
            src={post.user.profileImage.startsWith('http') ? post.user.profileImage : `${import.meta.env.VITE_API_URL}${post.user.profileImage}`}
            alt={post.user.username || '익명 사용자'}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              marginRight: '10px',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              marginRight: '10px',
              backgroundColor: '#ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            {post.user?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <strong>{post.user?.username || '알 수 없음'}</strong>
      </div>

      <h2>{post.title}</h2>
      <p>{post.content}</p>
      {post.imageUrl && (
        <img
          src={post.imageUrl.startsWith('http') ? post.imageUrl : `${import.meta.env.VITE_API_URL}${post.imageUrl}`}
          alt="게시글 이미지"
          style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'cover' }}
        />
      )}
      <div>
        <button onClick={() => handleReaction('like')}>
          👍 좋아요 ({post.likes?.length || 0})
        </button>
        <button onClick={() => handleReaction('dislike')} style={{ marginLeft: '10px' }}>
          👎 싫어요 ({post.dislikes?.length || 0})
        </button>
      </div>

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
