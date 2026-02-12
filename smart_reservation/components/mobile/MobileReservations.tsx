import React, { useState, useEffect } from 'react';
import { Calendar, Package } from 'lucide-react';
import { User as UserType, Reservation } from '../../types';
import { getReservations, cancelReservation, getAllStudentPackages } from '../../lib/supabase/database';
import { SwipeableReservationCard } from './SwipeableReservationCard';
import { SkeletonReservationsLoader } from './SkeletonLoader';
import toast from 'react-hot-toast';

interface StudentPackage {
  id: string;
  name?: string;
  template_id: number;
  student_id: number;
  coaching_id: number;
  instructor_id: number;
  total_sessions: number;
  remaining_sessions: number;
  start_date: string;
  expires_at: string;
  status: string;
  created_at: string;
  package_template?: {
    name: string;
    type: string;
  };
  coaching?: {
    title: string;
  };
  instructor?: {
    id: number;
    name: string;
    email: string;
  };
}

interface MobileReservationsProps {
  user: UserType;
}

export const MobileReservations: React.FC<MobileReservationsProps> = ({ user }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [packages, setPackages] = useState<StudentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [reservationsData, packagesData] = await Promise.all([
        getReservations(user.id, user.user_type),
        getAllStudentPackages(user.id)
      ]);
      setReservations(reservationsData);
      setPackages(packagesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      const data = await getReservations(user.id, user.user_type);
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('정말 이 예약을 취소하시겠습니까?')) return;

    const isInstructor = user.user_type === 'instructor';
    try {
      const result = await cancelReservation(reservationId, isInstructor);
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

      {/* My Packages - Compact Horizontal Scroll */}
      {packages.filter(pkg => {
        const expiresAt = new Date(pkg.expires_at);
        const isNotExpired = expiresAt > new Date();
        const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
        return isNotExpired && hasRemainingCredits;
      }).length > 0 && (
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-orange-500" />
            <h3 className="text-base font-bold text-slate-900">내 수강권</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide">
            {packages
              .filter(pkg => {
                const expiresAt = new Date(pkg.expires_at);
                const isNotExpired = expiresAt > new Date();
                const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
                return isNotExpired && hasRemainingCredits;
              })
              .map(pkg => {
                const expiresAt = new Date(pkg.expires_at);
                const daysLeft = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

                return (
                  <div
                    key={pkg.id}
                    className="flex-shrink-0 w-48 p-5 rounded-2xl bg-white shadow-md"
                  >
                    <p className="text-sm font-semibold mb-3 truncate text-slate-900">
                      {pkg.name || pkg.coaching?.title || '수강권'}
                    </p>
                    <div className="flex items-baseline gap-1 mb-3">
                      <p className="text-4xl font-bold text-slate-900">
                        {pkg.remaining_sessions}
                      </p>
                      <p className="text-base text-slate-500">
                        / {pkg.total_sessions}회
                      </p>
                    </div>
                    <p className={`text-xs ${isExpiringSoon ? 'text-orange-500 font-medium' : 'text-slate-500'}`}>
                      {isExpiringSoon ? `⏰ ${daysLeft}일 남음` : expiresAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-[73px] z-10">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              filter === 'upcoming'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
            }`}
          >
            예정
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              filter === 'past'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
            }`}
          >
            지난 예약
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
            }`}
          >
            전체
          </button>
        </div>
      </div>

      {/* Reservations List */}
      <div className="px-6 pt-6 space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="bg-white shadow-md rounded-2xl p-10 text-center mt-8">
            <p className="text-slate-900 font-semibold text-lg">예약이 없습니다</p>
            <p className="text-sm text-slate-500 mt-2">
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
