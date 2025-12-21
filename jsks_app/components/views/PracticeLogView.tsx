
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp, BarChart3, Grid3x3 } from 'lucide-react';
import { dbService } from '../../services/db';

interface PracticeLogViewProps {
  userEmail: string | null;
  onAddClick: () => void;
}

type ViewMode = 'calendar' | 'timeline' | 'stats' | 'weekly';

const PracticeLogView: React.FC<PracticeLogViewProps> = ({ userEmail, onAddClick }) => {
  const [practiceLogs, setPracticeLogs] = useState<any[]>([]);
  const [practiceItems, setPracticeItems] = useState<any[]>([]);

  // Load saved view preference from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('practiceLogViewMode');
    return (saved as ViewMode) || 'weekly';
  });

  // Listen for storage changes from ProfileView
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('practiceLogViewMode');
      if (saved) {
        setViewMode(saved as ViewMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Check on interval for same-tab updates
    const interval = setInterval(() => {
      const saved = localStorage.getItem('practiceLogViewMode');
      if (saved && saved !== viewMode) {
        setViewMode(saved as ViewMode);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [viewMode]);

  useEffect(() => {
    const loadData = async () => {
      if (!userEmail) return;
      const logs = await dbService.getPracticeLogs(userEmail);
      const items = await dbService.getPracticeItems();
      setPracticeLogs(logs);
      setPracticeItems(items);
    };
    loadData();
  }, [userEmail]);

  // Calculate stats (this month)
  const getPracticeStats = () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const recentLogs = practiceLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= thisMonthStart && logDate <= thisMonthEnd;
    });

    // Count by item
    const stats: Record<string, number> = {};
    recentLogs.forEach(log => {
      if (log.checkedIds && Array.isArray(log.checkedIds)) {
        log.checkedIds.forEach((itemId: string) => {
          const item = practiceItems.find(p => p.id === itemId);
          if (item) {
            const name = item.question;
            stats[name] = (stats[name] || 0) + 1;
          }
        });
      }
    });

    return stats;
  };

  const practiceStats = getPracticeStats();
  const totalCount = Object.values(practiceStats).reduce((sum, count) => sum + count, 0);

  // Calculate current streak (consecutive days)
  const getCurrentStreak = () => {
    if (practiceLogs.length === 0) return 0;

    // Sort logs by date descending
    const sortedLogs = [...practiceLogs].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check from today backwards
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const hasLog = sortedLogs.some(log => log.date === dateStr);

      if (hasLog) {
        streak++;
      } else {
        // If it's today and no log, continue checking yesterday
        if (i === 0) continue;
        // Otherwise break the streak
        break;
      }
    }

    return streak;
  };

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '';

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

    return `${year}년 ${month}월 ${day}일`;
  };

  // Render Weekly Heatmap View (옵션 4)
  const renderWeeklyHeatmap = () => {
    const now = new Date();
    const currentDay = now.getDay();

    // Generate week dates (Monday to Sunday)
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
    const weekDates: string[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      weekDates.push(`${year}-${month}-${day}`);
    }

    // Get unique practice items from recent logs
    const itemIds = new Set<string>();
    practiceLogs.forEach(log => {
      if (log.checkedIds && Array.isArray(log.checkedIds)) {
        log.checkedIds.forEach((id: string) => itemIds.add(id));
      }
    });

    const items = Array.from(itemIds)
      .map(id => practiceItems.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 10); // Show max 10 items

    // Helper to check if item was done on a specific date
    const wasItemDone = (itemId: string, dateStr: string) => {
      const log = practiceLogs.find(l => l.date === dateStr);
      return log?.checkedIds?.includes(itemId) || false;
    };

    return (
      <div className="space-y-6">
        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[20px] border border-dashed border-gray-200">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-[13px] font-bold text-gray-400 mb-2">아직 기록이 없습니다</p>
            <p className="text-sm text-gray-300">+ 버튼을 눌러 첫 수행을 기록해보세요</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <h3 className="text-[14px] font-bold text-dark mb-6">이번주 수행 현황</h3>

            {/* Header - Week Days */}
            <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: '100px repeat(7, 1fr)' }}>
              <div className="text-sm font-bold text-gray-500"></div>
              {weekDays.map((day, idx) => {
                const isToday = weekDates[idx] === now.toISOString().split('T')[0];
                return (
                  <div
                    key={idx}
                    className={`text-center text-sm font-bold ${isToday ? 'text-secondary' : 'text-gray-500'}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-3 max-h-[calc(100vh-480px)] overflow-y-auto pr-2">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="grid gap-2 items-center"
                  style={{ gridTemplateColumns: '100px repeat(7, 1fr)' }}
                >
                  {/* Practice Item Name */}
                  <div className="text-sm font-semibold text-dark truncate pr-2">
                    {item.question}
                  </div>

                  {/* Week Status */}
                  {weekDates.map((dateStr, idx) => {
                    const isDone = wasItemDone(item.id, dateStr);
                    const isToday = dateStr === now.toISOString().split('T')[0];

                    return (
                      <div key={idx} className="flex justify-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                            ${isDone
                              ? 'bg-primary shadow-md'
                              : 'bg-gray-100 border-2 border-gray-200'}
                            ${isToday ? 'ring-2 ring-secondary ring-offset-2' : ''}
                          `}
                        >
                          {isDone ? (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
                <span className="text-xs text-gray-600">완료</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                </div>
                <span className="text-xs text-gray-600">미완료</span>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  // Render Timeline View (옵션 2)
  const renderTimelineView = () => {
    return (
      <div className="space-y-4">
        {practiceLogs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[20px] border border-dashed border-gray-200">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-[13px] font-bold text-gray-400 mb-2">아직 기록이 없습니다</p>
            <p className="text-sm text-gray-300">+ 버튼을 눌러 첫 수행을 기록해보세요</p>
          </div>
        ) : (
          practiceLogs.map((log) => {
            const itemNames = log.checkedIds?.map((itemId: string) => {
              const item = practiceItems.find(p => p.id === itemId);
              return item?.question || '';
            }).filter(Boolean) || [];

            return (
              <div
                key={log.id}
                className="bg-white p-6 rounded-[20px] shadow-sm border-l-4 border-l-secondary"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[14px] text-gray-600">
                    <Calendar size={16} />
                    <span className="font-semibold">{formatDate(log.date)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-primary">{log.progress}%</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {itemNames.map((name: string, idx: number) => (
                    <span key={idx} className="text-sm bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // Render Stats View (옵션 3)
  const renderStatsView = () => {
    const sortedStats = Object.entries(practiceStats).sort((a, b) => b[1] - a[1]);
    const maxCount = sortedStats.length > 0 ? sortedStats[0][1] : 1;

    return (
      <div className="space-y-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100">
          <h4 className="text-[13px] font-bold text-dark mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            항목별 수행 횟수
          </h4>
          <div className="space-y-4 max-h-[calc(100vh-420px)] overflow-y-auto pr-2">
            {sortedStats.length === 0 ? (
              <p className="text-center text-gray-400 py-8">아직 데이터가 없습니다</p>
            ) : (
              sortedStats.map(([type, count]) => {
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 truncate flex-1 mr-2">
                        {type}
                      </span>
                      <span className="text-[13px] font-bold text-primary">{count}회</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // Generate monthly calendar with heatmap (옵션 1)
  const renderMonthlyCalendar = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get first day of month and total days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    // Create calendar grid
    const calendarDays = [];

    // Empty cells before first day (adjust for Monday start)
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = 0; i < adjustedStartDay; i++) {
      calendarDays.push(null);
    }

    // Fill in actual days
    for (let day = 1; day <= totalDays; day++) {
      calendarDays.push(day);
    }

    // Helper to get progress for a specific day
    const getProgressForDay = (day: number) => {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = practiceLogs.find(l => l.date === dateStr);
      return log ? log.progress : 0;
    };

    // Get intensity color based on progress
    const getIntensityColor = (progress: number) => {
      if (progress === 0) return 'bg-gray-100';
      if (progress < 30) return 'bg-primary/20';
      if (progress < 60) return 'bg-primary/40';
      if (progress < 100) return 'bg-primary/60';
      return 'bg-primary';
    };

    return (
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6">
        <h3 className="text-[14px] font-bold text-dark mb-4">
          {currentYear}년 {currentMonth + 1}월
        </h3>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => (
            <div key={idx} className="text-center text-sm font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const progress = getProgressForDay(day);
            const isToday = day === now.getDate();

            return (
              <div
                key={day}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all relative
                  ${getIntensityColor(progress)}
                  ${progress === 100 ? 'text-white' : 'text-gray-700'}
                  ${isToday ? 'ring-2 ring-secondary ring-offset-2' : ''}
                `}
              >
                {day}
                {progress === 100 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500 mr-2">수행 강도</span>
          <div className="w-5 h-5 rounded bg-gray-100" />
          <div className="w-5 h-5 rounded bg-primary/20" />
          <div className="w-5 h-5 rounded bg-primary/40" />
          <div className="w-5 h-5 rounded bg-primary/60" />
          <div className="w-5 h-5 rounded bg-primary" />
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 pt-14 pb-32 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[22px] font-bold text-dark">나의 수행 기록</h2>
      </div>

      {/* Stats Card - Last 30 Days and Streak - Enhanced for 50-60 age group */}
      <div className="mb-8 bg-gradient-to-br from-primary/10 to-secondary/10 p-8 rounded-[24px] border-2 border-primary/30 shadow-lg">
        <div className="grid grid-cols-2 gap-6">
          {/* Total Count */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-3">
              <TrendingUp size={32} className="text-primary" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-2">이번 달</p>
            <p className="text-4xl font-bold text-dark">
              {totalCount}
              <span className="text-[13px] font-medium text-gray-600 ml-2">회</span>
            </p>
          </div>

          {/* Current Streak */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-3">
              <Calendar size={32} className="text-secondary" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-2">연속 수행</p>
            <p className="text-4xl font-bold text-dark">
              {getCurrentStreak()}
              <span className="text-[13px] font-medium text-gray-600 ml-2">일</span>
            </p>
          </div>
        </div>
      </div>

      {/* Render Content Based on View Mode - No Tabs */}
      {viewMode === 'weekly' && renderWeeklyHeatmap()}

      {viewMode === 'calendar' && (
        <>
          {renderMonthlyCalendar()}
          {/* Recent Logs - Only for Calendar View */}
          {practiceLogs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[13px] font-bold text-dark mb-3">최근 기록</h3>
              <div className="space-y-3">
                {practiceLogs.slice(0, 5).map((log) => {
                  const itemNames = log.checkedIds?.map((itemId: string) => {
                    const item = practiceItems.find(p => p.id === itemId);
                    return item?.question || '';
                  }).filter(Boolean) || [];

                  return (
                    <div
                      key={log.id}
                      className="bg-white p-4 rounded-[16px] shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar size={14} />
                        <span>{formatDate(log.date)}</span>
                        <span className="ml-auto text-primary font-bold text-[14px]">{log.progress}%</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {itemNames.map((name: string, idx: number) => (
                          <span key={idx} className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-lg">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'timeline' && renderTimelineView()}
      {viewMode === 'stats' && renderStatsView()}
    </div>
  );
};

export default PracticeLogView;
