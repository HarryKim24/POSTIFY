/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo } from 'react';
import API from '../utils/api';
import { Link } from 'react-router-dom';

const PostListPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular'>('all');
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const lastPostRef = useRef<HTMLLIElement | null>(null);

  const observer = useMemo(() => {
    return new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 1.0 }
    );
  }, [hasMore, loading]);

  const fetchPosts = async (searchQuery = '', filterQuery = 'all', pageNumber = 1) => {
    setLoading(true);
    try {
      const response = await API.get('/posts', {
        params: { search: searchQuery.trim(), filter: filterQuery, page: pageNumber },
      });
      if (pageNumber === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...response.data.posts]);
      }
      setHasMore(response.data.posts.length > 0);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || '게시글을 불러오는 중 문제가 발생했습니다.';
      setError(errorMessage);
      console.error('게시글 목록 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(search, filter, 1);
  }, [search, filter]);

  useEffect(() => {
    if (page > 1) {
      fetchPosts(search, filter, page);
    }
  }, [page, search, filter]);

  useEffect(() => {
    if (observer && lastPostRef.current) {
      observer.observe(lastPostRef.current);
    }
    return () => {
      if (observer && lastPostRef.current) {
        observer.unobserve(lastPostRef.current);
      }
    };
  }, [observer, lastPostRef.current]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchPosts(search, filter, 1);
  };

  const handleFilterChange = (newFilter: 'all' | 'popular') => {
    setSearch('');
    setFilter(newFilter);
    setPage(1);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              padding: '5px',
              marginRight: '10px',
              backgroundColor: '#f4f4f4',
              color: '#333',
              border: '1px solid #ccc',
              cursor: 'pointer',
            }}
          >
            초기화
          </button>
        )}
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
      {error && (
        <p
          style={{
            color: '#fff',
            backgroundColor: '#d9534f',
            padding: '10px',
            borderRadius: '5px',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}
      <ul>
        {posts.map((post: any, index) => (
          <li
            ref={index === posts.length - 1 ? lastPostRef : null}
            key={post._id}
            style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}
          >
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
      {loading && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <div
            className="spinner"
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f4f4f4',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
        </div>
      )}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          ▲
        </button>
      )}
    </div>
  );
};

export default PostListPage;
