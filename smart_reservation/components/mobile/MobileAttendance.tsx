import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import { User as UserType, Reservation } from '../../types';
import { getAttendanceList, updateAttendance } from '../../lib/supabase/database';

interface MobileAttendanceProps {
  user: UserType;
}

export const MobileAttendance: React.FC<MobileAttendanceProps> = ({ user }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending'>('today');

  useEffect(() => {
    loadAttendance();
  }, [user.id, filter]);

  const loadAttendance = async () => {
    try {
      const data = await getAttendanceList(user.id, filter);
      setReservations(data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (
    reservationId: string,
    status: 'attended' | 'absent' | 'late'
  ) => {
    try {
      await updateAttendance(reservationId, status);
      await loadAttendance();
    } catch (error) {
      console.error('Failed to update attendance:', error);
      alert('출석 체크에 실패했습니다.');
    }
  };

  const getAttendanceStats = () => {
    const total = reservations.length;
    const attended = reservations.filter(r => r.attendance_status === 'attended').length;
    const absent = reservations.filter(r => r.attendance_status === 'absent').length;
    const late = reservations.filter(r => r.attendance_status === 'late').length;
    const pending = reservations.filter(r => !r.attendance_status).length;

    return { total, attended, absent, late, pending };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">✅ 출석 관리</h1>
        <p className="text-sm text-slate-500 mt-1">
          {filter === 'today' && '오늘'}
          {filter === 'pending' && '미체크'}
          {filter === 'all' && '전체'} {reservations.length}건
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 sticky top-[73px] z-10">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('today')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === 'today'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            미체크
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 pt-4 pb-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-1">출석</p>
            <p className="text-xl font-bold text-orange-600">{stats.attended}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-1">지각</p>
            <p className="text-xl font-bold text-yellow-600">{stats.late}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-1">결석</p>
            <p className="text-xl font-bold text-red-600">{stats.absent}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-1">미체크</p>
            <p className="text-xl font-bold text-slate-400">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="px-6 space-y-3">
        {reservations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center mt-4">
            <CheckCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">
              {filter === 'today' && '오늘 수업이 없습니다'}
              {filter === 'pending' && '미체크 수업이 없습니다'}
              {filter === 'all' && '출석 기록이 없습니다'}
            </p>
          </div>
        ) : (
          reservations.map((reservation) => {
            const startTime = new Date(reservation.start_time);
            const isPast = startTime < new Date();
            const status = reservation.attendance_status;

            return (
              <div
                key={reservation.id}
                className="bg-white rounded-xl p-4 border border-slate-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-1">
                      {reservation.student?.name || '수강생'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {reservation.coaching?.title || '수업'}
                    </p>
                  </div>

                  {status && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'attended'
                        ? 'bg-orange-100 text-orange-700'
                        : status === 'late'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {status === 'attended' && '출석'}
                      {status === 'late' && '지각'}
                      {status === 'absent' && '결석'}
                    </div>
                  )}
                </div>

                {/* Time Info */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} />
                    <span>
                      {startTime.toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={14} />
                    <span>
                      {startTime.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZoneName: 'short'
                      })}
                    </span>
                  </div>
                </div>

                {/* Attendance Buttons */}
                {!status && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleMarkAttendance(reservation.id, 'attended')}
                      className="flex items-center justify-center gap-1 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
                    >
                      <CheckCircle size={16} />
                      출석
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(reservation.id, 'late')}
                      className="flex items-center justify-center gap-1 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
                    >
                      <Clock size={16} />
                      지각
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(reservation.id, 'absent')}
                      className="flex items-center justify-center gap-1 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      <XCircle size={16} />
                      결석
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
