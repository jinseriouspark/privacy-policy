import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { signInWithGoogle } from '../lib/google-oauth';
import { Loader2, AlertCircle } from 'lucide-react';
import Signup from './Signup';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';

interface LoginProps {
  onLogin: (user: User) => void;
}

type LoginView = 'login' | 'signup';

// TypeScript용 전역 google 객체 선언
declare global {
  interface Window {
    google: any;
  }
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // 앱 내 브라우저 감지
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor;
    const inApp = /KAKAOTALK|Instagram|FBAN|FBAV|Twitter|Line|WebView|(iPhone|iPod|iPad)(?!.*Safari)/.test(ua);
    setIsInAppBrowser(inApp);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 새로운 OAuth 시스템 사용 (Google 페이지로 리디렉션)
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };



  return (
    <div className="flex flex-col space-y-6 py-8">
      {/* Login Buttons */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin h-10 w-10 text-orange-500 mb-3" />
            <p className="text-slate-500">연결 중...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isInAppBrowser && (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">앱 내 브라우저에서는 로그인할 수 없습니다</p>
                    <p className="text-xs text-orange-700 mb-2">
                      <strong>Safari 또는 Chrome</strong>에서 열어주세요<br/>
                      (우측 상단 ⋮ 메뉴 → 외부 브라우저에서 열기)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Google 로그인 안내</p>
                  <p className="text-blue-700 leading-relaxed">
                    • <strong>"Google에서 확인하지 않은 앱"</strong> 메시지가 나오면:<br/>
                    &nbsp;&nbsp;→ <strong>"고급"</strong> 버튼 클릭<br/>
                    &nbsp;&nbsp;→ 하단의 링크를 클릭하여 계속 진행해주세요<br/>
                    <br/>
                    • <strong>카카오톡, 인스타그램 등 앱 내 브라우저</strong>는 사용 불가<br/>
                    &nbsp;&nbsp;→ Safari 또는 Chrome 앱에서 접속해주세요
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleGoogleLogin}
              disabled={isInAppBrowser}
              className={`w-full py-4 px-6 rounded-full bg-white border-2 transition-all shadow-md flex items-center justify-center gap-3 font-semibold ${
                isInAppBrowser
                  ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'border-slate-300 hover:border-orange-400 hover:bg-orange-50 hover:shadow-lg text-slate-700'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill={isInAppBrowser ? "#CBD5E1" : "#4285F4"}/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={isInAppBrowser ? "#CBD5E1" : "#34A853"}/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={isInAppBrowser ? "#CBD5E1" : "#FBBC05"}/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={isInAppBrowser ? "#CBD5E1" : "#EA4335"}/>
              </svg>
              Google로 계속하기
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-slate-400">
          로그인 시{' '}
          <button
            onClick={() => setShowTerms(true)}
            className="underline hover:text-slate-600"
          >
            이용약관
          </button>
          {' '}및{' '}
          <button
            onClick={() => setShowPrivacy(true)}
            className="underline hover:text-slate-600"
          >
            개인정보처리방침
          </button>
          에 동의하게 됩니다.
        </p>
      </div>

      {/* Modals */}
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default Login;