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
            <div className="flex items-center gap-3">
              <img src="/yak-logo.png" alt="yAK" className="h-8" />
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
                onClick={handleGoogleLogin}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                로그인
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
                  onClick={handleGoogleLogin}
                  className="text-slate-600 hover:text-slate-900 font-medium text-left"
                >
                  로그인
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
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto">
            스튜디오 운영을 위한 올인원 예약 관리 솔루션으로<br />
            쉽게 수업을 예약하고 관리하세요
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGoogleLogin}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-full transition-all transform hover:scale-105 shadow-lg"
            >
              구글로 시작하기
            </button>
            <button
              onClick={() => window.location.href = '/?demo=true'}
              className="px-8 py-4 bg-white hover:bg-slate-50 text-orange-500 font-bold text-lg rounded-full transition-all transform hover:scale-105 shadow-lg border-2 border-orange-500"
            >
              데모 체험하기
            </button>
          </div>
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
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp size={24} className="text-orange-600" />
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
              '수강권 판매부터 관리까지 한 번에 (지원예정)',
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
        <div className="max-w-7xl mx-auto">
          {/* 사업자 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* 회사 정보 */}
            <div>
              <h3 className="text-white font-bold mb-4">사업자 정보</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">상호명:</span> 트래픽엔진</p>
                <p><span className="text-slate-500">대표자명:</span> 박진슬</p>
                <p><span className="text-slate-500">사업자등록번호:</span> 867-13-02930</p>
                <p><span className="text-slate-500">사업장 주소:</span> 서울특별시 양천구 목동중앙본로22길</p>
                <p><span className="text-slate-500">전화번호:</span> 010-3265-5939</p>
                <p><span className="text-slate-500">이메일:</span> contact@traff-engine.com</p>
                <p><span className="text-slate-500">통신판매업 신고:</span> 제2025-서울양천-1208호</p>
              </div>
            </div>

            {/* 고객 지원 */}
            <div>
              <h3 className="text-white font-bold mb-4">고객 지원</h3>
              <div className="space-y-2 text-sm">
                <p>평일 17:00 - 24:00</p>
                <p className="text-slate-500">(주말 및 공휴일 휴무)</p>
                <p className="mt-4">이메일: contact@traff-engine.com</p>
                <p>카카오톡: @traffic-engine</p>
              </div>
            </div>

            {/* 바로가기 */}
            <div>
              <h3 className="text-white font-bold mb-4">바로가기</h3>
              <div className="space-y-2 text-sm">
                <a
                  href="/terms"
                  className="block hover:text-white transition-colors"
                >
                  이용약관
                </a>
                <a
                  href="/privacy"
                  className="block hover:text-white transition-colors"
                >
                  개인정보처리방침
                </a>
                <button
                  onClick={() => setShowPricing(true)}
                  className="block hover:text-white transition-colors text-left"
                >
                  요금안내
                </button>
                <a href="mailto:contact@traff-engine.com" className="block hover:text-white transition-colors">
                  제휴문의
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-slate-800 text-center text-sm">
            <p>© 2025 트래픽엔진. All rights reserved.</p>
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
      {showTerms && <TermsOfService onBack={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onBack={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default LandingPage;
