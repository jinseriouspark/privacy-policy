import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Google OAuth Token Exchange (서버 전용)
 * - Client Secret을 서버에서만 사용
 * - Authorization Code를 Access Token + ID Token으로 교환
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 설정
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
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'Code and redirectUri are required' });
    }

    // 환경변수에서 Google OAuth 설정 가져오기 (클라이언트에 노출 안 됨)
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET; // ⚠️ 서버 전용!

    if (!clientId || !clientSecret) {
      console.error('[Google OAuth] Missing Google credentials');
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    console.log('[Google OAuth] Exchanging code for tokens...');

    // Google OAuth 토큰 엔드포인트로 토큰 교환
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('[Google OAuth] Token exchange error:', error);
      return res.status(tokenResponse.status).json({
        error: 'Failed to exchange authorization code',
        details: error,
      });
    }

    const tokenData = await tokenResponse.json();

    console.log('[Google OAuth] Token exchange successful');

    // 성공 응답
    return res.status(200).json({
      access_token: tokenData.access_token,
      id_token: tokenData.id_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    });
  } catch (error: any) {
    console.error('[Google OAuth] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
