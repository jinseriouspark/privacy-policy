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
    const { code, userId, redirectUri: clientRedirectUri } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code and userId are required' });
    }

    // 환경변수에서 Notion OAuth 설정 가져오기 (클라이언트에 노출 안 됨)
    const clientId = process.env.VITE_NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    // 클라이언트가 보낸 redirect_uri 우선 사용 (OAuth 인가 요청과 동일해야 함)
    // 없으면 환경변수 fallback
    const redirectUri = clientRedirectUri
      || (() => {
        const raw = (process.env.NOTION_REDIRECT_URI || 'https://yeyak-mania.co.kr').trim();
        return raw.includes('/notion-callback') ? raw : `${raw}/notion-callback`;
      })();

    console.log('[Notion OAuth] redirectUri:', redirectUri);
    console.log('[Notion OAuth] clientId present:', !!clientId);
    console.log('[Notion OAuth] clientSecret present:', !!clientSecret);

    if (!clientId || !clientSecret) {
      console.error('[Notion OAuth] Missing Notion credentials');
      return res.status(500).json({
        error: 'Notion OAuth not configured',
        debug: { hasClientId: !!clientId, hasClientSecret: !!clientSecret }
      });
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
        debug: {
          redirectUri,
          clientIdPrefix: clientId?.substring(0, 8),
          secretPrefix: clientSecret?.substring(0, 12),
        }
      });
    }

    const tokenData = await tokenResponse.json();

    // Supabase에 Notion 토큰 저장 (upsert: settings 행이 없어도 생성)
    const { error: updateError } = await supabase
      .from('settings')
      .upsert({
        instructor_id: userId,
        notion_access_token: tokenData.access_token,
        notion_workspace_name: tokenData.workspace_name,
        notion_workspace_icon: tokenData.workspace_icon,
        notion_bot_id: tokenData.bot_id,
        notion_connected_at: new Date().toISOString(),
      }, { onConflict: 'instructor_id' });

    if (updateError) {
      console.error('[Notion OAuth] Database update error:', updateError);
      return res.status(500).json({
        error: 'Failed to save Notion token',
        details: updateError,
      });
    }

    // 서버에서 Notion DB 2개 생성 (access_token이 서버 밖으로 나가지 않음)
    const accessToken = tokenData.access_token;
    let baseDatabaseId = '';
    let advancedDatabaseId = '';

    try {
      // Base DB 생성 (상담 기록)
      const baseDbRes = await fetch('https://api.notion.com/v1/databases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { type: 'workspace', workspace: true },
          title: [{ type: 'text', text: { content: '상담 기록 - Base (예약매니아)' } }],
          icon: { type: 'emoji', emoji: '💬' },
          properties: {
            '제목': { title: {} },
            '학생 이름': { rich_text: {} },
            '날짜': { date: {} },
            '내용': { rich_text: {} },
            '태그': {
              multi_select: {
                options: [
                  { name: '상담', color: 'blue' },
                  { name: '피드백', color: 'green' },
                  { name: '수업 계획', color: 'purple' },
                  { name: '목표 설정', color: 'pink' },
                  { name: '진도 체크', color: 'orange' },
                  { name: '부상/통증', color: 'red' },
                ],
              },
            },
          },
        }),
      });

      if (baseDbRes.ok) {
        const baseDb = await baseDbRes.json();
        baseDatabaseId = baseDb.id;
        console.log('[Notion OAuth] Base DB created:', baseDatabaseId);
      } else {
        const baseErr = await baseDbRes.json();
        console.error('[Notion OAuth] Base DB creation failed:', baseErr);
      }

      // Advanced DB 생성 (수업 노트)
      const advDbRes = await fetch('https://api.notion.com/v1/databases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { type: 'workspace', workspace: true },
          title: [{ type: 'text', text: { content: '수업 노트 - Advanced (예약매니아)' } }],
          icon: { type: 'emoji', emoji: '📝' },
          properties: {
            '제목': { title: {} },
            '학생 이름': { rich_text: {} },
            '날짜': { date: {} },
            '코치 업종': {
              select: {
                options: [
                  { name: '필라테스', color: 'purple' },
                  { name: '요가', color: 'pink' },
                  { name: '피트니스', color: 'orange' },
                  { name: '음악', color: 'blue' },
                  { name: '언어', color: 'green' },
                  { name: '미술', color: 'yellow' },
                  { name: '댄스', color: 'red' },
                  { name: '기타', color: 'gray' },
                ],
              },
            },
            '수업 내용': { rich_text: {} },
            '학생 상태/목표': { rich_text: {} },
            '주요 피드백': { rich_text: {} },
            '숙제': { rich_text: {} },
            '다음 계획': { rich_text: {} },
            '출석 상태': {
              select: {
                options: [
                  { name: '출석', color: 'green' },
                  { name: '결석', color: 'red' },
                  { name: '지각', color: 'yellow' },
                ],
              },
            },
            '녹화 링크': { url: {} },
            '녹화 텍스트': { rich_text: {} },
            'AI 분석': { rich_text: {} },
            '진전도': {
              select: {
                options: [
                  { name: '매우 우수', color: 'green' },
                  { name: '우수', color: 'blue' },
                  { name: '보통', color: 'yellow' },
                  { name: '개선 필요', color: 'orange' },
                  { name: '많은 개선 필요', color: 'red' },
                ],
              },
            },
          },
        }),
      });

      if (advDbRes.ok) {
        const advDb = await advDbRes.json();
        advancedDatabaseId = advDb.id;
        console.log('[Notion OAuth] Advanced DB created:', advancedDatabaseId);
      } else {
        const advErr = await advDbRes.json();
        console.error('[Notion OAuth] Advanced DB creation failed:', advErr);
      }
    } catch (dbError: any) {
      console.error('[Notion OAuth] DB creation error:', dbError.message);
      // DB 생성 실패해도 연동 자체는 성공 처리
    }

    // DB ID 저장 (service_role이므로 RLS 무관)
    if (advancedDatabaseId) {
      const { error: dbIdError } = await supabase
        .from('settings')
        .update({
          notion_database_id: advancedDatabaseId,
          updated_at: new Date().toISOString(),
        })
        .eq('instructor_id', userId);

      if (dbIdError) {
        console.error('[Notion OAuth] DB ID save error:', dbIdError);
      }
    }

    // 성공 응답 (access_token 제거 - 서버 밖 노출 차단)
    return res.status(200).json({
      success: true,
      workspace_name: tokenData.workspace_name,
      workspace_icon: tokenData.workspace_icon,
    });
  } catch (error: any) {
    console.error('[Notion OAuth] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
