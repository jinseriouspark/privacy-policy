import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, Package, Link2, MessageCircle, Copy, UserPlus } from 'lucide-react';
import { User, User as StudentType } from '../../types';
import { getInstructorStudents, getAllStudentPackages, getInstructorCoachings, getUserByEmail } from '../../lib/supabase/database';
import { UserEditModal } from '../UserEditModal';
import { StudentInviteModal } from '../StudentInviteModal';
import { sendBookingLinkToStudent } from '../../services/solapi';

const SkeletonStudentCard = () => (
  <div className="animate-pulse bg-white rounded-xl p-4 border border-slate-200">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 bg-slate-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-5 bg-slate-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-48"></div>
      </div>
    </div>
  </div>
);

interface MobileStudentsProps {
  user: User;
}

interface StudentWithPackages extends StudentType {
  packageCount?: number;
}

export const MobileStudents: React.FC<MobileStudentsProps> = ({ user }) => {
  const [students, setStudents] = useState<StudentWithPackages[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null);
  const [studentPackages, setStudentPackages] = useState<any[]>([]);
  const [coachings, setCoachings] = useState<any[]>([]);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadStudents();
    loadCoachings();
  }, [user.id]);

  const loadCoachings = async () => {
    try {
      const data = await getInstructorCoachings(user.id.toString());
      setCoachings(data);
    } catch (error) {
      console.error('Failed to load coachings:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await getInstructorStudents(user.id);

      // Load package count for each student
      const studentsWithPackages = await Promise.all(
        data.map(async (student) => {
          try {
            const packages = await getAllStudentPackages(student.id, user.id);
            const activePackages = packages.filter(p => p.status === 'active');
            return {
              ...student,
              packageCount: activePackages.length
            };
          } catch (error) {
            console.error(`Failed to load packages for student ${student.id}:`, error);
            return {
              ...student,
              packageCount: 0
            };
          }
        })
      );

      setStudents(studentsWithPackages);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentPackages = async (studentId: string) => {
    try {
      const packages = await getAllStudentPackages(Number(studentId), user.id);
      setStudentPackages(packages);
    } catch (error) {
      console.error('Failed to load student packages:', error);
      setStudentPackages([]);
    }
  };

  const handleOpenStudentModal = async (student: StudentType) => {
    setSelectedStudent(student);
    await loadStudentPackages(student.id);
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
    setStudentPackages([]);
  };

  const handleSavePackages = async () => {
    if (selectedStudent) {
      await loadStudentPackages(selectedStudent.id);
      await loadStudents(); // Refresh student list
    }
  };

  const handleInviteSuccess = async (invitedEmail?: string) => {
    // Refresh student list
    await loadStudents();

    // Check if the invited student has already accepted (rare but possible)
    if (invitedEmail) {
      try {
        const student = await getUserByEmail(invitedEmail);
        if (student) {
          // Student exists! Open package assignment modal
          await handleOpenStudentModal(student);
        }
      } catch (error) {
        console.error('Failed to check invited student:', error);
      }
    }
  };

  const handleCopyBookingLink = async (student: StudentType) => {
    // Get first active coaching (or show selector if multiple)
    const firstCoaching = coachings.find(c => c.status === 'active');
    if (!firstCoaching) {
      alert('활성화된 코칭이 없습니다.');
      return;
    }

    const bookingUrl = `${window.location.origin}/${firstCoaching.slug}`;

    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopiedStudentId(student.id);
      setTimeout(() => setCopiedStudentId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleSendKakao = async (student: StudentType) => {
    // Get first active coaching
    const firstCoaching = coachings.find(c => c.status === 'active');
    if (!firstCoaching) {
      alert('활성화된 코칭이 없습니다.');
      return;
    }

    const bookingUrl = `${window.location.origin}/${firstCoaching.slug}`;

    // Check if student has phone number
    if (!student.phone) {
      const message = `안녕하세요 ${student.name}님! 예약은 아래 링크에서 가능합니다.\n\n${bookingUrl}`;
      try {
        await navigator.clipboard.writeText(message);
        alert('학생 전화번호가 없습니다.\n메시지가 클립보드에 복사되었습니다.');
      } catch (error) {
        alert('학생 전화번호가 등록되지 않았습니다.');
      }
      return;
    }

    // Show loading state
    const confirmed = confirm(
      `${student.name}님에게 예약 링크를 전송하시겠습니까?\n\n전송 방법: 카카오 알림톡 → SMS (자동 대체)`
    );

    if (!confirmed) return;

    try {
      const result = await sendBookingLinkToStudent(user.id, {
        studentName: student.name,
        studentPhone: student.phone,
        bookingUrl: bookingUrl,
        coachingName: firstCoaching.name || firstCoaching.title,
      });

      if (result.success) {
        alert(`✅ ${student.name}님에게 예약 링크가 전송되었습니다!`);
      } else {
        // Fallback: copy to clipboard
        const message = `안녕하세요 ${student.name}님! 예약은 아래 링크에서 가능합니다.\n\n${bookingUrl}`;
        await navigator.clipboard.writeText(message);
        alert(
          `⚠️ 자동 전송 실패: ${result.error}\n\n메시지가 클립보드에 복사되었습니다.\n카카오톡으로 직접 전송해주세요.`
        );
      }
    } catch (error) {
      console.error('Failed to send kakao:', error);
      alert('전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="pb-20 bg-slate-50 min-h-screen">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="animate-pulse">
            <div className="h-7 bg-slate-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-20"></div>
          </div>
        </div>
        <div className="px-6 pt-6 space-y-3">
          <SkeletonStudentCard />
          <SkeletonStudentCard />
          <SkeletonStudentCard />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">👥 회원 관리</h1>
        <p className="text-sm text-slate-500 mt-1">
          총 {students.length}명
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 sticky top-[73px] z-10">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 pt-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users size={16} />
              <span className="text-xs">전체 회원</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{students.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Calendar size={16} />
              <span className="text-xs">이번 달</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {students.filter(s => {
                const created = new Date(s.created_at);
                const now = new Date();
                return created.getMonth() === now.getMonth() &&
                       created.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="px-6 space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center mt-4">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 회원이 없습니다'}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              {searchQuery ? '다른 검색어를 시도해보세요' : '새 회원을 초대해보세요'}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl p-4 border border-slate-200 active:bg-slate-50 transition-colors"
            >
              {/* Student Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {student.picture ? (
                    <img
                      src={student.picture}
                      alt={student.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {student.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">
                    {student.name}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">
                    {student.email}
                  </p>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">가입일</span>
                  <span className="text-slate-900 font-medium">
                    {new Date(student.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button
                  onClick={() => handleOpenStudentModal(student)}
                  className="flex items-center justify-center gap-1 py-2 bg-orange-50 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors"
                >
                  <Package size={14} />
                  수강권
                </button>
                <button
                  onClick={() => handleCopyBookingLink(student)}
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    copiedStudentId === student.id
                      ? 'bg-green-50 text-green-600'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {copiedStudentId === student.id ? (
                    <>
                      <Copy size={14} />
                      복사됨!
                    </>
                  ) : (
                    <>
                      <Link2 size={14} />
                      링크
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSendKakao(student)}
                  className="flex items-center justify-center gap-1 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-100 transition-colors"
                >
                  <MessageCircle size={14} />
                  카톡
                </button>
              </div>

              {/* Email button - moved to separate row for less important action */}
              <a
                href={`mailto:${student.email}`}
                className="flex items-center justify-center gap-2 py-2 mt-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
              >
                <Mail size={14} />
                이메일 보내기
              </a>
            </div>
          ))
        )}
      </div>

      {/* Add Student FAB */}
      <button
        onClick={() => setShowInviteModal(true)}
        className="fixed right-6 bottom-24 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 transition-all active:scale-95 z-20"
      >
        <UserPlus size={24} />
      </button>

      {/* Student Invite Modal */}
      {showInviteModal && coachings.length > 0 && (
        <StudentInviteModal
          instructorId={user.id.toString()}
          coachingId={coachings[0].id}
          coachingSlug={coachings[0].slug}
          studioSlug={user.username}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      {/* User Edit Modal */}
      {selectedStudent && (
        <UserEditModal
          user={selectedStudent}
          instructorId={user.id}
          packages={studentPackages}
          onClose={handleCloseModal}
          onSave={handleSavePackages}
        />
      )}
    </div>
  );
};
