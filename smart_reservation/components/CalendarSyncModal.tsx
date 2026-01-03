import React, { useState, useEffect } from 'react';
import { X, Calendar, RefreshCw, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { getUserCalendars } from '../lib/google-calendar';
import {
  saveLinkedCalendars,
  getLinkedCalendars,
  syncCalendarBusyTimes,
  getBusyTimesCache
} from '../lib/supabase/database';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  backgroundColor?: string;
  accessRole: string;
}

interface CalendarSyncModalProps {
  instructorId: string;
  onClose: () => void;
}

const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({ instructorId, onClose }) => {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Google Calendar 목록 조회
      const userCalendars = await getUserCalendars();
      setCalendars(userCalendars);

      // 2. 이미 연동된 캘린더 목록 가져오기
      const linked = await getLinkedCalendars(instructorId);
      setSelectedCalendars(linked);

      // 3. 마지막 동기화 시간 가져오기
      const cache = await getBusyTimesCache(instructorId);
      setLastSynced(cache.lastSynced);
    } catch (err: any) {
      console.error('Load calendars error:', err);
      setError(err.message || '캘린더 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCalendar = (calendarId: string) => {
    setSelectedCalendars(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId);
      } else {
        return [...prev, calendarId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // 연동된 캘린더 저장
      await saveLinkedCalendars(instructorId, selectedCalendars);

      // 즉시 동기화
      if (selectedCalendars.length > 0) {
        await handleSync();
      }

      alert('✅ 캘린더 연동이 완료되었습니다!');
      onClose();
    } catch (err: any) {
      console.error('Save calendars error:', err);
      setError(err.message || '캘린더 연동에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError('');

      const result = await syncCalendarBusyTimes(instructorId);
      setLastSynced(result.lastSynced);

      alert(`✅ ${result.busyTimes.length}개의 예약 불가 시간이 동기화되었습니다!`);
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || '동기화에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSynced = (timestamp: string | null) => {
    if (!timestamp) return '동기화 기록 없음';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">캘린더 연동</h2>
            <p className="text-sm text-slate-500 mt-1">
              다른 Google Calendar와 연동하여 예약 가능한 시간을 자동으로 관리하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 마지막 동기화 시간 */}
          {lastSynced && (
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-orange-600" />
                <div>
                  <p className="text-sm font-semibold text-orange-900">마지막 동기화</p>
                  <p className="text-sm text-orange-700">{formatLastSynced(lastSynced)}</p>
                </div>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing || selectedCalendars.length === 0}
                className="px-4 py-2 bg-slate-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
              >
                {syncing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    즉시 동기화
                  </>
                )}
              </button>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="text-sm text-orange-800">
              <strong>✓ 자동 동기화:</strong> 1시간마다 자동으로 동기화됩니다<br />
              <strong>✓ 예약 불가:</strong> 선택한 캘린더의 일정이 있는 시간은 예약 불가능으로 표시됩니다<br />
              <strong>✓ 다음 7일:</strong> 오늘부터 7일간의 일정을 확인합니다
            </p>
          </div>

          {/* 캘린더 목록 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-orange-500" />
            </div>
          ) : calendars.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">캘린더를 찾을 수 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900">캘린더 선택</h3>
              {calendars.map(calendar => {
                const isSelected = selectedCalendars.includes(calendar.id);
                const isPrimary = calendar.primary;

                return (
                  <label
                    key={calendar.id}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCalendar(calendar.id)}
                      className="w-5 h-5 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                    />
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{calendar.summary}</p>
                        {isPrimary && (
                          <span className="px-2 py-0.5 bg-slate-100 text-orange-700 text-xs font-bold rounded">
                            기본
                          </span>
                        )}
                      </div>
                      {calendar.description && (
                        <p className="text-sm text-slate-500 mt-1">{calendar.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={20} className="text-orange-500 flex-shrink-0" />
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              disabled={saving}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSyncModal;
