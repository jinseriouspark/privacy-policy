import React, { useEffect, useState } from 'react';
import { User, DashboardData, CalendarCheckResult, Reservation, WorkingHour, AvailabilityData, Coaching } from '../types';
import { postToGAS } from '../services/api';
import { Calendar, Plus, RefreshCw, LogOut, XCircle, Loader2, Video, Settings, Users, CheckCircle2, Clock, MinusCircle, PlusCircle, AlertTriangle, Share2, Copy, Package, TrendingUp, Edit, Trash2, Save, X, FolderOpen } from 'lucide-react';
import { InstructorSetupModal } from './InstructorSetupModal';
import { UserEditModal } from './UserEditModal';
import { StudentInviteModal } from './StudentInviteModal';
import { CoachingManagementModal } from './CoachingManagementModal';
import { CoachingManagementInline } from './CoachingManagementInline';
import PackageManagement from './PackageManagement';
import GroupClassSchedule from './GroupClassSchedule';
import AttendanceCheck from './AttendanceCheck';
import StatsDashboard from './StatsDashboard';
import { logActivity, type TabName } from '../lib/supabase/database';
import { getAllStudents, getInstructorStudents, getInstructorSettings, upsertInstructorSettings, getReservationsByDateRange, getReservations, cancelReservation, getStudentPackages, createPackage, updatePackage, deletePackage, getPackages, getInstructorCoachings } from '../lib/supabase/database';
import { createCoachingCalendar, getCalendarList } from '../lib/google-calendar';

interface DashboardProps {
  user: User;
  onNavigateToReservation: () => void;
  onLogout: () => void;
  onNavigateToProfile?: () => void;
}

type TabType = 'reservations' | 'users' | 'settings' | 'packages' | 'group-classes' | 'attendance' | 'stats' | 'class';

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigateToReservation, onLogout, onNavigateToProfile }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  
  // Instructor States
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupData, setSetupData] = useState<{ adminEmail: string, instructorId: string } | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(true);

  // URL to Tab mapping
  const urlToTab: Record<string, TabType> = {
    '/summary': 'stats',
    '/all-reservation': 'reservations',
    '/group': 'group-classes',
    '/attend': 'attendance',
    '/student': 'users',
    '/membership': 'packages',
    '/setting': 'settings',
    '/class': 'class'
  };

  const tabToUrl: Record<TabType, string> = {
    'stats': '/summary',
    'reservations': '/all-reservation',
    'group-classes': '/group',
    'attendance': '/attend',
    'users': '/student',
    'packages': '/membership',
    'settings': '/setting',
    'class': '/class'
  };
  
  // Instructor - User Mgmt
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userPackages, setUserPackages] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Instructor - Settings
  const [settings, setSettings] = useState<AvailabilityData | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Coaching Management
  const [currentCoaching, setCurrentCoaching] = useState<Coaching | null>(null);
  const [showCoachingModal, setShowCoachingModal] = useState(false);

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
        checkInstructorStatus();
        loadFirstCoaching();
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

  const checkInstructorStatus = async () => {
      try {
          // Supabase에서 캘린더 연동 상태 확인
          const settings = await getInstructorSettings(user.id);
          const isConnected = !!settings?.calendar_id;

          setCalendarConnected(isConnected);
          if (!isConnected) {
              setSetupData({
                  adminEmail: user.email || '',
                  instructorId: user.id
              });
          }
      } catch (e) {
          console.error("Failed to check calendar status", e);
      }
  };

  // --- Handlers ---

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
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
                total: activePackage.total_sessions
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

  const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
          const settingsData = await getInstructorSettings(user.id);

          // Convert Supabase settings format to AvailabilityData format
          const workingHours = settingsData?.business_hours || {
              '0': { start: '09:00', end: '18:00', isWorking: false }, // Sunday
              '1': { start: '09:00', end: '18:00', isWorking: true },  // Monday
              '2': { start: '09:00', end: '18:00', isWorking: true },
              '3': { start: '09:00', end: '18:00', isWorking: true },
              '4': { start: '09:00', end: '18:00', isWorking: true },
              '5': { start: '09:00', end: '18:00', isWorking: true },
              '6': { start: '09:00', end: '18:00', isWorking: false }, // Saturday
          };

          // Get current week's reservations for busy ranges
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);

          const reservations = await getReservationsByDateRange(
              user.id,
              startOfWeek.toISOString(),
              endOfWeek.toISOString()
          );

          const busyRanges = reservations.map(r => ({
              start: r.start_time,
              end: r.end_time
          }));

          setSettings({ workingHours, busyRanges });
      } catch (e) {
          console.error('Failed to load settings:', e);
          alert('설정 로드 실패');
      }
      finally { setSettingsLoading(false); }
  };

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

  const saveSettings = async () => {
      if (!settings) return;
      setSavingSettings(true);
      try {
          await upsertInstructorSettings(user.id, {
              business_hours: settings.workingHours
          });
          alert('설정이 저장되었습니다.');
      } catch (e) {
          console.error('Failed to save settings:', e);
          alert('저장 실패');
      }
      finally { setSavingSettings(false); }
  };

  const toggleWorkingDay = (dayIndex: string) => {
      if (!settings) return;
      const updated = { ...settings.workingHours };
      updated[dayIndex].isWorking = !updated[dayIndex].isWorking;
      setSettings({ ...settings, workingHours: updated });
  };

  const updateWorkingTime = (dayIndex: string, field: 'start' | 'end', value: string) => {
      if (!settings) return;
      const updated = { ...settings.workingHours };
      updated[dayIndex] = { ...updated[dayIndex], [field]: value };
      setSettings({ ...settings, workingHours: updated });
  };

  // --- Sub Views ---

  const renderCoachReservations = () => (
    <div className="space-y-3">
        {loading && !data ? (
        <div className="text-center py-8 text-slate-400 text-sm">데이터를 불러오는 중...</div>
        ) : data?.reservations && data.reservations.length > 0 ? (
        data.reservations.map((res, idx) => {
            const isUpcoming = res.status === '확정됨';
            const isCanceling = cancelingId === res.reservationId;
            return (
            <div key={idx} className={`flex p-4 rounded-xl border ${isUpcoming ? 'border-orange-100 bg-white' : 'border-slate-100 bg-slate-50'} shadow-sm gap-4`}>
                {/* Left Side - Action Buttons */}
                <div className="flex flex-col gap-2 items-center justify-center">
                    {isUpcoming && res.meetLink && (
                        <a
                            href={res.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-col items-center justify-center px-3 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-xs font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm min-w-[70px]"
                        >
                            <Video size={18} className="mb-1" />
                            <span>입장</span>
                        </a>
                    )}
                    {isUpcoming && (
                        <button
                            onClick={() => handleCancel(res.reservationId, res.date, res.time)}
                            disabled={isCanceling}
                            className="flex flex-col items-center justify-center px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-300 hover:bg-red-50 rounded-lg transition-all text-xs font-medium min-w-[70px]"
                        >
                            {isCanceling ? (
                                <Loader2 size={18} className="animate-spin mb-1" />
                            ) : (
                                <XCircle size={18} className="mb-1" />
                            )}
                            <span>{isCanceling ? '취소중' : '삭제'}</span>
                        </button>
                    )}
                </div>

                {/* Right Side - Details */}
                <div className="flex-1 flex flex-col gap-2">
                    {/* Student Info - Single Line */}
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isUpcoming ? 'bg-orange-50 text-orange-500' : 'bg-slate-200 text-slate-400'}`}>
                            {res.studentName ? res.studentName.charAt(0) : 'S'}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            <span className={`font-bold text-sm ${isUpcoming ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                                {res.studentName || res.studentEmail}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                res.packageType === 'group'
                                    ? 'bg-purple-50 text-purple-600'
                                    : 'bg-blue-50 text-blue-600'
                            }`}>
                                {res.packageType === 'group' ? '그룹' : '개인'}
                            </span>
                            {res.packageName && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold truncate">
                                        {res.packageName}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-3 text-sm text-slate-600 border-t border-slate-100 pt-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="font-medium">{res.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-400" />
                            <span className="font-medium">{res.time}</span>
                        </div>
                        {isUpcoming && res.meetLink && (
                            <a
                                href={res.meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors ml-auto"
                            >
                                <Video size={14} />
                                <span className="font-medium text-xs">Meet 입장</span>
                            </a>
                        )}
                    </div>
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

  const renderCoachUsers = () => (
      <div className="space-y-4">
          {/* 학생 초대 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!currentCoaching) {
                  alert('먼저 코칭을 생성해주세요. "코칭 관리" 버튼을 클릭하여 새 코칭을 만드세요.');
                  return;
                }
                setShowInviteModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
            >
              <Users size={18} />
              학생 초대하기
            </button>
          </div>

          {usersLoading ? (
               <div className="text-center py-8 text-slate-400 text-sm">사용자 목록 로딩 중...</div>
          ) : users.map((u: any, idx) => {
            const pkg = u.activePackage;
            const expiresAt = pkg?.expiresAt ? new Date(pkg.expiresAt) : null;
            const isExpiringSoon = expiresAt && expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

            return (
              <div key={idx} className="bg-white border border-slate-100 p-4 rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-base flex-shrink-0">
                              {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-base">{u.name}</p>
                              <p className="text-xs text-slate-400 mb-2">{u.email}</p>

                              {pkg ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold">
                                      {pkg.name}
                                    </span>
                                    <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                                      잔여 {pkg.remaining}/{pkg.total}회
                                    </span>
                                  </div>
                                  {expiresAt && (
                                    <p className={`text-xs ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                      만료: {expiresAt.toLocaleDateString()}
                                      {isExpiringSoon && ' ⚠️ 곧 만료'}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">활성 수강권 없음</p>
                              )}
                          </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => openUserEditor(u)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
                          >
                            <Edit size={14} />
                            <span>편집</span>
                          </button>
                      </div>
                  </div>
              </div>
            );
          })}
      </div>
  );

  const handleCreateCalendar = async () => {
    const calendarName = prompt('생성할 캘린더 이름을 입력하세요:', '코칭 예약');
    if (!calendarName) return;

    setSettingsLoading(true);
    try {
      const calendar = await createCoachingCalendar(calendarName);

      // Save calendar ID to settings
      await upsertInstructorSettings(user.id, {
        calendar_id: calendar.id
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

  const renderCoachSettings = () => {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      if (settingsLoading || !settings) return <div className="text-center py-8 text-slate-400">설정 로딩 중...</div>;

      return (
          <div className="space-y-6">
              {/* 영업시간 설정 */}
              <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">영업시간 설정</h3>
                  <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                      {Object.keys(settings.workingHours).map((key) => {
                          const dayIdx = parseInt(key);
                          const wh = settings.workingHours[key];
                          return (
                              <div key={key} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-none">
                                  <div className="flex items-center space-x-3 w-24">
                                      <input
                                        type="checkbox"
                                        checked={wh.isWorking}
                                        onChange={() => toggleWorkingDay(key)}
                                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400"
                                      />
                                      <span className={`font-bold ${wh.isWorking ? 'text-slate-800' : 'text-slate-400'}`}>{days[dayIdx]}요일</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <input
                                        type="time"
                                        value={wh.start}
                                        disabled={!wh.isWorking}
                                        onChange={(e) => updateWorkingTime(key, 'start', e.target.value)}
                                        className="bg-white text-slate-900 border border-slate-200 rounded px-2 py-1 text-sm w-24 disabled:bg-slate-50 disabled:text-slate-300"
                                      />
                                      <span className="text-slate-400">-</span>
                                      <input
                                        type="time"
                                        value={wh.end}
                                        disabled={!wh.isWorking}
                                        onChange={(e) => updateWorkingTime(key, 'end', e.target.value)}
                                        className="bg-white text-slate-900 border border-slate-200 rounded px-2 py-1 text-sm w-24 disabled:bg-slate-50 disabled:text-slate-300"
                                      />
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>

              <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                  {savingSettings ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2"/>}
                  설정 저장하기
              </button>
          </div>
      );
  };

  const Header = () => (
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
                {isCoach && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full uppercase flex-shrink-0">Coach</span>
                )}
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
              {showSetupModal && setupData && (
                  <InstructorSetupModal
                    adminEmail={setupData.adminEmail}
                    instructorId={setupData.instructorId}
                    defaultCalendarName={currentCoaching?.title || '코칭 예약'}
                    onClose={() => setShowSetupModal(false)}
                  />
              )}

              <Header />

            {!calendarConnected && (
                <div onClick={() => setShowSetupModal(true)} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-100 transition-colors">
                    <div className="flex items-center space-x-3 text-red-700">
                        <AlertTriangle size={20} />
                        <div>
                            <p className="font-bold text-sm">캘린더 연동 필요</p>
                            <p className="text-xs opacity-80">예약을 위해 권한 설정이 필요합니다.</p>
                        </div>
                    </div>
                    <Settings size={18} className="text-red-400" />
                </div>
            )}

            {/* Coach Tabs */}
            <div className="overflow-x-auto">
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
                        onClick={() => { handleTabChange('settings'); fetchSettings(); }}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Settings size={14} className="inline mr-1" />
                        설정
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
                            <button onClick={fetchDashboard} className="text-slate-400 hover:text-orange-500 transition-colors">
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        {renderCoachReservations()}
                    </>
                )}
                {activeTab === 'group-classes' && <GroupClassSchedule instructorEmail={user.email} instructorId={user.id} />}
                {activeTab === 'attendance' && <AttendanceCheck instructorEmail={user.email} instructorId={user.id} />}
                {activeTab === 'users' && renderCoachUsers()}
                {activeTab === 'packages' && <PackageManagement instructorEmail={user.email} instructorId={user.id} />}
                {activeTab === 'settings' && renderCoachSettings()}
                {activeTab === 'class' && renderCoachingManagement()}
            </div>
          </div>
        </div>
        </>
      );
  }

  // --- STUDENT VIEW RENDER ---
  const remaining = data?.remaining ?? user.remaining;
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

      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">잔여 수강권</p>
        <div className="flex items-end items-baseline">
            <span className="text-5xl font-bold tracking-tighter">{remaining ?? '-'}</span>
            <span className="text-xl ml-2 text-slate-400">회</span>
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
                <div key={idx} className="flex flex-col p-4 rounded-xl border border-slate-100 bg-white shadow-sm gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        res.status === '확정됨' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
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