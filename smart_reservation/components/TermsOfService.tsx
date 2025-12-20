import React from 'react';
import { X } from 'lucide-react';

interface TermsOfServiceProps {
  onClose: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">이용약관</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] prose prose-slate">
          <h3>제 1 조 (목적)</h3>
          <p>
            본 약관은 예약매니아(이하 "서비스")가 제공하는 예약 관리 서비스의 이용과 관련하여
            회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>

          <h3>제 2 조 (정의)</h3>
          <ol>
            <li>"서비스"란 예약매니아가 제공하는 예약 관리 플랫폼을 의미합니다.</li>
            <li>"회원"이란 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.</li>
            <li>"강사"란 서비스를 통해 예약을 받는 회원을 의미합니다.</li>
            <li>"수강생"이란 강사의 서비스를 예약하는 회원을 의미합니다.</li>
          </ol>

          <h3>제 3 조 (약관의 효력 및 변경)</h3>
          <ol>
            <li>본 약관은 서비스를 이용하고자 하는 모든 회원에게 그 효력이 발생합니다.</li>
            <li>
              회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있으며,
              변경된 약관은 공지 후 7일이 경과한 시점부터 효력이 발생합니다.
            </li>
          </ol>

          <h3>제 4 조 (회원가입)</h3>
          <ol>
            <li>회원가입은 Google 계정을 통해 이루어집니다.</li>
            <li>
              회원은 가입 시 제공한 정보가 사실과 다르거나 부정확한 경우 서비스 이용이 제한될 수
              있습니다.
            </li>
          </ol>

          <h3>제 5 조 (서비스의 제공)</h3>
          <ol>
            <li>회사는 다음과 같은 서비스를 제공합니다:
              <ul>
                <li>예약 관리 시스템</li>
                <li>Google 캘린더 연동</li>
                <li>수강권 관리</li>
                <li>화상 회의(Google Meet) 자동 생성</li>
                <li>예약 알림</li>
              </ul>
            </li>
            <li>
              서비스는 연중무휴 1일 24시간 제공을 원칙으로 하나, 시스템 점검 등의 사유로 일시
              중단될 수 있습니다.
            </li>
          </ol>

          <h3>제 6 조 (회원의 의무)</h3>
          <ol>
            <li>회원은 다음 행위를 하여서는 안 됩니다:
              <ul>
                <li>타인의 정보 도용</li>
                <li>서비스 운영 방해</li>
                <li>허위 정보 등록</li>
                <li>타인에게 피해를 주는 행위</li>
              </ul>
            </li>
            <li>회원은 관계 법령, 본 약관, 이용안내 및 서비스상 공지한 주의사항을 준수해야 합니다.</li>
          </ol>

          <h3>제 7 조 (개인정보 보호)</h3>
          <p>
            회사는 회원의 개인정보를 보호하기 위하여 개인정보처리방침을 수립하고 이를 준수합니다.
          </p>

          <h3>제 8 조 (서비스 이용 제한)</h3>
          <p>
            회사는 회원이 본 약관을 위반한 경우 사전 통지 없이 서비스 이용을 제한하거나 계약을
            해지할 수 있습니다.
          </p>

          <h3>제 9 조 (면책 조항)</h3>
          <ol>
            <li>
              회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를
              제공할 수 없는 경우 책임이 면제됩니다.
            </li>
            <li>회사는 회원 간 또는 회원과 제3자 간에 발생한 분쟁에 대해 책임지지 않습니다.</li>
          </ol>

          <h3>제 10 조 (분쟁 해결)</h3>
          <p>
            본 약관과 관련하여 분쟁이 발생한 경우, 회사의 본사 소재지를 관할하는 법원을 전속
            관할법원으로 합니다.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
            <p>시행일: 2025년 1월 1일</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
