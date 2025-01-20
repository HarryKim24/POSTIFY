import { Router } from 'express';
import { upload } from '../utils/upload';
import authenticate from '../middleware/authMiddleware';
import User from '../models/User';

const router = Router();

router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ message: '이미지 업로드 성공', imageUrl });
  } catch (error: any) {
    console.error('이미지 업로드 에러:', error.message);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});

router.post('/profile-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    user.profileImage = imageUrl;
    await user.save();

    res.status(200).json({ message: '프로필 이미지 업로드 성공', imageUrl });
  } catch (error) {
    console.error('프로필 이미지 업로드 에러:', error);
    res.status(500).json({ error: '서버 에러' });
  }
});

export default router;
