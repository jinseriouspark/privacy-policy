import React from 'react';
import { ArrowLeft, FileText, Users, Calendar, Shield, AlertCircle, Ban } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
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
                <FileText size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">이용약관</h1>
                <p className="text-orange-100 mt-2">Terms of Service</p>
              </div>
            </div>
            <p className="text-sm text-orange-100">최종 수정일: 2024년 12월 22일</p>
          </div>

          {/* Terms Content */}
          <div className="p-8 space-y-8">
            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">1. 서비스 정의</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <p className="leading-relaxed">
                  <strong>예약매니아</strong>(이하 "서비스")는 강사와 학생 간의 레슨 예약을 관리하는 플랫폼입니다.
                </p>
                <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                  <h3 className="font-bold text-slate-900 mb-3">서비스 주요 기능</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>강사의 Google Calendar 연동을 통한 예약 가능 시간 관리</li>
                    <li>학생의 온라인 예약 및 결제</li>
                    <li>예약 자동 확인 및 캘린더 동기화</li>
                    <li>코칭별 독립적인 예약 시스템 운영</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">2. 회원 가입 및 계정</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">2.1 회원 자격</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                      <li>Google 계정을 보유한 만 14세 이상의 개인</li>
                      <li>법인의 경우 대표자 또는 권한 있는 담당자</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">2.2 계정 책임</h3>
                    <p className="text-sm text-blue-800">
                      회원은 본인의 계정 정보를 안전하게 관리할 책임이 있으며, 계정을 통해 발생한 모든 활동에 대해 책임을 집니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">3. Google Calendar 연동</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <div className="bg-purple-50 rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">3.1 Calendar API 권한</h3>
                    <p className="text-sm mb-3">
                      서비스는 다음 권한을 요청합니다:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><code className="bg-slate-200 px-2 py-1 rounded text-xs">calendar.events.readonly</code> - 예약 가능 시간 확인</li>
                      <li><code className="bg-slate-200 px-2 py-1 rounded text-xs">calendar.events</code> - 예약 일정 생성/수정</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">3.2 권한 사용 범위</h3>
                    <p className="text-sm">
                      Calendar API는 <strong>오직 예약 관리 목적</strong>으로만 사용되며, 다른 용도로 일정 정보를 수집하거나 공유하지 않습니다.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">3.3 권한 취소</h3>
                    <p className="text-sm">
                      회원은 언제든지 Google 계정 설정에서 서비스의 Calendar 접근 권한을 취소할 수 있습니다. 단, 권한 취소 시 예약 기능을 사용할 수 없습니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">4. 예약 및 결제</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <div className="grid gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-bold text-green-900 mb-2">4.1 예약 정책</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                      <li>예약은 선착순 원칙으로 처리됩니다</li>
                      <li>강사의 승인이 완료된 예약만 확정됩니다</li>
                      <li>예약 확정 후 취소 정책은 강사별로 상이합니다</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-bold text-green-900 mb-2">4.2 결제 및 환불</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                      <li>결제는 강사와 학생 간 직접 진행됩니다</li>
                      <li>플랫폼은 결제 대행을 하지 않습니다</li>
                      <li>환불 정책은 강사의 정책을 따릅니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Ban size={20} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">5. 금지 행위</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <p className="leading-relaxed">
                  다음 행위는 엄격히 금지되며, 위반 시 서비스 이용이 제한될 수 있습니다:
                </p>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <ul className="space-y-2 text-sm text-red-900">
                    <li>• 타인의 개인정보를 무단으로 수집, 저장, 공개하는 행위</li>
                    <li>• 서비스를 통해 얻은 정보를 상업적 목적으로 이용하는 행위</li>
                    <li>• 허위 예약 또는 악의적인 예약 취소를 반복하는 행위</li>
                    <li>• 시스템의 취약점을 악용하거나 정상적인 운영을 방해하는 행위</li>
                    <li>• 타인의 계정을 도용하거나 부정하게 사용하는 행위</li>
                    <li>• 법령에 위배되는 불법적인 목적으로 서비스를 이용하는 행위</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">6. 서비스 제공 및 중단</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">6.1 서비스 중단</h3>
                    <p className="text-sm">
                      다음의 경우 사전 통지 없이 서비스를 일시 중단할 수 있습니다:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                      <li>시스템 점검, 서버 교체, 네트워크 장애 등</li>
                      <li>천재지변, 국가비상사태 등 불가항력적 사유</li>
                      <li>서비스 제공 업체(Google, Supabase 등)의 장애</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">6.2 서비스 종료</h3>
                    <p className="text-sm">
                      서비스를 종료할 경우 최소 30일 전에 공지하며, 회원의 데이터는 종료일 이후 즉시 삭제됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">7. 책임의 제한</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                  <p className="text-sm">
                    • 서비스는 <strong>있는 그대로(As-Is)</strong> 제공되며, 특정 목적에의 적합성, 완전성, 정확성 등을 보증하지 않습니다.
                  </p>
                  <p className="text-sm">
                    • 강사와 학생 간의 분쟁에 대해 플랫폼은 책임을 지지 않으며, 당사자 간 직접 해결해야 합니다.
                  </p>
                  <p className="text-sm">
                    • Google Calendar API 장애 또는 제3자 서비스의 문제로 인한 손해에 대해 책임을 지지 않습니다.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">8. 약관 변경</h2>
              </div>
              <div className="pl-13 space-y-4 text-slate-700">
                <p className="leading-relaxed">
                  본 약관은 관련 법령 또는 서비스 정책 변경에 따라 수정될 수 있습니다. 중요한 변경사항은 최소 7일 전에 공지하며, 변경 후에도 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주됩니다.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t-2 border-slate-200 pt-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. 문의</h2>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
                <p className="text-slate-700 mb-4">
                  이용약관에 대한 문의사항이 있으시면 아래로 연락 주시기 바랍니다:
                </p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><strong>서비스명:</strong> 예약매니아</p>
                  <p><strong>이메일:</strong> contact@traff-engine.com</p>
                  <p><strong>운영:</strong> 박진슬</p>
                </div>
              </div>
            </section>

            {/* Acceptance */}
            <section className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6">
              <p className="text-sm text-slate-700 text-center">
                예약매니아 서비스를 이용함으로써 귀하는 본 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
