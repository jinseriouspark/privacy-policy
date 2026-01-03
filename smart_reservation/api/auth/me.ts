import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// JWT 검증 함수 (서버용)
async function verifyJWT(token: string): Promise<any | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');

    if (!headerB64 || !payloadB64 || !signatureB64) {
      return null;
    }

    // Signature 검증
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (expectedSignature !== signatureB64) {
      console.error('[verifyJWT] Signature mismatch');
      return null;
    }

    // Payload 디코딩
    const payload = JSON.parse(
      Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );

    // Expiry 검증
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('[verifyJWT] Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[verifyJWT] Error:', error);
    return null;
  }
}

/**
 * 현재 사용자 정보 조회
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // JWT 검증
    const payload = await verifyJWT(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // DB에서 사용자 정보 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      console.error('[Me] User not found:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    // 역할 정보 조회
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role_name')
      .eq('user_id', user.id);

    const roleNames = roles?.map(r => r.role_name) || [];

    // 성공 응답
    return res.status(200).json({
      ...user,
      roles: roleNames,
    });
  } catch (error: any) {
    console.error('[Me] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
