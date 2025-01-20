/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import API from '../utils/api';
import { Link } from 'react-router-dom';

const PostListPage = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true); // 로딩 시작
      try {
        const response = await API.get('/posts');
        setPosts(response.data.posts);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || '게시글을 불러오는 중 문제가 발생했습니다.';
        setError(errorMessage);
        console.error('게시글 목록 에러:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) return <div>로딩 중...</div>; 

  return (
    <div>
      <h1>게시글 목록</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {posts.map((post: any) => (
          <li key={post._id}>
            <Link to={`/posts/${post._id}`}>
              <h2>{post.title}</h2>
            </Link>
            <p>{post.content}</p>
            <span>작성자: {post.user?.username || '알 수 없음'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostListPage;
