/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import API from '../utils/api';
import { Link } from 'react-router-dom';

const PostListPage = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular'>('all');

  const fetchPosts = async (searchQuery = '', filterQuery = 'all') => {
    setLoading(true);
    try {
      const response = await API.get('/posts', {
        params: { search: searchQuery.trim(), filter: filterQuery },
      });
      setPosts(response.data.posts);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || '게시글을 불러오는 중 문제가 발생했습니다.';
      setError(errorMessage);
      console.error('게시글 목록 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSearch = () => {
    fetchPosts(search, filter);
  };

  const handleFilterChange = (newFilter: 'all' | 'popular') => {
    setSearch('');
    setFilter(newFilter);
    fetchPosts('', newFilter);
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <h1>게시글 목록</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색어를 입력하세요"
          style={{ padding: '5px', marginRight: '10px' }}
        />
        <button onClick={handleSearch} style={{ padding: '5px', marginRight: '10px' }}>
          검색
        </button>
        <button
          onClick={() => handleFilterChange('all')}
          style={{
            padding: '5px',
            marginRight: '10px',
            backgroundColor: filter === 'all' ? '#007bff' : '#f4f4f4',
            color: filter === 'all' ? 'white' : 'black',
            border: '1px solid #ccc',
          }}
        >
          전체 게시글
        </button>
        <button
          onClick={() => handleFilterChange('popular')}
          style={{
            padding: '5px',
            backgroundColor: filter === 'popular' ? '#007bff' : '#f4f4f4',
            color: filter === 'popular' ? 'white' : 'black',
            border: '1px solid #ccc',
          }}
        >
          인기글
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {posts.map((post: any) => (
          <li key={post._id} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <Link to={`/posts/${post._id}`}>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
              <div style={{ fontSize: '0.9rem', color: '#555' }}>
                <span>작성자: {post.user?.username || '알 수 없음'}</span>
                <br />
                <span>좋아요: {post.likes?.length || 0}</span>
                <br />
                <span>댓글 수: {post.commentsCount || 0}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostListPage;
