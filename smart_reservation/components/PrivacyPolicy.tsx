import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">뒤로</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">개인정보처리방침</h1>
          <p className="text-slate-600">
            트래픽엔진(이하 "회사")은 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
            <span>시행일자: 2026년 1월 1일</span>
            <span>•</span>
            <span>최종 수정: 2025년 12월 31일</span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-3">목차</h2>
          <ol className="space-y-2 text-sm text-slate-700">
            <li><a href="#section1" className="hover:text-orange-500">1. 개인정보의 수집 및 이용 목적</a></li>
            <li><a href="#section2" className="hover:text-orange-500">2. 수집하는 개인정보의 항목</a></li>
            <li><a href="#section3" className="hover:text-orange-500">3. 개인정보의 보유 및 이용 기간</a></li>
            <li><a href="#section4" className="hover:text-orange-500">4. Google API 서비스 사용자 데이터 정책 준수</a></li>
            <li><a href="#section5" className="hover:text-orange-500">5. 개인정보의 파기 절차 및 방법</a></li>
            <li><a href="#section6" className="hover:text-orange-500">6. 이용자의 권리와 행사 방법</a></li>
            <li><a href="#section7" className="hover:text-orange-500">7. 개인정보 보호책임자</a></li>
            <li><a href="#section8" className="hover:text-orange-500">8. 개인정보처리방침의 변경</a></li>
          </ol>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Section 1 */}
          <section id="section1" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              1. 개인정보의 수집 및 이용 목적
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">가. 회원 가입 및 관리</h3>
                  <p className="pl-4 text-sm">- 회원 가입 의사 확인, 회원제 서비스 제공, 본인 확인, 불량 회원의 부정 이용 방지</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">나. 예약 관리 서비스 제공</h3>
                  <p className="pl-4 text-sm">- 수업 예약 관리, 출석 체크, 수강권 관리, 스케줄 조정</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">다. Google Calendar 연동</h3>
                  <p className="pl-4 text-sm">- 예약 일정 자동 동기화, 캘린더 일정 생성 및 수정, 시간 충돌 방지</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">라. Notion 연동 (선택)</h3>
                  <p className="pl-4 text-sm">- 수업 노트 작성, 출석 기록 관리, AI 기반 수업 분석 제공</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">마. 고객 지원</h3>
                  <p className="pl-4 text-sm">- 문의 응대, 불만 처리, 공지사항 전달</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="section2" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              2. 수집하는 개인정보의 항목
            </h2>
            <div className="space-y-6 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">가. 필수 수집 항목</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-3 px-4 bg-slate-50">구분</th>
                      <th className="text-left py-3 px-4 bg-slate-50">수집 항목</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4">회원 가입</td>
                      <td className="py-3 px-4">이메일, 이름, 프로필 사진(선택)</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4">Google OAuth</td>
                      <td className="py-3 px-4">Google 계정 정보 (이메일, 이름, 프로필)</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4">Google Calendar</td>
                      <td className="py-3 px-4">캘린더 일정 읽기/쓰기 권한, 예약 정보</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">나. 선택 수집 항목</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-3 px-4 bg-slate-50">구분</th>
                      <th className="text-left py-3 px-4 bg-slate-50">수집 항목</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4">Notion OAuth</td>
                      <td className="py-3 px-4">Notion 워크스페이스 접근 권한, 데이터베이스 읽기/쓰기</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4">수업 노트</td>
                      <td className="py-3 px-4">수업 내용, 출석 정보, AI 분석 결과</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="font-semibold text-amber-900 mb-1">선택적 정보 제공</p>
                <p className="text-amber-800">Notion 연동은 선택사항이며, 동의하지 않아도 서비스 이용에 제한이 없습니다.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section3" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              3. 개인정보의 보유 및 이용 기간
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>회사는 법령에 따른 개인정보 보유·이용 기간 또는 이용자로부터 개인정보 수집 시 동의받은 보유·이용 기간 내에서 개인정보를 처리·보유합니다.</p>
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="text-left py-3 px-4 bg-slate-50">항목</th>
                    <th className="text-left py-3 px-4 bg-slate-50">보유 기간</th>
                    <th className="text-left py-3 px-4 bg-slate-50">근거</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4">회원 정보</td>
                    <td className="py-3 px-4">회원 탈퇴 시까지</td>
                    <td className="py-3 px-4">서비스 이용 계약 유지</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4">예약 기록</td>
                    <td className="py-3 px-4">서비스 이용 기간 + 3년</td>
                    <td className="py-3 px-4">전자상거래법</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4">수업 노트</td>
                    <td className="py-3 px-4">회원 탈퇴 시까지</td>
                    <td className="py-3 px-4">이용자 동의</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4">OAuth 토큰</td>
                    <td className="py-3 px-4">연동 해제 시까지</td>
                    <td className="py-3 px-4">이용자 동의</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section4" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              4. Google API 서비스 사용자 데이터 정책 준수
            </h2>
            <div className="space-y-6 text-slate-700">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Google API 서비스 사용</h3>
                <p className="text-sm text-blue-800">
                  예약매니아는 <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Google API 서비스 사용자 데이터 정책</a>의
                  <strong> 제한된 사용 요구사항</strong>을 포함한 모든 요구사항을 준수합니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">가. Google 사용자 데이터 사용 및 전송에 대한 공개</h3>
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-2">1) 수집하는 Google 사용자 데이터</h4>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      <li><strong>Google 계정 정보</strong>: 이메일 주소, 이름, 프로필 사진</li>
                      <li><strong>Google Calendar 데이터</strong>: 캘린더 일정 읽기 및 쓰기 권한</li>
                      <li><strong>OAuth 액세스 토큰</strong>: Google 서비스 접근을 위한 인증 토큰</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-2">2) Google 사용자 데이터 사용 방법</h4>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      <li><strong>인증 및 로그인</strong>: Google OAuth를 통한 사용자 인증 및 계정 생성</li>
                      <li><strong>예약 일정 관리</strong>: 사용자의 Google Calendar에 예약 일정 자동 생성 및 동기화</li>
                      <li><strong>시간 충돌 방지</strong>: 기존 일정과의 중복 확인</li>
                      <li><strong>Google Meet 링크 생성</strong>: 온라인 수업을 위한 화상 회의 링크 자동 생성</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2">3) 제한된 사용 요구사항 준수</h4>
                    <p className="text-amber-800 mb-2">
                      예약매니아의 Google 사용자 데이터 사용 및 다른 앱으로의 전송은 다음을 포함하여
                      <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-600 mx-1">
                        Google API 서비스 사용자 데이터 정책
                      </a>
                      의 모든 요구사항을 준수합니다:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                      <li><strong>제한된 사용 원칙</strong>: Google 데이터는 사용자에게 공개된 기능 제공 목적으로만 사용</li>
                      <li><strong>제3자 전송 금지</strong>: 사용자 데이터를 제3자에게 판매하거나 전송하지 않음</li>
                      <li><strong>광고 목적 사용 금지</strong>: 맞춤 광고를 게재하거나 타겟팅하는 목적으로 사용하지 않음</li>
                      <li><strong>신용도 판단 금지</strong>: 대출 또는 신용 평가 목적으로 사용하지 않음</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">나. 제3자 정보 제공</h3>
                <p className="mb-4">회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.</p>
                <ul className="list-disc list-inside space-y-2 pl-4 text-sm">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">다. 개인정보 처리 위탁</h3>
                <table className="w-full text-sm mt-4">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-3 px-4 bg-slate-50">수탁업체</th>
                      <th className="text-left py-3 px-4 bg-slate-50">위탁 업무</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4">Google LLC</td>
                      <td className="py-3 px-4">Google OAuth 인증, Calendar API 연동</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4">Notion Labs, Inc.</td>
                      <td className="py-3 px-4">Notion API 연동 (선택)</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4">Supabase Inc.</td>
                      <td className="py-3 px-4">데이터베이스 및 인증 서비스</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4">Vercel Inc.</td>
                      <td className="py-3 px-4">웹 호스팅 및 배포</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="section5" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              5. 개인정보의 파기 절차 및 방법
            </h2>
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">가. 파기 절차</h3>
                <p className="pl-4 text-sm">이용자가 회원 가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">나. 파기 방법</h3>
                <ul className="list-disc list-inside space-y-2 pl-4 text-sm">
                  <li>전자적 파일: 복구 및 재생이 불가능한 기술적 방법을 사용하여 완전 삭제</li>
                  <li>서면 문서: 분쇄기로 분쇄하거나 소각</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="section6" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              6. 이용자의 권리와 행사 방법
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>이용자는 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">개인정보 열람 요구</h3>
                  <p className="text-sm">대시보드에서 본인의 정보 확인 가능</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">개인정보 정정 요구</h3>
                  <p className="text-sm">설정 메뉴에서 직접 수정 가능</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">개인정보 삭제 요구</h3>
                  <p className="text-sm">회원 탈퇴를 통해 즉시 삭제</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">처리 정지 요구</h3>
                  <p className="text-sm">고객센터를 통해 요청</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm mt-6">
                <p className="font-semibold text-orange-900 mb-2">권리 행사 방법</p>
                <p className="text-orange-800">개인정보보호법 시행규칙 별지 제8호 서식에 따라 서면, 전자우편 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="section7" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              7. 개인정보 보호책임자
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 mt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <span className="w-32 font-semibold text-slate-900">책임자</span>
                    <span>박진슬</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold text-slate-900">이메일</span>
                    <span>contact@traff-engine.com</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold text-slate-900">전화</span>
                    <span>010-3265-5939</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold text-slate-900">운영시간</span>
                    <span>평일 17:00 - 24:00 (주말 및 공휴일 제외)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section id="section8" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              8. 개인정보처리방침의 변경
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm mt-4">
                <p className="font-semibold text-slate-900 mb-1">공고 일자: 2024년 12월 31일</p>
                <p className="text-slate-600">시행 일자: 2025년 1월 1일</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="text-center text-sm text-slate-500">
            <p>본 개인정보처리방침은 관련 법령 및 지침의 변경 또는 회사 내부 방침에 따라 변경될 수 있습니다.</p>
            <p className="mt-2">문의사항이 있으시면 언제든지 고객센터로 연락 주시기 바랍니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
