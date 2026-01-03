/**
 * JWT 토큰 생성/검증 유틸리티
 * - Google OAuth 구현을 위한 자체 JWT 토큰 시스템
 * - Supabase Auth 없이 독립적으로 작동
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d'; // 7일

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Base64 URL-safe encoding
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL-safe decoding
 */
function base64UrlDecode(str: string): string {
  // Pad with '=' to make length multiple of 4
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * HMAC SHA256 signature
 */
async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  // Use Web Crypto API (available in both Node and browsers)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * JWT 토큰 생성
 */
export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expirySeconds = parseExpiry(JWT_EXPIRY);

  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expirySeconds,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = await hmacSha256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * JWT 토큰 검증 및 디코딩
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const [encodedHeader, encodedPayload, providedSignature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !providedSignature) {
      return null;
    }

    // Verify signature
    const expectedSignature = await hmacSha256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

    if (expectedSignature !== providedSignature) {
      console.error('[verifyToken] Signature mismatch');
      return null;
    }

    // Decode payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('[verifyToken] Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[verifyToken] Error:', error);
    return null;
  }
}

/**
 * Parse expiry string (e.g., '7d', '24h', '60m')
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhm])$/);
  if (!match) return 7 * 24 * 60 * 60; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60;
    case 'h':
      return value * 60 * 60;
    case 'm':
      return value * 60;
    default:
      return value;
  }
}

/**
 * 토큰에서 사용자 ID 추출 (검증 없이)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const [, encodedPayload] = token.split('.');
    if (!encodedPayload) return null;

    return JSON.parse(base64UrlDecode(encodedPayload));
  } catch (error) {
    return null;
  }
}
