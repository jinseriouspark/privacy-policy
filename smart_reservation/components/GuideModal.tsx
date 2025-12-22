import React from 'react';
import { X, BookOpen, CheckCircle2, Calendar, Users, Package, Share2, Zap } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">사용 가이드</h2>
                <p className="text-orange-100 text-sm">예약매니아 시작하기</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Step 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900">초기 설정 (최초 1회)</h3>
            </div>
            <div className="ml-13 space-y-3 text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Google 로그인 → "강사/코치" 선택</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">스튜디오 정보 입력 (이름, 소개)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Google Calendar 연동</p>
                  <p className="text-sm text-slate-500">캘린더 이름 입력 → "생성하기" 클릭하면 자동 생성됩니다</p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={24} className="text-blue-600" />
                코칭(클래스) 생성
              </h3>
            </div>
            <div className="ml-13 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="font-bold text-slate-900 mb-2">대시보드 → "코칭 관리" 클릭</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <div>
                      <span className="font-medium">Class ID:</span> 영문으로 입력 (예: <code className="bg-blue-100 px-2 py-0.5 rounded">pilates-private</code>, <code className="bg-blue-100 px-2 py-0.5 rounded">yoga-group</code>)
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <div>이 ID가 예약 URL에 사용됩니다</div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <div>여러 코칭을 만들어 각각 관리할 수 있습니다</div>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users size={24} className="text-green-600" />
                회원(학생) 등록
              </h3>
            </div>
            <div className="ml-13 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                <p className="font-bold text-slate-900">"학생 초대하기" 버튼 클릭</p>
                <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
                  <li>학생의 Gmail 주소 입력</li>
                  <li>"초대장 발송" 클릭</li>
                  <li>생성된 6자리 초대 코드를 학생에게 전달</li>
                </ol>
                <p className="text-xs text-slate-500 bg-white p-2 rounded border border-green-300">
                  💡 학생은 예약 링크 접속 → Google 로그인 → "수강생" 선택 → 초대 코드 입력으로 등록
                </p>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package size={24} className="text-purple-600" />
                수강권 등록
              </h3>
            </div>
            <div className="ml-13 space-y-3">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
                <div>
                  <p className="font-bold text-slate-900 mb-2">방법 1: 수강권 템플릿 만들기 (추천)</p>
                  <ul className="space-y-1 text-sm text-slate-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">→</span>
                      <span>"수강권" 탭에서 템플릿 생성 (이름, 횟수, 유효기간, 가격)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">→</span>
                      <span>나중에 학생에게 부여 시 빠르게 선택 가능</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-2">방법 2: 학생에게 직접 부여</p>
                  <ul className="space-y-1 text-sm text-slate-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">→</span>
                      <span>대시보드 → 학생 이름 클릭 → "추가" 버튼</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">→</span>
                      <span>수강권 정보 입력 후 저장</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Step 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-lg">
                5
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Share2 size={24} className="text-pink-600" />
                예약 링크 공유
              </h3>
            </div>
            <div className="ml-13 space-y-3">
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 space-y-3">
                <div>
                  <p className="font-bold text-slate-900 mb-2">코칭별 예약 링크 (추천)</p>
                  <div className="bg-white p-3 rounded border border-pink-300 font-mono text-sm text-slate-800">
                    https://yeyak-mania.vercel.app/<span className="text-pink-600 font-bold">pilates-private</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Class ID가 URL에 포함됩니다</p>
                </div>
                <div className="border-t border-pink-200 pt-3">
                  <p className="font-bold text-slate-900 mb-2">강사 프로필 링크</p>
                  <div className="bg-white p-3 rounded border border-pink-300 font-mono text-sm text-slate-800 break-all">
                    https://yeyak-mania.vercel.app?coach=<span className="text-pink-600 font-bold">your@email.com</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">모든 코칭 목록을 보여줍니다</p>
                </div>
                <p className="text-sm text-slate-600 bg-white p-3 rounded border border-pink-300">
                  💡 대시보드의 "공유하기" 버튼으로 링크를 쉽게 복사할 수 있습니다
                </p>
              </div>
            </div>
          </section>

          {/* Automation */}
          <section className="space-y-4 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">자동화 기능</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <p className="font-bold text-slate-900 mb-2">📅 예약 시 자동 처리</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• Google Calendar 일정 등록</li>
                  <li>• Meet 링크 자동 생성</li>
                  <li>• 학생에게 캘린더 초대 발송</li>
                  <li>• 수강권 잔여 횟수 차감</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <p className="font-bold text-slate-900 mb-2">🎯 편리한 관리</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• 오늘 예약 한눈에 보기</li>
                  <li>• 수강권 횟수 실시간 업데이트</li>
                  <li>• 만료일 자동 계산</li>
                  <li>• 학생별 이력 관리</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
            <h4 className="font-bold text-slate-900 text-lg">💡 유용한 팁</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>코칭 = 상품 단위:</strong> 1:1 레슨, 그룹 수업 등을 각각 만들어 관리하세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>수강권 템플릿:</strong> 자주 사용하는 수강권을 미리 만들어두면 편리합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>링크 공유:</strong> 카카오톡, SNS, QR코드 등으로 간편하게 공유하세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span><strong>설정 탭:</strong> 영업시간을 설정하면 예약 가능 시간을 제한할 수 있습니다</span>
              </li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
};
