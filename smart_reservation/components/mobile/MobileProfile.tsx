import React, { useState } from 'react';
import { User, Mail, Calendar, LogOut, Settings, Bell, HelpCircle, Shield, X, RefreshCw } from 'lucide-react';
import { User as UserType } from '../../types';
import { navigateTo, ROUTES } from '../../utils/router';

interface MobileProfileProps {
  user: UserType;
  onLogout: () => void;
}

export const MobileProfile: React.FC<MobileProfileProps> = ({ user, onLogout }) => {
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      onLogout();
    }
  };

  const handleContactUs = () => {
    window.location.href = 'mailto:jseul45@gmail.com?subject=예약매니아 문의';
  };

  const handlePrivacyPolicy = () => {
    window.location.href = '/privacy-policy';
  };

  const handleChangeRole = () => {
    if (confirm('역할을 변경하시겠습니까? (강사 ↔ 수강생)')) {
      navigateTo(ROUTES.ONBOARDING);
    }
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 pt-8 pb-12">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-orange-600 font-bold text-3xl">
                {user.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex-1 text-white">
            <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
            <p className="text-orange-100 text-sm">{user.email}</p>
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                {user.user_type === 'instructor' ? '강사' : '수강생'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="px-6 -mt-6 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">가입일</p>
              <p className="text-sm font-bold text-slate-900">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : '-'
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">플랜</p>
              <p className="text-sm font-bold text-orange-600">Free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-6 space-y-4">
        {/* Account Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">계정 설정</h2>
          </div>

          <button
            onClick={() => setShowProfileEdit(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
          >
            <User size={20} className="text-slate-400" />
            <span className="flex-1 text-left text-slate-700">프로필 수정</span>
            <span className="text-slate-400">›</span>
          </button>

          <button
            onClick={() => setShowNotificationSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
          >
            <Bell size={20} className="text-slate-400" />
            <span className="flex-1 text-left text-slate-700">알림 설정</span>
            <span className="text-slate-400">›</span>
          </button>

          <button
            onClick={() => setShowAppSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
          >
            <Settings size={20} className="text-slate-400" />
            <span className="flex-1 text-left text-slate-700">환경 설정</span>
            <span className="text-slate-400">›</span>
          </button>

          <button
            onClick={handleChangeRole}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={20} className="text-slate-400" />
            <span className="flex-1 text-left text-slate-700">역할 변경</span>
            <span className="text-xs text-slate-500">
              {user.user_type === 'instructor' ? '강사 → 수강생' : '수강생 → 강사'}
            </span>
            <span className="text-slate-400">›</span>
          </button>
        </div>

        {/* Support */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">지원</h2>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
          >
            <HelpCircle size={20} className="text-slate-400" />
            <span className="flex-1 text-left text-slate-700">도움말</span>
            <span className="text-slate-400">›</span>
          </button>

          <button
            onClick={handleContactUs}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
          >
            <Mail size={20} className="text-slate-400" />
            <span className="flex-1 text-left text-slate-700">문의하기</span>
            <span className="text-slate-400">›</span>
          </button>

          <button
            onClick={handlePrivacyPolicy}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <Shield size={20} className="text-slate-400" />
            <span className="flex-1 text-left text-slate-700">개인정보 처리방침</span>
            <span className="text-slate-400">›</span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} className="text-red-500" />
            <span className="flex-1 text-left text-red-600 font-medium">로그아웃</span>
          </button>
        </div>

        {/* Version Info */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">
            예약매니아 v1.0.0
          </p>
          <p className="text-xs text-slate-400 mt-1">
            © 2025 All rights reserved
          </p>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">프로필 수정</h2>
              <button onClick={() => setShowProfileEdit(false)}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600">프로필 수정 기능은 곧 제공될 예정입니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">알림 설정</h2>
              <button onClick={() => setShowNotificationSettings(false)}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">예약 알림</p>
                  <p className="text-sm text-slate-500">새로운 예약이 있을 때 알림</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">취소 알림</p>
                  <p className="text-sm text-slate-500">예약 취소 시 알림</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">이메일 알림</p>
                  <p className="text-sm text-slate-500">중요한 알림을 이메일로 받기</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* App Settings Modal */}
      {showAppSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">환경 설정</h2>
              <button onClick={() => setShowAppSettings(false)}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="py-3 border-b border-slate-100">
                <p className="font-medium text-slate-900 mb-2">언어</p>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                  <option>한국어</option>
                  <option>English</option>
                </select>
              </div>
              <div className="py-3 border-b border-slate-100">
                <p className="font-medium text-slate-900 mb-2">시간대</p>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                  <option>한국 표준시 (GMT+9)</option>
                  <option>미국 동부 (GMT-5)</option>
                  <option>일본 (GMT+9)</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">다크 모드</p>
                  <p className="text-sm text-slate-500">어두운 테마 사용</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">도움말</h2>
              <button onClick={() => setShowHelp(false)}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-2">예약매니아란?</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  예약매니아는 강사와 학생을 연결하는 스마트 예약 관리 시스템입니다.
                  간편한 예약, 수강권 관리, Google Calendar 연동 등 다양한 기능을 제공합니다.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2">예약하는 방법</h3>
                <ol className="text-slate-600 text-sm space-y-2 list-decimal list-inside">
                  <li>캘린더 탭에서 원하는 날짜를 선택합니다</li>
                  <li>예약 가능한 시간 중 하나를 선택합니다</li>
                  <li>확인 버튼을 눌러 예약을 완료합니다</li>
                  <li>예약 탭에서 내 예약을 확인할 수 있습니다</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2">예약 취소</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  예약 탭에서 취소하고 싶은 예약을 선택 후 취소 버튼을 누르세요.
                  취소 가능 시간 내 취소 시 수강권이 복구됩니다.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2">수강권 확인</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  홈 화면에서 보유한 수강권과 잔여 횟수를 확인할 수 있습니다.
                  만료일과 남은 횟수를 항상 체크하세요.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2">문의하기</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  문제가 발생하거나 궁금한 점이 있다면 '문의하기' 버튼을 눌러
                  이메일로 문의해주세요. 빠르게 답변드리겠습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
