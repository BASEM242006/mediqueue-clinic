import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET ?? 'dev-secret';

export type TokenPayload = {
  userId: string;
  role: string;
  phone: string;
};

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}
