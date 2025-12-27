import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { User as UserType, Reservation } from '../../types';
import { getReservations, cancelReservation } from '../../lib/supabase/database';
import { SwipeableReservationCard } from './SwipeableReservationCard';
import { SkeletonReservationsLoader } from './SkeletonLoader';
import toast from 'react-hot-toast';

interface MobileReservationsProps {
  user: UserType;
}

export const MobileReservations: React.FC<MobileReservationsProps> = ({ user }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    loadReservations();
  }, [user.id]);

  const loadReservations = async () => {
    try {
      const data = await getReservations(user.id, user.user_type);
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('정말 이 예약을 취소하시겠습니까?')) return;

    try {
      const result = await cancelReservation(reservationId);
      await loadReservations();

      if (result.refunded) {
        toast.success('예약이 취소되었습니다. 수강권이 복귀되었습니다.');
      } else {
        toast.error('예약이 취소되었습니다. 취소 가능 시간이 지나 수강권은 차감됩니다.');
      }
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      toast.error('예약 취소에 실패했습니다.');
    }
  };

  const filteredReservations = reservations.filter(r => {
    const reservationDate = new Date(r.start_time);
    const now = new Date();

    if (filter === 'upcoming') {
      return reservationDate >= now && r.status !== 'cancelled';
    } else if (filter === 'past') {
      return reservationDate < now || r.status === 'cancelled';
    }
    return true;
  });

  if (loading) {
    return <SkeletonReservationsLoader />;
  }

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">예약 관리</h1>
        <p className="text-sm text-slate-500 mt-1">
          총 {filteredReservations.length}개
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 sticky top-[73px] z-10">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            예정
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === 'past'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            지난 예약
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

      {/* Reservations List */}
      <div className="px-6 pt-4 space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center mt-8">
            <p className="text-slate-600 font-medium">예약이 없습니다</p>
            <p className="text-sm text-slate-400 mt-2">
              {filter === 'upcoming' && '새로운 예약을 추가해보세요'}
              {filter === 'past' && '아직 지난 예약이 없습니다'}
              {filter === 'all' && '첫 예약을 만들어보세요'}
            </p>
          </div>
        ) : (
          filteredReservations.map((reservation) => (
            <SwipeableReservationCard
              key={reservation.id}
              reservation={reservation}
              userType={user.user_type as 'instructor' | 'student'}
              onCancel={handleCancelReservation}
            />
          ))
        )}
      </div>
    </div>
  );
};
