import mongoose from 'mongoose';
import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import Post, { IPost } from '../models/Post';
import Comment from '../models/Comment';
import authenticate, { AuthRequest } from '../middleware/authMiddleware';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    if (imageUrl && (!imageUrl.url || !imageUrl.public_id)) {
      return res.status(400).json({ error: '유효하지 않은 이미지 정보입니다.' });
    }

    const newPost: IPost = new Post({
      title,
      content,
      imageUrl: imageUrl || null,
      user: userId,
    });

    await newPost.save();
    await newPost.populate('user', 'username');

    res.status(201).json({ message: '포스트 작성 성공', post: newPost });
  } catch (error: any) {
    console.error('포스트 작성 에러:', error);
    res.status(500).json({
      error: '서버 에러',
      message: error.message || '문제가 발생했습니다. 다시 시도해주세요.',
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

    if (imageUrl) {
      if (!imageUrl.url || !imageUrl.public_id) {
        return res.status(400).json({ error: '유효하지 않은 이미지 정보입니다.' });
      }

      if (post.imageUrl && post.imageUrl.public_id) {
        await cloudinary.uploader.destroy(post.imageUrl.public_id);
      }

      post.imageUrl = imageUrl;
    }

    await post.save();

    res.status(200).json({ message: '게시글 수정 완료', post });
  } catch (error: any) {
    console.error('게시글 수정 에러:', error);

    res.status(500).json({
      error: '서버 에러',
      message: error.message || '문제가 발생했습니다. 다시 시도해주세요.',
    });
  }
});

router.delete('/:postId', authenticate, async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = (req as any).userId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({ error: '게시글을 삭제할 권한이 없습니다.' });
    }

    if (post.imageUrl && post.imageUrl.public_id) {
      await cloudinary.uploader.destroy(post.imageUrl.public_id);
    }

    await Comment.deleteMany({ post: postId });
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: '게시글과 관련된 댓글들이 모두 삭제되었습니다.' });
  } catch (error: any) {
    console.error('게시글 삭제 에러:', error);

    res.status(500).json({
      error: '서버 에러',
      message: error.message || '문제가 발생했습니다. 다시 시도해주세요.',
    });
  }
});

router.put('/:postId/like', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    if (post.likes.some((id) => id.equals(userId))) {
      post.likes = post.likes.filter((id) => !id.equals(userId));
    } else {
      post.likes.push(userId);
      post.dislikes = post.dislikes.filter((id) => !id.equals(userId));
    }

    await post.save();
    res.status(200).json({ message: '좋아요 업데이트 성공', likes: post.likes, dislikes: post.dislikes });
  } catch (error) {
    console.error('좋아요 업데이트 에러:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

router.put('/:postId/dislike', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    if (post.dislikes.some((id) => id.equals(userId))) {
      post.dislikes = post.dislikes.filter((id) => !id.equals(userId));
    } else {
      post.dislikes.push(userId);
      post.likes = post.likes.filter((id) => !id.equals(userId));
    }

    await post.save();
    res.status(200).json({ message: '싫어요 업데이트 성공', likes: post.likes, dislikes: post.dislikes });
  } catch (error) {
    console.error('싫어요 업데이트 에러:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

export default router;
