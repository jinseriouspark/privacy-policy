
import React, { useState, useEffect } from 'react';
import WeekCalendar from './components/WeekCalendar';
import FeatureCards from './components/FeatureCards';
import ScheduleList from './components/ScheduleList';
import ScheduleDetailModal from './components/ScheduleDetailModal';
import BottomNav from './components/BottomNav';
import LoginView from './components/views/LoginView';
import ScheduleView from './components/views/ScheduleView';
import AddView from './components/views/AddView';
import AddPracticeView from './components/views/AddPracticeView';
import DharmaView from './components/views/DharmaView';
import ProfileView from './components/views/ProfileView';
import OnboardingView from './components/views/OnboardingView';
import PracticeView from './components/views/PracticeView';
import PracticeLogView from './components/views/PracticeLogView';
import MonkModeView from './components/views/MonkModeView';
import NotificationSettingsView from './components/views/NotificationSettingsView';
import MyEventsView from './components/views/MyEventsView';
import { APP_STRINGS } from './constants';
import { ViewType, User, ScheduleItem, AppConfig, VideoContent } from './types';
import { googleAuthService, dbService } from './services/db';
import { getKoreanToday } from './utils/dateUtils';
import { getAllSpecialDates } from './utils/specialDates';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  
  // App Dynamic Data
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [latestVideo, setLatestVideo] = useState<VideoContent | null>(null);
  
  // Practice Data
  const [practiceLogs, setPracticeLogs] = useState<any[]>([]);

  // Schedule Detail Modal State
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);

  // Helper to get today's date in Korean timezone YYYY-MM-DD
  const getLocalTodayStr = () => {
    return getKoreanToday();
  };

  // Initial Data Load
  useEffect(() => {
    const initApp = async () => {
      try {
        const settings = await dbService.getSettings();
        setAppConfig(settings);
      } catch (e) {
        console.warn("Settings fetch failed:", e);
      }

      try {
        const videos = await dbService.getVideos();
        if (videos.length > 0) setLatestVideo(videos[0]);
      } catch (e) {
        console.warn("Videos fetch failed:", e);
      }
    };

    initApp();

    // 앱 버전 체크 - 버전이 다르면 강제 로그아웃
    const APP_VERSION = '1.0.2'; // 버전을 올리면 모든 사용자 강제 로그아웃
    const savedVersion = localStorage.getItem('app_version');

    if (savedVersion !== APP_VERSION) {
      // 버전이 다르면 로그아웃 처리
      localStorage.clear();
      localStorage.setItem('app_version', APP_VERSION);
      setUser(null);
      setCurrentView('login');
      return;
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);

      // Refresh user data from DB to get latest dharmaName
      dbService.getUserProfile(parsedUser.email).then(freshUser => {
        if (freshUser) {
          const updatedUser = { ...parsedUser, ...freshUser };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          setUser(parsedUser);
        }
      }).catch(() => {
        setUser(parsedUser);
      });

      loadSchedules(parsedUser.email);
      loadPracticeLogs(parsedUser.email);

      if (parsedUser.role === 'monk') {
        setCurrentView('monk-home');
        return;
      }
      if (!parsedUser.trackingIds || parsedUser.trackingIds.length === 0) {
        setCurrentView('onboarding');
      } else {
        setCurrentView('home');
      }
    }
  }, []);

  const loadSchedules = async (email: string, useCache: boolean = true) => {
    try {
      const data = await dbService.getSchedules(email, useCache);

      // Add special dates as schedule items
      const specialDates = getAllSpecialDates();
      const specialSchedules: ScheduleItem[] = Object.entries(specialDates).map(([dateKey, title]) => ({
        id: `special_${dateKey}`,
        type: 'temple' as const,
        time: '종일',
        title: title,
        date: dateKey,
        meta: '절기/행사'
      }));

      setSchedules([...specialSchedules, ...data]);
    } catch (e) { console.warn("Schedules load failed", e); }
  };
  
  const loadPracticeLogs = async (email: string) => {
    try {
      const logs = await dbService.getPracticeLogs(email);
      setPracticeLogs([...logs]); // Create new array to trigger re-render
    } catch (e) {
      console.warn("Logs load failed", e);
      // Try to load from cache
      const cache = localStorage.getItem(`logs_${email}`);
      if (cache) {
        setPracticeLogs([...JSON.parse(cache)]);
      }
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    localStorage.setItem('app_version', '1.0.2'); // 로그인 시 버전 저장
    loadSchedules(loggedInUser.email);
    loadPracticeLogs(loggedInUser.email);

    if (loggedInUser.role === 'monk') {
      setCurrentView('monk-home');
      return;
    }
    if (!loggedInUser.trackingIds || loggedInUser.trackingIds.length === 0) {
      setCurrentView('onboarding');
    } else {
      setCurrentView('home');
    }
  };

  const handleLogout = async () => {
    await googleAuthService.signOut();
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('login');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleOnboardingComplete = async (selectedIds: string[]) => {
    if (user) {
      const updatedUser = { ...user, trackingIds: selectedIds };
      handleUpdateUser(updatedUser);

      try {
        console.log('📤 수행목표 저장 시작:', selectedIds);
        await dbService.updateUserGoals(updatedUser.email, selectedIds);
        console.log('✅ 수행목표 저장 성공');
        setCurrentView('home');
      } catch (error) {
        console.error('❌ 수행목표 저장 실패:', error);
        alert('수행목표 저장에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };
  
  const handlePracticeComplete = async (checkedIds: string[], progress: number) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const today = getLocalTodayStr();
    console.log('🔄 수행 완료 저장 시작:', {
      user: user.email,
      today,
      progress,
      checkedCount: checkedIds.length
    });

    try {
      const logData = {
        id: `${user.email}_${today}`,
        email: user.email,
        date: today,
        progress: progress,
        checkedIds: checkedIds
      };

      console.log('📤 저장할 데이터:', logData);

      const result = await dbService.savePracticeLog(logData);
      console.log('✅ 저장 성공:', result);

      // 로컬 캐시 즉시 업데이트
      const updatedLogs = practiceLogs.filter(log => log.id !== logData.id);
      updatedLogs.push(logData);
      setPracticeLogs([...updatedLogs]);

      // 서버에서 다시 로드
      await loadPracticeLogs(user.email);
      console.log('✅ 수행 기록 새로고침 완료');

      alert('✅ 수행 기록이 저장되었습니다!');
      setCurrentView('home');
    } catch (e) {
      console.error('❌ 수행 기록 저장 실패:', e);
      console.error('에러 상세:', {
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined
      });
      alert(`수행 기록 저장에 실패했습니다.\n\n에러: ${e instanceof Error ? e.message : '알 수 없는 오류'}\n\n다시 시도해주세요.`);
    }
  };

  const handleDeleteSchedule = async () => {
    if (selectedSchedule) {
      if (confirm('이 일정을 삭제하시겠습니까?')) {
        try {
          await dbService.deleteSchedule(selectedSchedule.id);
          setSchedules(prev => prev.filter(s => s.id !== selectedSchedule.id));
          setSelectedSchedule(null);
          alert('일정이 삭제되었습니다.');
        } catch (e) {
          alert('일정 삭제에 실패했습니다.');
        }
      }
    }
  };

  const handleRSVP = async () => {
    if (!selectedSchedule || !user) return;

    const isCurrentlyJoined = selectedSchedule.participants?.includes(user.email) || false;
    const isJoining = !isCurrentlyJoined;

    try {
      await dbService.rsvpEvent(selectedSchedule.id, user.email, isJoining);

      // Update local state
      const updatedSchedules = schedules.map(s => {
        if (s.id === selectedSchedule.id) {
          const newParticipants = isJoining
            ? [...(s.participants || []), user.email]
            : (s.participants || []).filter(email => email !== user.email);
          return { ...s, participants: newParticipants };
        }
        return s;
      });

      setSchedules(updatedSchedules);

      // Update selected schedule
      const updatedSelected = updatedSchedules.find(s => s.id === selectedSchedule.id);
      if (updatedSelected) setSelectedSchedule(updatedSelected);

      alert(isJoining ? '참가 신청이 완료되었습니다!' : '참가 신청이 취소되었습니다.');
    } catch (e) {
      alert('참가 신청 처리에 실패했습니다.');
    }
  };

  // Calculate Progress for Dashboard Card
  const getProgressLabel = () => {
    if (!user || !user.trackingIds || user.trackingIds.length === 0) {
      return '목표 설정하기';
    }

    const today = getLocalTodayStr();
    const todayLog = practiceLogs.find(l => l.date === today);
    const completedCount = todayLog ? todayLog.checkedIds.length : 0;
    const totalCount = user.trackingIds.length;

    return `${completedCount}/${totalCount} 완료`;
  };

  // Check if today's practice is completed
  const isPracticeCompleted = () => {
    if (!user || !user.trackingIds || user.trackingIds.length === 0) {
      return false;
    }

    const today = getLocalTodayStr();
    const todayLog = practiceLogs.find(l => l.date === today);
    return todayLog ? todayLog.progress === 100 : false;
  };

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginView onLoginSuccess={handleLogin} appConfig={appConfig} />;
      
      case 'onboarding':
        return (
          <OnboardingView
            onComplete={handleOnboardingComplete}
            initialSelection={user?.trackingIds || []}
            onBack={user?.trackingIds && user.trackingIds.length > 0 ? () => setCurrentView('profile') : undefined}
          />
        );

      case 'monk-home':
        return user ? <MonkModeView user={user} onLogout={handleLogout} /> : null;

      case 'home':
        return (
          <div className="px-6 pt-14 flex flex-col gap-8 animate-fade-in pb-32">
            <section className="flex flex-col gap-0.5">
              <h1 className="text-[20px] text-dark font-bold leading-[1.3] tracking-tight">
                {appConfig?.homeGreeting || APP_STRINGS.greeting}
              </h1>
              <h2 className="text-[20px] text-dark font-bold leading-[1.3] tracking-tight">
                {user?.dharmaName
                  ? `${user.dharmaName}님`
                  : `${user?.name || user?.email?.split('@')[0]}님`
                }
              </h2>
            </section>

            <section>
              <WeekCalendar
                days={[]}
                practiceLogs={practiceLogs}
                schedules={schedules}
                onSeeAll={() => setCurrentView('schedule')}
                title=""
              />
            </section>

            <section>
              <FeatureCards
                onStartPractice={() => setCurrentView('practice')}
                onOpenDharma={() => setCurrentView('dharma')}
                appConfig={appConfig}
                latestVideo={latestVideo}
                progressLabel={getProgressLabel()}
                isCompleted={isPracticeCompleted()}
              />
            </section>

            <section>
              <ScheduleList
                items={
                  schedules
                    .filter(s => {
                      // 수행 기록 제외 (practice_ 로 시작하는 ID 또는 meta가 '수행 완료')
                      if (s.id.startsWith('practice_')) return false;
                      if (s.meta === '수행 완료') return false;

                      // 절 공식 일정(temple) 및 개인 일정(personal) 표시
                      if (s.type !== 'temple' && s.type !== 'personal') return false;

                      // 오늘 이후의 일정만 표시
                      if (!s.date) return false;
                      const scheduleDate = new Date(s.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return scheduleDate >= today;
                    })
                    .sort((a, b) => {
                      // 날짜순 정렬
                      const dateA = new Date(a.date || '');
                      const dateB = new Date(b.date || '');
                      return dateA.getTime() - dateB.getTime();
                    })
                    .slice(0, 3)
                }
                title={appConfig?.scheduleTitle || APP_STRINGS.sectionSchedule}
                onItemClick={setSelectedSchedule}
              />
            </section>
          </div>
        );

      case 'schedule':
        return (
          <ScheduleView
            schedules={schedules}
            currentUser={user}
            onScheduleClick={setSelectedSchedule}
            onAddSchedule={() => setCurrentView('add')}
            onRefresh={async () => {
              if (user) {
                await loadSchedules(user.email, false);
              }
            }}
          />
        );

      case 'add':
        return <AddView onComplete={() => { setCurrentView('home'); if(user) loadSchedules(user.email, false); }} currentUser={user} appConfig={appConfig} />;

      case 'dharma':
        return <DharmaView appConfig={appConfig} />;
      
      case 'practice':
        const today = getLocalTodayStr();
        const todayLog = practiceLogs.find(l => l.date === today);
        return (
          <PracticeView 
            selectedIds={user?.trackingIds || []} 
            initialCheckedIds={todayLog ? todayLog.checkedIds : []}
            onBack={() => setCurrentView('home')}
            onComplete={handlePracticeComplete}
          />
        );

      case 'profile':
        return (
          <ProfileView
            user={user}
            onLogout={handleLogout}
            onChangeChecklist={() => setCurrentView('onboarding')}
            onNotificationSettings={() => setCurrentView('notification-settings')}
            onUpdateUser={handleUpdateUser}
            appConfig={appConfig}
            onMyEvents={() => setCurrentView('my-events')}
          />
        );

      case 'notification-settings':
        return <NotificationSettingsView onBack={() => setCurrentView('profile')} />;

      case 'my-events':
        return (
          <MyEventsView
            userEmail={user?.email || null}
            onBack={() => setCurrentView('profile')}
            onScheduleClick={setSelectedSchedule}
          />
        );

      case 'practice-log':
        return (
          <PracticeLogView
            userEmail={user?.email || null}
            onAddClick={() => setCurrentView('add-practice')}
          />
        );

      case 'add-practice':
        return <AddPracticeView onComplete={() => { setCurrentView('practice-log'); if(user) loadSchedules(user.email, false); }} currentUser={user} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-dark selection:bg-secondary/20 font-serif pb-safe">
      <main className="max-w-lg mx-auto min-h-screen relative bg-[#F8F9FA] shadow-2xl">
        {renderContent()}
        {['home', 'schedule', 'dharma', 'profile', 'practice-log'].includes(currentView) && (
          <BottomNav currentView={currentView} onNavigate={setCurrentView} />
        )}

        {/* Schedule Detail Modal */}
        <ScheduleDetailModal
          schedule={selectedSchedule}
          currentUser={user}
          onClose={() => setSelectedSchedule(null)}
          onUpdate={() => user && loadSchedules(user.email, false)}
        />
      </main>
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
};

export default App;
