/**
 * JWT 토큰 생성/검증 유틸리티
 * - Google OAuth 구현을 위한 자체 JWT 토큰 시스템
 * - Supabase Auth 없이 독립적으로 작동
 *
 * NOTE: 브라우저에서는 검증 없이 디코딩만 수행
 * 실제 검증은 서버(api/auth/login.ts)에서만 이루어짐
 */

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Base64 URL-safe decoding (브라우저 호환)
 */
function base64UrlDecode(str: string): string {
  // Pad with '=' to make length multiple of 4
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');

  // 브라우저 환경
  if (typeof window !== 'undefined') {
    return decodeURIComponent(escape(atob(base64)));
  }

  // Node.js 환경
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * JWT 토큰 검증 및 디코딩 (클라이언트용)
 * - 서버에서 발급한 토큰의 만료 시간만 체크
 * - 서명 검증은 서버에서만 수행
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const [encodedHeader, encodedPayload, providedSignature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !providedSignature) {
      console.error('[verifyToken] Invalid token format');
      return null;
    }

    // Decode payload (서명 검증은 서버에서 했으므로 스킵)
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
 * 토큰에서 사용자 정보 추출 (검증 없이 디코딩만)
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
