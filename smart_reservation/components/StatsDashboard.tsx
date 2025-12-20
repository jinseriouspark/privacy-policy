import React, { useState, useEffect } from 'react';
import { postToGAS } from '../services/api';
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
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ instructorEmail }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await postToGAS<StatsData>({
        action: 'getStats',
        instructorEmail,
        period
      });
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
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign size={24} className="opacity-80" />
            <span className="text-xs font-medium opacity-80 uppercase">매출</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.monthlyRevenue.toLocaleString()}원</p>
          <p className="text-sm opacity-80">전체: {stats.totalRevenue.toLocaleString()}원</p>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="opacity-80" />
            <span className="text-xs font-medium opacity-80 uppercase">회원</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.activeStudents}</p>
          <p className="text-sm opacity-80">전체: {stats.totalStudents}명</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="opacity-80" />
            <span className="text-xs font-medium opacity-80 uppercase">예약</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalReservations}</p>
          <p className="text-sm opacity-80">이번 {period === 'week' ? '주' : period === 'month' ? '달' : '해'}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Award size={24} className="opacity-80" />
            <span className="text-xs font-medium opacity-80 uppercase">출석률</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.attendanceRate.toFixed(1)}%</p>
          <p className="text-sm opacity-80">평균 출석률</p>
        </div>
      </div>

      {/* Popular Time Slots */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">인기 시간대</h3>
        <div className="space-y-3">
          {stats.popularTimeSlots.slice(0, 5).map((slot, index) => {
            const maxCount = Math.max(...stats.popularTimeSlots.map(s => s.count));
            const percentage = (slot.count / maxCount) * 100;

            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-slate-700">{slot.time}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-400 transition-all duration-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-bold text-slate-700">
                    {slot.count}회
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">최근 거래 내역</h3>
        {stats.recentTransactions.length === 0 ? (
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
                    +{transaction.amount.toLocaleString()}원
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
