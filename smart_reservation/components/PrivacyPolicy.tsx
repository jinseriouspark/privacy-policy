import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Database, Calendar, Mail, Clock, Lock } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">뒤로 가기</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Shield size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">개인정보처리방침</h1>
                <p className="text-orange-100 mt-2">Privacy Policy</p>
              </div>
            </div>
            <p className="text-sm text-orange-100">최종 수정일: 2024년 12월 22일</p>
          </div>

          {/* Policy Content */}
          <div className="p-8 space-y-8">
            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Database size={20} className="text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">1. 수집하는 개인정보</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <p className="leading-relaxed">
                  예약매니아는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
                </p>
                <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">필수 정보</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>이메일 주소 (Google 계정 인증)</li>
                      <li>이름 (서비스 이용자 식별)</li>
                      <li>프로필 사진 (선택사항, Google 계정에서 제공)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Google Calendar API 관련 정보</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Google Calendar 일정 읽기 권한</li>
                      <li>Google Calendar 일정 생성/수정 권한</li>
                      <li>예약 일정 정보 (날짜, 시간, 제목, 설명)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">2. Google Calendar API 사용 목적</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <p className="leading-relaxed">
                  Google Calendar API는 다음 목적을 위해서만 사용됩니다:
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>강사의 예약 가능 시간 조회</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>학생의 예약 생성 및 일정 자동 추가</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>예약 변경 및 취소 시 일정 업데이트</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>예약 충돌 방지를 위한 일정 확인</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <h3 className="font-bold text-red-900 mb-3">❌ 다음 용도로는 절대 사용하지 않습니다:</h3>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li>• 제3자에게 Calendar 데이터 판매 또는 공유</li>
                    <li>• 광고 목적으로 Calendar 정보 활용</li>
                    <li>• 예약 관리 이외의 목적으로 일정 데이터 분석</li>
                    <li>• 사용자의 동의 없는 Calendar 정보 접근</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Lock size={20} className="text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">3. 개인정보 보관 및 보호</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">보관 기간</h3>
                    <p className="text-sm">
                      • 회원 탈퇴 시까지 보관<br />
                      • 탈퇴 후 즉시 삭제 (법령에 따른 보관 의무 제외)
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">보안 조치</h3>
                    <p className="text-sm">
                      • Supabase Row Level Security (RLS) 적용<br />
                      • Google OAuth 2.0 보안 인증<br />
                      • HTTPS 암호화 통신<br />
                      • 접근 권한 최소화 원칙
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail size={20} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">4. 이용자 권리</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <p className="leading-relaxed">
                  이용자는 언제든지 다음 권리를 행사할 수 있습니다:
                </p>
                <div className="grid gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-bold text-green-900 mb-2">개인정보 열람 및 수정</h3>
                    <p className="text-sm text-green-800">
                      프로필 페이지에서 언제든지 본인의 정보를 확인하고 수정할 수 있습니다.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-bold text-green-900 mb-2">Google 연동 해제</h3>
                    <p className="text-sm text-green-800">
                      Google 계정 설정에서 예약매니아 앱 액세스 권한을 언제든지 취소할 수 있습니다.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-bold text-green-900 mb-2">회원 탈퇴</h3>
                    <p className="text-sm text-green-800">
                      대시보드에서 회원 탈퇴를 요청하면 즉시 모든 개인정보가 삭제됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">5. 개인정보처리방침 변경</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <p className="leading-relaxed">
                  본 방침이 변경될 경우 웹사이트 공지사항을 통해 공지하며, 중요한 변경사항의 경우 이메일로 사전 통지합니다.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t-2 border-slate-200 pt-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. 문의</h2>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
                <p className="text-slate-700 mb-4">
                  개인정보처리방침에 대한 문의사항이 있으시면 아래로 연락 주시기 바랍니다:
                </p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><strong>서비스명:</strong> 예약매니아</p>
                  <p><strong>이메일:</strong> contact@traff-engine.com</p>
                  <p><strong>운영:</strong> 박진슬</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
