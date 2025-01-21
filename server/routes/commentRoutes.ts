import { Router } from 'express';
import authenticate from '../middleware/authMiddleware';
import Comment from '../models/Comment';
import Post from '../models/Post';

const router = Router();

router.post('/:postId', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;
    const userId = (req as any).userId;

    if (!content) {
      return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    const comment = new Comment({ content, user: userId, post: postId });
    await comment.save();
    await comment.populate('user', 'username profileImage');

    res.status(201).json({ message: '댓글 작성 성공', comment });
  } catch (error) {
    console.error('댓글 작성 에러:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ comments });
  } catch (error) {
    console.error('댓글 조회 에러:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

router.delete('/:commentId', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).userId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({ error: '댓글 삭제 권한이 없습니다.' });
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: '댓글이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 에러:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

export default router;
