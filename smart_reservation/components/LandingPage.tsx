import React, { useState } from 'react';
import { Calendar, Users, TrendingUp, CheckCircle, ArrowRight, Menu, X } from 'lucide-react';
import PricingPage from './PricingPage';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import { signInWithGoogle } from '../lib/supabase/auth';

interface LandingPageProps {
  onLoginSuccess: (user: User) => void;
  onShowLogin: () => void;
}

declare global {
  interface Window {
    google: any;
  }
}

type LandingView = 'landing' | 'signup';

const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess, onShowLogin }) => {
  const [showPricing, setShowPricing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<LandingView>('landing');
  const [googleUserData, setGoogleUserData] = useState<{email: string; name: string; picture?: string} | null>(null);

  // useEffect removed - now using Supabase Auth directly

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    setError(null);

    try {
      const payload = decodeJwt(response.credential);
      if (!payload) throw new Error("인증 정보가 유효하지 않습니다.");

      // 먼저 로그인/회원가입 확인 (access token 없이)
      const result = await postToGAS<User & { isNewUser?: boolean }>({
        action: 'login',
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });

      // 신규 사용자인 경우 회원가입 플로우로 이동
      if (result.isNewUser || !result.userType) {
        setGoogleUserData({
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        });
        setCurrentView('signup');
        setLoading(false);
        return;
      }

      onLoginSuccess(result);
    } catch (err: any) {
      console.error(err);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // Supabase OAuth 리다이렉트가 자동으로 처리됩니다
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Show signup flow if user is new
  if (currentView === 'signup' && googleUserData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <Signup
            googleUser={googleUserData}
            onComplete={onLoginSuccess}
            onBack={() => {
              setCurrentView('landing');
              setGoogleUserData(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-500 bg-clip-text text-transparent">
                예약매니아
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                기능
              </a>
              <button
                onClick={() => setShowPricing(true)}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                가격
              </button>
              <a href="mailto:contact@traff-engine.com" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                문의
              </a>
              <button
                onClick={onShowLogin}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                로그인
              </button>
              <button
                onClick={handleGoogleLogin}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-600 transition-all shadow-lg"
              >
                무료로 시작
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium">
                  기능
                </a>
                <button
                  onClick={() => setShowPricing(true)}
                  className="text-slate-600 hover:text-slate-900 font-medium text-left"
                >
                  가격
                </button>
                <a href="mailto:contact@traff-engine.com" className="text-slate-600 hover:text-slate-900 font-medium">
                  문의
                </a>
                <button
                  onClick={onShowLogin}
                  className="text-slate-600 hover:text-slate-900 font-medium text-left"
                >
                  로그인
                </button>
                <button
                  onClick={handleGoogleLogin}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-500 text-white font-semibold rounded-full"
                >
                  무료로 시작
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
            간편한 예약 관리
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            스튜디오 운영을 위한 올인원 예약 관리 솔루션으로<br />
            쉽게 수업을 예약하고 관리하세요
          </p>
          <div className="flex flex-col items-center gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="animate-spin h-12 w-12 text-orange-500 mb-3" />
                <p className="text-slate-500">로그인 중...</p>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-500 text-white font-bold text-xl rounded-full hover:from-orange-600 hover:to-orange-600 transition-all shadow-xl hover:shadow-2xl flex items-center gap-3"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google로 시작하기
              </button>
            )}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm max-w-md">
                {error}
              </div>
            )}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            신용카드 필요 없음 · 언제든지 취소 가능
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              스튜디오 운영에 필요한 모든 기능
            </h2>
            <p className="text-xl text-slate-600">
              예약부터 결제, 통계까지 한 곳에서
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Calendar size={24} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">스마트 예약 시스템</h3>
              <p className="text-slate-600 leading-relaxed">
                1:1 개인 레슨부터 그룹 수업까지, 실시간 예약 관리와 자동 알림으로 예약 누락 걱정 없이 운영하세요.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Users size={24} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">회원 관리</h3>
              <p className="text-slate-600 leading-relaxed">
                수강권 관리, 출석 체크, 회원 정보 관리까지. 스튜디오 운영에 필요한 모든 회원 관리 기능을 제공합니다.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">실시간 통계</h3>
              <p className="text-slate-600 leading-relaxed">
                매출, 출석률, 인기 시간대 분석 등 스튜디오 운영에 필요한 인사이트를 실시간으로 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              왜 예약매니아를 선택해야 할까요?
            </h2>
          </div>

          <div className="space-y-6">
            {[
              '전화 응대 없이 자동으로 예약 접수',
              'Google 캘린더와 자동 동기화',
              '수강권 판매부터 관리까지 한 번에',
              '실시간 출석 체크로 수업 관리 간편화',
              '매출과 통계를 한눈에 파악',
              '모바일과 PC 모두에서 사용 가능'
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <CheckCircle size={24} className="text-orange-500 flex-shrink-0 mt-1" />
                <p className="text-lg text-slate-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-500 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            무료로 시작하고, 언제든지 업그레이드할 수 있습니다
          </p>
          <button
            onClick={handleGoogleLogin}
            className="px-10 py-5 bg-white text-orange-500 font-bold text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105"
          >
            무료로 시작하기
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">© 2025 예약매니아. All rights reserved.</p>
          <div className="mt-4 space-x-6">
            <button
              onClick={() => setShowTerms(true)}
              className="text-sm hover:text-white transition-colors"
            >
              이용약관
            </button>
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-sm hover:text-white transition-colors"
            >
              개인정보처리방침
            </button>
            <a href="mailto:contact@traff-engine.com" className="text-sm hover:text-white transition-colors">문의하기</a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showPricing && (
        <PricingPage
          onSelectPlan={(plan) => {
            setShowPricing(false);
            handleGoogleLogin();
          }}
          onClose={() => setShowPricing(false)}
        />
      )}
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default LandingPage;
