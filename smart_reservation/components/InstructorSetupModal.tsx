import React, { useState } from 'react';
import { Check, Calendar, Loader2, Settings as SettingsIcon, ExternalLink } from 'lucide-react';
import { createCoachingCalendar } from '../lib/google-calendar';
import { upsertInstructorSettings } from '../lib/supabase/database';

interface InstructorSetupModalProps {
  adminEmail: string;
  instructorId: string;
  onClose: () => void;
}

export const InstructorSetupModal: React.FC<InstructorSetupModalProps> = ({ adminEmail, instructorId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [calendarName, setCalendarName] = useState('코칭 예약');
  const [createdCalendarId, setCreatedCalendarId] = useState<string | null>(null);

  const handleCreateCalendar = async () => {
    if (!calendarName.trim()) {
      setError('캘린더 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Google Calendar에 새 캘린더 생성
      const calendar = await createCoachingCalendar(calendarName);

      // Supabase에 캘린더 ID 저장
      await upsertInstructorSettings(instructorId, {
        calendar_id: calendar.id
      });

      setCreatedCalendarId(calendar.id);
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (e: any) {
      console.error(e);
      setError(e.message || "캘린더 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors text-2xl">✕</button>
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg backdrop-blur-sm">
            <Calendar size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">캘린더 자동 연동</h2>
          <p className="text-orange-100 text-sm mt-2">클릭 한 번으로 캘린더를 자동 생성하세요</p>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center py-8 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Check size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">설정 완료!</h3>
                <p className="text-slate-600 text-sm mt-2">캘린더가 생성되었습니다.<br/>예약이 자동으로 등록됩니다.</p>

                {createdCalendarId && (
                  <a
                    href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(createdCalendarId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                  >
                    <Calendar size={20} />
                    <span>Google Calendar에서 확인</span>
                    <ExternalLink size={16} />
                  </a>
                )}
            </div>
          ) : (
            <div className="space-y-6">

                {/* 캘린더 이름 입력 */}
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-sm font-bold text-slate-900 mb-2 block">캘린더 이름</span>
                        <input
                            type="text"
                            value={calendarName}
                            onChange={(e) => setCalendarName(e.target.value)}
                            placeholder="예: 코칭 예약, 레슨 일정 등"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors text-slate-900"
                        />
                    </label>
                    <p className="text-xs text-slate-500">
                        💡 Google Calendar에 생성될 캘린더의 이름입니다
                    </p>
                </div>

                {/* 설명 */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
                    <h3 className="font-bold text-slate-900 text-lg mb-3 flex items-center">
                        <SettingsIcon size={20} className="mr-2 text-orange-600" />
                        자동 캘린더 생성
                    </h3>
                    <div className="text-sm text-slate-700 space-y-2">
                        <p className="flex items-start">
                            <span className="text-orange-600 font-bold mr-2">✓</span>
                            <span>입력한 이름으로 Google Calendar에 캘린더가 자동 생성됩니다</span>
                        </p>
                        <p className="flex items-start">
                            <span className="text-orange-600 font-bold mr-2">✓</span>
                            <span>예약 시 Meet 링크가 자동으로 생성됩니다</span>
                        </p>
                        <p className="flex items-start">
                            <span className="text-orange-600 font-bold mr-2">✓</span>
                            <span>수강생에게 캘린더 초대장이 발송됩니다</span>
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
                        <p className="font-bold mb-1">⚠️ 오류 발생</p>
                        <p>{error}</p>
                        {error.includes('insufficient') || error.includes('scopes') ? (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-red-300">
                                <p className="font-bold text-slate-900 mb-2">🔑 권한 재설정이 필요합니다</p>
                                <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
                                    <li>우측 상단 프로필에서 <b>로그아웃</b></li>
                                    <li>다시 <b>Google로 로그인</b></li>
                                    <li>캘린더 권한 요청 시 <b>허용</b> 클릭</li>
                                    <li>이 화면에서 다시 <b>생성하기</b> 버튼 클릭</li>
                                </ol>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-600 mt-2">
                                * 다시 로그인이 필요할 수 있습니다.
                            </p>
                        )}
                    </div>
                )}

                <button
                    onClick={handleCreateCalendar}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={24} />
                            캘린더 생성 중...
                        </>
                    ) : (
                        <>
                            <Calendar size={24} className="mr-2" />
                            지금 바로 생성하기
                        </>
                    )}
                </button>

                <p className="text-xs text-slate-500 text-center">
                    버튼을 클릭하면 Google Calendar에 새 캘린더가 생성되고<br/>
                    예약 시스템과 자동으로 연동됩니다.
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};