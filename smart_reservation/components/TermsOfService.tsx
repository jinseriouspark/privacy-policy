import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">서비스 이용약관</h1>
          <p className="text-slate-600">
            본 약관은 트래픽엔진(이하 "회사")이 제공하는 예약매니아 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
            <span>시행일자: 2025년 1월 1일</span>
            <span>•</span>
            <span>최종 수정: 2024년 12월 31일</span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-3">목차</h2>
          <ol className="space-y-2 text-sm text-slate-700">
            <li><a href="#article1" className="hover:text-orange-500">제1조 (목적)</a></li>
            <li><a href="#article2" className="hover:text-orange-500">제2조 (정의)</a></li>
            <li><a href="#article3" className="hover:text-orange-500">제3조 (약관의 게시와 개정)</a></li>
            <li><a href="#article4" className="hover:text-orange-500">제4조 (서비스의 제공 및 변경)</a></li>
            <li><a href="#article5" className="hover:text-orange-500">제5조 (이용계약의 성립)</a></li>
            <li><a href="#article6" className="hover:text-orange-500">제6조 (회원 정보의 변경)</a></li>
            <li><a href="#article7" className="hover:text-orange-500">제7조 (개인정보보호 의무)</a></li>
            <li><a href="#article8" className="hover:text-orange-500">제8조 (회원의 의무)</a></li>
            <li><a href="#article9" className="hover:text-orange-500">제9조 (서비스 이용 제한)</a></li>
            <li><a href="#article10" className="hover:text-orange-500">제10조 (저작권의 귀속 및 이용 제한)</a></li>
            <li><a href="#article11" className="hover:text-orange-500">제11조 (계약 해제 및 이용 제한)</a></li>
            <li><a href="#article12" className="hover:text-orange-500">제12조 (면책 조항)</a></li>
            <li><a href="#article13" className="hover:text-orange-500">제13조 (분쟁 해결)</a></li>
          </ol>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Article 1 */}
          <article id="article1" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제1조 (목적)
            </h2>
            <div className="text-slate-700 leading-relaxed">
              <p>이 약관은 트래픽엔진(이하 "회사")이 운영하는 예약매니아 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
            </div>
          </article>

          {/* Article 2 */}
          <article id="article2" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제2조 (정의)
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-semibold w-40">서비스</td>
                    <td className="py-3 px-4">회사가 제공하는 예약매니아 웹 애플리케이션 및 관련 부가 서비스 일체</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-semibold">회원</td>
                    <td className="py-3 px-4">서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 서비스를 이용하는 자</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-semibold">강사</td>
                    <td className="py-3 px-4">스튜디오 운영 및 수업 제공을 목적으로 서비스를 이용하는 회원</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-semibold">학생</td>
                    <td className="py-3 px-4">수업 예약 및 수강을 목적으로 서비스를 이용하는 회원</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-semibold">계정</td>
                    <td className="py-3 px-4">회원의 식별과 서비스 이용을 위하여 회원이 선정하고 회사가 승인한 이메일 주소</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          {/* Article 3 */}
          <article id="article3" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제3조 (약관의 게시와 개정)
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 약관의 게시</h3>
                <p className="pl-4 text-sm">회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면 및 웹사이트 하단에 게시합니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 약관의 개정</h3>
                <p className="pl-4 text-sm">회사는 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">③ 개정 통지</h3>
                <p className="pl-4 text-sm">회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 전부터 적용일자 전일까지 공지합니다.</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="font-semibold text-amber-900 mb-1">중요 사항</p>
                <p className="text-amber-800">회원이 개정약관의 적용에 동의하지 않는 경우 회원 탈퇴를 요청할 수 있습니다. 변경된 약관의 공지 기간 내에 거부 의사를 표시하지 않으면 승인한 것으로 간주합니다.</p>
              </div>
            </div>
          </article>

          {/* Article 4 */}
          <article id="article4" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제4조 (서비스의 제공 및 변경)
            </h2>
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 제공 서비스</h3>
                <p className="mb-3 text-sm">회사는 다음과 같은 서비스를 제공합니다.</p>
                <ul className="list-disc list-inside space-y-2 pl-4 text-sm">
                  <li>수업 예약 관리 서비스 (1:1 개인 레슨, 그룹 수업)</li>
                  <li>Google Calendar 연동 서비스</li>
                  <li>출석 체크 및 수강권 관리</li>
                  <li>수업 노트 작성 및 AI 분석 (Notion 연동)</li>
                  <li>스튜디오 통계 및 매출 관리</li>
                  <li>기타 회사가 추가 개발하거나 제휴 계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 서비스 변경</h3>
                <p className="pl-4 text-sm">회사는 상당한 이유가 있는 경우 운영상, 기술상의 필요에 따라 제공하고 있는 서비스를 변경할 수 있습니다. 변경될 서비스의 내용 및 제공일자를 서비스 화면에 7일 전에 통지합니다.</p>
              </div>
            </div>
          </article>

          {/* Article 5 */}
          <article id="article5" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제5조 (이용계약의 성립)
            </h2>
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 가입 신청</h3>
                <p className="pl-4 text-sm">서비스를 이용하고자 하는 자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 가입 승낙</h3>
                <p className="pl-4 text-sm">회사는 제1항과 같이 회원으로 가입할 것을 신청한 자가 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</p>
                <ul className="list-disc list-inside space-y-1 pl-8 text-sm mt-2">
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>회원 자격 제한, 정지 또는 상실한 적이 있는 경우</li>
                  <li>기타 회원으로 등록하는 것이 서비스의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">③ 계약 성립 시기</h3>
                <p className="pl-4 text-sm">이용계약은 회사의 승낙이 회원에게 도달한 시점에 성립합니다.</p>
              </div>
            </div>
          </article>

          {/* Article 6 */}
          <article id="article6" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제6조 (회원 정보의 변경)
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 정보 수정</h3>
                <p className="pl-4 text-sm">회원은 개인정보관리 화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 변경 통지</h3>
                <p className="pl-4 text-sm">회원은 회원가입신청 시 기재한 사항이 변경되었을 경우 온라인으로 수정을 하거나 기타 방법으로 회사에 그 변경사항을 알려야 합니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">③ 미통지 책임</h3>
                <p className="pl-4 text-sm">제2항의 변경사항을 회사에 알리지 않아 발생한 불이익에 대하여 회사는 책임지지 않습니다.</p>
              </div>
            </div>
          </article>

          {/* Article 7 */}
          <article id="article7" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제7조 (개인정보보호 의무)
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 개인정보 보호</h3>
                <p className="pl-4 text-sm">회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련법령 및 회사의 개인정보처리방침이 적용됩니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 개인정보처리방침</h3>
                <p className="pl-4 text-sm">단, 회사의 공식 사이트 이외의 링크된 사이트에서는 회사의 개인정보처리방침이 적용되지 않습니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">③ 회원정보의 공개 제한</h3>
                <p className="pl-4 text-sm">회사는 회원의 귀책사유로 인하여 노출된 정보에 대해서는 일체의 책임을 지지 않습니다.</p>
              </div>
            </div>
          </article>

          {/* Article 8 */}
          <article id="article8" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제8조 (회원의 의무)
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>회원은 다음 행위를 하여서는 안 됩니다.</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">① 허위 정보 등록</h3>
                  <p className="text-xs text-red-800">신청 또는 변경 시 허위 내용 등록</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">② 타인 정보 도용</h3>
                  <p className="text-xs text-red-800">다른 사람의 정보 도용</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">③ 회사 정보 변경</h3>
                  <p className="text-xs text-red-800">회사가 게시한 정보의 무단 변경</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">④ 금지 정보 송신</h3>
                  <p className="text-xs text-red-800">회사가 정한 정보 이외의 정보 등의 송신 또는 게시</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">⑤ 저작권 침해</h3>
                  <p className="text-xs text-red-800">회사 및 기타 제3자의 저작권 등 지적재산권 침해</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">⑥ 명예 훼손</h3>
                  <p className="text-xs text-red-800">회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">⑦ 외설 정보 유포</h3>
                  <p className="text-xs text-red-800">외설 또는 폭력적인 메시지, 화상, 음성 기타 공서양속에 반하는 정보 공개 또는 게시</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">⑧ 관련 법령 위반</h3>
                  <p className="text-xs text-red-800">기타 관련 법령이나 회사가 정한 규정에 위배되는 행위</p>
                </div>
              </div>
            </div>
          </article>

          {/* Article 9 */}
          <article id="article9" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제9조 (서비스 이용 제한)
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 이용 제한 사유</h3>
                <p className="pl-4 text-sm mb-2">회사는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 제한 절차</h3>
                <p className="pl-4 text-sm">회사는 이용 제한 시, 그 사유 및 일시, 기간 등을 회원에게 사전 통지합니다. 다만, 긴급을 요하거나 회원에게 책임이 있는 경우는 예외로 합니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">③ 이의 신청</h3>
                <p className="pl-4 text-sm">이용이 제한된 회원은 그 제한에 대하여 회사가 정한 절차에 따라 이의신청을 할 수 있습니다.</p>
              </div>
            </div>
          </article>

          {/* Article 10 */}
          <article id="article10" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제10조 (저작권의 귀속 및 이용 제한)
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 저작권 귀속</h3>
                <p className="pl-4 text-sm">회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 이용 제한</h3>
                <p className="pl-4 text-sm">회원은 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">③ 회원 게시물</h3>
                <p className="pl-4 text-sm">회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시물의 저작자에게 귀속됩니다.</p>
              </div>
            </div>
          </article>

          {/* Article 11 */}
          <article id="article11" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제11조 (계약 해제 및 이용 제한)
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 회원 탈퇴</h3>
                <p className="pl-4 text-sm">회원은 언제든지 서비스 이용을 원하지 않는 경우 회원 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴를 처리합니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 탈퇴 효과</h3>
                <p className="pl-4 text-sm">회원 탈퇴 시 회원이 작성한 게시물은 삭제되지 않습니다. 탈퇴 전 삭제를 원하시는 경우 직접 삭제 후 탈퇴하시기 바랍니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">③ 재가입 제한</h3>
                <p className="pl-4 text-sm">부정한 목적으로 재가입하는 경우, 회사는 가입을 제한할 수 있습니다.</p>
              </div>
            </div>
          </article>

          {/* Article 12 */}
          <article id="article12" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제12조 (면책 조항)
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 천재지변 등</h3>
                <p className="pl-4 text-sm">회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 회원 귀책 사유</h3>
                <p className="pl-4 text-sm">회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">③ 제3자 서비스</h3>
                <p className="pl-4 text-sm">회사는 회원이 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">④ 무료 서비스</h3>
                <p className="pl-4 text-sm">회사는 무료로 제공되는 서비스 이용과 관련하여 관련법에 특별한 규정이 없는 한 책임을 지지 않습니다.</p>
              </div>
            </div>
          </article>

          {/* Article 13 */}
          <article id="article13" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
              제13조 (분쟁 해결)
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">① 준거법</h3>
                <p className="pl-4 text-sm">회사와 회원 간 제기된 소송은 대한민국법을 준거법으로 합니다.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">② 관할법원</h3>
                <p className="pl-4 text-sm">회사와 회원 간 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제소합니다.</p>
              </div>
            </div>
          </article>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="p-6 bg-slate-50 rounded-lg text-sm">
            <p className="font-semibold text-slate-900 mb-2">부칙</p>
            <p className="text-slate-600">본 약관은 2025년 1월 1일부터 적용됩니다.</p>
          </div>
          <div className="text-center text-sm text-slate-500 mt-8">
            <p>본 약관은 관련 법령 및 회사 내부 방침에 따라 변경될 수 있습니다.</p>
            <p className="mt-2">문의사항이 있으시면 언제든지 고객센터로 연락 주시기 바랍니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
