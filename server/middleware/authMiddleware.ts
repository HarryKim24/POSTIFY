import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Authorization 헤더가 없거나 잘못된 형식입니다.');
    res.status(401).json({ status: 'fail', error: 'Unauthorized', message: '인증 토큰이 필요합니다.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    res.status(500).json({ status: 'error', error: 'Server Error', message: '서버 설정 오류입니다.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('유효하지 않은 인증 토큰:', error);
    res.status(401).json({ status: 'fail', error: 'Unauthorized', message: '유효하지 않은 인증 토큰입니다.' });
  }
};

export default authenticate;
