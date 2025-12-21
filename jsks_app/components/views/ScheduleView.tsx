
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, Maximize2, Minimize2, ArrowLeft, Plus } from 'lucide-react';
import { ScheduleItem } from '../../types';
import { Lunar, Solar } from 'lunar-javascript';
import { getSpecialDate } from '../../utils/specialDates';

interface ScheduleViewProps {
  schedules: ScheduleItem[];
  onBack?: () => void;
  onScheduleClick?: (schedule: ScheduleItem) => void;
  onAddSchedule?: () => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ schedules, onBack, onScheduleClick, onAddSchedule }) => {
  const [baseDate, setBaseDate] = useState(new Date()); // The month being viewed
  const [selectedDate, setSelectedDate] = useState(new Date()); // The specific day selected
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month'); // Pinch-to-zoom state

  // --- Helper Functions ---
  const getYearMonth = (date: Date) => {
    return { year: date.getFullYear(), month: date.getMonth() };
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const handlePrev = () => {
    const newDate = new Date(baseDate);
    if (viewMode === 'month') newDate.setMonth(baseDate.getMonth() - 1);
    else newDate.setDate(baseDate.getDate() - 7);
    setBaseDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(baseDate);
    if (viewMode === 'month') newDate.setMonth(baseDate.getMonth() + 1);
    else newDate.setDate(baseDate.getDate() + 7);
    setBaseDate(newDate);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'month' ? 'week' : 'month');
  };

  // --- Pinch to Zoom Logic ---
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartDist = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      // Threshold for zoom
      if (dist - touchStartDist.current > 50) setViewMode('month'); // Pinch Out -> Month
      if (touchStartDist.current - dist > 50) setViewMode('week');  // Pinch In -> Week
    }
  };

  // --- Calendar Grid Generation ---
  const renderCalendarDays = () => {
    const { year, month } = getYearMonth(baseDate);
    const days = [];

    if (viewMode === 'month') {
      // Month View Generation (Start from Monday)
      const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)
      const adjustedFirstDay = (firstDayOfMonth + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Empty slots for previous month
      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-10" />);
      }

      // Actual days
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDateKey(year, month, day);
        const dateObj = new Date(year, month, day);
        days.push(renderDayCell(day, dateObj, dateKey));
      }
    } else {
      // Week View Generation (Start from Monday)
      const currentDayOfWeek = baseDate.getDay();
      const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      const monday = new Date(baseDate);
      monday.setDate(baseDate.getDate() + mondayOffset);

      for (let i = 0; i < 7; i++) {
        const dateObj = new Date(monday);
        dateObj.setDate(monday.getDate() + i);
        const day = dateObj.getDate();
        const { year: y, month: m } = getYearMonth(dateObj);
        const dateKey = formatDateKey(y, m, day);
        days.push(renderDayCell(day, dateObj, dateKey));
      }
    }

    return days;
  };

  const renderDayCell = (day: number, dateObj: Date, dateKey: string) => {
    const isSelected = isSameDay(dateObj, selectedDate);
    const isToday = isSameDay(dateObj, new Date());

    // Find events for this day (temple and personal events)
    const dayEvents = schedules.filter(s => {
      if (s.date !== dateKey) return false;
      if (s.id.startsWith('practice_')) return false; // Exclude practice logs
      if (s.meta === '수행 완료') return false; // Exclude practice completion records
      if (s.type !== 'temple' && s.type !== 'personal') return false; // Temple and personal events
      return true;
    });
    const hasEvents = dayEvents.length > 0;

    // Get lunar date (only for Monday - day of week = 1)
    const isMonday = dateObj.getDay() === 1;
    let autoLunarDate = '';
    if (isMonday) {
      const solar = Solar.fromDate(dateObj);
      const lunar = solar.getLunar();
      autoLunarDate = `${lunar.getMonth()}.${lunar.getDay()}`;
    }

    // Get special date info
    const specialInfo = getSpecialDate(dateKey, isMonday);
    const displayLunar = autoLunarDate || specialInfo.lunarInfo;

    // Check if it's a holiday (Sunday or special holiday with "대체휴일" or public holidays)
    const isSunday = dateObj.getDay() === 0;
    const isHoliday = specialInfo.event && (
      specialInfo.event.includes('대체휴일') ||
      specialInfo.event.includes('삼일절') ||
      specialInfo.event.includes('어린이날') ||
      specialInfo.event.includes('현충일') ||
      specialInfo.event.includes('광복절') ||
      specialInfo.event.includes('개천절') ||
      specialInfo.event.includes('한글날') ||
      specialInfo.event.includes('설날') ||
      specialInfo.event.includes('추석') ||
      specialInfo.event.includes('부처님오신날') ||
      specialInfo.event.includes('식목일')
    );
    const isRedDay = isSunday || isHoliday;

    return (
      <div
        key={dateKey}
        onClick={() => { setSelectedDate(dateObj); setBaseDate(dateObj); }}
        className={`
          h-[60px] p-1.5 border-r border-b border-gray-100 cursor-pointer transition-colors overflow-hidden
          ${isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
          ${dateObj.getDay() === 0 ? 'border-r-0' : ''}
        `}
      >
        {/* Row 1: Solar date (1,1) and Lunar date (1,2) */}
        <div className="flex items-baseline justify-between mb-0.5">
          <div className={`
            text-[14px] font-bold leading-none
            ${isToday ? 'bg-primary text-white rounded-md px-1.5 py-0.5' : ''}
            ${!isToday && isSelected ? 'text-primary' : ''}
            ${!isToday && !isSelected && isRedDay ? 'text-red-500' : ''}
            ${!isToday && !isSelected && !isRedDay ? 'text-gray-700' : ''}
          `}>
            {day}
          </div>

          {/* Lunar date - (1,2) position */}
          {displayLunar && (
            <div className="text-[7px] text-gray-400 font-medium leading-none">
              {displayLunar}
            </div>
          )}
        </div>

        {/* Row 2: Event/Holiday (2,1) and Schedule Count (2,2) */}
        <div className="flex items-start justify-between gap-0.5">
          {/* Special event/holiday - (2,1) position */}
          {specialInfo.event && (
            <div className="text-[7px] text-secondary font-bold leading-tight flex-1 truncate">
              {specialInfo.event}
            </div>
          )}

          {/* Event count - (2,2) position */}
          {hasEvents && (
            <div className="text-[8px] text-primary font-bold leading-none whitespace-nowrap">
              {dayEvents.length}개
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filter schedules for the list
  const selectedDateKey = formatDateKey(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );

  const filteredSchedules = schedules.filter(item => {
    if (item.date !== selectedDateKey) return false;
    if (item.id.startsWith('practice_')) return false; // Exclude practice logs
    if (item.meta === '수행 완료') return false; // Exclude practice completion records
    if (item.type !== 'temple' && item.type !== 'personal') return false; // Temple and personal events
    return true;
  });

  return (
    <div
      className="px-6 pt-14 pb-32 animate-fade-in select-none"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Back Button */}
      {onBack && (
        <div className="mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={28} className="text-dark" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[22px] font-bold text-dark">일정</h2>
        <button
          onClick={toggleViewMode}
          className="px-4 py-2 bg-white border-2 border-gray-200 hover:border-primary hover:bg-primary/5 rounded-xl font-bold text-sm text-dark transition-all active:scale-95"
        >
          {viewMode === 'month' ? '주간' : '월간'}
        </button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft size={20} /></button>
        <span className="text-[14px] font-bold text-dark">
          {baseDate.getFullYear()}({baseDate.getFullYear() + 544})년 {baseDate.getMonth() + 1}월 {viewMode === 'week' ? ' (주간)' : ''}
        </span>
        <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronRight size={20} /></button>
      </div>

      {/* Calendar Grid - Google Calendar Style */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 mb-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['월','화','수','목','금','토','일'].map((d, i) => (
            <div key={d} className={`text-center py-2 text-[10px] font-bold ${i === 6 ? 'text-red-500' : 'text-gray-600'} uppercase tracking-wider`}>
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Selected Date Header */}
      <div className="mb-3">
        <h3 className="text-[14px] font-bold text-gray-700">
          {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
        </h3>
      </div>

      {/* Schedule List - Simple */}
      <div className="space-y-4 mb-6">
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map(item => (
            <div
              key={item.id}
              onClick={() => onScheduleClick?.(item)}
              className="relative bg-white p-5 rounded-[16px] shadow-sm border-l-[5px] transition-transform active:scale-[0.99] cursor-pointer border-l-primary"
            >
              <div className="flex flex-col gap-1.5">
                {/* Date & Time Badge */}
                <div className="text-[12px] text-gray-500 font-medium">
                  {item.time}
                </div>

                <h3 className="text-[14px] font-bold text-dark leading-snug">
                  {item.title}
                </h3>

                {item.location && (
                  <div className="text-gray-500 text-[12px]">
                    {item.location}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-[13px]">일정이 없습니다</p>
          </div>
        )}
      </div>

      {/* Add Schedule Button - Always Visible at Bottom */}
      {onAddSchedule && (
        <button
          onClick={onAddSchedule}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg"
        >
          일정 추가하기
        </button>
      )}
    </div>
  );
};

export default ScheduleView;
