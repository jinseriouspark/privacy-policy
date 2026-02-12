import React, { useState, useEffect } from 'react';
import { Bell, TrendingUp, Calendar as CalendarIcon, Users as UsersIcon, CheckCircle, ChevronDown } from 'lucide-react';
import { User, Reservation } from '../../types';
import { getTodayReservations, getInstructorStats, getInstructorCoachings } from '../../lib/supabase/database';
import { TodayClassCards } from './TodayClassCards';
import { SkeletonHomeLoader } from './SkeletonLoader';

interface MobileInstructorHomeProps {
  user: User;
  onTabChange?: (tab: 'reservations' | 'students') => void;
}

interface WeekStats {
  totalRevenue: number;
  totalReservations: number;
  attendanceRate: number;
}

export const MobileInstructorHome: React.FC<MobileInstructorHomeProps> = ({ user, onTabChange }) => {
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coachings, setCoachings] = useState<any[]>([]);
  const [selectedCoachingId, setSelectedCoachingId] = useState<number | null>(null);
  const [showCoachingSelector, setShowCoachingSelector] = useState(false);

  const loadCoachings = async () => {
    try {
      if (!user.id) return;
      const data = await getInstructorCoachings(user.id.toString());
      setCoachings(data);
    } catch (error) {
      console.error('Failed to load coachings:', error);
    }
  };

  const loadTodayData = async () => {
    try {
      if (!user.id) return;

      // Load today's reservations
      let reservations = await getTodayReservations(user.id);

      // Filter by selected coaching if any
      if (selectedCoachingId !== null) {
        reservations = reservations.filter(r => r.coaching_id === selectedCoachingId);
      }

      setTodayReservations(reservations);

      // Load week stats
      const stats = await getInstructorStats(user.id.toString(), statsPeriod);
      setWeekStats({
        totalRevenue: stats.totalRevenue || 0,
        totalReservations: stats.totalReservations || 0,
        attendanceRate: stats.attendanceRate || 0
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoachings();
  }, [user.id]);

  useEffect(() => {
    loadTodayData();
  }, [user.id, statsPeriod, selectedCoachingId]);

  // Close coaching selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showCoachingSelector) {
        const target = e.target as HTMLElement;
        if (!target.closest('.coaching-selector')) {
          setShowCoachingSelector(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCoachingSelector]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTodayData();
  };

  // 오늘 통계 계산 (실제 수업 가격 기반)
  const todayStats = {
    revenue: todayReservations.reduce((sum, r) => sum + (r.coaching?.price || 0), 0),
    classCount: todayReservations.length,
    attendedCount: todayReservations.filter(r => r.attendance_status === 'attended').length
  };

  // 매출 유형별 분석
  const revenueBreakdown = {
    private: todayReservations
      .filter(r => r.coaching?.type === 'private')
      .reduce((sum, r) => sum + (r.coaching?.price || 0), 0),
    group: todayReservations
      .filter(r => r.coaching?.type === 'group')
      .reduce((sum, r) => sum + (r.coaching?.price || 0), 0),
    attended: todayReservations
      .filter(r => r.attendance_status === 'attended')
      .reduce((sum, r) => sum + (r.coaching?.price || 0), 0),
    pending: todayReservations
      .filter(r => r.attendance_status === 'pending')
      .reduce((sum, r) => sum + (r.coaching?.price || 0), 0)
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
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell size={24} className="text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      {refreshing && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Coaching Selector */}
      {coachings.length > 1 && (
        <div className="bg-white border-b border-slate-200 px-6 py-3">
          <div className="relative coaching-selector">
            <button
              onClick={() => setShowCoachingSelector(!showCoachingSelector)}
              className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-orange-300 transition-colors"
            >
              <span className="text-sm font-medium text-slate-900">
                {selectedCoachingId
                  ? coachings.find(c => c.id === selectedCoachingId)?.name || '전체 코칭'
                  : '전체 코칭'}
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform ${showCoachingSelector ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {showCoachingSelector && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedCoachingId(null);
                    setShowCoachingSelector(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${
                    selectedCoachingId === null ? 'bg-orange-50 text-orange-600 font-medium' : 'text-slate-900'
                  }`}
                >
                  전체 코칭
                </button>
                {coachings.map((coaching) => (
                  <button
                    key={coaching.id}
                    onClick={() => {
                      setSelectedCoachingId(coaching.id);
                      setShowCoachingSelector(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-t border-slate-100 ${
                      selectedCoachingId === coaching.id ? 'bg-orange-50 text-orange-600 font-medium' : 'text-slate-900'
                    }`}
                  >
                    {coaching.name}
                  </button>
                ))}
              </div>
            )}
          </div>
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
        <div className="bg-gradient-to-br bg-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">📊 오늘의 요약</h2>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              실시간
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1 text-orange-100">
                <TrendingUp size={16} />
                <span className="text-xs">매출</span>
              </div>
              <p className="text-2xl font-bold">
                {todayStats.revenue >= 10000
                  ? `${(todayStats.revenue / 10000).toFixed(0)}만`
                  : `${todayStats.revenue.toLocaleString()}원`}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1 text-orange-100">
                <CalendarIcon size={16} />
                <span className="text-xs">수업</span>
              </div>
              <p className="text-2xl font-bold">{todayStats.classCount}건</p>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1 text-orange-100">
                <CheckCircle size={16} />
                <span className="text-xs">출석</span>
              </div>
              <p className="text-2xl font-bold">
                {todayStats.classCount > 0
                  ? `${todayStats.attendedCount}/${todayStats.classCount}`
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">🕐 오늘 수업</h2>
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
                  hour12: false,
                  timeZoneName: 'short'
                }),
                studentName: r.student?.name || '수강생',
                isGroup: r.coaching?.type === 'group',
                participantCount: r.coaching?.type === 'group' ? 1 : undefined,
                meetLink: r.meet_link || '#'
              };
            })}
          />
        </div>

        {/* Revenue Breakdown */}
        {todayReservations.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">💰 오늘 매출 분석</h2>

            <div className="space-y-3">
              {/* By Class Type */}
              <div>
                <p className="text-xs text-slate-500 mb-2">수업 유형별</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs text-orange-600 mb-1">1:1 레슨</p>
                    <p className="text-lg font-bold text-slate-900">
                      {revenueBreakdown.private >= 10000
                        ? `${(revenueBreakdown.private / 10000).toFixed(1)}만`
                        : `${revenueBreakdown.private.toLocaleString()}원`}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-orange-600 mb-1">그룹</p>
                    <p className="text-lg font-bold text-slate-900">
                      {revenueBreakdown.group >= 10000
                        ? `${(revenueBreakdown.group / 10000).toFixed(1)}만`
                        : `${revenueBreakdown.group.toLocaleString()}원`}
                    </p>
                  </div>
                </div>
              </div>

              {/* By Attendance Status */}
              <div>
                <p className="text-xs text-slate-500 mb-2">출석 상태별</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs text-orange-600 mb-1">출석 완료</p>
                    <p className="text-lg font-bold text-slate-900">
                      {revenueBreakdown.attended >= 10000
                        ? `${(revenueBreakdown.attended / 10000).toFixed(1)}만`
                        : `${revenueBreakdown.attended.toLocaleString()}원`}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-600 mb-1">대기 중</p>
                    <p className="text-lg font-bold text-slate-900">
                      {revenueBreakdown.pending >= 10000
                        ? `${(revenueBreakdown.pending / 10000).toFixed(1)}만`
                        : `${revenueBreakdown.pending.toLocaleString()}원`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Percentage Bar */}
              {todayStats.revenue > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>출석률</span>
                    <span>{((revenueBreakdown.attended / todayStats.revenue) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                      style={{ width: `${(revenueBreakdown.attended / todayStats.revenue) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Period Stats */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">📈 통계</h2>

            {/* Period Selector */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setStatsPeriod('week')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  statsPeriod === 'week'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                주간
              </button>
              <button
                onClick={() => setStatsPeriod('month')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  statsPeriod === 'month'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                월간
              </button>
              <button
                onClick={() => setStatsPeriod('year')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  statsPeriod === 'year'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                연간
              </button>
            </div>
          </div>

          {weekStats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">총 매출</span>
                <span className="text-lg font-bold text-slate-900">
                  {weekStats.totalRevenue.toLocaleString('ko-KR')}원
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">총 수업</span>
                <span className="text-lg font-bold text-slate-900">
                  {weekStats.totalReservations}건
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">평균 출석률</span>
                <span className="text-lg font-bold text-orange-600">
                  {weekStats.attendanceRate.toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onTabChange?.('calendar')}
            className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-orange-300 transition-colors active:scale-95"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <CalendarIcon size={20} className="text-orange-600" />
            </div>
            <p className="font-bold text-slate-900">새 예약</p>
            <p className="text-xs text-slate-500 mt-1">수업 추가하기</p>
          </button>

          <button
            onClick={() => onTabChange?.('students')}
            className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-orange-300 transition-colors active:scale-95"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <UsersIcon size={20} className="text-orange-600" />
            </div>
            <p className="font-bold text-slate-900">회원 관리</p>
            <p className="text-xs text-slate-500 mt-1">수강생 보기</p>
          </button>
        </div>
      </div>
    </div>
  );
};
