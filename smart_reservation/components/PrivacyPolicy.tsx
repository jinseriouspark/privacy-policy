import React from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">개인정보처리방침</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] prose prose-slate">
          <h3>1. 개인정보의 수집 및 이용 목적</h3>
          <p>
            예약매니아(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한
            개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경될 시에는
            사전 동의를 구합니다.
          </p>
          <ul>
            <li>회원 가입 및 관리</li>
            <li>예약 서비스 제공</li>
            <li>서비스 개선 및 통계 분석</li>
            <li>고객 문의 응대</li>
          </ul>

          <h3>2. 수집하는 개인정보의 항목</h3>
          <p>회사는 다음과 같은 개인정보를 수집합니다:</p>
          <ul>
            <li><strong>필수 정보:</strong> 이메일 주소, 이름, Google 프로필 사진</li>
            <li><strong>선택 정보:</strong> 전화번호, 스튜디오 정보, 자기소개</li>
            <li><strong>자동 수집 정보:</strong> 서비스 이용 기록, 접속 로그, 쿠키</li>
          </ul>

          <h3>3. 개인정보의 보유 및 이용기간</h3>
          <p>
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
            동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </p>
          <ul>
            <li><strong>회원 정보:</strong> 회원 탈퇴 시까지</li>
            <li><strong>예약 기록:</strong> 서비스 종료 후 1년</li>
            <li><strong>부정 이용 기록:</strong> 5년 (전자상거래법)</li>
          </ul>

          <h3>4. 개인정보의 제3자 제공</h3>
          <p>
            회사는 원칙적으로 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위
            내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등이 있는 경우에만 제3자에게
            제공합니다.
          </p>
          <p>현재 회사는 다음의 서비스와 연동하여 개인정보를 공유합니다:</p>
          <ul>
            <li><strong>Google Calendar API:</strong> 예약 일정 동기화</li>
            <li><strong>Google Meet:</strong> 화상 회의 링크 생성</li>
            <li><strong>Google Sheets:</strong> 데이터 저장</li>
          </ul>

          <h3>5. 개인정보 처리의 위탁</h3>
          <p>회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:</p>
          <table className="min-w-full border border-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-4 py-2">수탁업체</th>
                <th className="border border-slate-200 px-4 py-2">위탁업무</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 px-4 py-2">Google LLC</td>
                <td className="border border-slate-200 px-4 py-2">
                  인증, 캘린더 연동, 데이터 저장
                </td>
              </tr>
            </tbody>
          </table>

          <h3>6. 정보주체의 권리·의무 및 행사방법</h3>
          <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
          <ul>
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리정지 요구</li>
          </ul>
          <p>
            권리 행사는 서비스 내 프로필 설정 메뉴 또는 고객센터를 통해 가능합니다.
          </p>

          <h3>7. 개인정보의 파기</h3>
          <p>
            회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
            지체없이 해당 개인정보를 파기합니다.
          </p>
          <ul>
            <li><strong>파기절차:</strong> 불필요한 개인정보는 내부 방침에 따라 즉시 파기</li>
            <li><strong>파기방법:</strong> 전자적 파일 형태는 복구 불가능한 방법으로 영구 삭제</li>
          </ul>

          <h3>8. 개인정보 보호책임자</h3>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한
            정보주체의 불만처리 및 피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고
            있습니다.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p><strong>개인정보 보호책임자</strong></p>
            <p>이메일: privacy@reservation-mania.com</p>
          </div>

          <h3>9. 개인정보의 안전성 확보조치</h3>
          <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
          <ul>
            <li>개인정보 취급 직원의 최소화 및 교육</li>
            <li>개인정보에 대한 접근 제한</li>
            <li>접속기록의 보관 및 위변조 방지</li>
            <li>개인정보의 암호화</li>
            <li>보안프로그램 설치 및 갱신</li>
          </ul>

          <h3>10. 개인정보처리방침 변경</h3>
          <p>
            이 개인정보처리방침은 2025년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의
            추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여
            고지할 것입니다.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
            <p>시행일: 2025년 1월 1일</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
