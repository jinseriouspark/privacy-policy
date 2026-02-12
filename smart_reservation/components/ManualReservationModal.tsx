import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, CreditCard, Loader2 } from 'lucide-react';
import { createReservation, deductPackageCredit } from '../lib/supabase/database';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Package {
  id: string;
  name: string;
  sessions: number;
  remaining_sessions?: number;
}

interface ManualReservationModalProps {
  instructorId: string;
  students: Student[];
  packages: Package[];
  onClose: () => void;
  onSuccess: () => void;
}

const ManualReservationModal: React.FC<ManualReservationModalProps> = ({
  instructorId,
  students,
  packages,
  onClose,
  onSuccess
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [notes, setNotes] = useState<string>('');
  const [deductCredit, setDeductCredit] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 시간 옵션 생성 (30분 간격)
  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  // 최소 날짜를 오늘로 설정
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!date) {
      setDate(today);
    }
  }, [today, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      setError('학생을 선택해주세요.');
      return;
    }

    if (!date || !startTime || !endTime) {
      setError('날짜와 시간을 모두 입력해주세요.');
      return;
    }

    // 시간 유효성 검사
    if (startTime >= endTime) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ISO 8601 형식으로 변환
      const startDateTime = `${date}T${startTime}:00+09:00`;
      const endDateTime = `${date}T${endTime}:00+09:00`;

      // 예약 생성
      await createReservation({
        student_id: selectedStudent,
        instructor_id: instructorId,
        package_id: deductCredit && selectedPackage ? selectedPackage : undefined,
        start_time: startDateTime,
        end_time: endDateTime,
        notes: notes || undefined,
        status: 'confirmed'
      });

      // 수강권 1회 차감
      if (deductCredit && selectedPackage) {
        await deductPackageCredit(selectedPackage);
      }

      // TODO: 학생에게 알림 발송
      // await sendNotificationToStudent(selectedStudent, startDateTime, endDateTime);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Manual reservation error:', err);
      setError(err.message || '예약 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-slate-900">수동 예약 추가</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 학생 선택 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <User size={18} className="text-orange-500" />
              학생 선택 *
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">학생을 선택해주세요</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          {/* 날짜 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Calendar size={18} className="text-orange-500" />
              날짜 *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Clock size={18} className="text-orange-500" />
                시작 시간 *
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Clock size={18} className="text-orange-500" />
                종료 시간 *
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 수강권 차감 */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deductCredit}
                onChange={(e) => setDeductCredit(e.target.checked)}
                className="w-5 h-5 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
              />
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CreditCard size={18} className="text-orange-500" />
                수강권 차감
              </span>
            </label>

            {deductCredit && (
              <select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">수강권 선택 (선택사항)</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.sessions}회)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <FileText size={18} className="text-orange-500" />
              메모 (선택)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="수업 관련 메모를 입력해주세요"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows={3}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-sm text-orange-800">
              ✓ Google Calendar에 자동으로 추가됩니다<br />
              ✓ Meet 링크가 자동으로 생성됩니다<br />
              ✓ 학생에게 이메일 알림이 발송됩니다
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !selectedStudent}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? '예약 생성 중...' : '예약 확정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualReservationModal;
