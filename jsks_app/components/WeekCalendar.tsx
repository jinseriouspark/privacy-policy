
import React, { useMemo, useState } from 'react';
import { DayData, ScheduleItem } from '../types';
import { APP_STRINGS } from '../constants';
import { Lunar, Solar } from 'lunar-javascript';
import { getSpecialDate } from '../utils/specialDates';

interface WeekCalendarProps {
  days: DayData[];
  practiceLogs: any[];
  schedules?: ScheduleItem[];
  onSeeAll?: () => void;
  title?: string;
  onScheduleClick?: (schedule: ScheduleItem) => void;
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({ days: _externalDays, practiceLogs, schedules = [], onSeeAll, title, onScheduleClick }) => {
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
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
      const isMonday = i === 0;
      let autoLunarDate = '';
      if (isMonday) {
        const solar = Solar.fromDate(date);
        const lunar = solar.getLunar();
        autoLunarDate = `${lunar.getMonth()}.${lunar.getDay()}`;
      }

      // Get special date info
      const specialInfo = getSpecialDate(dateStr, isMonday);
      const displayLunar = autoLunarDate || specialInfo.lunarInfo;

      result.push({
        dayLabel: weekDays[i],
        dayNumber: date.getDate(),
        status: status,
        isToday: isToday,
        hasSchedule: isPracticeComplete, // 수행 완료 시 점 표시
        lunarDate: displayLunar,
        specialEvent: specialInfo.event,
        dateStr: dateStr // 날짜 문자열 저장
      });
    }
    return result;
  }, [practiceLogs, schedules]);

  // Filter schedules for selected date
  const filteredSchedules = useMemo(() => {
    if (!selectedDateStr) return [];
    return schedules.filter(item => {
      if (item.date !== selectedDateStr) return false;
      if (item.id?.startsWith('practice_')) return false;
      if (item.meta === '수행 완료') return false;
      return item.type === 'temple' || item.type === 'personal';
    });
  }, [selectedDateStr, schedules]);

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
          <div key={index} className="flex flex-col items-center gap-2 group">
            {/* Day Label */}
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${day.isToday ? 'text-secondary' : 'text-gray-400'}`}>
              {day.dayLabel}
            </span>

            {/* Day Number Box */}
            <div
              onClick={() => setSelectedDateStr(day.dateStr || null)}
              className={`
                w-full aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-300 relative p-1 cursor-pointer
                ${day.isToday
                  ? 'bg-dark text-white shadow-lg'
                  : 'bg-white border border-gray-100 text-gray-400 hover:border-gray-300'}
                ${selectedDateStr === day.dateStr ? 'ring-2 ring-primary' : ''}
              `}
            >
              {/* Row 1: Lunar date */}
              {day.lunarDate && (
                <div className={`text-[7px] font-medium leading-none mb-0.5 ${day.isToday ? 'text-white/70' : 'text-gray-400'}`}>
                  {day.lunarDate}
                </div>
              )}

              {/* Row 2: Day number */}
              <span className={`text-[16px] font-bold leading-none ${day.isToday ? 'text-white' : 'text-dark'}`}>
                {day.dayNumber}
              </span>

              {/* Row 3: Special event/holiday */}
              {day.specialEvent && (
                <div className={`text-[6px] font-bold leading-tight mt-0.5 text-center truncate w-full ${day.isToday ? 'text-white/90' : 'text-secondary'}`}>
                  {day.specialEvent}
                </div>
              )}

              {/* Schedule indicator - compact version */}
              {day.hasSchedule && (
                <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-secondary' : 'bg-secondary'}`} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Schedule List for Selected Date */}
      {selectedDateStr && filteredSchedules.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-bold text-dark">
              {selectedDateStr.split('-')[1]}월 {selectedDateStr.split('-')[2]}일 일정
            </h4>
            <button
              onClick={() => setSelectedDateStr(null)}
              className="text-[10px] text-gray-400 hover:text-dark"
            >
              닫기
            </button>
          </div>
          {filteredSchedules.map(item => (
            <div
              key={item.id}
              onClick={() => onScheduleClick?.(item)}
              className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-gray-500 font-medium">
                  {item.time}
                </div>
                <h5 className="text-[12px] font-bold text-dark leading-snug">
                  {item.title}
                </h5>
                {item.location && (
                  <div className="text-gray-500 text-[10px]">
                    {item.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeekCalendar;
