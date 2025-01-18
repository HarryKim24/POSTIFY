// server/routes/authRoutes.ts
import { Router, Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import RefreshToken, { IRefreshToken } from '../models/RefreshToken';
import authenticate from '../middleware/authMiddleware';
import { Types } from 'mongoose';

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
  return refreshToken;
};

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

router.post('/refresh-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh Token이 필요합니다.' });
      return;
    }

    const existingToken: IRefreshToken | null = await RefreshToken.findOne({ token: refreshToken });
    if (!existingToken) {
      res.status(403).json({ error: '유효하지 않은 Refresh Token입니다.' });
      return;
    }

    if (existingToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ token: refreshToken });
      res.status(403).json({ error: 'Refresh Token이 만료되었습니다.' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string);
    } catch (error) {
      res.status(403).json({ error: '유효하지 않은 Refresh Token입니다.' });
      return;
    }

    const userId: string = decoded.userId;

    const newAccessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    console.error('Refresh Token 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
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

router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증되지 않은 사용자입니다.' });
      return;
    }

    const user: IUser | null = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    res.status(200).json({ user });
  } catch (error: any) {
    console.error('사용자 정보 조회 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});

export default router;
