import { Router } from 'express';
import { upload } from '../utils/upload';
import authenticate from '../middleware/authMiddleware';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import User from '../models/User';
import Image from '../models/Image'; 

const router = Router();

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const filePath = path.resolve(req.file.path);
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    const existingImage = await Image.findOne({ hash });
    if (existingImage) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ message: '이미 존재하는 이미지입니다.', imageUrl: existingImage.url });
    }

    const newImage = new Image({
      url: `/uploads/${req.file.filename}`,
      hash,
    });
    await newImage.save();

    res.status(200).json({ message: '이미지 업로드 성공', imageUrl: newImage.url });
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

    const filePath = path.join(__dirname, '..', req.file.path);
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    const existingImage = await Image.findOne({ hash });
    let imageUrl: string;

    if (existingImage) {
      fs.unlinkSync(filePath);
      imageUrl = existingImage.url;
    } else {
      const newImage = new Image({
        url: `/uploads/${req.file.filename}`,
        hash,
      });
      await newImage.save();
      imageUrl = newImage.url;
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    user.profileImage = imageUrl;
    await user.save();

    res.status(200).json({ message: '프로필 이미지 업로드 성공', imageUrl });
  } catch (error: any) {
    console.error('프로필 이미지 업로드 에러:', error.message);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});

export default router;
