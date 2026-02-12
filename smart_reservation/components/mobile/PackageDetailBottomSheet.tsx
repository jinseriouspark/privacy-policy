import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, X, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getReservationsByPackageId } from '../../lib/supabase/database';

interface Package {
  id: string;
  name?: string;
  total_sessions: number;
  remaining_sessions: number;
  start_date: string;
  expires_at: string;
  created_at: string;
  coaching?: {
    title: string;
  };
  instructor?: {
    id: number;
    name: string;
  };
}

interface ReservationHistory {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  attendance_status?: string;
  notes?: string;
  coaching?: {
    title: string;
    type: string;
    duration: number;
  };
  instructor?: {
    name: string;
  };
}

interface PackageDetailBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: Package | null;
}

export const PackageDetailBottomSheet: React.FC<PackageDetailBottomSheetProps> = ({
  isOpen,
  onClose,
  selectedPackage
}) => {
  const [history, setHistory] = useState<ReservationHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedPackage) {
      loadHistory();
    }
  }, [isOpen, selectedPackage?.id]);

  const loadHistory = async () => {
    if (!selectedPackage) return;
    setLoading(true);
    try {
      const data = await getReservationsByPackageId(selectedPackage.id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load reservation history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !selectedPackage) return null;

  const pkg = selectedPackage;
  const daysRemaining = Math.ceil(
    (new Date(pkg.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const usedSessions = pkg.total_sessions - pkg.remaining_sessions;
  const usagePercent = pkg.total_sessions > 0
    ? Math.round((usedSessions / pkg.total_sessions) * 100)
    : 0;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '예정';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const completedCount = history.filter(r => r.status === 'completed' || (r.status === 'confirmed' && new Date(r.start_time) < new Date())).length;
  const cancelledCount = history.filter(r => r.status === 'cancelled').length;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">수강권 상세</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Package Info */}
          <div className={`rounded-2xl p-5 ${
            isExpired ? 'bg-slate-50 border border-slate-200' :
            isExpiringSoon ? 'bg-orange-50 border border-orange-200' :
            'bg-orange-50 border border-orange-200'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {pkg.name || pkg.coaching?.title || '수강권'}
                </h3>
                {pkg.instructor && (
                  <p className="text-sm text-slate-500 mt-0.5">{pkg.instructor.name} 강사</p>
                )}
              </div>
              {isExpired ? (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">만료</span>
              ) : isExpiringSoon ? (
                <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">{daysRemaining}일 남음</span>
              ) : (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">사용 중</span>
              )}
            </div>

            {/* Credits */}
            <div className="bg-white rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-orange-500" />
                  <span className="text-sm text-slate-600">잔여 횟수</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-orange-600">{pkg.remaining_sessions}</span>
                  <span className="text-slate-400 text-sm"> / {pkg.total_sessions}회</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">{usedSessions}회 사용 ({usagePercent}%)</p>
            </div>

            {/* Period */}
            <div className="flex items-center gap-3 bg-white rounded-xl p-3">
              <Calendar size={18} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">사용 기간</p>
                <p className="text-sm font-medium text-slate-900">
                  {formatDate(pkg.start_date)} ~ {formatDate(pkg.expires_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Reservation History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">예약 히스토리</h3>
              <div className="flex gap-2 text-xs text-slate-500">
                <span>진행 {completedCount}</span>
                {cancelledCount > 0 && <span className="text-red-500">취소 {cancelledCount}</span>}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-orange-500" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">아직 예약 기록이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((res) => {
                  const date = new Date(res.start_time);
                  const isPast = date < new Date();

                  return (
                    <div
                      key={res.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        res.status === 'cancelled'
                          ? 'border-red-100 bg-red-50/50'
                          : isPast
                          ? 'border-slate-100 bg-slate-50'
                          : 'border-orange-100 bg-white'
                      }`}
                    >
                      {/* Date */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <p className="text-xs text-slate-400">
                          {date.toLocaleDateString('ko-KR', { month: 'short' })}
                        </p>
                        <p className="text-lg font-bold text-slate-900">{date.getDate()}</p>
                        <p className="text-xs text-slate-400">
                          {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-10 bg-slate-200" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {formatTime(res.start_time)} - {formatTime(res.end_time)}
                        </p>
                        {res.coaching && (
                          <p className="text-xs text-slate-500 truncate">{res.coaching.title}</p>
                        )}
                      </div>

                      {/* Status */}
                      <span className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(res.status)}`}>
                        {getStatusLabel(res.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
