import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// JWT 생성 함수 (서버용)
async function generateJWT(payload: any): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  };

  const base64UrlEncode = (str: string) =>
    Buffer.from(str).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const crypto = await import('crypto');
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * 사용자 로그인 및 세션 생성
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      googleId,
      email,
      name,
      picture,
      accessToken,
      refreshToken,
      expiresAt,
    } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Email and Google ID are required' });
    }

    console.log('[Login] Processing login for:', email);

    // 사용자 조회 또는 생성 (upsert)
    const { data: user, error: upsertError } = await supabase
      .from('users')
      .upsert({
        email,
        name,
        picture,
        google_id: googleId,
        google_access_token: accessToken,
        google_refresh_token: refreshToken,
        google_token_expires_at: expiresAt,
      }, {
        onConflict: 'email',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('[Login] Upsert error:', upsertError);
      return res.status(500).json({ error: 'Failed to create/update user' });
    }

    console.log('[Login] User upserted:', user.id);

    // 사용자 역할 조회
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role_name')
      .eq('user_id', user.id);

    const primaryRole = roles && roles.length > 0 ? roles[0].role_name : null;

    console.log('[Login] User role:', primaryRole);

    // JWT 토큰 생성
    const token = await generateJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // 성공 응답 (primaryRole과 studio_name 포함)
    return res.status(200).json({
      user: {
        ...user,
        primaryRole,
      },
      token,
    });
  } catch (error: any) {
    console.error('[Login] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
