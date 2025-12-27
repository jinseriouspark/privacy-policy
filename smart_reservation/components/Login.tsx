import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase/client';
import { signInWithGoogle, onAuthStateChange } from '../lib/supabase/auth';
import { getUserByEmail } from '../lib/supabase/database';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
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
  const [isDemo, setIsDemo] = useState(false);
  const [currentView, setCurrentView] = useState<LoginView>('login');
  const [googleUserData, setGoogleUserData] = useState<{email: string; name: string; picture?: string} | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    // 페이지 로드 시 세션 확인 (OAuth 콜백 처리)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleAuthCallback(session.user);
      }
    };

    checkSession();

    // Supabase Auth 상태 변경 감지
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleAuthCallback(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  const handleAuthCallback = async (authUser: any) => {
    setLoading(true);
    setError(null);

    try {
      const email = authUser.email;
      const name = authUser.user_metadata?.full_name || authUser.email;
      const picture = authUser.user_metadata?.avatar_url;

      // DB에서 사용자 조회
      const existingUser = await getUserByEmail(email);

      // 신규 사용자인 경우 회원가입 플로우로 이동
      if (!existingUser || !existingUser.user_type) {
        setGoogleUserData({
          email,
          name,
          picture
        });
        setCurrentView('signup');
        setLoading(false);
        return;
      }

      // 기존 사용자 로그인
      onLogin({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        picture: existingUser.picture,
        userType: existingUser.user_type,
        short_id: existingUser.short_id,
        bio: existingUser.bio,
        isProfileComplete: true
      } as User);
    } catch (err: any) {
      console.error(err);
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };


  // Show signup flow if user is new
  if (currentView === 'signup' && googleUserData) {
    return (
      <Signup
        googleUser={googleUserData}
        onComplete={onLogin}
        onBack={() => {
          setCurrentView('login');
          setGoogleUserData(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col space-y-6 py-8">
      {/* Login Buttons */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin h-10 w-10 text-orange-500 mb-3" />
            <p className="text-slate-500">연결 중...</p>
          </div>
        ) : isDemo ? (
           <div className="space-y-4">
             <div className="p-4 bg-amber-50 text-amber-900 text-sm rounded-2xl border border-amber-200">
               <strong>데모 모드</strong>
               <p className="mt-1 text-xs text-amber-700">
                 실제 Google 로그인을 사용하려면 constants.ts에서 GOOGLE_CLIENT_ID를 설정하세요.
               </p>
             </div>
             <button
               onClick={handleDemoLogin}
               className="w-full py-5 px-6 rounded-full bg-slate-900 text-white font-semibold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
             >
               데모로 시작하기
             </button>
           </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 px-6 rounded-full bg-white border-2 border-slate-300 hover:border-orange-400 hover:bg-orange-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 font-semibold text-slate-700"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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