
import React, { useMemo } from 'react';
import { DayData, ScheduleItem } from '../types';
import { APP_STRINGS } from '../constants';
import { Lunar, Solar } from 'lunar-javascript';

interface WeekCalendarProps {
  days: DayData[];
  practiceLogs: any[];
  schedules?: ScheduleItem[];
  onSeeAll?: () => void;
  title?: string;
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({ days: _externalDays, practiceLogs, schedules = [], onSeeAll, title }) => {
  
  // Dynamically generate the current week's days and merge with practice logs
  const days: DayData[] = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const result: DayData[] = [];

    // Start from Monday
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      // Normalize date string for comparison "YYYY-MM-DD"
      // Note: timezone handling might be simple here as per requirements
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const isToday = date.toDateString() === today.toDateString();
      const isFuture = date > today && !isToday;
      
      // Check logs
      const log = practiceLogs.find(l => l.date === dateStr);
      let status: 'complete' | 'today' | 'future' | 'missed' = 'future';

      if (isToday) {
        status = 'today'; 
        if (log && log.progress === 100) status = 'complete';
      } else if (isFuture) {
        status = 'future';
      } else {
        // Past
        if (log && log.progress === 100) status = 'complete';
        else status = 'missed';
      }

      // Check if practice is completed on this day
      const isPracticeComplete = log && log.progress === 100;

      // Get lunar date (only for Monday - index 0)
      let lunarDate = '';
      if (i === 0) { // Monday
        const solar = Solar.fromDate(date);
        const lunar = solar.getLunar();
        lunarDate = `${lunar.getMonth()}.${lunar.getDay()}`;
      }

      result.push({
        dayLabel: weekDays[i],
        dayNumber: date.getDate(),
        status: status,
        isToday: isToday,
        hasSchedule: isPracticeComplete, // 수행 완료 시 점 표시
        lunarDate: lunarDate
      });
    }
    return result;
  }, [practiceLogs, schedules]);

  return (
    <div className="w-full flex flex-col">
      {title && (
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[13px] text-dark font-bold tracking-tight">
            {title}
          </h3>
        </div>
      )}

      <div className="w-full grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer">
            {/* Day Label */}
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${day.isToday ? 'text-secondary' : 'text-gray-400'}`}>
              {day.dayLabel}
            </span>

            {/* Day Number Box */}
            <div
              className={`
                w-full aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-300 relative
                ${day.isToday
                  ? 'bg-dark text-white shadow-lg'
                  : 'bg-white border border-gray-100 text-gray-400 hover:border-gray-300'}
              `}
            >
              {/* Lunar date - only on Monday */}
              {day.lunarDate && (
                <div className={`text-[9px] font-medium mb-0.5 ${day.isToday ? 'text-white/70' : 'text-gray-400'}`}>
                  {day.lunarDate}
                </div>
              )}

              {/* Day number */}
              <span className={`text-[16px] font-bold leading-none ${day.isToday ? 'text-white' : 'text-dark'}`}>
                {day.dayNumber}
              </span>

              {/* Schedule indicator - compact version */}
              {day.hasSchedule && (
                <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-secondary' : 'bg-secondary'}`} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekCalendar;
