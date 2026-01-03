import React, { useState, useEffect } from 'react';
import { Reservation } from '../types';
import { getAttendanceList, updateAttendance } from '../lib/supabase/database';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Search, Download } from 'lucide-react';
import ConsultationMemoModal from './ConsultationMemoModal';
import { convertToCSV, downloadCSV, getTimestampForFilename, formatDateForCSV } from '../utils/csv';

interface AttendanceCheckProps {
  instructorEmail: string;
  instructorId?: string;
}

const AttendanceCheck: React.FC<AttendanceCheckProps> = ({ instructorEmail, instructorId }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending'>('today');
  const [searchTerm, setSearchTerm] = useState('');

  // Memo modal state
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string; email: string } | null>(null);
  const [pendingAttendanceUpdate, setPendingAttendanceUpdate] = useState<{ reservationId: string; status: 'attended' | 'absent' | 'late' | 'pending' } | null>(null);

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const fetchReservations = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const result = await getAttendanceList(instructorId, filter);

      // Convert Supabase format to Reservation format
      const formatted = result.map((r: any) => ({
        reservationId: r.id,
        date: new Date(r.start_time).toISOString().split('T')[0],
        time: new Date(r.start_time).toTimeString().split(':').slice(0, 2).join(':'),
        status: r.status === 'confirmed' ? '확정됨' : r.status === 'cancelled' ? '취소됨' : '대기중',
        studentName: r.student?.name || '',
        studentEmail: r.student?.email || '',
        classType: r.coaching?.type || 'private',
        attendanceStatus: r.attendance_status || 'pending',
        instructorName: '',
        meetLink: r.meet_link || ''
      }));

      setReservations(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (reservationId: string, status: 'attended' | 'absent' | 'late' | 'pending', reservation?: Reservation) => {
    // '출석' 버튼 클릭 시 메모 모달 먼저 띄우기
    if (status === 'attended' && reservation) {
      setSelectedStudent({
        id: reservation.studentEmail, // student_id가 없으므로 email을 사용
        name: reservation.studentName || reservation.studentEmail,
        email: reservation.studentEmail
      });
      setPendingAttendanceUpdate({ reservationId, status });
      setShowMemoModal(true);
      return;
    }

    // 다른 상태(지각, 결석, 초기화)는 바로 처리
    try {
      await updateAttendance(reservationId, status as any);

      setReservations(reservations.map(r =>
        r.reservationId === reservationId
          ? { ...r, attendanceStatus: status }
          : r
      ));
    } catch (err: any) {
      alert(err.message || '출석 처리에 실패했습니다.');
    }
  };

  // 메모 작성 완료 후 출석 처리
  const handleMemoSaved = async () => {
    if (!pendingAttendanceUpdate) return;

    try {
      await updateAttendance(pendingAttendanceUpdate.reservationId, pendingAttendanceUpdate.status as any);

      setReservations(reservations.map(r =>
        r.reservationId === pendingAttendanceUpdate.reservationId
          ? { ...r, attendanceStatus: pendingAttendanceUpdate.status }
          : r
      ));

      // Reset state
      setShowMemoModal(false);
      setSelectedStudent(null);
      setPendingAttendanceUpdate(null);
    } catch (err: any) {
      alert(err.message || '출석 처리에 실패했습니다.');
    }
  };

  const handleDownloadAttendanceCSV = () => {
    if (reservations.length === 0) {
      alert('다운로드할 출석 기록이 없습니다.');
      return;
    }

    // Format data for CSV
    const csvData = reservations.map(reservation => ({
      '날짜': reservation.date,
      '시간': reservation.time,
      '학생명': reservation.studentName || '',
      '학생이메일': reservation.studentEmail,
      '수업유형': reservation.classType === 'private' ? '개인' : '그룹',
      '출석상태': getAttendanceLabel(reservation.attendanceStatus),
      '예약상태': reservation.status
    }));

    const csv = convertToCSV(csvData, ['날짜', '시간', '학생명', '학생이메일', '수업유형', '출석상태', '예약상태']);
    const filename = `출석기록_${getTimestampForFilename()}.csv`;

    downloadCSV(csv, filename);
  };

  const filteredReservations = reservations.filter(r =>
    r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceColor = (status?: string) => {
    switch (status) {
      case 'attended':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'absent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'late':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getAttendanceLabel = (status?: string) => {
    switch (status) {
      case 'attended':
        return '출석';
      case 'absent':
        return '결석';
      case 'late':
        return '지각';
      default:
        return '미처리';
    }
  };

  const renderReservationCard = (reservation: Reservation) => {
    const sessionDateTime = new Date(`${reservation.date}T${reservation.time}`);
    const isPast = sessionDateTime < new Date();
    const isToday = reservation.date === new Date().toISOString().split('T')[0];

    return (
      <div
        key={reservation.reservationId}
        className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-bold text-lg text-slate-900">
                {reservation.studentName || reservation.studentEmail}
              </h3>
              {isToday && (
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-600">
                  오늘
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <span>{reservation.date}</span>
              <span>{reservation.time}</span>
              {reservation.classType && (
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-600 text-xs font-medium">
                  {reservation.classType === 'private' ? '개인' : '그룹'}
                </span>
              )}
            </div>
          </div>

          <div className={`px-3 py-2 rounded-lg text-sm font-medium border ${getAttendanceColor(reservation.attendanceStatus)}`}>
            {getAttendanceLabel(reservation.attendanceStatus)}
          </div>
        </div>

        {isPast && reservation.attendanceStatus === 'pending' && (
          <div className="flex space-x-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => handleAttendance(reservation.reservationId, 'attended', reservation)}
              className="flex-1 py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
            >
              <CheckCircle size={16} className="mr-1" />
              출석
            </button>
            <button
              onClick={() => handleAttendance(reservation.reservationId, 'late', reservation)}
              className="flex-1 py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
            >
              <Clock size={16} className="mr-1" />
              지각
            </button>
            <button
              onClick={() => handleAttendance(reservation.reservationId, 'absent', reservation)}
              className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
            >
              <XCircle size={16} className="mr-1" />
              결석
            </button>
          </div>
        )}

        {reservation.attendanceStatus && reservation.attendanceStatus !== 'pending' && (
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => handleAttendance(reservation.reservationId, 'pending')}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              출석 상태 초기화
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500 mb-3" />
        <p className="text-slate-500 text-sm">출석 목록 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center mb-2">
          <CheckCircle size={24} className="mr-2 text-orange-600" />
          출석 체크
        </h2>
        <p className="text-sm text-slate-500">회원들의 출석을 관리하세요</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이름 또는 이메일 검색..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        {/* CSV Download Button */}
        <button
          onClick={handleDownloadAttendanceCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-medium text-sm transition-all whitespace-nowrap"
        >
          <Download size={18} />
          출석 CSV
        </button>

        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'today'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'pending'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            미처리
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['attended', 'late', 'absent', 'pending'].map(status => {
          const count = reservations.filter(r => r.attendanceStatus === status).length;
          const colors = {
            attended: 'bg-orange-50 border-orange-200 text-orange-700',
            late: 'bg-orange-50 border-orange-200 text-orange-700',
            absent: 'bg-red-50 border-red-200 text-red-700',
            pending: 'bg-slate-50 border-slate-200 text-slate-600'
          };

          return (
            <div key={status} className={`rounded-lg border-2 p-3 ${colors[status as keyof typeof colors]}`}>
              <p className="text-xs font-medium opacity-80">{getAttendanceLabel(status)}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Reservation List */}
      {filteredReservations.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium mb-2">예약 내역이 없습니다</p>
          <p className="text-sm text-slate-400">
            {searchTerm ? '검색 결과가 없습니다' : '조건에 맞는 예약이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReservations.map(renderReservationCard)}
        </div>
      )}

      {/* Consultation Memo Modal */}
      {selectedStudent && instructorId && (
        <ConsultationMemoModal
          isOpen={showMemoModal}
          onClose={() => {
            setShowMemoModal(false);
            setSelectedStudent(null);
            setPendingAttendanceUpdate(null);
          }}
          userId={parseInt(instructorId)}
          student={{
            id: selectedStudent.id,
            name: selectedStudent.name,
            email: selectedStudent.email,
          }}
          onSave={handleMemoSaved}
        />
      )}
    </div>
  );
};

export default AttendanceCheck;
