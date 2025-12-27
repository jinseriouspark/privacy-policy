import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileInstructorHome } from './MobileInstructorHome';
import { MobileStudentHome } from './MobileStudentHome';
import { MobileCalendar } from './MobileCalendar';
import { MobileReservations } from './MobileReservations';
import { MobileStudents } from './MobileStudents';
import { MobileAttendance } from './MobileAttendance';
import { MobileProfile } from './MobileProfile';
import { signOut } from '../../lib/supabase/auth';
import { navigateTo, ROUTES } from '../../utils/router';
import { Home, Calendar, Users, CheckCircle, MoreHorizontal, User as UserIcon } from 'lucide-react';

type TabId = 'home' | 'calendar' | 'reservations' | 'students' | 'attendance' | 'more' | 'profile';

interface MobileDashboardProps {
  user: User;
  initialTab?: TabId; // 🆕 Optional initial tab from URL
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({ user, initialTab = 'home' }) => {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const isInstructor = user.user_type === 'instructor';

  // Update URL when tab changes (students only)
  useEffect(() => {
    if (!isInstructor) {
      const urlMap: Record<TabId, string> = {
        home: ROUTES.STUDENT_HOME,
        calendar: ROUTES.STUDENT_CALENDAR,
        reservations: ROUTES.STUDENT_RESERVATIONS,
        profile: ROUTES.STUDENT_PROFILE,
        students: ROUTES.STUDENTS, // Not used for students
        attendance: ROUTES.ATTENDANCE, // Not used for students
        more: ROUTES.PROFILE, // Not used for students
      };

      const targetUrl = urlMap[activeTab];
      if (targetUrl && window.location.pathname !== targetUrl) {
        navigateTo(targetUrl);
      }
    }
  }, [activeTab, isInstructor]);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return isInstructor ? (
          <MobileInstructorHome user={user} onTabChange={setActiveTab} />
        ) : (
          <MobileStudentHome user={user} />
        );

      case 'calendar':
        return <MobileCalendar user={user} />;

      case 'reservations':
        return <MobileReservations user={user} />;

      case 'students':
        return isInstructor ? (
          <MobileStudents user={user} />
        ) : null;

      case 'attendance':
        return isInstructor ? (
          <MobileAttendance user={user} />
        ) : null;

      case 'more':
        return isInstructor ? (
          <MobileProfile user={user} onLogout={handleLogout} />
        ) : null;

      case 'profile':
        return !isInstructor ? (
          <MobileProfile user={user} onLogout={handleLogout} />
        ) : null;

      default:
        return null;
    }
  };

  const instructorTabs = [
    { id: 'home' as TabId, icon: Home, label: '홈' },
    { id: 'calendar' as TabId, icon: Calendar, label: '캘린더' },
    { id: 'students' as TabId, icon: Users, label: '회원' },
    { id: 'attendance' as TabId, icon: CheckCircle, label: '출석' },
    { id: 'more' as TabId, icon: MoreHorizontal, label: '더보기' }
  ];

  const studentTabs = [
    { id: 'home' as TabId, icon: Home, label: '홈' },
    { id: 'calendar' as TabId, icon: Calendar, label: '캘린더' },
    { id: 'reservations' as TabId, icon: CheckCircle, label: '예약' },
    { id: 'profile' as TabId, icon: UserIcon, label: '내정보' }
  ];

  const tabs = isInstructor ? instructorTabs : studentTabs;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      {/* Mobile-width container for all screens */}
      <div className="w-full max-w-md bg-white shadow-lg relative">
        {/* Main Content */}
        <main className="pb-safe">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isInstructor={isInstructor}
        />
      </div>
    </div>
  );
};
