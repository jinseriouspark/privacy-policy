import React, { useState, useEffect } from 'react';
import { getInstructorStats } from '../lib/supabase/database';
import { TrendingUp, Users, DollarSign, Calendar, Award, Loader2 } from 'lucide-react';

interface StatsData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalStudents: number;
  activeStudents: number;
  totalReservations: number;
  attendanceRate: number;
  popularTimeSlots: { time: string; count: number }[];
  recentTransactions: {
    id: string;
    studentName: string;
    packageName: string;
    amount: number;
    date: string;
  }[];
}

interface StatsDashboardProps {
  instructorEmail: string;
  instructorId?: string;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ instructorEmail, instructorId }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const result = await getInstructorStats(instructorId, period);
      setStats(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500 mb-3" />
        <p className="text-slate-500 text-sm">통계 불러오는 중...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">통계 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <TrendingUp size={24} className="mr-2 text-orange-500" />
            통계 대시보드
          </h2>
          <p className="text-sm text-slate-500 mt-1">스튜디오 운영 현황을 한눈에</p>
        </div>

        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              period === 'week'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              period === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              period === 'year'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            연간
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign size={24} className="opacity-80" />
            <span className="text-xs font-medium opacity-80 uppercase">매출</span>
          </div>
          <p className="text-3xl font-bold mb-1">{(stats.monthlyRevenue || 0).toLocaleString()}원</p>
          <p className="text-sm opacity-80">전체: {(stats.totalRevenue || 0).toLocaleString()}원</p>
        </div>

        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="opacity-80" />
            <span className="text-xs font-medium opacity-80 uppercase">회원</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.activeStudents || 0}</p>
          <p className="text-sm opacity-80">전체: {stats.totalStudents || 0}명</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="opacity-80" />
            <span className="text-xs font-medium opacity-80 uppercase">예약</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalReservations || 0}</p>
          <p className="text-sm opacity-80">이번 {period === 'week' ? '주' : period === 'month' ? '달' : '해'}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Award size={24} className="opacity-80" />
            <span className="text-xs font-medium opacity-80 uppercase">출석률</span>
          </div>
          <p className="text-3xl font-bold mb-1">{(stats.attendanceRate || 0).toFixed(1)}%</p>
          <p className="text-sm opacity-80">평균 출석률</p>
        </div>
      </div>

      {/* Popular Time Slots */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">인기 시간대</h3>
        {!stats.popularTimeSlots || stats.popularTimeSlots.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">데이터가 없습니다</p>
        ) : (
          <div className="space-y-6">
            {/* Chart Container */}
            <div className="relative h-64 flex items-end justify-between gap-2 px-4">
              {stats.popularTimeSlots.slice(0, 10).map((slot, index) => {
                const maxCount = Math.max(...stats.popularTimeSlots.map(s => s.count));
                const heightPercentage = (slot.count / maxCount) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end group">
                    {/* Bar */}
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: '240px' }}>
                      {/* Count Label */}
                      <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                          {slot.count}회
                        </span>
                      </div>
                      {/* Bar */}
                      <div
                        className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all duration-500 hover:from-orange-600 hover:to-orange-500 relative"
                        style={{ height: `${heightPercentage}%`, minHeight: slot.count > 0 ? '8px' : '0px' }}
                      >
                        {/* Subtle top highlight */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-t-lg"></div>
                      </div>
                    </div>
                    {/* X-axis Label */}
                    <div className="mt-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {slot.time}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Y-axis Reference Lines */}
            <div className="relative -mt-6 px-4 pointer-events-none">
              <div className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: '240px' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-t border-slate-100 relative">
                    <span className="absolute -left-8 -top-2 text-xs text-slate-400">
                      {Math.round((Math.max(...stats.popularTimeSlots.map(s => s.count)) * (4 - i)) / 4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">최근 거래 내역</h3>
        {!stats.recentTransactions || stats.recentTransactions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">거래 내역이 없습니다</p>
        ) : (
          <div className="space-y-3">
            {stats.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{transaction.studentName}</p>
                  <p className="text-sm text-slate-600">{transaction.packageName}</p>
                  <p className="text-xs text-slate-400 mt-1">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">
                    +{(transaction.amount || 0).toLocaleString()}원
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsDashboard;
