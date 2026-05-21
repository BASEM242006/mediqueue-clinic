import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

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

export function generateRefreshToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}
