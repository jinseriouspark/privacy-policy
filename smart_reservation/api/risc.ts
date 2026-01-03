import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Google RISC (Risk and Incident Sharing and Coordination) 엔드포인트
 * https://developers.google.com/identity/protocols/risc
 *
 * Google이 보안 이벤트를 알려주는 웹훅 엔드포인트
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[RISC] Received request:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  // GET 요청: 구성 정보 반환 (선택사항)
  if (req.method === 'GET') {
    return res.status(200).json({
      issuer: 'https://accounts.google.com',
      jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
      delivery: {
        delivery_methods_supported: ['https://schemas.openid.net/secevent/risc/delivery-method/push'],
      },
    });
  }

  // POST 요청: 보안 이벤트 수신
  if (req.method === 'POST') {
    try {
      const token = req.body;

      // JWT 토큰 검증 (실제 프로덕션에서는 Google 공개 키로 검증 필요)
      // 여기서는 간단히 이벤트 타입만 확인
      console.log('[RISC] Security Event Token:', token);

      // 이벤트 타입별 처리
      const events = token.events || {};

      // 계정 비활성화 이벤트
      if (events['https://schemas.openid.net/secevent/risc/event-type/account-disabled']) {
        const subject = token.sub; // Google User ID
        console.log(`[RISC] Account disabled: ${subject}`);

        // Supabase에서 해당 사용자 비활성화
        await handleAccountDisabled(subject);
      }

      // 계정 자격 증명 변경 이벤트
      if (events['https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required']) {
        const subject = token.sub;
        console.log(`[RISC] Credential change required: ${subject}`);

        // 사용자에게 재인증 요구
        await handleCredentialChangeRequired(subject);
      }

      // 세션 취소 이벤트
      if (events['https://schemas.openid.net/secevent/risc/event-type/sessions-revoked']) {
        const subject = token.sub;
        console.log(`[RISC] Sessions revoked: ${subject}`);

        // 모든 세션 무효화
        await handleSessionsRevoked(subject);
      }

      return res.status(202).json({ status: 'accepted' });
    } catch (error) {
      console.error('[RISC] Error processing event:', error);
      return res.status(400).json({ error: 'Invalid event' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * 계정 비활성화 처리
 */
async function handleAccountDisabled(googleUserId: string) {
  try {
    // Google User ID로 사용자 찾기
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('google_user_id', googleUserId)
      .single();

    if (user) {
      // 사용자 비활성화
      await supabase
        .from('users')
        .update({
          is_active: false,
          disabled_reason: 'Google account disabled',
          disabled_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      console.log(`[RISC] User ${user.id} disabled`);
    }
  } catch (error) {
    console.error('[RISC] Error handling account disabled:', error);
  }
}

/**
 * 자격 증명 변경 필요 처리
 */
async function handleCredentialChangeRequired(googleUserId: string) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('google_user_id', googleUserId)
      .single();

    if (user) {
      // 재인증 필요 플래그 설정
      await supabase
        .from('users')
        .update({
          requires_reauth: true,
          reauth_reason: 'Google credential change required',
        })
        .eq('id', user.id);

      console.log(`[RISC] User ${user.id} requires reauth`);
    }
  } catch (error) {
    console.error('[RISC] Error handling credential change:', error);
  }
}

/**
 * 세션 취소 처리
 */
async function handleSessionsRevoked(googleUserId: string) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('google_user_id', googleUserId)
      .single();

    if (user) {
      // 모든 활성 세션 무효화 (Supabase Auth 사용 시)
      // 실제 구현은 세션 관리 방식에 따라 다름

      console.log(`[RISC] Sessions revoked for user ${user.id}`);
    }
  } catch (error) {
    console.error('[RISC] Error handling sessions revoked:', error);
  }
}
