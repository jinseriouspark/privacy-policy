import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Clock, Link2, Copy, Check } from 'lucide-react';
import { User, Reservation } from '../../types';
import { getUpcomingReservations, getAllStudentPackages, getInstructorCoachings } from '../../lib/supabase/database';
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
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const loadTodayData = async () => {
    try {
      if (!user.id) return;

      console.log('[MobileStudentHome] Loading data for user:', {
        id: user.id,
        email: user.email,
        name: user.name
      });

      // Load upcoming reservations
      const reservations = await getUpcomingReservations(user.id);
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
        <h1 className="text-xl font-bold text-slate-900">
          {getGreeting()}, {user.name}님!
        </h1>
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
        {/* Empty State - No packages and no reservations */}
        {packages.filter(pkg => {
          const expiresAt = new Date(pkg.expires_at);
          return expiresAt > new Date() && (pkg.remaining_sessions || 0) > 0;
        }).length === 0 && todayReservations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon size={32} className="text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-700 mb-2">아직 수강 정보가 없어요</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              강사에게 수강권을 받으면<br />
              여기에 수업 일정이 표시됩니다.
            </p>
          </div>
        )}

        {/* My Packages - Horizontal Scroll with Selection */}
        {packages.filter(pkg => {
          const expiresAt = new Date(pkg.expires_at);
          const isNotExpired = expiresAt > new Date();
          const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
          return isNotExpired && hasRemainingCredits;
        }).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">내 수강권</h2>
              <button
                onClick={() => setSelectedPackageId(null)}
                className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all ${
                  selectedPackageId === null
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
                }`}
              >
                전체
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
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
                  const isSelected = selectedPackageId === pkg.id;

                  // Count today's reservations for this package
                  const packageTodayCount = todayReservations.filter(r => r.package_id === parseInt(pkg.id)).length;

                  return (
                    <button
                      key={pkg.id}
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setIsPackageDetailOpen(true);
                      }}
                      className={`flex-shrink-0 w-48 p-5 rounded-2xl transition-all ${
                        isSelected
                          ? 'bg-orange-500 shadow-lg scale-105'
                          : 'bg-white shadow-md'
                      }`}
                    >
                      <p className={`text-sm font-semibold mb-3 truncate text-left ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}>
                        {pkg.name || pkg.coaching?.title || '수강권'}
                      </p>
                      <div className="flex items-baseline gap-1 mb-3">
                        <p className={`text-4xl font-bold ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}>
                          {pkg.remaining_sessions}
                        </p>
                        <p className={`text-base ${
                          isSelected ? 'text-orange-100' : 'text-slate-500'
                        }`}>
                          / {pkg.total_sessions}회
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <p className={
                          isSelected ? 'text-orange-100' : 'text-slate-500'
                        }>
                          {isExpiringSoon ? `⏰ ${daysLeft}일 남음` : expiresAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </p>
                        {packageTodayCount > 0 && (
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            isSelected ? 'bg-white/20 text-white' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            오늘 {packageTodayCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Upcoming Classes - Filtered by selected package */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              앞둔 수업
              {selectedPackageId && packages.find(p => p.id === selectedPackageId) && (
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({packages.find(p => p.id === selectedPackageId)?.name || '선택한 수강권'})
                </span>
              )}
            </h2>
            {(() => {
              const filteredReservations = selectedPackageId
                ? todayReservations.filter(r => r.package_id === parseInt(selectedPackageId))
                : todayReservations;

              return filteredReservations.length > 0 && (
                <span className="text-sm text-slate-500">
                  {filteredReservations.length}개
                </span>
              );
            })()}
          </div>

          <TodayClassCards
            classes={(() => {
              const filteredReservations = selectedPackageId
                ? todayReservations.filter(r => r.package_id === parseInt(selectedPackageId))
                : todayReservations;

              return filteredReservations.map(r => {
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
                    hour12: false,
                    timeZoneName: 'short'
                  }),
                  studentName: r.instructor?.name || '강사님',
                  isGroup: r.coaching?.type === 'group',
                  participantCount: r.coaching?.type === 'group' ? 1 : undefined,
                  meetLink: r.meet_link || '#'
                };
              });
            })()}
          />
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
        selectedPackage={packages.find(p => p.id === selectedPackageId) || null}
      />
    </div>
  );
};
