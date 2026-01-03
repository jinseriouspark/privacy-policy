import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// 환경변수 헬퍼 함수
function getEnv(key: string): string {
  return process.env[key] || process.env[`VITE_${key}`] || '';
}

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`Missing Supabase config: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 기존 사용자의 Supabase Auth 세션 정보 반환
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // JWT 토큰에서 사용자 이메일 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    // JWT 디코딩 (간단한 검증)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const email = payload.email;

    if (!email) {
      return res.status(400).json({ error: 'Email not found in token' });
    }

    console.log('[RefreshSupabaseSession] Refreshing for:', email);

    // 사용자 이메일 기반 고정 비밀번호 생성
    const crypto = await import('crypto');
    const userPassword = crypto
      .createHmac('sha256', getEnv('JWT_SECRET'))
      .update(email + 'supabase-auth-password')
      .digest('hex');

    // 세션 정보 반환
    return res.status(200).json({
      supabaseSession: {
        email,
        password: userPassword
      }
    });
  } catch (error: any) {
    console.error('[RefreshSupabaseSession] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
