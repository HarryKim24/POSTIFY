import { Router } from 'express';
import { upload } from '../utils/upload';

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

export default router;
