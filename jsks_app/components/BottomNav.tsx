import React from 'react';
import { House, CalendarDays, Plus, Flower2, UserCircle, ClipboardList } from 'lucide-react';
import { ViewType } from '../types';

interface BottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const navItems: { label: string; icon: any; view: ViewType; isCenter?: boolean }[] = [
    { label: '홈', icon: House, view: 'home' },
    { label: '일정', icon: CalendarDays, view: 'schedule' },
    { label: '수행기록', icon: ClipboardList, view: 'practice-log', isCenter: true },
    { label: '법문', icon: Flower2, view: 'dharma' },
    { label: '내 정보', icon: UserCircle, view: 'profile' },
  ];

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <nav className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[32px] px-2 py-2 flex items-center gap-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          
          if (item.isCenter) {
            return (
              <button
                key={index}
                className="bg-dark text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all mx-1"
                onClick={() => onNavigate(item.view)}
                aria-label={item.label}
              >
                <Icon size={28} strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button 
              key={index}
              className={`
                relative flex flex-col items-center justify-center w-16 h-14 rounded-[24px] transition-all duration-300
                ${isActive ? 'bg-gray-100 text-dark' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
              `}
              onClick={() => onNavigate(item.view)}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 bg-dark rounded-full"></span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;