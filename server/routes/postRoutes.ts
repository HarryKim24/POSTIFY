import { Router, Request, Response } from 'express';
import Post, { IPost } from '../models/Post';
import authenticate from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { title, content, imageUrl } = req.body;
    const userId = (req as any).userId;

    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
    }
    if (title.length > 100) {
      return res.status(400).json({ error: '제목은 100자 이내로 입력해주세요.' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ error: '내용은 1000자 이내로 입력해주세요.' });
    }

    const newPost: IPost = new Post({
      title,
      content,
      imageUrl,
      user: userId,
    });

    await newPost.save();
    await newPost.populate('user', 'username');

    res.status(201).json({ message: '포스트 작성 성공', post: newPost });
  } catch (error: any) {
    console.error('포스트 작성 에러:', error);
    res.status(500).json({
      error: '서버 에러',
      message: process.env.NODE_ENV === 'development' ? error.message : '문제가 발생했습니다. 다시 시도해주세요.',
    });
  }
});

router.get('/', async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const posts = await Post.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit) 
      .limit(+limit);

    const total = await Post.countDocuments();

    res.status(200).json({ posts, total, page: +page, limit: +limit });
  } catch (error) {
    console.error('게시글 목록 조회 에러:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: '서버 에러',
        message: process.env.NODE_ENV === 'development' ? error.message : '문제가 발생했습니다. 다시 시도해주세요.',
      });
    } else {
      res.status(500).json({
        error: '서버 에러',
        message: '알 수 없는 문제가 발생했습니다.',
      });
    }
  }
});

router.get('/:postId', async (req: Request, res: Response) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).populate('user', 'username');
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error('게시글 상세 조회 에러:', error);

    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

    res.status(500).json({
      error: '서버 에러',
      message: process.env.NODE_ENV === 'development' ? errorMessage : '문제가 발생했습니다. 다시 시도해주세요.',
    });
  }
});

router.put('/:postId', authenticate, async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { title, content, imageUrl } = req.body;
  const userId = (req as any).userId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({ error: '수정 권한이 없습니다.' });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    if (imageUrl) post.imageUrl = imageUrl;

    await post.save();

    res.status(200).json({ message: '게시글 수정 완료', post });
  } catch (error: any) {
    console.error('게시글 수정 에러:', error);
    res.status(500).json({
      error: '서버 에러',
      message: process.env.NODE_ENV === 'development' ? error.message : '문제가 발생했습니다. 다시 시도해주세요.',
    });
  }
});

export default router;