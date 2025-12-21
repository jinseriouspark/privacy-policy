
import React, { useState } from 'react';
import { User, AppConfig } from '../../types';
import { Settings, Award, LogOut, CheckSquare, Edit2, Check, Flower2, LayoutGrid, Calendar } from 'lucide-react';
import { dbService } from '../../services/db';

interface ProfileViewProps {
  user: User | null;
  onLogout: () => void;
  onChangeChecklist?: () => void;
  onNotificationSettings?: () => void;
  onUpdateUser?: (user: User) => void;
  appConfig?: AppConfig | null;
  onMyEvents?: () => void;
}

type ViewMode = 'calendar' | 'timeline' | 'stats' | 'weekly';

const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, onChangeChecklist, onNotificationSettings, onUpdateUser, appConfig, onMyEvents }) => {
  const [isEditingDharma, setIsEditingDharma] = useState(false);
  const [editName, setEditName] = useState('');
  const [isResting, setIsResting] = useState(false);
  const [showViewSelector, setShowViewSelector] = useState(false);

  // Get current preferred view
  const [preferredView, setPreferredView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('practiceLogViewMode');
    return (saved as ViewMode) || 'weekly';
  });

  if (!user) return null;

  // Initialize edit name when entering edit mode
  const startEditing = () => {
    setEditName(user.dharmaName || '');
    setIsEditingDharma(true);
  };

  const handleSaveDharma = async () => {
    setIsResting(true);

    await Promise.all([
      dbService.updateUserProfile(user.email, { dharmaName: editName }),
      new Promise(resolve => setTimeout(resolve, 1500))
    ]);

    if (onUpdateUser) {
      onUpdateUser({ ...user, dharmaName: editName });
    }
    setIsEditingDharma(false);
    setIsResting(false);
  };

  const handleViewChange = (mode: ViewMode) => {
    setPreferredView(mode);
    localStorage.setItem('practiceLogViewMode', mode);
    setShowViewSelector(false);
  };

  const getViewLabel = (mode: ViewMode) => {
    switch(mode) {
      case 'weekly': return '주간 히트맵';
      case 'calendar': return '월간 캘린더';
      case 'timeline': return '타임라인 목록';
      case 'stats': return '통계 차트';
    }
  };

  return (
    <div className="px-6 pt-14 pb-32 animate-fade-in relative">
      {/* Profile Header - Compact */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-white shadow-sm overflow-hidden">
          <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h2 className="text-[15px] font-bold text-dark">{user.name}</h2>
          <p className="text-[12px] text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Stats - Horizontal Single Row */}
      <div className="bg-white p-4 rounded-[16px] shadow-sm mb-6 flex items-center justify-around">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-orange-600" />
          <div>
            <span className="text-[16px] font-bold text-dark">{user.streak}일</span>
            <span className="text-[10px] text-gray-400 ml-1">연속수행</span>
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-green-600" />
          <div>
            <span className="text-[16px] font-bold text-dark">{user.trackingIds?.length || 0}개</span>
            <span className="text-[10px] text-gray-400 ml-1">목표항목</span>
          </div>
        </div>
      </div>

      {/* Dharma Name Section - Compact */}
      <div className="bg-white p-4 rounded-[16px] shadow-sm mb-6 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">법명</h3>
          {isEditingDharma ? (
            <input
              className="text-[14px] font-bold text-dark w-full border-b-2 border-primary focus:outline-none bg-transparent"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="법명을 입력하세요"
              autoFocus
            />
          ) : (
            <span className="text-[14px] font-bold text-dark">{user.dharmaName || '법명을 설정해주세요'}</span>
          )}
        </div>
        <button
          onClick={() => isEditingDharma ? handleSaveDharma() : startEditing()}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm
            ${isEditingDharma
              ? 'bg-primary text-white hover:bg-green-700'
              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
        >
          {isEditingDharma ? <Check size={16} /> : <Edit2 size={16} />}
        </button>
      </div>

      {/* Menu List - Compact */}
      <div className="bg-white rounded-[16px] overflow-hidden shadow-sm mb-8">
        {onChangeChecklist && (
          <button
            onClick={onChangeChecklist}
            className="w-full p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <CheckSquare size={18} className="text-secondary" />
            <span className="text-[14px] font-medium text-dark flex-1 text-left">수행 목표 선택</span>
          </button>
        )}
        <button
          onClick={() => setShowViewSelector(!showViewSelector)}
          className="w-full p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <LayoutGrid size={18} className="text-primary" />
          <div className="flex-1 text-left">
            <p className="text-[14px] font-medium text-dark">수행 기록 보기 방식</p>
            <p className="text-[11px] text-gray-400">{getViewLabel(preferredView)}</p>
          </div>
        </button>
        {onMyEvents && (
          <button
            onClick={onMyEvents}
            className="w-full p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <Calendar size={18} className="text-blue-500" />
            <span className="text-[14px] font-medium text-dark flex-1 text-left">참석 신청한 일정</span>
          </button>
        )}
        <button
          onClick={onNotificationSettings}
          className="w-full p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Settings size={18} className="text-gray-400" />
          <span className="text-[14px] font-medium text-dark flex-1 text-left">알림 설정</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-500"
        >
          <LogOut size={18} className="text-red-400" />
          <span className="text-[14px] font-medium flex-1 text-left">로그아웃</span>
        </button>
      </div>

      {/* View Selector Modal */}
      {showViewSelector && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-fade-in" onClick={() => setShowViewSelector(false)}>
          <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-dark mb-6 text-center">수행 기록 보기 방식</h3>
            <div className="space-y-3 mb-6">
              {(['weekly', 'calendar', 'timeline', 'stats'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleViewChange(mode)}
                  className={`w-full p-4 rounded-[16px] text-left transition-all flex items-center justify-between
                    ${preferredView === mode
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-50 text-dark hover:bg-gray-100'}`}
                >
                  <span className="text-[15px] font-medium">{getViewLabel(mode)}</span>
                  {preferredView === mode && <Check size={20} />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowViewSelector(false)}
              className="w-full py-3 rounded-[16px] bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 휴식 오버레이 */}
      {isResting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md animate-fade-in">
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
              <Flower2 size={40} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h3 className="text-[19px] font-serif font-bold text-dark mb-2">
                {appConfig?.loadingMessage || '1초의 휴식...'}
              </h3>
              <p className="text-gray-500 text-sm">잠시 숨을 고르세요</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
