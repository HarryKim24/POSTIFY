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

      if (response.data && response.data.posts) {
        const newPosts = response.data.posts;

        if (pageNumber === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prevPosts) => [...prevPosts, ...newPosts]);
        }

        setHasMore(newPosts.length > 0);
      } else {
        throw new Error('Unexpected API response format');
      }
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

  if (loading && posts.length === 0) {
    return <p>로딩 중...</p>;
  }

  return (
    <div>
      <h1>게시글 목록</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색어를 입력하세요"
        />
        <button onClick={handleSearch}>검색</button>
        <button onClick={() => handleFilterChange('all')}>전체 게시글</button>
        <button onClick={() => handleFilterChange('popular')}>인기글</button>
      </div>
      <ul>
        {posts.map((post, index) => (
          <li ref={index === posts.length - 1 ? lastPostRef : null} key={post._id}>
            <Link to={`/posts/${post._id}`}>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
            </Link>
          </li>
        ))}
      </ul>
      {loading && <p>로딩 중...</p>}
      {showScrollToTop && <button onClick={scrollToTop}>▲</button>}
    </div>
  );
};

export default PostListPage;
