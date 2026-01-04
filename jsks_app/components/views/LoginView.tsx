
import React, { useState } from 'react';
import { googleAuthService } from '../../services/db';
import { UserRole, AppConfig } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
  appConfig: AppConfig | null;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, appConfig }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showMonkLogin, setShowMonkLogin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  const handleTitleClick = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount === 5) {
      setShowMonkLogin(true);
    }
  };

  const handleGoogleLogin = async (role: UserRole) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const user = await googleAuthService.signIn(role);
      onLoginSuccess(user);
    } catch (error) {
      console.error("Login failed", error);
      alert("로그인에 실패했습니다.\n" + (error instanceof Error ? error.message : ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonkLoginClick = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = () => {
    if (password === '108') {
      setShowPasswordModal(false);
      setPassword('');
      handleGoogleLogin('monk');
    } else {
      alert("암호가 올바르지 않습니다.");
      setPassword('');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPassword('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-20%] w-[250px] h-[250px] rounded-full bg-secondary/10 blur-3xl"></div>

      <div className="z-10 text-center flex flex-col items-center gap-8 w-full max-w-sm">
        
        <div className="space-y-3">
          {/* Easter Egg Trigger: Click 5 times to reveal admin button */}
          <h1
            onClick={handleTitleClick}
            className="text-3xl font-bold text-dark select-none cursor-pointer active:scale-95 transition-transform whitespace-pre-line"
          >
            {appConfig?.loginSubtitle || '마음을 닦는 수행의 길'}
          </h1>
        </div>

        <div className="w-full space-y-4">
          {/* Google Login - Official Button Style wrapper can be added if needed, sticking to custom for UI consistency */}
          <div id="google-login-btn"></div>
          <button 
            onClick={() => handleGoogleLogin('believer')}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-dark font-medium h-[60px] rounded-[16px] flex items-center justify-center gap-3 shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            <span className="text-[18px]">Google 계정으로 시작하기</span>
          </button>
          
          <div className="h-2"></div>

          {showMonkLogin && (
            <button
              onClick={handleMonkLoginClick}
              disabled={isLoading}
              className="w-full text-gray-400 font-medium text-sm py-2 hover:text-dark transition-colors animate-fade-in"
            >
              스님(관리자) 로그인
            </button>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          }}
          onClick={handlePasswordCancel}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform"
            style={{
              maxWidth: '90vw',
              WebkitTransform: 'translate3d(0,0,0)',
              transform: 'translate3d(0,0,0)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-dark mb-6 text-center">관리자 암호 입력</h3>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="암호를 입력하세요"
              autoFocus
              autoComplete="off"
              className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 mb-6 text-xl text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              style={{ fontSize: '20px' }}
            />
            <div className="flex gap-3">
              <button
                onClick={handlePasswordCancel}
                className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-dark font-semibold py-4 rounded-xl transition-colors text-lg"
              >
                취소
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginView;
