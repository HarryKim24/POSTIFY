// server/routes/authRoutes.ts
import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware';
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

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: '이메일을 입력해주세요.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: '해당 이메일을 사용하는 사용자가 없습니다.' });
      return;
    }

    await ResetToken.deleteMany({ user: user._id });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await ResetToken.create({
      token: hashedToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.status(200).json({
      message: '비밀번호 재설정 토큰이 생성되었습니다.',
      resetToken,
    });
  } catch (error: any) {
    console.error('비밀번호 재설정 요청 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});

router.post('/reset-password/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json({ error: '새 비밀번호를 입력해주세요.' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await ResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      res.status(400).json({ error: '유효하지 않은 또는 만료된 토큰입니다.' });
      return;
    }

    const user = await User.findById(resetToken.user);
    if (!user) {
      res.status(400).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    await ResetToken.deleteOne({ token: hashedToken });

    res.status(200).json({ message: '비밀번호가 성공적으로 재설정되었습니다.' });
  } catch (error: any) {
    console.error('비밀번호 재설정 에러:', error);
    res.status(500).json({ error: '서버 에러', message: error.message });
  }
});

router.put('/change-password', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: '비밀번호는 최소 8자 이상이어야 합니다.' });
      return;
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({ error: '새 비밀번호는 현재 비밀번호와 다르게 설정해야 합니다.' });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error: any) {
    console.error('비밀번호 변경 에러:', error);
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

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as {
      userId: string;
    };

    const userId = decoded.userId;

    const newAccessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET as string,
      { expiresIn: '1m' }
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

router.put('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { profileImage } = req.body;

    if (profileImage === undefined) {
      return res.status(400).json({ error: '업데이트할 프로필 이미지를 제공해주세요.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    user.profileImage = profileImage;
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
    console.error('프로필 이미지 업데이트 에러:', error);
    res.status(500).json({
      error: '서버 에러',
      message: process.env.NODE_ENV === 'development' ? error.message : '문제가 발생했습니다.',
    });
  }
});

router.put('/me/remove-profile-image', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    user.profileImage = null;
    await user.save();

    res.status(200).json({
      message: '프로필 이미지가 성공적으로 삭제되었습니다.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error: any) {
    console.error('프로필 이미지 삭제 에러:', error);
    res.status(500).json({
      error: '서버 에러',
      message: process.env.NODE_ENV === 'development' ? error.message : '문제가 발생했습니다.',
    });
  }
});


export default router;
