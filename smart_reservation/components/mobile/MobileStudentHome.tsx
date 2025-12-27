import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Clock, Link2, Copy, Check } from 'lucide-react';
import { User, Reservation } from '../../types';
import { getTodayReservations, getAllStudentPackages, getInstructorCoachings } from '../../lib/supabase/database';
import { TodayClassCards } from './TodayClassCards';
import { BookingBottomSheet } from './BookingBottomSheet';
import { PackageDetailBottomSheet } from './PackageDetailBottomSheet';
import { SkeletonHomeLoader } from './SkeletonLoader';

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

interface MobileStudentHomeProps {
  user: User;
}

export const MobileStudentHome: React.FC<MobileStudentHomeProps> = ({ user }) => {
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [packages, setPackages] = useState<StudentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [isPackageDetailOpen, setIsPackageDetailOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const loadTodayData = async () => {
    try {
      if (!user.id) return;

      console.log('[MobileStudentHome] Loading data for user:', {
        id: user.id,
        email: user.email,
        name: user.name
      });

      // Load today's reservations
      const reservations = await getTodayReservations(user.id);
      setTodayReservations(reservations);

      // Load student packages
      const studentPackages = await getAllStudentPackages(user.id);
      console.log('[MobileStudentHome] Loaded packages:', studentPackages);
      setPackages(studentPackages);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadTodayData();
  }, [user.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTodayData();
  };

  const handleCopyBookingLink = async () => {
    // Get instructor's coaching from packages
    if (packages.length === 0) {
      alert('수강권이 없습니다. 강사에게 수강권을 요청하세요.');
      return;
    }

    const firstPackage = packages[0];
    const instructorId = firstPackage.instructor_id;

    try {
      // Get instructor's first coaching
      const coachings = await getInstructorCoachings(instructorId.toString());
      const firstCoaching = coachings.find(c => c.status === 'active');

      if (!firstCoaching) {
        alert('예약 가능한 코칭이 없습니다.');
        return;
      }

      const bookingUrl = `${window.location.origin}/${firstCoaching.slug}`;

      await navigator.clipboard.writeText(bookingUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('링크 복사에 실패했습니다.');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️ 좋은 아침이에요';
    if (hour < 18) return '🌤️ 좋은 오후에요';
    return '🌙 좋은 저녁이에요';
  };

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  if (loading) {
    return <SkeletonHomeLoader />;
  }

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {getGreeting()}, {user.name}님!
            </h1>
            <p className="text-sm text-slate-500 mt-1">{today}</p>
          </div>
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      {refreshing && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Content */}
      <div
        className="px-6 pt-6 space-y-6"
        onTouchStart={(e) => {
          const startY = e.touches[0].clientY;
          const scrollTop = window.scrollY;

          if (scrollTop === 0) {
            const onTouchMove = (e: TouchEvent) => {
              const currentY = e.touches[0].clientY;
              const diff = currentY - startY;

              if (diff > 80) {
                handleRefresh();
                document.removeEventListener('touchmove', onTouchMove);
              }
            };

            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', () => {
              document.removeEventListener('touchmove', onTouchMove);
            }, { once: true });
          }
        }}
      >
        {/* Today's Summary Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">오늘의 일정</h2>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {todayReservations.length}건
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 text-orange-100">
                <span className="text-xs">수업 시간</span>
              </div>
              <p className="text-2xl font-bold">
                {todayReservations.length > 0
                  ? new Date(todayReservations[0].start_time).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })
                  : '-'}
              </p>
            </div>

            <div>
              <div className="mb-1 text-orange-100">
                <span className="text-xs">남은 수업</span>
              </div>
              <p className="text-2xl font-bold">{todayReservations.length}건</p>
            </div>
          </div>
        </div>

        {/* Today's Classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">오늘 수업</h2>
            {todayReservations.length > 0 && (
              <span className="text-sm text-slate-500">
                {todayReservations.length}개
              </span>
            )}
          </div>

          <TodayClassCards
            classes={todayReservations.map(r => {
              const startTime = new Date(r.start_time);
              const endTime = new Date(r.end_time);

              return {
                id: r.id,
                time: startTime.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }),
                endTime: endTime.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }),
                studentName: r.instructor?.name || '강사님',
                isGroup: r.coaching?.type === 'group',
                participantCount: r.coaching?.type === 'group' ? 1 : undefined,
                meetLink: r.meet_link || '#'
              };
            })}
          />
        </div>

        {/* My Packages */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">내 수강권</h2>
          </div>

          <div className="space-y-3">
            {packages.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm">아직 수강권이 없습니다</p>
                <button className="mt-3 text-sm text-orange-600 font-medium hover:underline">
                  수강권 구매하기
                </button>
              </div>
            ) : (
              packages
                .filter(pkg => {
                  // 만료되지 않고 잔여 횟수가 있는 수강권만 표시
                  const expiresAt = new Date(pkg.expires_at);
                  const isNotExpired = expiresAt > new Date();
                  const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
                  return isNotExpired && hasRemainingCredits;
                })
                .map(pkg => {
                  const expiresAt = new Date(pkg.expires_at);
                  const daysLeft = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
                  const isExpired = daysLeft <= 0;

                  return (
                    <div
                      key={pkg.id}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        isExpired ? 'bg-red-50 border border-red-200' :
                        isExpiringSoon ? 'bg-orange-50 border border-orange-200' :
                        'bg-indigo-50 border border-indigo-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${
                            isExpired ? 'text-slate-900' :
                            isExpiringSoon ? 'text-slate-900' :
                            'text-indigo-900'
                          }`}>
                            {pkg.name || pkg.coaching?.title || '수강권'}
                          </p>
                          {isExpiringSoon && (
                            <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full">
                              곧 만료
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-full">
                              만료됨
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          isExpired ? 'text-slate-500' :
                          isExpiringSoon ? 'text-slate-500' :
                          'text-indigo-600'
                        }`}>
                          만료일: {expiresAt.toLocaleDateString('ko-KR')}
                          {isExpiringSoon && ` (${daysLeft}일 남음)`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          isExpired ? 'text-red-600' :
                          isExpiringSoon ? 'text-orange-600' :
                          'text-indigo-600'
                        }`}>
                          {pkg.remaining_sessions}회
                        </p>
                        <p className={`text-xs ${
                          isExpired ? 'text-slate-500' :
                          isExpiringSoon ? 'text-slate-500' :
                          'text-indigo-500'
                        }`}>/ {pkg.total_sessions}회</p>
                      </div>
                    </div>
                  );
                })
            )}
            {packages.filter(pkg => pkg.status === 'active').length > 2 && (
              <button className="w-full text-center text-sm text-slate-600 hover:text-orange-600 py-2">
                +{packages.filter(pkg => pkg.status === 'active').length - 2}개 더 보기
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Booking Bottom Sheet */}
      <BookingBottomSheet
        isOpen={isBookingSheetOpen}
        onClose={() => setIsBookingSheetOpen(false)}
        studentId={user.id.toString()}
        instructorId={packages.find(p => {
          const expiresAt = new Date(p.expires_at);
          const isNotExpired = expiresAt > new Date();
          const hasRemainingCredits = (p.remaining_sessions || 0) > 0;
          return isNotExpired && hasRemainingCredits;
        })?.instructor_id?.toString() || ''}
        packages={packages
          .filter(pkg => {
            const expiresAt = new Date(pkg.expires_at);
            const isNotExpired = expiresAt > new Date();
            const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
            return isNotExpired && hasRemainingCredits;
          })
          .map(pkg => ({
            id: pkg.id,
            name: pkg.name || '수강권',
            credits_remaining: pkg.remaining_sessions,
            coaching_id: pkg.coaching_id?.toString(),
            coaching: pkg.coaching ? {
              id: pkg.coaching_id.toString(),
              title: pkg.coaching.title,
              duration: 60 // Default duration
            } : undefined
          }))
        }
        onSuccess={() => {
          // Refresh data after successful booking
          loadTodayData();
        }}
      />

      {/* Package Detail Bottom Sheet */}
      <PackageDetailBottomSheet
        isOpen={isPackageDetailOpen}
        onClose={() => setIsPackageDetailOpen(false)}
        packages={packages}
      />
    </div>
  );
};
