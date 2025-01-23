/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';

interface Comment {
  _id: string;
  content: string;
  user: {
    username: string;
    profileImage?: string | null;
  };
  createdAt: string;
}

const CommentList = ({ postId }: { postId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const response = await API.get(`/comments/${postId}`);
      setComments(response.data.comments);
    } catch (error: any) {
      setError('댓글을 불러오는 데 문제가 발생했습니다.');
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await API.post(`/comments/${postId}`, { content: newComment });
      setComments([response.data.comment, ...comments]);
      setNewComment('');
    } catch (error: any) {
      setError('댓글 작성에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('정말로 댓글을 삭제하시겠습니까?')) return;

    try {
      await API.delete(`/comments/${commentId}`);
      setComments(comments.filter((comment) => comment._id !== commentId));
    } catch (error: any) {
      setError('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      <h3>댓글</h3>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        {comments[0]?.user.profileImage && (
          <img
            src={`${import.meta.env.VITE_API_URL}${comments[0].user.profileImage}`}
            alt={`${comments[0]?.user.username}의 프로필 이미지`}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              marginRight: '10px',
            }}
          />
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요"
          style={{
            flexGrow: 1,
            marginRight: '10px',
            resize: 'none',
          }}
        />
        <button onClick={handleAddComment}>작성</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {comments.map((comment) => (
          <li
            key={comment._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            {comment.user.profileImage && (
              <img
                src={`${import.meta.env.VITE_API_URL}${comment.user.profileImage}`}
                alt={`${comment.user.username}의 프로필 이미지`}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  marginRight: '10px',
                }}
              />
            )}
            <div>
              <p>
                <strong>{comment.user.username}</strong>: {comment.content}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'gray' }}>
                {new Date(comment.createdAt).toLocaleString()}
              </p>
              <button
                onClick={() => handleDeleteComment(comment._id)}
                style={{ color: 'red' }}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommentList;
