import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Notion OAuth Token Exchange (보안)
 * - Client Secret을 서버에서만 사용
 * - 클라이언트에서 직접 토큰 교환 방지
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
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code and userId are required' });
    }

    // 환경변수에서 Notion OAuth 설정 가져오기 (클라이언트에 노출 안 됨)
    const clientId = process.env.VITE_NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = `${process.env.NOTION_REDIRECT_URI || 'https://yeyak-mania.co.kr'}/notion-callback`;

    if (!clientId || !clientSecret) {
      console.error('[Notion OAuth] Missing Notion credentials');
      return res.status(500).json({ error: 'Notion OAuth not configured' });
    }

    // Notion OAuth 토큰 교환
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('[Notion OAuth] Token exchange error:', error);
      return res.status(tokenResponse.status).json({
        error: 'Failed to exchange authorization code',
        details: error,
      });
    }

    const tokenData = await tokenResponse.json();

    // Supabase에 Notion 토큰 저장
    const { error: updateError } = await supabase
      .from('settings')
      .update({
        notion_access_token: tokenData.access_token,
        notion_workspace_name: tokenData.workspace_name,
        notion_workspace_icon: tokenData.workspace_icon,
        notion_bot_id: tokenData.bot_id,
        notion_connected_at: new Date().toISOString(),
      })
      .eq('instructor_id', userId);

    if (updateError) {
      console.error('[Notion OAuth] Database update error:', updateError);
      return res.status(500).json({
        error: 'Failed to save Notion token',
        details: updateError,
      });
    }

    // 성공 응답
    return res.status(200).json({
      success: true,
      workspace_name: tokenData.workspace_name,
      workspace_icon: tokenData.workspace_icon,
      bot_id: tokenData.bot_id,
    });
  } catch (error: any) {
    console.error('[Notion OAuth] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
