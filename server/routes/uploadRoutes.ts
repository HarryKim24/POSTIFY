import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import authenticate from '../middleware/authMiddleware';
import User from '../models/User';
import Image from '../models/Image';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});

export const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const { path: imageUrl } = req.file;

    const newImage = new Image({
      url: imageUrl,
      hash: req.file.filename,
    });
    await newImage.save();

    res.status(200).json({ message: '이미지 업로드 성공', imageUrl });
  } catch (error: any) {
    console.error('이미지 업로드 에러:', error.message);
    res.status(500).json({
      error: '서버 에러',
      message: error.message || '이미지 업로드 중 문제가 발생했습니다.',
    });
  }
});


router.post('/profile-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const imageUrl = {
      url: req.file.path,
      public_id: req.file.filename,
    };

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    if (user.profileImage?.public_id) {
      await cloudinary.uploader.destroy(user.profileImage.public_id);
    }

    user.profileImage = imageUrl;
    await user.save();

    res.status(200).json({ message: '프로필 이미지 업로드 성공', profileImage: user.profileImage });
  } catch (error: any) {
    console.error('프로필 이미지 업로드 에러:', error.message);
    res.status(500).json({
      error: '서버 에러',
      message: error.message || '이미지 업로드 중 문제가 발생했습니다.',
    });
  }
});


export default router;
