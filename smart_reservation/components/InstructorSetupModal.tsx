import React, { useState, useEffect } from 'react';
import { Check, Calendar, Loader2, ExternalLink, RefreshCw, Plus } from 'lucide-react';
import { getUserCalendars } from '../lib/google-calendar';
import { updateCoachingCalendar } from '../lib/supabase/database';
import { requestCalendarPermissions } from '../lib/supabase/auth';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  backgroundColor?: string;
  accessRole: string;
}

interface InstructorSetupModalProps {
  adminEmail: string;
  instructorId: string;
  coachingId: string;
  defaultCalendarName?: string;
  onClose: () => void;
}

export const InstructorSetupModal: React.FC<InstructorSetupModalProps> = ({
  adminEmail,
  instructorId,
  coachingId,
  defaultCalendarName,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCalendars = await getUserCalendars();
      // 쓰기 권한이 있는 캘린더만 필터링 (owner 또는 writer)
      const writableCalendars = userCalendars.filter(
        (c: GoogleCalendar) => c.accessRole === 'owner' || c.accessRole === 'writer'
      );
      setCalendars(writableCalendars);
    } catch (e: any) {
      console.error('Failed to load calendars:', e);
      setError(e.message || '캘린더 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCalendar = async () => {
    if (!selectedCalendarId) {
      setError('캘린더를 선택해주세요.');
      return;
    }

    if (!coachingId || coachingId === 'undefined') {
      setError('코칭 ID가 올바르지 않습니다. 페이지를 새로고침해주세요.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateCoachingCalendar(coachingId, selectedCalendarId);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (e: any) {
      console.error('Failed to save calendar:', e);
      setError(e.message || '캘린더 연동에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-br bg-orange-500 p-8 text-white text-center relative flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors text-2xl">✕</button>
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg backdrop-blur-sm">
            <Calendar size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">캘린더 연동</h2>
          <p className="text-orange-100 text-sm mt-2">예약을 등록할 캘린더를 선택하세요</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Check size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">연동 완료!</h3>
              <p className="text-slate-600 text-sm mt-2">
                캘린더가 연동되었습니다.<br/>
                예약이 자동으로 등록됩니다.
              </p>

              {selectedCalendarId && (
                <a
                  href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(selectedCalendarId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  <Calendar size={20} />
                  <span>Google Calendar에서 확인</span>
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 캘린더 목록 */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-orange-500" />
                </div>
              ) : calendars.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 mb-4">사용 가능한 캘린더가 없습니다.</p>
                  <p className="text-sm text-slate-400 mb-4">Google Calendar에서 새 캘린더를 만들어주세요.</p>
                  <a
                    href="https://calendar.google.com/calendar/u/0/r/settings/createcalendar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus size={18} />
                    캘린더 생성하러 가기
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">캘린더 선택</h3>
                    <button
                      onClick={loadCalendars}
                      className="p-1.5 text-slate-400 hover:text-orange-500 transition-colors"
                      title="새로고침"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {calendars.map(calendar => {
                      const isSelected = selectedCalendarId === calendar.id;

                      return (
                        <label
                          key={calendar.id}
                          className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-slate-200 hover:border-orange-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="calendar"
                            checked={isSelected}
                            onChange={() => setSelectedCalendarId(calendar.id)}
                            className="w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500"
                          />
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900 truncate">{calendar.summary}</p>
                              {calendar.primary && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                                  기본
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* 캘린더 생성 링크 */}
                  <div className="pt-3 border-t border-slate-100">
                    <a
                      href="https://calendar.google.com/calendar/u/0/r/settings/createcalendar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                      새 캘린더 생성하러 가기
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </>
              )}

              {/* 안내 메시지 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-sm text-slate-600 space-y-1">
                  <p className="flex items-start">
                    <span className="text-orange-500 font-bold mr-2">✓</span>
                    <span>선택한 캘린더에 예약이 자동 등록됩니다</span>
                  </p>
                  <p className="flex items-start">
                    <span className="text-orange-500 font-bold mr-2">✓</span>
                    <span>Meet 링크가 자동으로 생성됩니다</span>
                  </p>
                  <p className="flex items-start">
                    <span className="text-orange-500 font-bold mr-2">✓</span>
                    <span>수강생에게 캘린더 초대장이 발송됩니다</span>
                  </p>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
                  <p className="font-bold mb-1">⚠️ 오류 발생</p>
                  <p>{error}</p>
                  {(error.includes('권한') || error.includes('토큰') || error.includes('insufficient')) && (
                    <button
                      onClick={() => requestCalendarPermissions()}
                      className="mt-3 w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors text-sm"
                    >
                      다시 로그인하여 권한 허용
                    </button>
                  )}
                </div>
              )}

              {/* 연동 버튼 */}
              {calendars.length > 0 && (
                <button
                  onClick={handleSelectCalendar}
                  disabled={saving || !selectedCalendarId}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={24} />
                      연동 중...
                    </>
                  ) : (
                    <>
                      <Calendar size={24} className="mr-2" />
                      지금바로 연동하기
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
