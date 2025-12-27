import React, { useEffect, useState } from 'react';
import { User, DashboardData, CalendarCheckResult, Reservation, WorkingHour, AvailabilityData, Coaching } from '../types';
import { postToGAS } from '../services/api';
import { Calendar, Plus, RefreshCw, LogOut, XCircle, Loader2, Video, Settings, Users, CheckCircle2, Clock, MinusCircle, PlusCircle, AlertTriangle, Share2, Copy, Package, TrendingUp, Edit, Trash2, Save, X, FolderOpen, Link2, MessageCircle, Menu, FileText } from 'lucide-react';
import { InstructorSetupModal } from './InstructorSetupModal';
import { UserEditModal } from './UserEditModal';
import { StudentInviteModal } from './StudentInviteModal';
import { CoachingManagementModal } from './CoachingManagementModal';
import { CoachingManagementInline } from './CoachingManagementInline';
import NotionSettingsModal from './NotionSettingsModal';
import ConsultationMemoModal from './ConsultationMemoModal';
import PackageManagement from './PackageManagement';
import GroupClassSchedule from './GroupClassSchedule';
import AttendanceCheck from './AttendanceCheck';
import StatsDashboard from './StatsDashboard';
import { logActivity, type TabName } from '../lib/supabase/database';
import { getAllStudents, getInstructorStudents, getInstructorSettings, upsertInstructorSettings, getReservationsByDateRange, getReservations, cancelReservation, getStudentPackages, createPackage, updatePackage, deletePackage, getPackages, getInstructorCoachings, getAllStudentPackages, removeStudentFromInstructor } from '../lib/supabase/database';
import { sendBookingLinkToStudent } from '../services/solapi';
import { createCoachingCalendar, getCalendarList } from '../lib/google-calendar';
import { navigateTo, ROUTES } from '../utils/router';

interface DashboardProps {
  user: User;
  onNavigateToReservation: () => void;
  onLogout: () => void;
  onNavigateToProfile?: () => void;
}

type TabType = 'reservations' | 'users' | 'packages' | 'group-classes' | 'attendance' | 'stats' | 'class';

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigateToReservation, onLogout, onNavigateToProfile }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  
  // Instructor States
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // URL to Tab mapping
  const urlToTab: Record<string, TabType> = {
    '/summary': 'stats',
    '/all-reservation': 'reservations',
    '/group': 'group-classes',
    '/attend': 'attendance',
    '/student': 'users',
    '/membership': 'packages',
    '/class': 'class'
  };

  const tabToUrl: Record<TabType, string> = {
    'stats': '/summary',
    'reservations': '/all-reservation',
    'group-classes': '/group',
    'attendance': '/attend',
    'users': '/student',
    'packages': '/membership',
    'class': '/class'
  };
  
  // Instructor - User Mgmt
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userPackages, setUserPackages] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [coachings, setCoachings] = useState<any[]>([]);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [reservationSort, setReservationSort] = useState<'asc' | 'desc'>('desc'); // 시간 정렬

  // Coaching Management
  const [currentCoaching, setCurrentCoaching] = useState<Coaching | null>(null);
  const [showCoachingModal, setShowCoachingModal] = useState(false);

  // Notion Integration
  const [showNotionSettings, setShowNotionSettings] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Check if user is instructor based on user.userType
  const isCoach = user.userType === 'instructor';

  // Cache Key
  const CACHE_KEY = `dashboard_data_${user.email}_${currentCoaching?.id || 'default'}`;

  const fetchDashboard = async () => {
    // [Optimization] Load from cache first for instant feedback
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
       try {
         const parsed = JSON.parse(cached);
         setData(parsed);
         if (!isCoach) setLoading(false); // Only assume cached is enough for students momentarily
       } catch(e) { /* ignore corrupt cache */ }
    }

    if (!data && !cached) setLoading(true); // Only show spinner if absolutely nothing to show

    try {
      // Use Supabase for data loading
      const reservations = await getReservations(user.id, isCoach ? 'instructor' : 'student');

      // Convert Supabase format to DashboardData format
      const formattedReservations = reservations.map((r: any) => ({
        reservationId: r.id,
        date: new Date(r.start_time).toISOString().split('T')[0],
        time: new Date(r.start_time).toTimeString().split(':').slice(0, 2).join(':'),
        status: r.status === 'confirmed' ? '확정됨' : r.status === 'cancelled' ? '취소됨' : '대기중',
        instructorName: r.instructor?.name || 'Unknown',
        studentName: r.student?.name || '',
        studentEmail: r.student?.email || '',
        packageName: r.package?.name || '',
        packageType: r.coaching?.type || 'private', // 개인/그룹
        totalCredits: r.package?.sessions || 0, // 총 수강권
        remainingCredits: 0, // TODO: Calculate from user's package purchases
        meetLink: r.meet_link || ''
      }));

      const result: DashboardData = {
        remaining: 0, // TODO: Calculate from packages
        reservations: formattedReservations
      };

      setData(result);
      // [Optimization] Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize tab from URL on mount
  useEffect(() => {
    if (isCoach) {
      const currentPath = window.location.pathname;
      const tabFromUrl = urlToTab[currentPath];
      if (tabFromUrl) {
        setActiveTab(tabFromUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDashboard();

    if (isCoach) {
        loadFirstCoaching();
        loadCoachings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFirstCoaching = async () => {
    try {
      const coachings = await getInstructorCoachings(user.id);
      if (coachings.length > 0) {
        setCurrentCoaching(coachings[0]);
      }
    } catch (e) {
      console.error('Failed to load coachings:', e);
    }
  };

  const loadCoachings = async () => {
    try {
      const data = await getInstructorCoachings(user.id);
      console.log('[Dashboard] Loaded coachings:', data);
      setCoachings(data);
    } catch (error) {
      console.error('Failed to load coachings:', error);
    }
  };

  const handleCopyBookingLink = async (student: User) => {
    // Get first active coaching
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

  const handleSendKakao = async (student: User) => {
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

    // Show confirmation dialog
    const confirmed = confirm(
      `${student.name}님에게 예약 링크를 전송하시겠습니까?\n\n전송 방법: 카카오 알림톡 → SMS (자동 대체)`
    );

    if (!confirmed) return;

    try {
      const result = await sendBookingLinkToStudent(user.id, {
        studentName: student.name,
        studentPhone: student.phone!,
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

  const handleDeleteStudent = async (student: any) => {
    const confirmed = confirm(
      `⚠️ 정말로 ${student.name}님을 삭제하시겠습니까?\n\n삭제 시 다음 데이터가 함께 삭제됩니다:\n- 예약 기록\n- 수강권 정보\n- 학생 관계\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      console.log('[handleDeleteStudent] Deleting student:', student.id, 'instructor:', user.id);
      await removeStudentFromInstructor(student.id, user.id);
      alert(`✅ ${student.name}님이 삭제되었습니다.`);
      // Reload users list
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete student:', error);
      const errorMessage = error?.message || error?.toString() || '알 수 없는 오류';
      alert(`학생 삭제에 실패했습니다.\n\n오류: ${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`);
    }
  };

  // --- Handlers ---

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close mobile menu when tab changes
    const url = tabToUrl[tab];
    if (url) {
      window.history.pushState({}, '', url);
    }
  };

  const handleCancel = async (reservationId: string, date: string, time: string) => {
    const message = isCoach 
        ? `수강생의 ${date} ${time} 예약을 취소하시겠습니까?`
        : `${date} ${time} 예약을 취소하시겠습니까?\n취소 시 수강권이 환불됩니다.`;

    if (!window.confirm(message)) return;

    setCancelingId(reservationId);
    try {
      await cancelReservation(reservationId);
      alert('예약이 정상적으로 취소되었습니다.');
      fetchDashboard();
    } catch (error: any) {
      console.error('Failed to cancel reservation:', error);
      alert(error.message || '예약 취소에 실패했습니다.');
    } finally {
      setCancelingId(null);
    }
  };

  const fetchUsers = async () => {
      setUsersLoading(true);
      try {
          console.log('[Dashboard] Fetching students for instructor:', user.id);
          const students = await getInstructorStudents(user.id);

          // Load packages for each student
          const formattedUsersPromises = students.map(async (s) => {
            const packages = await getStudentPackages(s.id, user.id);

            // Get active package (most recent with remaining sessions)
            const activePackage = packages
              .filter(p => p.remaining_sessions > 0 && (!p.expires_at || new Date(p.expires_at) > new Date()))
              .sort((a, b) => new Date(b.start_date || b.created_at).getTime() - new Date(a.start_date || a.created_at).getTime())[0];

            return {
              id: s.id,
              email: s.email,
              name: s.name,
              picture: s.picture,
              userType: s.user_type,
              remaining: 0,
              total: 0,
              isProfileComplete: true,
              activePackage: activePackage ? {
                name: activePackage.name,
                startDate: activePackage.start_date,
                expiresAt: activePackage.expires_at,
                remaining: activePackage.remaining_sessions,
                total: activePackage.total_sessions,
                coaching_id: activePackage.coaching_id
              } : null
            } as User & { activePackage: any };
          });

          const formattedUsers = await Promise.all(formattedUsersPromises);
          setUsers(formattedUsers);
      } catch (e) {
        console.error('Failed to load users:', e);
        alert('사용자 목록 로드 실패');
      }
      finally { setUsersLoading(false); }
  };

  // fetchSettings 함수 제거됨 - 설정 탭 삭제

  const updateUserCredit = async (targetEmail: string, currentTotal: number, delta: number) => {
      if (!confirm(`${targetEmail}님의 수강권을 변경하시겠습니까?`)) return;
      try {
          const res = await postToGAS<{user: User}>({ 
              action: 'updateUserCredits', 
              userEmail: targetEmail, 
              newTotal: currentTotal + delta 
          });
          setUsers(prev => prev.map(u => u.email === targetEmail ? { ...u, total: res.user.total, remaining: res.user.remaining } : u));
      } catch (e) { alert('수정 실패'); }
  };

  // saveSettings, toggleWorkingDay, updateWorkingTime 함수 제거됨 - 설정 탭 삭제

  // --- Sub Views ---

  const renderCoachReservations = () => {
    // 예약 정렬
    const sortedReservations = data?.reservations ? [...data.reservations].sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
      return reservationSort === 'asc' ? dateTimeA - dateTimeB : dateTimeB - dateTimeA;
    }) : [];

    return (
    <div className="space-y-3">
        {loading && !data ? (
        <div className="text-center py-8 text-slate-400 text-sm">데이터를 불러오는 중...</div>
        ) : sortedReservations && sortedReservations.length > 0 ? (
        sortedReservations.map((res, idx) => {
            const isUpcoming = res.status === '확정됨';
            const isCanceling = cancelingId === res.reservationId;
            return (
            <div key={idx} className={`flex items-center p-4 rounded-xl border ${isUpcoming ? 'border-orange-100 bg-white' : 'border-slate-100 bg-slate-50'} shadow-sm gap-4`}>
                {/* 왼쪽 - 입장 버튼 */}
                <div className="flex-shrink-0">
                    {isUpcoming && res.meetLink ? (
                        <a
                            href={res.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                        >
                            <Video size={16} />
                            <span>입장</span>
                        </a>
                    ) : (
                        <div className="w-20 h-10"></div>
                    )}
                </div>

                {/* 중간 - 수강생 정보 */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                    {/* 수강생 이름 */}
                    <span className={`font-bold text-base ${isUpcoming ? 'text-slate-900' : 'text-slate-400 line-through'} truncate`}>
                        {res.studentName || res.studentEmail}
                    </span>

                    {/* 멤버십 */}
                    {res.packageName && (
                        <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium truncate max-w-[150px]">
                            {res.packageName}
                        </span>
                    )}

                    {/* 날짜 & 시간 */}
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="font-medium whitespace-nowrap">{res.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-400" />
                            <span className="font-medium whitespace-nowrap">{res.time}</span>
                        </div>
                    </div>
                </div>

                {/* 오른쪽 - 삭제 버튼 */}
                <div className="flex-shrink-0">
                    {isUpcoming && (
                        <button
                            onClick={() => handleCancel(res.reservationId, res.date, res.time)}
                            disabled={isCanceling}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg transition-all text-sm font-semibold"
                        >
                            {isCanceling ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Trash2 size={16} />
                            )}
                            <span>{isCanceling ? '취소중' : '삭제'}</span>
                        </button>
                    )}
                </div>
            </div>
            );
        })
        ) : (
        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
            예약 내역이 없습니다.
        </div>
        )}
    </div>
    );
  };

  const openUserEditor = async (u: User) => {
    console.log('Opening editor for user:', u);
    setEditingUser(u);
    // Load user's packages
    try {
      const packages = await getStudentPackages(u.id, user.id);
      console.log('Loaded packages:', packages);
      setUserPackages(packages);
    } catch (e) {
      console.error('Failed to load packages:', e);
      setUserPackages([]);
    }
  };

  const handleUserEditSave = async () => {
    if (!editingUser) return;
    // Reload packages for the modal
    try {
      const packages = await getStudentPackages(editingUser.id, user.id);
      setUserPackages(packages);

      // Also reload the user list to update the active package display
      await fetchUsers();
    } catch (e) {
      console.error('Failed to reload packages:', e);
    }
  };

  const renderCoachUsers = () => {
    // 이메일 검색 필터링
    const filteredUsers = users.filter(u =>
      u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
      u.name.toLowerCase().includes(searchEmail.toLowerCase())
    );

    return (
      <div>
          {/* 검색 & 초대 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* 이메일 검색 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="이메일 또는 이름으로 검색..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* 학생 초대 버튼 */}
            <button
              onClick={() => {
                if (!currentCoaching) {
                  alert('먼저 코칭을 생성해주세요. "코칭 관리" 버튼을 클릭하여 새 코칭을 만드세요.');
                  return;
                }
                setShowInviteModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg whitespace-nowrap"
            >
              <Users size={18} />
              학생 초대하기
            </button>
          </div>

          {usersLoading ? (
               <div className="text-center py-8 text-slate-400 text-sm">사용자 목록 로딩 중...</div>
          ) : filteredUsers.length === 0 ? (
               <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                 {searchEmail ? '검색 결과가 없습니다' : '등록된 학생이 없습니다'}
               </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u: any, idx) => {
            const pkg = u.activePackage;
            const expiresAt = pkg?.expiresAt ? new Date(pkg.expiresAt) : null;
            const isExpiringSoon = expiresAt && expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

            // Get booking link from student's package coaching
            let bookingUrl = '';
            if (pkg) {
              // Find the coaching associated with this package
              const packageCoachingId = pkg.coaching_id;
              const packageCoaching = coachings.find(c => c.id === packageCoachingId);

              if (packageCoaching && packageCoaching.slug) {
                bookingUrl = `${window.location.origin}/${packageCoaching.slug}`;
              }
            }

            // Fallback to first active coaching if no package coaching found
            if (!bookingUrl) {
              const firstCoaching = coachings.find(c => c.status === 'active');
              if (firstCoaching) {
                bookingUrl = `${window.location.origin}/${firstCoaching.slug}`;
              }
            }

            // Debug: log coaching and URL
            if (idx === 0) {
              console.log('[Dashboard] Student package:', pkg);
              console.log('[Dashboard] Booking URL:', bookingUrl);
              console.log('[Dashboard] All coachings:', coachings);
            }

            return (
              <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  {/* Student Header */}
                  <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {u.picture ? (
                              <img
                                  src={u.picture}
                                  alt={u.name}
                                  className="w-full h-full rounded-full object-cover"
                              />
                          ) : (
                              <span className="text-white font-bold text-lg">
                                  {u.name.charAt(0)}
                              </span>
                          )}
                      </div>

                      <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{u.name}</h3>
                          <p className="text-sm text-slate-500 truncate">{u.email}</p>
                      </div>
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                      {/* 등록일자 */}
                      {u.created_at && (
                          <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">등록일</span>
                              <span className="text-slate-900 font-medium">
                                  {new Date(u.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                              </span>
                          </div>
                      )}

                      {pkg ? (
                          <>
                              <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-500">수강권</span>
                                  <span className="text-slate-900 font-medium">{pkg.name}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-500">잔여 수업</span>
                                  <span className="text-orange-600 font-medium">{pkg.remaining}/{pkg.total}회</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-500">기간</span>
                                  <span className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-slate-900'}`}>
                                      {pkg.startDate ? new Date(pkg.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '-'}
                                      {' ~ '}
                                      {expiresAt ? expiresAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '-'}
                                      {isExpiringSoon && ' ⚠️'}
                                  </span>
                              </div>
                          </>
                      ) : (
                          <p className="text-sm text-slate-400 italic text-center py-2">활성 수강권 없음</p>
                      )}
                  </div>

                  {/* Booking Link */}
                  {bookingUrl && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                              <input
                                  type="text"
                                  readOnly
                                  value={bookingUrl}
                                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
                              />
                              <button
                                  onClick={() => handleCopyBookingLink(u)}
                                  className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                                      copiedStudentId === u.id
                                          ? 'bg-green-50 text-green-600'
                                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                  }`}
                                  title="링크 복사"
                              >
                                  {copiedStudentId === u.id ? <Copy size={16} /> : <Copy size={16} />}
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                      <button
                          onClick={() => handleSendKakao(u)}
                          className="flex items-center justify-center gap-1 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-100 transition-colors"
                      >
                          <MessageCircle size={14} />
                          카톡
                      </button>
                      <button
                          onClick={() => {
                            setSelectedStudent(u);
                            setShowMemoModal(true);
                          }}
                          className="flex items-center justify-center gap-1 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors"
                      >
                          <FileText size={14} />
                          메모
                      </button>
                      <button
                          onClick={() => openUserEditor(u)}
                          className="flex items-center justify-center gap-1 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
                      >
                          <Edit size={14} />
                          편집
                      </button>
                      <button
                          onClick={() => handleDeleteStudent(u)}
                          className="flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                          <Trash2 size={14} />
                          삭제
                      </button>
                  </div>
              </div>
            );
          })}
          </div>
          )}
      </div>
    );
  };

  const handleCreateCalendar = async () => {
    const calendarName = prompt('생성할 캘린더 이름을 입력하세요:', '코칭 예약');
    if (!calendarName) return;

    setSettingsLoading(true);
    try {
      const calendar = await createCoachingCalendar(calendarName);

      // Save calendar ID to settings
      await upsertInstructorSettings(user.id, {
        google_calendar_id: calendar.id
      });

      alert(`✅ 캘린더가 생성되었습니다!\n\n캘린더 이름: ${calendar.name}\n캘린더 ID: ${calendar.id}\n\n이제 예약 시 자동으로 이 캘린더에 일정이 추가됩니다.`);

      // Refresh settings
      await fetchSettings();
    } catch (error: any) {
      console.error('캘린더 생성 오류:', error);
      alert(`캘린더 생성 실패: ${error.message}\n\n다시 로그인이 필요할 수 있습니다.`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const renderCoachingManagement = () => {
    return (
      <CoachingManagementInline
        instructorId={user.id!}
        currentCoaching={currentCoaching}
        onSelectCoaching={(coaching) => {
          setCurrentCoaching(coaching);
          // Optionally reload dashboard with new coaching context
          fetchDashboard();
        }}
      />
    );
  };

  // renderCoachSettings 함수 제거됨 - 설정 탭 삭제

  const Header = () => (
    <div className="sticky top-0 z-20 bg-slate-50 pb-3 pt-2 -mt-2">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200 flex-shrink-0" />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${isCoach ? 'bg-orange-100 text-orange-500' : 'bg-orange-100 text-orange-500'}`}>
              {user.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">{user.name}</h2>
                <button
                  onClick={() => {
                    if (confirm('역할을 변경하시겠습니까? (강사 ↔ 수강생)')) {
                      navigateTo(ROUTES.ONBOARDING);
                    }
                  }}
                  className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full uppercase flex-shrink-0 hover:bg-orange-200 transition-colors cursor-pointer"
                  title="클릭하여 역할 변경"
                >
                  {isCoach ? 'Coach' : 'Student'}
                </button>
            </div>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            {isCoach && onNavigateToProfile && (
                <button onClick={onNavigateToProfile} className="p-2 text-slate-400 hover:text-orange-500 transition-colors bg-white border border-slate-200 rounded-full">
                    <Settings size={18} />
                </button>
            )}
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-white border border-slate-200 rounded-full">
                <LogOut size={18} />
            </button>
        </div>
      </div>
    </div>
  );

  // --- COACH VIEW RENDER ---
  if (isCoach) {
      return (
        <>
          {/* User Edit Modal */}
          {editingUser && (
            <UserEditModal
              user={editingUser}
              instructorId={user.id}
              packages={userPackages}
              onClose={() => setEditingUser(null)}
              onSave={handleUserEditSave}
            />
          )}

          {/* Student Invite Modal */}
          {showInviteModal && currentCoaching && (
            <StudentInviteModal
              instructorId={user.id}
              coachingId={currentCoaching.id}
              coachingSlug={currentCoaching.slug}
              studioSlug={user.short_id}
              onClose={() => setShowInviteModal(false)}
              onSuccess={() => {
                fetchUsers();
                setShowInviteModal(false);
              }}
            />
          )}

          {/* Coaching Management Modal */}
          {showCoachingModal && (
            <CoachingManagementModal
              instructorId={user.id}
              currentCoaching={currentCoaching}
              onClose={() => setShowCoachingModal(false)}
              onSelectCoaching={(coaching) => setCurrentCoaching(coaching)}
            />
          )}

          <div className="min-h-screen bg-slate-50">
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 space-y-6">
              <Header />

            {/* Coach Tabs - Desktop & Mobile */}
            {/* Mobile: Hamburger Menu + Current Tab Title */}
            <div className="lg:hidden sticky top-[72px] z-10 bg-slate-50 pb-3">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-slate-50 transition-colors rounded-xl"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  <span className="font-bold text-slate-900">
                    {activeTab === 'stats' && '통계'}
                    {activeTab === 'reservations' && '예약'}
                    {activeTab === 'group-classes' && '그룹수업'}
                    {activeTab === 'attendance' && '출석'}
                    {activeTab === 'users' && '회원'}
                    {activeTab === 'packages' && '수강권'}
                    {activeTab === 'class' && '코칭 관리'}
                  </span>
                </button>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                  <div className="p-3 pt-0 space-y-1">
                    <button
                      onClick={() => handleTabChange('stats')}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                        activeTab === 'stats'
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      통계
                    </button>
                    <button
                      onClick={() => handleTabChange('reservations')}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                        activeTab === 'reservations'
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      예약
                    </button>
                    <button
                      onClick={() => handleTabChange('group-classes')}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                        activeTab === 'group-classes'
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      그룹수업
                    </button>
                    <button
                      onClick={() => handleTabChange('attendance')}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                        activeTab === 'attendance'
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      출석
                    </button>
                    <button
                      onClick={() => { handleTabChange('users'); fetchUsers(); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                        activeTab === 'users'
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      회원
                    </button>
                    <button
                      onClick={() => handleTabChange('packages')}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                        activeTab === 'packages'
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      수강권
                    </button>
                    <button
                      onClick={() => handleTabChange('class')}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                        activeTab === 'class'
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      코칭 관리
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop: Original Horizontal Tabs */}
            <div className="hidden lg:block overflow-x-auto sticky top-[72px] z-10 bg-slate-50 pb-3">
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl min-w-max">
                    <button
                        onClick={() => handleTabChange('stats')}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <TrendingUp size={14} className="inline mr-1" />
                        통계
                    </button>
                    <button
                        onClick={() => handleTabChange('reservations')}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'reservations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Calendar size={14} className="inline mr-1" />
                        예약
                    </button>
                    <button
                        onClick={() => handleTabChange('group-classes')}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'group-classes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="inline-block w-4 h-4 bg-purple-100 text-purple-600 rounded text-[10px] font-black leading-4 text-center mr-1">G</span>
                        그룹수업
                    </button>
                    <button
                        onClick={() => handleTabChange('attendance')}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <CheckCircle2 size={14} className="inline mr-1" />
                        출석
                    </button>
                    <button
                        onClick={() => { handleTabChange('users'); fetchUsers(); }}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Users size={14} className="inline mr-1" />
                        회원
                    </button>
                    <button
                        onClick={() => handleTabChange('packages')}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'packages' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Package size={14} className="inline mr-1" />
                        수강권
                    </button>
                    <button
                        onClick={() => handleTabChange('class')}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'class' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <FolderOpen size={14} className="inline mr-1" />
                        코칭 관리
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[300px]">
                {activeTab === 'stats' && <StatsDashboard instructorEmail={user.email} instructorId={user.id} />}
                {activeTab === 'reservations' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center">
                                <Calendar size={22} className="mr-2 text-orange-500"/> 전체 예약
                            </h3>
                            <div className="flex items-center gap-2">
                                {/* 정렬 버튼 */}
                                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setReservationSort('desc')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                            reservationSort === 'desc'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        최신순
                                    </button>
                                    <button
                                        onClick={() => setReservationSort('asc')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                            reservationSort === 'asc'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        오래된순
                                    </button>
                                </div>
                                <button onClick={fetchDashboard} className="text-slate-400 hover:text-orange-500 transition-colors">
                                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                        {renderCoachReservations()}
                    </>
                )}
                {activeTab === 'group-classes' && <GroupClassSchedule instructorEmail={user.email} instructorId={user.id} />}
                {activeTab === 'attendance' && <AttendanceCheck instructorEmail={user.email} instructorId={user.id} />}
                {activeTab === 'users' && renderCoachUsers()}
                {activeTab === 'packages' && <PackageManagement instructorEmail={user.email} instructorId={user.id} />}
                {activeTab === 'class' && renderCoachingManagement()}
            </div>
          </div>
        </div>

        {/* Notion Settings Modal */}
        <NotionSettingsModal
          isOpen={showNotionSettings}
          onClose={() => setShowNotionSettings(false)}
          userId={parseInt(user.id)}
        />

        {/* Consultation Memo Modal */}
        {selectedStudent && (
          <ConsultationMemoModal
            isOpen={showMemoModal}
            onClose={() => {
              setShowMemoModal(false);
              setSelectedStudent(null);
            }}
            userId={parseInt(user.id)}
            student={{
              id: selectedStudent.id,
              name: selectedStudent.name,
              email: selectedStudent.email,
            }}
          />
        )}
        </>
      );
  }

  // --- STUDENT VIEW RENDER ---
  const [studentPackages, setStudentPackages] = useState<any[]>([]);
  const [totalRemaining, setTotalRemaining] = useState(0);

  useEffect(() => {
    if (!isCoach && user.id) {
      loadStudentPackages();
    }
  }, [isCoach, user.id]);

  const loadStudentPackages = async () => {
    try {
      const packages = await getAllStudentPackages(user.id);
      setStudentPackages(packages);

      // Calculate total remaining credits from active packages
      const activePackages = packages.filter(p =>
        p.remaining_sessions > 0 &&
        (!p.expires_at || new Date(p.expires_at) > new Date())
      );
      const total = activePackages.reduce((sum, p) => sum + p.remaining_sessions, 0);
      setTotalRemaining(total);
      console.log('[Student Dashboard] Active packages:', activePackages);
      console.log('[Student Dashboard] Total remaining:', total);
    } catch (error) {
      console.error('Failed to load student packages:', error);
    }
  };

  const remaining = totalRemaining;
  const hasCredits = remaining > 0;
  const now = new Date();

  // 강사는 언제든지 취소 가능, 학생은 1시간 전까지만
  const isCancelable = (date: string, time: string, status: string) => {
    if (status !== '확정됨') return false;
    const sessionDate = new Date(`${date}T${time}:00`);
    const diffMs = sessionDate.getTime() - now.getTime();
    const oneHourMs = 60 * 60 * 1000;
    return diffMs > oneHourMs;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-6 space-y-6">
        <Header />

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <p className="text-orange-100 text-sm font-medium uppercase tracking-wider mb-1">잔여 수강권</p>
        <div className="flex items-end items-baseline">
            <span className="text-5xl font-bold tracking-tighter">{remaining ?? '-'}</span>
            <span className="text-xl ml-2 text-orange-100">회</span>
        </div>
      </div>

      <button
        onClick={onNavigateToReservation}
        disabled={!hasCredits || loading}
        className={`w-full py-4 px-6 rounded-2xl flex items-center justify-between group transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
          hasCredits 
            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 shadow-xl' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        <span className="font-semibold text-lg">{hasCredits ? '새 예약하기' : '수강권 소진됨'}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasCredits ? 'bg-white/20' : 'bg-slate-300'}`}>
          <Plus size={20} />
        </div>
      </button>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-bold text-slate-800">나의 예약</h3>
          <button onClick={fetchDashboard} className="text-slate-400 hover:text-orange-500 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="space-y-3">
          {loading && !data ? (
             <div className="text-center py-4 text-slate-400 text-sm">내역을 불러오는 중...</div>
          ) : data?.reservations && data.reservations.length > 0 ? (
            data.reservations.map((res, idx) => {
              const cancelable = isCancelable(res.date, res.time, res.status);
              const isCanceling = cancelingId === res.reservationId;

              return (
                <div key={idx} className="flex flex-col p-4 rounded-xl border border-slate-200 bg-white shadow-sm gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        res.status === '확정됨' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                        <Calendar size={18} />
                        </div>
                        <div>
                        <p className={`text-sm font-semibold ${res.status === '취소됨' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {res.date} <span className="text-slate-500 font-normal">| {res.instructorName || '코치'}</span>
                        </p>
                        <p className="text-xs text-slate-500">{res.time}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            res.status === '확정됨' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {res.status}
                        </span>
                        
                        {cancelable && (
                        <button 
                            onClick={() => handleCancel(res.reservationId, res.date, res.time)}
                            disabled={isCanceling}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            {isCanceling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />}
                        </button>
                        )}
                    </div>
                  </div>
                  {res.status === '확정됨' && res.meetLink && (
                      <a href={res.meetLink} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-100">
                          <Video size={16} className="mr-2" /> 화상 회의 입장
                      </a>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">예약 내역이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};