import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware';
import { v2 as cloudinary } from 'cloudinary';
import authenticate from '../middleware/authMiddleware';
import User, { IUser } from '../models/User';
import RefreshToken, { IRefreshToken } from '../models/RefreshToken';
import ResetToken from '../models/ResetToken';

const router = Router();

const generateRefreshToken = async (userId: string): Promise<string> => {
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: '7d' }
  );
  const tokenDoc: IRefreshToken = new RefreshToken({
    token: refreshToken,
    user: new Types.ObjectId(userId),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await tokenDoc.save();
  return refreshToken;{}
};


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: '모든 필드를 입력해주세요.' });
      return;
    }
    const existingUser: IUser | null = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
      return;
    }
    const existingUsername: IUser | null = await User.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ error: '이미 사용 중인 사용자 이름입니다.' });
      return;
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser: IUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    const token = jwt.sign(
      { userId: newUser._id.toString() }, 
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
    res.status(201).json({
      message: '회원가입 성공',
      token,
      user: {
        id: newUser._id.toString(), 
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});

router.delete('/delete-account', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }
    await RefreshToken.deleteMany({ user: userId });
    res.status(200).json({ message: '계정이 성공적으로 삭제되었습니다.' });
  } catch (error: any) {
    console.error('회원 탈퇴 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
      return;
    }
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: '이메일 또는 비밀번호가 일치하지 않습니다.' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: '이메일 또는 비밀번호가 일치하지 않습니다.' });
      return;
    }
    const accessToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
    );
    const refreshToken = await generateRefreshToken(user._id.toString());
    res.status(200).json({
      message: '로그인 성공',
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});

router.post('/refresh-token', async (req: Request, res: Response): Promise<Response<any, Record<string, any>> | void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh Token이 필요합니다.' });
    }

    const existingToken: IRefreshToken | null = await RefreshToken.findOne({ token: refreshToken });
    if (!existingToken) {
      return res.status(403).json({ error: '유효하지 않은 Refresh Token입니다.' });
    }

    if (existingToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ token: refreshToken });
      return res.status(403).json({ error: 'Refresh Token이 만료되었습니다.' });
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as { userId: string };
    } catch (error) {
      await RefreshToken.deleteOne({ token: refreshToken });
      return res.status(403).json({ error: '유효하지 않은 Refresh Token입니다.' });
    }

    const { userId } = decoded;

    const user = await User.findById(userId);
    if (!user) {
      await RefreshToken.deleteOne({ token: refreshToken });
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const newAccessToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      accessToken: newAccessToken,
      message: '새로운 Access Token이 발급되었습니다.',
    });
  } catch (error: any) {
    console.error('Refresh Token 에러:', error.message);
    return res.status(500).json({ error: '서버 에러', message: error.message });
  }
});



router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh Token이 필요합니다.' });
      return;
    }
    const deletedToken: IRefreshToken | null = await RefreshToken.findOneAndDelete({ token: refreshToken });
    if (!deletedToken) {
      res.status(403).json({ error: '유효하지 않은 Refresh Token입니다.' });
      return;
    }
    res.status(200).json({ message: '로그아웃 성공' });
  } catch (error: any) {
    console.error('로그아웃 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});

router.put('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { username, email } = req.body;
    if (!username || !email) {
      res.status(400).json({ error: '사용자 이름과 이메일은 필수 입력 항목입니다.' });
      return;
    }
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }
    user.username = username;
    user.email = email;
    await user.save();
    res.status(200).json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('프로필 업데이트 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
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

    if (user.profileImage?.public_id) {
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
