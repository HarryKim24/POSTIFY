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

    const newPost: IPost = new Post({
      title,
      content,
      imageUrl,
      user: userId,
    });

    await newPost.save();

    res.status(201).json({ message: '포스트 작성 성공', post: newPost });
  } catch (error: any) {
    console.error('포스트 작성 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});

export default router;