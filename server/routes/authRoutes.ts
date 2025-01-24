import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import authenticate from '../middleware/authMiddleware';
import User from '../models/User';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { profileImage } = req.body;

    if (!profileImage || !profileImage.url || !profileImage.public_id) {
      return res.status(400).json({ error: '업로드된 이미지 정보가 제공되지 않았습니다.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    if (user.profileImage && user.profileImage.public_id) {
      await cloudinary.uploader.destroy(user.profileImage.public_id);
    }

    user.profileImage = {
      url: profileImage.url,
      public_id: profileImage.public_id,
    };
    await user.save();

    res.status(200).json({
      message: '프로필 이미지가 성공적으로 업데이트되었습니다.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error: any) {
    console.error('프로필 이미지 업데이트 에러:', error.message);
    res.status(500).json({
      error: '서버 에러',
      message: error.message || '문제가 발생했습니다.',
    });
  }
});

router.put('/me/remove-profile-image', authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    if (user.profileImage?.public_id) {
      await cloudinary.uploader.destroy(user.profileImage.public_id);
    }

    user.profileImage = null;
    await user.save();

    res.status(200).json({
      message: '프로필 이미지가 성공적으로 삭제되었습니다.',
      profileImage: user.profileImage,
    });
  } catch (error: any) {
    console.error('프로필 이미지 삭제 에러:', error.message);
    res.status(500).json({
      error: '서버 에러',
      message: error.message || '이미지 삭제 중 문제가 발생했습니다.',
    });
  }
});

export default router;
