
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Clock, Volume2, CheckCircle } from 'lucide-react';
import { messagingService } from '../../services/messaging';
import { dbService } from '../../services/db';
import { User } from '../../types';

interface NotificationSettingsViewProps {
  onBack: () => void;
}

const NotificationSettingsView: React.FC<NotificationSettingsViewProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    practiceReminder: false,
    practiceTime: '06:00',
    templeNews: false,
    dharmaVideo: false
  });
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Load settings
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // Check notification permission
    setNotificationEnabled(messagingService.checkPermission() === 'granted');
  }, []);

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const requestNotificationPermission = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    const token = await messagingService.requestPermission();

    if (token) {
      // FCM 토큰을 서버에 저장
      await dbService.saveFCMToken(currentUser.email, token);
      setNotificationEnabled(true);
      alert('✅ 알림이 활성화되었습니다!');
    } else {
      alert('❌ 알림 권한이 거부되었습니다.\n\n브라우저 설정에서 알림을 허용해주세요.');
    }
  };

  const toggle = async (key: keyof typeof settings) => {
    if (!notificationEnabled) {
      // 알림 권한이 없으면 먼저 권한 요청
      await requestNotificationPermission();
      if (!notificationEnabled) return;
    }

    saveSettings({ ...settings, [key]: !settings[key] });
  };

  const updateTime = (time: string) => {
    saveSettings({ ...settings, practiceTime: time });
  };

  return (
    <div className="px-6 pt-14 pb-32 animate-slide-up bg-[#F8F9FA] min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={28} className="text-dark" />
        </button>
        <h2 className="text-[28px] font-bold text-dark">알림 설정</h2>
      </div>

      {/* 알림 권한 상태 */}
      {!notificationEnabled && (
        <div className="bg-orange-50 border-2 border-orange-200 p-5 rounded-[20px] mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Bell size={24} className="text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-orange-900 mb-1">알림이 비활성화되어 있습니다</h3>
              <p className="text-[13px] text-orange-700 leading-relaxed">
                수행 알림, 절 소식, 새 법문 알림을 받으시려면 먼저 알림 권한을 허용해주세요.
              </p>
            </div>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="w-full py-3 bg-orange-500 text-white rounded-[14px] font-bold hover:bg-orange-600 transition-colors"
          >
            알림 권한 허용하기
          </button>
        </div>
      )}

      {notificationEnabled && (
        <div className="bg-green-50 border-2 border-green-200 p-4 rounded-[20px] mb-6 flex items-center gap-3">
          <CheckCircle size={24} className="text-green-600" />
          <div>
            <h3 className="text-[14px] font-bold text-green-900">알림이 활성화되었습니다</h3>
            <p className="text-[12px] text-green-700">설정한 알림을 받을 수 있습니다</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Practice Reminder Section */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-dark">매일 수행 알림</h3>
                <p className="text-sm text-gray-500">설정하신 시간에 알림을 드립니다</p>
              </div>
            </div>
            <div 
              onClick={() => toggle('practiceReminder')}
              className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.practiceReminder ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.practiceReminder ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
          
          {settings.practiceReminder && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between animate-fade-in">
              <span className="font-medium text-gray-600">알림 시간</span>
              <input 
                type="time" 
                value={settings.practiceTime}
                onChange={(e) => updateTime(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold text-dark focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Temple News */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-secondary">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-dark">절 소식 알림</h3>
              <p className="text-sm text-gray-500">중요한 행사나 공지를 받습니다</p>
            </div>
          </div>
          <div 
            onClick={() => toggle('templeNews')}
            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.templeNews ? 'bg-secondary' : 'bg-gray-200'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.templeNews ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* New Videos */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-dark">새 법문 알림</h3>
              <p className="text-sm text-gray-500">새로운 영상이 올라오면 알립니다</p>
            </div>
          </div>
          <div 
            onClick={() => toggle('dharmaVideo')}
            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.dharmaVideo ? 'bg-purple-500' : 'bg-gray-200'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.dharmaVideo ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsView;
