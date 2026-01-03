import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { createReservation, deductPackageCredit, getAvailableTimeSlots, getCoachingCalendar, getUserById } from '../../lib/supabase/database';
import { addEventToCalendar, addEventToStudentCalendar } from '../../lib/google-calendar';
import toast from 'react-hot-toast';

interface BookingBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  instructorId: string;
  packages: Array<{
    id: string;
    name: string;
    credits_remaining: number;
    coaching_id?: string;
    coaching?: {
      id: string;
      title: string;
      duration: number;
    };
  }>;
  onSuccess?: () => void;
  initialDate?: Date;
}

export const BookingBottomSheet: React.FC<BookingBottomSheetProps> = ({
  isOpen,
  onClose,
  studentId,
  instructorId,
  packages,
  onSuccess,
  initialDate
}) => {
  const [step, setStep] = useState<'package' | 'date' | 'time' | 'confirm'>('package');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false); // 중복 호출 방지

  // Reset when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setStep('package');
      setSelectedPackage(null);
      setSelectedDate(initialDate || null);
      setSelectedTime(null);
    }
  }, [isOpen, initialDate]);

  const loadTimeSlotsForDate = async (date: Date, coachingId: string) => {
    setLoadingTimeSlots(true);
    try {
      const slots = await getAvailableTimeSlots(
        instructorId,
        coachingId,
        date
      );
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('Failed to load time slots:', error);
      toast.error('시간대를 불러오는데 실패했습니다.');
      // Fallback to mock data
      setAvailableTimeSlots([
        '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
      ].map(time => ({ time, available: true })));
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setStep('date');
  };

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);

    const selectedPkg = packages.find(p => p.id === selectedPackage);
    if (selectedPkg?.coaching_id && instructorId) {
      loadTimeSlotsForDate(date, selectedPkg.coaching_id);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    // 중복 호출 방지
    if (isProcessing) {
      console.log('[BookingBottomSheet] Already processing, ignoring duplicate call');
      return;
    }

    if (!selectedPackage || !selectedDate || !selectedTime) {
      toast.error('예약 정보를 모두 선택해주세요.');
      return;
    }

    const selectedPkg = packages.find(p => p.id === selectedPackage);
    if (!selectedPkg) {
      toast.error('선택된 수강권을 찾을 수 없습니다.');
      return;
    }

    if (!selectedPkg.coaching_id && !selectedPkg.coaching?.id) {
      toast.error('코칭 정보가 없습니다.');
      return;
    }

    setIsProcessing(true);
    setLoading(true);

    try {
      // 시작 시간과 종료 시간 계산
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const duration = selectedPkg.coaching?.duration || 60; // 기본 60분
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      // 코칭의 Google Calendar ID 가져오기
      const coachingId = selectedPkg.coaching_id || selectedPkg.coaching?.id || '';
      console.log('[BookingBottomSheet] Getting coaching calendar for:', coachingId);

      const coachingCalendar = await getCoachingCalendar(coachingId);
      console.log('[BookingBottomSheet] Coaching calendar:', coachingCalendar);

      if (!coachingCalendar?.google_calendar_id) {
        toast.error('강사의 캘린더가 설정되지 않았습니다. 강사에게 문의해주세요.');
        setLoading(false);
        return;
      }

      // 학생 정보 가져오기
      const student = await getUserById(studentId);

      // Google Calendar 이벤트 생성 (Google Meet 포함)
      console.log('[BookingBottomSheet] Creating calendar event with Meet');
      const event = await addEventToCalendar({
        calendarId: coachingCalendar.google_calendar_id,
        title: `코칭 - ${student?.name || '학생'}`,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        description: `${selectedPkg.coaching?.title || '코칭'} 세션`,
        attendees: [student?.email || ''],
        instructorId: selectedPkg.instructor_id // 🆕 Use instructor's token
      });

      console.log('[BookingBottomSheet] Calendar event created:', event);

      // 학생 캘린더에도 추가 (선택사항)
      if (event.meetLink) {
        try {
          await addEventToStudentCalendar({
            title: `코칭 - ${selectedPkg.coaching?.title || '코칭'}`,
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            meetLink: event.meetLink,
            instructorName: '강사'
          });
        } catch (e) {
          console.error('[BookingBottomSheet] Failed to add to student calendar:', e);
          // 학생 캘린더 추가 실패는 무시
        }
      }

      // 예약 생성 (Google Meet 링크 포함)
      const reservation = await createReservation({
        student_id: studentId,
        instructor_id: instructorId,
        coaching_id: coachingId,
        package_id: selectedPackage,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        meet_link: event.meetLink || '',
        google_event_id: event.id,
        status: 'confirmed'
      });

      // 수강권 차감
      await deductPackageCredit(selectedPackage);

      toast.success('예약이 완료되었습니다!');

      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess();
      }

      // 초기화 및 닫기
      setStep('date');
      setSelectedPackage(null);
      setSelectedDate(null);
      setSelectedTime(null);
      onClose();
    } catch (error: any) {
      console.error('Booking error:', error);

      // 사용자 친화적인 에러 메시지
      if (error.message.includes('수강권')) {
        toast.error(error.message);
      } else if (error.message.includes('overlap') || error.message.includes('충돌')) {
        toast.error('이미 예약된 시간입니다. 다른 시간을 선택해주세요.');
      } else if (error.message.includes('expired') || error.message.includes('만료')) {
        toast.error('수강권이 만료되었습니다.');
      } else if (error.message.includes('credits') || error.message.includes('남은')) {
        toast.error('수강권 잔여 횟수가 부족합니다.');
      } else {
        toast.error('예약에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step === 'time') setStep('date');
    else if (step === 'confirm') setStep('time');
  };

  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-3xl h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
          <div className="p-4 bg-white rounded-t-3xl flex-1 overflow-auto">
            {/* Handle bar */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              {step !== 'date' && (
                <button
                  onClick={handleBack}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  ← 뒤로
                </button>
              )}
              <Drawer.Title className="text-xl font-bold text-slate-900 flex-1 text-center">
                {step === 'date' && '날짜 선택'}
                {step === 'time' && '시간 선택'}
                {step === 'confirm' && '예약 확인'}
              </Drawer.Title>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Step Content */}
            <div className="space-y-4">
              {/* Step 1: Package Selection */}
              {step === 'package' && (
                <>
                  {packages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-600 mb-4">사용 가능한 수강권이 없습니다</p>
                      <button className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors">
                        수강권 구매하기
                      </button>
                    </div>
                  ) : (
                    packages.map(pkg => (
                      <button
                        key={pkg.id}
                        onClick={() => handlePackageSelect(pkg.id)}
                        className="w-full p-4 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-xl text-left transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">
                              {pkg.name || pkg.coaching?.title}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              잔여 {pkg.credits_remaining}회
                            </p>
                          </div>
                          <div className="text-orange-600">→</div>
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}

              {/* Step 2: Date/Time Selection */}
              {step === 'date' && (
                <>
                  {/* initialDate가 없을 때만 캘린더 보여주기 */}
                  {!initialDate && (
                    <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ChevronLeft size={20} className="text-slate-600" />
                      </button>
                      <h3 className="text-lg font-bold text-slate-900">
                        {currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                      </h3>
                      <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ChevronRight size={20} className="text-slate-600" />
                      </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                        <div key={i} className="text-center text-xs font-medium text-slate-500 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                        const startPadding = firstDay.getDay();
                        const daysInMonth = lastDay.getDate();

                        const days = [];

                        // Empty cells for padding
                        for (let i = 0; i < startPadding; i++) {
                          days.push(<div key={`empty-${i}`} className="aspect-square" />);
                        }

                        // Actual days
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                          date.setHours(0, 0, 0, 0);
                          const isPast = date < today;
                          const isToday = date.getTime() === today.getTime();
                          const isSelected = selectedDate &&
                            date.getFullYear() === selectedDate.getFullYear() &&
                            date.getMonth() === selectedDate.getMonth() &&
                            date.getDate() === selectedDate.getDate();

                          days.push(
                            <button
                              key={day}
                              onClick={() => !isPast && handleDateSelect(date)}
                              disabled={isPast}
                              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                isPast
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-orange-500 text-white'
                                  : isToday
                                  ? 'bg-orange-100 text-orange-900 border-2 border-orange-500'
                                  : 'hover:bg-orange-50 text-slate-900'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        }

                        return days;
                      })()}
                    </div>
                    </div>
                  )}

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">
                        {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })} 예약 가능한 시간
                      </h3>
                      {loadingTimeSlots ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                      ) : availableTimeSlots.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-slate-600">예약 가능한 시간이 없습니다</p>
                          <p className="text-sm text-slate-400 mt-2">다른 날짜를 선택해주세요</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {availableTimeSlots.map(slot => (
                            <button
                              key={slot.time}
                              onClick={() => slot.available && handleTimeSelect(slot.time)}
                              disabled={!slot.available}
                              className={`p-4 rounded-xl text-center transition-all ${
                                slot.available
                                  ? 'bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 cursor-pointer'
                                  : 'bg-slate-100 border border-slate-200 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <Clock size={20} className={`mx-auto mb-2 ${slot.available ? 'text-slate-600' : 'text-slate-400'}`} />
                              <div className={`text-sm font-medium ${slot.available ? 'text-slate-900' : 'text-slate-500'}`}>
                                {slot.time}
                              </div>
                              {!slot.available && (
                                <div className="text-xs text-red-600 mt-1">예약됨</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Step 4: Confirmation */}
              {step === 'confirm' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br bg-orange-500 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle size={24} />
                      <h3 className="text-lg font-bold">예약 정보 확인</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                        <Calendar size={20} className="mt-0.5" />
                        <div>
                          <p className="text-sm text-orange-100">날짜</p>
                          <p className="font-medium">
                            {selectedDate?.toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                        <Clock size={20} className="mt-0.5" />
                        <div>
                          <p className="text-sm text-orange-100">시간</p>
                          <p className="font-medium">{selectedTime}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                        <div className="w-5 h-5 mt-0.5 bg-white/20 rounded-full flex items-center justify-center text-xs">
                          🎫
                        </div>
                        <div>
                          <p className="text-sm text-orange-100">수강권</p>
                          <p className="font-medium">{selectedPkg?.name || selectedPkg?.coaching?.title}</p>
                          <p className="text-sm text-orange-100 mt-1">
                            잔여 {selectedPkg?.credits_remaining}회 → {(selectedPkg?.credits_remaining || 0) - 1}회
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirm}
                    disabled={loading || isProcessing}
                    className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '예약 중...' : '예약 확정하기'}
                  </button>

                  <p className="text-xs text-center text-slate-500">
                    예약 확정 시 수강권 1회가 차감됩니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
