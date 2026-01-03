import React from 'react';
import { Briefcase, GraduationCap, ArrowRight } from 'lucide-react';

interface AccountTypeSelectionProps {
  onSelectType: (type: 'instructor' | 'student') => void;
  onBack: () => void;
}

const AccountTypeSelection: React.FC<AccountTypeSelectionProps> = ({ onSelectType, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-br bg-orange-500 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mx-auto mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="3" stroke="#FF6B35" strokeWidth="2"/>
                <path d="M6 20C6 16.6863 8.68629 14 12 14C15.3137 14 18 16.6863 18 20" stroke="#FF6B35" strokeWidth="2"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">예약매니아</h1>
        </div>

        {/* Body */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 text-center mb-2">계정 유형 선택</h2>
          <p className="text-sm text-slate-500 text-center mb-8">어떤 용도로 사용하시나요?</p>

          <div className="space-y-4">
            {/* Instructor Option */}
            <button
              onClick={() => onSelectType('instructor')}
              className="w-full group"
            >
              <div className="bg-white border-2 border-slate-200 hover:border-orange-500 rounded-xl p-6 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <Briefcase size={28} className="text-orange-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">강사 / 코치</h3>
                      <p className="text-sm text-slate-600">수강생을 관리하고 예약을 받습니다.</p>
                    </div>
                  </div>
                  <ArrowRight size={24} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                </div>
              </div>
            </button>

            {/* Student Option */}
            <button
              onClick={() => onSelectType('student')}
              className="w-full group"
            >
              <div className="bg-white border-2 border-slate-200 hover:border-orange-500 rounded-xl p-6 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <GraduationCap size={28} className="text-orange-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">수강생</h3>
                      <p className="text-sm text-slate-600">강사의 예약 링크를 통해</p>
                      <p className="text-sm text-slate-600">코칭 세션을 예약합니다.</p>
                    </div>
                  </div>
                  <ArrowRight size={24} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                </div>
              </div>
            </button>
          </div>

          {/* Back Link */}
          <button
            onClick={onBack}
            className="w-full mt-8 py-3 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>←</span>
            <span>로그인으로 돌아가기</span>
          </button>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400">© 2025 예약매니아</p>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelection;
