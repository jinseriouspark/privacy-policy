import React, { useState, useEffect } from 'react';
import { User, Instructor, AvailabilityData } from '../types';
import { getInstructorAvailability, createReservation } from '../lib/supabase/database';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Calendar as CalendarIcon, Sun, Moon, ExternalLink } from 'lucide-react';

interface ReservationProps {
  user: User | null; // Allow null for guest booking
  instructor: Instructor;
  onBack: () => void;
  onSuccess: () => void;
}

const Reservation: React.FC<ReservationProps> = ({ user, instructor, onBack, onSuccess }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>(""); 
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const getWeekDates = (startDate: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  };

  const toLocalYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const weekDates = getWeekDates(currentWeekStart);

  useEffect(() => {
    const today = new Date();
    const todayStr = toLocalYMD(today);
    const isTodayInWeek = weekDates.some(d => toLocalYMD(d) === todayStr);
    if (isTodayInWeek && !selectedDateStr) {
        setSelectedDateStr(todayStr);
    } else if (!selectedDateStr) {
        setSelectedDateStr(toLocalYMD(weekDates[0]));
    }
  }, [currentWeekStart]);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const startStr = toLocalYMD(weekDates[0]);
        const endStr = toLocalYMD(weekDates[6]);

        const data = await getInstructorAvailability(
          instructor.id,
          `${startStr}T00:00:00Z`,
          `${endStr}T23:59:59Z`
        );
        setAvailability(data);
      } catch (e) {
        console.error('Failed to fetch availability:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [currentWeekStart, instructor.id]); 

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
    setSelectedTime(null);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
    setSelectedTime(null);
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setSelectedTime(null);
  };

  const handleConfirm = async () => {
    if (!selectedDateStr || !selectedTime || !user) return;

    setProcessing(true);
    setError(null);

    try {
      const startTime = new Date(`${selectedDateStr}T${selectedTime}:00`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      await createReservation({
        student_id: user.id,
        instructor_id: instructor.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      });
      setConfirmed(true);
      setTimeout(onSuccess, 4000);
    } catch (err: any) {
      console.error('Reservation error:', err);
      setError(err.message || '예약 중 오류가 발생했습니다.');
      setProcessing(false);
    }
  };

  // Google Calendar Link Generation
  const getGoogleCalendarUrl = () => {
    if (!selectedDateStr || !selectedTime) return "#";
    
    const start = new Date(`${selectedDateStr}T${selectedTime}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const title = encodeURIComponent(`[1:1 코칭] ${instructor.name}님과의 세션`);
    const details = encodeURIComponent("스마트 코칭 시스템을 통해 예약된 일정입니다. (Google Meet 링크는 이메일 초대장을 확인해주세요)");
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(start)}/${format(end)}&details=${details}`;
  };

  const getAvailableSlots = () => {
    if (!availability || !selectedDateStr) return [];

    const targetDate = new Date(selectedDateStr);
    const dayIndex = targetDate.getDay(); 
    
    const settings = availability.workingHours[dayIndex];
    if (!settings || !settings.isWorking) return [];

    const slots = [];
    const startH = parseInt(settings.start.split(':')[0], 10);
    const endH = parseInt(settings.end.split(':')[0], 10);

    for (let h = startH; h < endH; h++) {
      const timeLabel = `${h.toString().padStart(2, '0')}:00`;
      let status: 'available' | 'busy' | 'past' = 'available';

      const slotDateTime = new Date(`${selectedDateStr}T${timeLabel}:00`);
      const now = new Date();
      if (slotDateTime < now) {
        status = 'past';
      } else {
        const slotEndTime = new Date(slotDateTime.getTime() + 60 * 60 * 1000); 
        const isBusy = availability.busyRanges.some(range => {
            const busyStart = new Date(range.start);
            const busyEnd = new Date(range.end);
            return busyStart < slotEndTime && busyEnd > slotDateTime;
        });

        if (isBusy) status = 'busy';
      }

      slots.push({ time: timeLabel, status, hour: h });
    }
    return slots;
  };

  const slots = getAvailableSlots();
  const morningSlots = slots.filter(s => s.hour < 12);
  const afternoonSlots = slots.filter(s => s.hour >= 12 && s.hour < 18);
  const eveningSlots = slots.filter(s => s.hour >= 18);

  const renderSlotGroup = (title: string, icon: React.ReactNode, groupSlots: typeof slots) => {
    if (groupSlots.length === 0) return null;
    return (
      <div className="mb-6 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center space-x-2 mb-3 text-slate-500">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {groupSlots.map((slot) => {
             const isSelected = selectedTime === slot.time;
             const isDisabled = slot.status !== 'available';
             return (
               <button
                  key={slot.time}
                  disabled={isDisabled}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`
                      py-3 px-2 rounded-xl text-sm font-bold border transition-all duration-200 relative
                      ${isSelected 
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg ring-2 ring-orange-200 ring-offset-1' 
                          : isDisabled
                              ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-white border-slate-200 text-slate-900 hover:border-orange-400 hover:text-orange-500 hover:shadow-sm'
                      }
                  `}
               >
                  {slot.time}
                  {slot.status === 'busy' && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full -mt-1 -mr-1 ring-2 ring-white"></span>
                  )}
               </button>
             );
          })}
        </div>
      </div>
    );
  };

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300 px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">예약 확정</h2>
        <div className="text-slate-600 mb-8 space-y-1">
            <p className="font-medium text-lg text-slate-800">{instructor.name}</p>
            <p><strong>{selectedDateStr} {selectedTime}</strong></p>
            <p className="text-sm text-slate-500 mt-2">이메일 초대장 발송됨</p>
        </div>

        <div className="w-full max-w-xs space-y-3">
            <a 
                href={getGoogleCalendarUrl()}
                target="_blank" 
                rel="noreferrer"
                className="w-full py-3 bg-orange-50 text-orange-500 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors flex items-center justify-center border border-orange-100"
            >
                <ExternalLink size={16} className="mr-2" />
                Google 캘린더 추가
            </a>
            <button
                onClick={onSuccess}
                className="w-full py-3 text-slate-400 text-sm hover:text-slate-600 transition-colors underline decoration-slate-300"
            >
                대시보드로 이동
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
            <h2 className="text-xl font-bold text-slate-900">시간 선택</h2>
            <p className="text-xs text-slate-500">{instructor.name}의 일정</p>
        </div>
      </div>

      {/* Week Selector ... (동일) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500 flex items-center">
                <CalendarIcon size={16} className="mr-1"/> 
                {currentWeekStart.getFullYear()}년 {currentWeekStart.getMonth() + 1}월
            </span>
            <div className="flex space-x-2">
                <button onClick={handlePrevWeek} className="p-1 hover:bg-slate-100 rounded-full text-slate-400"><ChevronLeft size={20}/></button>
                <button onClick={handleNextWeek} className="p-1 hover:bg-slate-100 rounded-full text-slate-400"><ChevronRight size={20}/></button>
            </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
            {weekDates.map((d, i) => {
                const dateStr = toLocalYMD(d);
                const isSelected = selectedDateStr === dateStr;
                const isToday = toLocalYMD(new Date()) === dateStr;
                const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];

                return (
                    <button
                        key={i}
                        onClick={() => handleDateClick(dateStr)}
                        className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-200 ${
                            isSelected 
                                ? 'bg-slate-900 text-white shadow-md scale-105' 
                                : 'bg-transparent text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <span className={`text-xs mb-1 ${isSelected ? 'text-slate-300' : isToday ? 'text-orange-500 font-bold' : ''}`}>
                            {dayName}
                        </span>
                        <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {d.getDate()}
                        </span>
                        {isToday && !isSelected && <div className="w-1 h-1 bg-orange-500 rounded-full mt-1"></div>}
                    </button>
                );
            })}
        </div>
      </div>

      <div className="min-h-[300px]">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-3">
                 <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
                 <span className="text-slate-400 text-sm">일정 확인 중...</span>
             </div>
        ) : slots.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">예약 가능한 시간이 없습니다.</p>
                <p className="text-slate-400 text-xs mt-1">휴무일이거나 코치님의 일정이 꽉 찼습니다.</p>
            </div>
        ) : (
            <div className="pt-2">
                {renderSlotGroup("오전", <Sun size={16}/>, morningSlots)}
                {renderSlotGroup("오후", <Sun size={16} className="text-orange-400"/>, afternoonSlots)}
                {renderSlotGroup("저녁", <Moon size={16} className="text-indigo-400"/>, eveningSlots)}
            </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center animate-pulse">
          {error}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex items-center justify-center md:static md:bg-transparent md:border-none md:p-0 md:mt-6 z-50">
        <div className="w-full max-w-md">
            <button
                onClick={handleConfirm}
                disabled={!selectedTime || processing || !user}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
                {processing ? <Loader2 className="animate-spin mr-2" /> : null}
                {!user ? '로그인이 필요합니다' : selectedTime ? `${selectedTime} 예약하기` : '시간을 선택해주세요'}
            </button>
        </div>
      </div>
      <div className="h-24 md:h-0"></div>
    </div>
  );
};

export default Reservation;