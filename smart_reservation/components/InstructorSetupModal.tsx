import React, { useState } from 'react';
import { Check, Calendar, AlertTriangle, Loader2, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { postToGAS } from '../services/api';
import { CalendarCheckResult } from '../types';

interface InstructorSetupModalProps {
  adminEmail: string;
  instructorId: string;
  onClose: () => void;
}

export const InstructorSetupModal: React.FC<InstructorSetupModalProps> = ({ adminEmail, instructorId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMsg, setDebugMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Client-side fallback to ensure UI is never empty
  const safeAdminEmail = adminEmail || "flowgineer@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(safeAdminEmail);
    alert('시스템 이메일이 복사되었습니다: ' + safeAdminEmail);
  };

  const handleVerifyConnection = async () => {
    setLoading(true);
    setError(null);
    setDebugMsg(null);

    try {
      // 1. Backend Sync: CalendarID 등록
      await postToGAS({ 
          action: 'updateCoachSettings', 
          instructorId, 
          calendarId: instructorId 
      });

      // 2. Verification: 실제 접속 테스트
      const check = await postToGAS<CalendarCheckResult & { debugMessage?: string }>({ 
          action: 'checkCalendarConnection',
          instructorId
      });

      if (!check.isConnected) {
          if (check.debugMessage) setDebugMsg(check.debugMessage);
          throw new Error("캘린더에 접근할 수 없습니다. 공유 설정을 확인해주세요.");
      }

      setSuccess(true);
      setTimeout(() => window.location.reload(), 2000);

    } catch (e: any) {
      console.error(e);
      setError(e.message || "연결 확인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">✕</button>
          <div className="mx-auto w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-lg">
            <Calendar size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-bold">캘린더 연동 가이드</h2>
          <p className="text-slate-300 text-sm mt-1">예약 자동 등록을 위한 필수 절차입니다.</p>
        </div>
        
        <div className="p-6">
          {success ? (
            <div className="text-center py-8 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">연결 성공!</h3>
                <p className="text-slate-500 text-sm mt-1">이제 예약이 캘린더에 자동 등록됩니다.</p>
            </div>
          ) : (
            <div className="space-y-5">
                
                {/* Step 1 */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <h3 className="font-bold text-blue-900 text-sm mb-2">1단계: 시스템 이메일 복사</h3>
                    <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-white px-3 py-2 rounded-lg text-xs text-slate-600 font-mono border border-orange-100 overflow-hidden text-ellipsis whitespace-nowrap">
                            {safeAdminEmail}
                        </code>
                        <button onClick={handleCopyEmail} className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                            <Copy size={16} />
                        </button>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-2">
                     <h3 className="font-bold text-slate-900 text-sm">2단계: 구글 캘린더 설정에서 공유 추가</h3>
                     <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <li>
                            <a href="https://calendar.google.com/calendar/u/0/r/settings" target="_blank" rel="noreferrer" className="text-orange-500 underline font-medium inline-flex items-center">
                                구글 캘린더 설정 <ExternalLink size={12} className="ml-1"/>
                            </a> 
                            으로 이동합니다.
                        </li>
                        <li>
                            <span className="text-red-600 font-bold">중요!</span> 좌측 사이드바에서 <strong>'내 캘린더의 설정'</strong> 목록을 펼치고 <strong>본인의 이름</strong>을 클릭하세요.
                        </li>
                        <li>화면 중앙의 스크롤을 내려 <strong>'공유대상'</strong> 섹션을 찾습니다.</li>
                        <li><strong>[+사용자 및 그룹추가]</strong> 버튼을 누르고 복사한 이메일을 붙여넣습니다.</li>
                        <li>권한을 반드시 <strong>'일정 변경 및 공유 관리'</strong>로 선택하고 저장합니다.</li>
                     </ol>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex flex-col items-start border border-red-100 animate-pulse">
                        <div className="flex items-center mb-1 font-bold">
                            <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                            {error}
                        </div>
                        {debugMsg && (
                            <div className="text-xs text-red-500 opacity-90 break-all pl-6">
                                상세 에러: {debugMsg}
                            </div>
                        )}
                         <div className="text-xs text-slate-500 mt-2 pl-6">
                            * 혹시 개발자이신가요? 코드가 변경되었다면 <strong>Apps Script에서 '새 배포(New Version)'</strong>를 꼭 눌러주세요.
                        </div>
                    </div>
                )}

                <button
                    onClick={handleVerifyConnection}
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center"
                >
                    {loading ? (
                        <><Loader2 className="animate-spin mr-2" /> 확인 중...</>
                    ) : (
                        <><RefreshCw size={20} className="mr-2" /> 연결 확인 (설정 후 1분 소요될 수 있음)</>
                    )}
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};