import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Plus } from 'lucide-react';
import { User as UserType, Reservation } from '../../types';
import { getReservations, getAllStudentPackages, getInstructorCoachings, getAvailableTimeSlots, createReservation, deductPackageCredit, getCoachingCalendar } from '../../lib/supabase/database';
import { addEventToCalendar, addEventToStudentCalendar, ensureCalendarInList } from '../../lib/google-calendar';
import { SkeletonCalendarLoader } from './SkeletonLoader';
import toast from 'react-hot-toast';

interface MobileCalendarProps {
  user: UserType;
}

export const MobileCalendar: React.FC<MobileCalendarProps> = ({ user }) => {
  const isInstructor = user.user_type === 'instructor';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; time: string; date: Date | null }>({
    isOpen: false,
    time: '',
    date: null
  });

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday
    return new Date(d.setDate(diff));
  }

  useEffect(() => {
    loadReservations();
    loadPackages();
  }, [user.id]);

  useEffect(() => {
    if (packages.length > 0 && selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [packages.length, selectedDate.getTime()]);

  const loadReservations = async () => {
    try {
      const data = await getReservations(user.id, user.user_type);
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const studentPackages = await getAllStudentPackages(user.id);
      console.log('[MobileCalendar] All packages:', studentPackages);
      setPackages(studentPackages);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const loadTimeSlots = async (date: Date) => {
    console.log('[MobileCalendar] loadTimeSlots called with date:', date);
    console.log('[MobileCalendar] packages:', packages);

    // 유효한 수강권 찾기
    const validPackage = packages.find(pkg => {
      const expiresAt = new Date(pkg.expires_at);
      const isNotExpired = expiresAt > new Date();
      const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
      console.log('[MobileCalendar] Package check:', {
        name: pkg.name,
        expires_at: pkg.expires_at,
        isNotExpired,
        remaining_sessions: pkg.remaining_sessions,
        hasRemainingCredits,
        coaching_id: pkg.coaching_id,
        instructor_id: pkg.instructor_id
      });
      return isNotExpired && hasRemainingCredits;
    });

    console.log('[MobileCalendar] validPackage:', validPackage);

    if (!validPackage || !validPackage.instructor_id) {
      console.log('[MobileCalendar] No valid package found, clearing slots');
      setAvailableTimeSlots([]);
      return;
    }

    // coaching_id가 없으면 instructor_id로 코칭 목록 가져오기
    let coachingId = validPackage.coaching_id;
    if (!coachingId) {
      console.log('[MobileCalendar] No coaching_id, fetching instructor coachings...');
      try {
        const coachings = await getInstructorCoachings(validPackage.instructor_id.toString());
        const activeCoaching = coachings.find(c => c.status === 'active');
        if (activeCoaching) {
          coachingId = activeCoaching.id;
          console.log('[MobileCalendar] Found active coaching:', coachingId);
        } else {
          console.log('[MobileCalendar] No active coaching found');
          setAvailableTimeSlots([]);
          return;
        }
      } catch (error) {
        console.error('[MobileCalendar] Failed to fetch coachings:', error);
        setAvailableTimeSlots([]);
        return;
      }
    }

    setLoadingTimeSlots(true);
    try {
      console.log('[MobileCalendar] Fetching slots for:', {
        instructor_id: validPackage.instructor_id,
        coaching_id: coachingId,
        date
      });
      const slots = await getAvailableTimeSlots(
        validPackage.instructor_id.toString(),
        coachingId.toString(),
        date
      );
      console.log('[MobileCalendar] Received slots:', slots);
      console.log('[MobileCalendar] Slots is array?', Array.isArray(slots));
      console.log('[MobileCalendar] Slots length:', slots?.length);
      console.log('[MobileCalendar] First slot:', slots?.[0]);
      setAvailableTimeSlots(slots);
      console.log('[MobileCalendar] After setState, availableTimeSlots should update');
    } catch (error) {
      console.error('Failed to load time slots:', error);
      // Fallback to mock data
      console.log('[MobileCalendar] Using fallback mock data');
      setAvailableTimeSlots([
        '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
      ].map(time => ({ time, available: true })));
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    loadTimeSlots(date);
  };

  const handleTimeSlotClick = (time: string) => {
    if (!selectedDate) return;

    // Open confirmation modal
    setConfirmationModal({
      isOpen: true,
      time: time,
      date: selectedDate
    });
  };

  const handleConfirmBooking = async () => {
    const { time, date } = confirmationModal;
    if (!date || !time) return;

    const validPackage = packages.find(pkg => {
      const expiresAt = new Date(pkg.expires_at);
      const isNotExpired = expiresAt > new Date();
      const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
      return isNotExpired && hasRemainingCredits;
    });

    if (!validPackage) {
      toast.error('사용 가능한 수강권이 없습니다.');
      setConfirmationModal({ isOpen: false, time: '', date: null });
      return;
    }

    // coaching_id가 없으면 instructor_id로 코칭 목록 가져오기
    let coachingId = validPackage.coaching_id;
    if (!coachingId) {
      try {
        const coachings = await getInstructorCoachings(validPackage.instructor_id.toString());
        const activeCoaching = coachings.find(c => c.status === 'active');
        if (activeCoaching) {
          coachingId = activeCoaching.id;
        } else {
          toast.error('예약 가능한 코칭이 없습니다.');
          setConfirmationModal({ isOpen: false, time: '', date: null });
          return;
        }
      } catch (error) {
        toast.error('코칭 정보를 불러오는데 실패했습니다.');
        setConfirmationModal({ isOpen: false, time: '', date: null });
        return;
      }
    }

    try {
      const [hours, minutes] = time.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);

      const duration = validPackage.coaching?.duration || 60;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      // 🆕 Google Calendar 연동
      let meetLink = '';
      let googleEventId = '';

      try {
        console.log('[MobileCalendar] Fetching coaching calendar for coaching_id:', coachingId);
        const coaching = await getCoachingCalendar(coachingId.toString());
        console.log('[MobileCalendar] Coaching calendar:', coaching);

        if (coaching?.google_calendar_id) {
          console.log('[MobileCalendar] Using google_calendar_id:', coaching.google_calendar_id);

          // 캘린더가 목록에 없으면 자동으로 추가
          await ensureCalendarInList(coaching.google_calendar_id);

          // Google Calendar 이벤트 생성
          // Note: 학생 계정으로는 강사 캘린더에 writer 권한이 없을 수 있음
          // 실패 시 무시하고 DB에만 예약 저장
          const instructorName = validPackage.instructor?.name || '강사';
          const event = await addEventToCalendar({
            calendarId: coaching.google_calendar_id,
            title: `코칭 - ${user.name}`,
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            description: `${instructorName}님과의 코칭 세션`,
            attendees: [user.email],
            instructorId: validPackage.instructor_id // 🆕 Use instructor's token
          });

          console.log('[MobileCalendar] Calendar event created:', event);
          meetLink = event.meetLink || '';
          googleEventId = event.id || '';

          // 학생 캘린더에도 추가
          if (event.meetLink) {
            try {
              const studentEvent = await addEventToStudentCalendar({
                title: `코칭 - ${instructorName}`,
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                meetLink: event.meetLink,
                instructorName: instructorName
              });
              if (studentEvent) {
                console.log('[MobileCalendar] Student calendar event created:', studentEvent.htmlLink);
              }
            } catch (e) {
              console.error('[MobileCalendar] Failed to add to student calendar (non-critical):', e);
            }
          }
        } else {
          console.warn('[MobileCalendar] No Google Calendar ID found - creating reservation without Meet link');
        }
      } catch (calendarError) {
        console.error('[MobileCalendar] Google Calendar integration failed (non-critical):', calendarError);
      }

      const reservationData = {
        student_id: parseInt(user.id.toString()),
        instructor_id: parseInt(validPackage.instructor_id.toString()),
        coaching_id: parseInt(coachingId.toString()),
        package_id: validPackage.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        meet_link: meetLink,
        google_event_id: googleEventId,
        status: 'confirmed'
      };

      console.log('[MobileCalendar] Creating reservation with data:', reservationData);
      console.log('[MobileCalendar] coaching_id value:', coachingId, 'type:', typeof coachingId);

      await createReservation(reservationData);

      await deductPackageCredit(validPackage.id);

      toast.success('예약이 완료되었습니다!');
      setConfirmationModal({ isOpen: false, time: '', date: null });
      loadReservations();
      loadTimeSlots(date); // 시간대 새로고침
    } catch (error: any) {
      console.error('Booking error:', error);
      if (error.message.includes('overlap') || error.message.includes('충돌')) {
        toast.error('이미 예약된 시간입니다.');
      } else {
        toast.error('예약에 실패했습니다.');
      }
      setConfirmationModal({ isOpen: false, time: '', date: null });
    }
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeekStart(getWeekStart(today));
    setSelectedDate(today);
  };

  // Generate 7 days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Get reservations for selected date
  const selectedDateReservations = reservations.filter(r => {
    const resDate = new Date(r.start_time);
    return (
      resDate.getFullYear() === selectedDate.getFullYear() &&
      resDate.getMonth() === selectedDate.getMonth() &&
      resDate.getDate() === selectedDate.getDate() &&
      r.status !== 'cancelled'
    );
  });

  // Get count of reservations for each day
  const getReservationCount = (date: Date) => {
    return reservations.filter(r => {
      const resDate = new Date(r.start_time);
      return (
        resDate.getFullYear() === date.getFullYear() &&
        resDate.getMonth() === date.getMonth() &&
        resDate.getDate() === date.getDate() &&
        r.status !== 'cancelled'
      );
    }).length;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  if (loading) {
    return <SkeletonCalendarLoader />;
  }

  // 강사는 자신의 예약 현황을 캘린더로 보여줌
  if (isInstructor) {
    return (
      <div className="pb-20 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-900">📅 내 스케줄</h1>
          <p className="text-sm text-slate-500 mt-1">
            예약 현황을 확인하세요
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pt-6">
          <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
            <p className="text-slate-600">강사용 캘린더 뷰는 곧 제공될 예정입니다.</p>
            <p className="text-sm text-slate-400 mt-2">현재는 하단의 "예약" 탭에서 예약 목록을 확인하세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">일정 캘린더</h1>
          <button
            onClick={goToToday}
            className="text-sm px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            오늘
          </button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>

          <div className="text-center">
            <p className="font-semibold text-slate-900">
              {currentWeekStart.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </p>
            <p className="text-xs text-slate-500">
              {weekDays[0].getDate()}일 - {weekDays[6].getDate()}일
            </p>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((date, index) => {
            const count = getReservationCount(date);
            const selected = isSameDay(date, selectedDate);
            const today = isToday(date);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`aspect-square flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  selected
                    ? 'bg-orange-500 text-white shadow-lg scale-105'
                    : today
                    ? 'bg-orange-100 text-orange-900 border-2 border-orange-500'
                    : 'bg-white border border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className="text-xs mb-1">
                  {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${selected ? 'text-white' : today ? 'text-orange-900' : 'text-slate-900'}`}>
                  {date.getDate()}
                </div>
                {count > 0 && (
                  <div className={`text-xs mt-1 px-1.5 py-0.5 rounded-full ${
                    selected
                      ? 'bg-white/30 text-white'
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Time Slots */}
      <div className="px-6 mt-6 pb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })} 예약 가능한 시간
        </h3>

        {/* Cancellation Policy Notice */}
        {packages.length > 0 && packages.find(pkg => {
          const expiresAt = new Date(pkg.expires_at);
          const isNotExpired = expiresAt > new Date();
          const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
          return isNotExpired && hasRemainingCredits;
        })?.coaching?.cancellation_hours && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              ⚠️ 시작 <strong>{packages.find(pkg => {
                const expiresAt = new Date(pkg.expires_at);
                const isNotExpired = expiresAt > new Date();
                const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
                return isNotExpired && hasRemainingCredits;
              })?.coaching?.cancellation_hours}시간</strong> 전까지만 취소가 가능합니다.
              예약 취소 가능 시간이 지나면 1회 차감됩니다.
            </p>
          </div>
        )}


        {loadingTimeSlots ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : availableTimeSlots.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
            <p className="text-slate-600">예약 가능한 시간이 없습니다</p>
            <p className="text-sm text-slate-400 mt-2">다른 날짜를 선택해주세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {availableTimeSlots.map(slot => (
              <button
                key={slot.time}
                onClick={() => slot.available && handleTimeSlotClick(slot.time)}
                disabled={!slot.available}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                  slot.available
                    ? 'bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-400 cursor-pointer'
                    : 'bg-slate-50 border border-slate-200 cursor-not-allowed opacity-60'
                }`}
              >
                <div className={`text-sm font-bold ${slot.available ? 'text-slate-900' : 'text-slate-400'}`}>
                  {slot.time}
                </div>
                {slot.available ? (
                  <div className="text-[10px] text-green-600 mt-0.5">가능</div>
                ) : slot.reason === 'past' ? (
                  <div className="text-[10px] text-slate-400 mt-0.5">지남</div>
                ) : (
                  <div className="text-[10px] text-red-500 mt-0.5">예약</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">예약 확인</h3>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Clock size={20} className="text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">예약 일시</div>
                  <div className="font-semibold text-slate-900">
                    {confirmationModal.date?.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
                  </div>
                  <div className="text-lg font-bold text-orange-600">
                    {confirmationModal.time}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-slate-600 text-sm mb-6">
              이 시간에 예약하시겠습니까?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmationModal({ isOpen: false, time: '', date: null })}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                예약 확정
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
