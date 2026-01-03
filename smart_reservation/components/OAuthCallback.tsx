import React, { useEffect, useState } from 'react';
import { handleOAuthCallback } from '../lib/google-oauth';

/**
 * OAuth Callback Handler
 * - Google에서 리디렉션된 후 처리
 * - Authorization Code를 토큰으로 교환
 * - 사용자 세션 생성
 */
export default function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      try {
        console.log('[OAuthCallback] Processing OAuth callback...');
        console.log('[OAuthCallback] Current URL:', window.location.href);

        // OAuth callback 처리
        const { user, token } = await handleOAuthCallback();

        console.log('[OAuthCallback] Login successful');
        console.log('[OAuthCallback] User object:', JSON.stringify(user, null, 2));
        console.log('[OAuthCallback] Token saved:', !!token);
        console.log('[OAuthCallback] primaryRole:', user.primaryRole);
        console.log('[OAuthCallback] studio_name:', user.studio_name);

        setStatus('success');

        // 사용자 역할에 따라 리디렉션
        setTimeout(() => {
          // 역할이 없으면 온보딩으로
          if (!user.primaryRole) {
            console.log('[OAuthCallback] No role → Redirecting to /onboarding');
            window.location.href = '/onboarding';
            return;
          }

          // 강사이고 스튜디오 정보가 없으면 setup으로
          if (user.primaryRole === 'instructor' && !user.studio_name) {
            console.log('[OAuthCallback] Instructor without studio → Redirecting to /setup');
            window.location.href = '/setup';
            return;
          }

          // 그 외는 summary로
          console.log('[OAuthCallback] Has role → Redirecting to /summary');
          window.location.href = '/summary';
        }, 1000);
      } catch (err: any) {
        console.error('[OAuthCallback] Error:', err);
        setError(err.message || 'Login failed');
        setStatus('error');

        // 3초 후 로그인 페이지로 리디렉션
        setTimeout(() => {
          window.location.href = '/login';
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
