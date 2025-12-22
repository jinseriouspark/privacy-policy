import React, { useState, useEffect } from 'react';
import { User, Instructor, AvailabilityData } from '../types';
import { getInstructorAvailability, createReservation, getStudentPackages, getInstructorSettings, deductPackageCredit } from '../lib/supabase/database';
import { signInWithGoogle } from '../lib/supabase/auth';
import { addEventToCalendar } from '../lib/google-calendar';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Calendar as CalendarIcon, Sun, Moon, ExternalLink, Package } from 'lucide-react';

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
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [userPackages, setUserPackages] = useState<any[]>([]);
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

  // Fetch user's packages
  useEffect(() => {
    const fetchPackages = async () => {
      console.log('[Reservation] fetchPackages called, user:', user ? { id: user.id, email: user.email, name: user.name } : null);

      if (!user) {
        console.log('[Reservation] No user, skipping package fetch');
        return;
      }

      try {
        console.log('[Reservation] Fetching packages for:', {
          user: user,
          studentId: user.id,
          studentEmail: user.email,
          instructorId: instructor.id,
          instructorName: instructor.name
        });
        const packages = await getStudentPackages(user.id, instructor.id);
        console.log('[Reservation] Packages fetched:', packages);

        // Filter active packages with remaining sessions
        const activePackages = packages.filter((pkg: any) => {
          const now = new Date();
          const expiresAt = pkg.expires_at ? new Date(pkg.expires_at) : null;
          const isExpired = expiresAt && expiresAt < now;
          const isActive = pkg.remaining_sessions > 0 && !isExpired;
          console.log('[Reservation] Package filter:', {
            id: pkg.id,
            name: pkg.name,
            remaining: pkg.remaining_sessions,
            expiresAt,
            isExpired,
            isActive
          });
          return isActive;
        });
        console.log('[Reservation] Active packages:', activePackages);
        setUserPackages(activePackages);

        // Auto-select first package if available
        if (activePackages.length > 0 && !selectedPackageId) {
          setSelectedPackageId(activePackages[0].id);
          console.log('[Reservation] Auto-selected package:', activePackages[0].id);
        }
      } catch (e) {
        console.error('[Reservation] Failed to fetch packages:', e);
      }
    };

    fetchPackages();
  }, [user, instructor.id]); 

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
      // Validate package selection
      if (!selectedPackageId) {
        throw new Error('수강권을 선택해주세요.');
      }

      // Verify package still has credits
      const selectedPackage = userPackages.find(pkg => pkg.id === selectedPackageId);
      if (!selectedPackage) {
        throw new Error('선택한 수강권을 찾을 수 없습니다.');
      }

      if (selectedPackage.remaining_sessions <= 0) {
        throw new Error('수강권 잔여 횟수가 부족합니다.');
      }

      const startTime = new Date(`${selectedDateStr}T${selectedTime}:00`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      // Get instructor's calendar ID
      const instructorSettings = await getInstructorSettings(instructor.id);

      if (!instructorSettings?.calendar_id) {
        throw new Error('강사의 캘린더가 설정되지 않았습니다. 강사에게 문의해주세요.');
      }

      // Deduct package credit FIRST (before creating reservation)
      await deductPackageCredit(selectedPackageId);

      // Create Google Calendar event with Meet link
      console.log('Creating calendar event with:', {
        calendarId: instructorSettings.calendar_id,
        title: `코칭 - ${user.name}`,
        attendees: [user.email]
      });

      const event = await addEventToCalendar({
        calendarId: instructorSettings.calendar_id,
        title: `코칭 - ${user.name}`,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        description: `${instructor.name} 강사님과의 코칭 세션`,
        attendees: [user.email] // Add student email
      });

      console.log('Calendar event created:', event);

      // Create reservation with Meet link
      await createReservation({
        student_id: user.id,
        instructor_id: instructor.id,
        package_id: selectedPackageId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        meet_link: event.meetLink || '',
        google_event_id: event.id,
        status: 'confirmed'
      });

      // Update local state to reflect the deduction
      setUserPackages(prev => prev.map(pkg =>
        pkg.id === selectedPackageId
          ? { ...pkg, remaining_sessions: pkg.remaining_sessions - 1 }
          : pkg
      ));

      setConfirmed(true);
      setTimeout(onSuccess, 4000);
    } catch (err: any) {
      console.error('Reservation error:', err);
      setError(err.message || '예약 중 오류가 발생했습니다.');
    } finally {
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
      let type: 'private' | 'group' | null = null;
      let coachingTitle: string | null = null;

      const slotDateTime = new Date(`${selectedDateStr}T${timeLabel}:00`);
      const now = new Date();
      if (slotDateTime < now) {
        status = 'past';
      } else {
        const slotEndTime = new Date(slotDateTime.getTime() + 60 * 60 * 1000);
        const busyRange = availability.busyRanges.find(range => {
            const busyStart = new Date(range.start);
            const busyEnd = new Date(range.end);
            return busyStart < slotEndTime && busyEnd > slotDateTime;
        });

        if (busyRange) {
          status = 'busy';
          type = busyRange.type;
          coachingTitle = busyRange.coachingTitle;
        }
      }

      slots.push({ time: timeLabel, status, hour: h, type, coachingTitle });
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
             const isGroup = slot.type === 'group';
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
                  <div className="flex flex-col items-center gap-1">
                    <span>{slot.time}</span>
                    {slot.status === 'busy' && slot.type && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isGroup
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {isGroup ? '그룹' : '개인'}
                      </span>
                    )}
                  </div>
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

      {/* Package Selection */}
      {user && userPackages.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-purple-600" />
            <h3 className="font-bold text-slate-900">수강권 선택</h3>
          </div>
          <div className="space-y-2">
            {userPackages.map((pkg: any) => {
              const isSelected = selectedPackageId === pkg.id;
              const expiresAt = pkg.expires_at ? new Date(pkg.expires_at) : null;
              const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-purple-500 bg-purple-100/50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${isSelected ? 'text-purple-900' : 'text-slate-900'}`}>
                        {pkg.name || '수강권'}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        잔여: <span className="font-bold text-purple-600">{pkg.remaining_sessions}</span>
                        {pkg.total_sessions && ` / ${pkg.total_sessions}회`}
                      </p>
                      {daysLeft !== null && (
                        <p className="text-xs text-slate-500 mt-1">
                          {daysLeft > 0 ? `${daysLeft}일 남음` : '만료됨'}
                        </p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {user && userPackages.length === 0 && (
        <div className="p-6 bg-yellow-50 text-yellow-800 rounded-2xl border border-yellow-200 text-center">
          <p className="font-bold mb-2">사용 가능한 수강권이 없습니다</p>
          <p className="text-sm">강사에게 수강권 등록을 요청해주세요.</p>
        </div>
      )}

      {!user && (
        <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 text-center">
          <p className="text-slate-900 font-bold text-lg mb-3">🔒 로그인이 필요합니다</p>
          <p className="text-slate-600 text-sm mb-4">
            예약을 진행하려면 Google 계정으로 로그인해주세요
          </p>
          <button
            onClick={async () => {
              // Trigger Google login with current URL as redirect
              const { supabase } = await import('../lib/supabase/client');
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.href, // Redirect back to this exact page
                  queryParams: {
                    access_type: 'offline',
                    prompt: 'select_account',
                  },
                  scopes: 'email profile openid https://www.googleapis.com/auth/calendar',
                  skipBrowserRedirect: false
                }
              });

              if (error) {
                console.error('Login error:', error);
                setError('로그인에 실패했습니다. 다시 시도해주세요.');
              }
            }}
            className="px-6 py-3 bg-white border-2 border-orange-500 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all flex items-center justify-center mx-auto space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google로 로그인</span>
          </button>
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