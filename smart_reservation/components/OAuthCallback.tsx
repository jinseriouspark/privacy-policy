import React, { useEffect, useState } from 'react';
import { handleOAuthCallback } from '../lib/google-oauth';
import { getSession, syncUserToDatabase, onAuthStateChange } from '../lib/supabase-auth';
import { getUserByEmail } from '../lib/supabase/database';
import { supabase } from '../lib/supabase/client';

// 커스텀 OAuth 사용 (Calendar scope 포함)
const USE_SUPABASE_OAUTH = false;

/**
 * OAuth Callback Handler
 * - Google에서 리디렉션된 후 처리
 * - Supabase OAuth 모드: 세션 확인 후 사용자 동기화
 * - 기존 모드: Authorization Code를 토큰으로 교환
 */
export default function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let processed = false;

    async function handleSession(session: any) {
      if (processed) return;
      processed = true;

      try {
        console.log('[OAuthCallback] Session received:', session.user.email);
        console.log('[OAuthCallback] Provider token:', session.provider_token ? 'EXISTS' : 'MISSING');

        // 사용자 DB 동기화
        await syncUserToDatabase(session);

        // DB에서 최신 사용자 정보 가져오기
        const user = await getUserByEmail(session.user.email!);

        setStatus('success');

        // 역할에 따라 리디렉션
        setTimeout(() => {
          if (!user?.primaryRole) {
            window.location.href = '/onboarding';
            return;
          }

          if (user.primaryRole === 'instructor' && !user.studio_name) {
            window.location.href = '/setup';
            return;
          }

          window.location.href = '/summary';
        }, 1000);
      } catch (err: any) {
        console.error('[OAuthCallback] handleSession error:', err);
        throw err;
      }
    }

    async function processCallback() {
      try {
        if (USE_SUPABASE_OAUTH) {
          // Supabase OAuth 모드: 세션 확인
          console.log('[OAuthCallback] Supabase OAuth mode');
          console.log('[OAuthCallback] URL hash:', window.location.hash ? 'EXISTS' : 'NONE');
          console.log('[OAuthCallback] URL search:', window.location.search);

          // onAuthStateChange로 세션 변경 감지
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[OAuthCallback] Auth state changed:', event);

            if (event === 'SIGNED_IN' && session) {
              await handleSession(session);
            }
          });
          unsubscribe = () => subscription.unsubscribe();

          // 이미 세션이 있는지 확인 (페이지 로드 시)
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user?.email) {
            await handleSession(session);
            return;
          }

          // 5초 후에도 세션이 없으면 에러 (implicit flow는 hash 처리 시간 필요)
          setTimeout(async () => {
            if (!processed) {
              // 한 번 더 세션 확인
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession?.user?.email) {
                await handleSession(retrySession);
                return;
              }

              setError('로그인 세션을 찾을 수 없습니다. 다시 시도해주세요');
              setStatus('error');
              setTimeout(() => {
                window.location.href = '/?error=oauth_timeout';
              }, 3000);
            }
          }, 3000);

        } else {
          // 기존 커스텀 OAuth 모드
          console.log('[OAuthCallback] Custom OAuth mode');

          const { user, token } = await handleOAuthCallback();

          setStatus('success');

          setTimeout(() => {
            // 초대 링크 등에서 저장한 리다이렉트 URL 확인
            const savedRedirect = sessionStorage.getItem('postLoginRedirect');
            if (savedRedirect) {
              sessionStorage.removeItem('postLoginRedirect');
              window.location.href = savedRedirect;
              return;
            }

            if (!user.primaryRole) {
              window.location.href = '/onboarding';
              return;
            }

            if (user.primaryRole === 'instructor' && !user.studio_name) {
              window.location.href = '/setup';
              return;
            }

            window.location.href = '/summary';
          }, 1000);
        }
      } catch (err: any) {
        console.error('[OAuthCallback] Error:', err);

        let friendlyMessage = '로그인 중 문제가 발생했습니다';

        if (err.message?.includes('invalid_client')) {
          friendlyMessage = 'Google 로그인 설정에 문제가 있습니다. 관리자에게 문의해주세요';
        } else if (err.message?.includes('redirect_uri_mismatch')) {
          friendlyMessage = '로그인 경로 설정에 문제가 있습니다. 관리자에게 문의해주세요';
        } else if (err.message?.includes('State verification failed')) {
          friendlyMessage = '보안 검증에 실패했습니다. 다시 시도해주세요';
        } else if (err.message?.includes('Token exchange failed')) {
          friendlyMessage = '인증 토큰 교환에 실패했습니다. 다시 시도해주세요';
        } else if (err.message?.includes('세션을 찾을 수 없습니다')) {
          friendlyMessage = '로그인 세션을 찾을 수 없습니다. 다시 시도해주세요';
        }

        setError(friendlyMessage);
        setStatus('error');

        setTimeout(() => {
          window.location.href = '/?error=oauth_failed';
        }, 3000);
      }
    }

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              로그인 처리 중...
            </h2>
            <p className="text-gray-600">
              잠시만 기다려주세요
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              로그인 성공!
            </h2>
            <p className="text-gray-600">
              대시보드로 이동합니다...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              로그인 실패
            </h2>
            <p className="text-gray-600 mb-4">
              {error || '알 수 없는 오류가 발생했습니다'}
            </p>
            <p className="text-sm text-gray-500">
              로그인 페이지로 돌아갑니다...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
