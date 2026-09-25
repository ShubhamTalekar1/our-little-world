import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

export const hashPassword = (pw) => bcrypt.hash(pw, 12);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash);

export const signToken = (user) => jwt.sign({ sub: user.id, v: user.tokenVersion }, config.jwtSecret, { expiresIn: config.jwtTtl });
export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

export const COOKIE = 'olw_session';
export const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: config.isProd, maxAge: 30 * 24 * 3600 * 1000, path: '/' };

export function tokenFrom(req) {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) return h.slice(7);
  return req.cookies?.[COOKIE] ?? null;
}
