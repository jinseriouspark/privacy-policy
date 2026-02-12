import React from 'react';
import { Home, Calendar, Users, CheckCircle, MoreHorizontal, User } from 'lucide-react';

type TabId = 'home' | 'calendar' | 'reservations' | 'students' | 'attendance' | 'more' | 'profile';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isInstructor: boolean;
}

export const MobileBottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  isInstructor
}) => {
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
    { id: 'profile' as TabId, icon: User, label: '내정보' }
  ];

  const tabs = isInstructor ? instructorTabs : studentTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative
                ${isActive ? 'text-orange-500' : 'text-slate-400'}
              `}
            >
              <Icon
                size={24}
                className={`mb-1 transition-transform ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-1 bg-orange-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
