
import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { User, AppConfig, ScheduleType } from '../../types';
import { Lock, Globe, Flower2, ArrowLeft, Search, FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';
import DriveFilePicker from '../DriveFilePicker';
import { getKoreanToday } from '../../utils/dateUtils';
import { validateTitle, ValidationResult, autoCorrect } from '../../utils/textValidator';

interface AddViewProps {
  onComplete: () => void;
  currentUser: User | null;
  appConfig: AppConfig | null;
}

const AddView: React.FC<AddViewProps> = ({ onComplete, currentUser, appConfig }) => {
  const isMonk = currentUser?.role === 'monk';
  const defaultType = isMonk ? 'temple' : 'personal';

  const [formData, setFormData] = useState({
    title: '',
    type: defaultType,
    date: getKoreanToday(),
    time: '03:00',
    endDate: getKoreanToday(),
    endTime: '04:00',
    maxParticipants: 0,
    memo: '',
    invitedEmails: [] as string[]
  });

  const [isAllDay, setIsAllDay] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(true); // 누구나 참석 가능
  const [isResting, setIsResting] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const isAdmin = currentUser?.role === 'monk' || currentUser?.role === 'developer';

  // 오타 검증 상태
  const [titleValidation, setTitleValidation] = useState<ValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // 스님 드라이브 폴더 ID
  const MONK_DRIVE_FOLDER_ID = '1Iw3aFnn0cimoiD2WaTbuEQRcFflwdFkC';

  useEffect(() => {
    // Load all users for search
    const loadUsers = async () => {
      const users = await dbService.getUsers();
      setAllUsers(users);
    };
    loadUsers();
  }, []);

  const handleSearchUsers = (query: string) => {
    setInviteInput(query);
    if (!query.trim()) {
      setFilteredUsers([]);
      setShowUserDropdown(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = allUsers.filter(u =>
      (u.name && u.name.toLowerCase().includes(lowerQuery)) ||
      (u.dharmaName && u.dharmaName.toLowerCase().includes(lowerQuery)) ||
      (u.email && u.email.toLowerCase().includes(lowerQuery))
    ).filter(u => u.email !== currentUser?.email); // 자기 자신 제외

    setFilteredUsers(results.slice(0, 5)); // 최대 5명
    setShowUserDropdown(results.length > 0);
  };

  const handleSelectUser = (user: User) => {
    if (!formData.invitedEmails.includes(user.email)) {
      setFormData({...formData, invitedEmails: [...formData.invitedEmails, user.email]});
    }
    setInviteInput('');
    setShowUserDropdown(false);
  };

  const handleSelectDriveFile = (fileUrl: string, fileName: string) => {
    setAttachmentUrl(fileUrl);
    setAttachmentName(fileName);
  };

  // 제목 입력 시 오타 검증
  const handleTitleChange = (value: string) => {
    setFormData({...formData, title: value});

    // 2자 이상일 때만 검증
    if (value.length >= 2) {
      const validation = validateTitle(value);
      setTitleValidation(validation);
      setShowValidation(!validation.isValid);
    } else {
      setTitleValidation(null);
      setShowValidation(false);
    }
  };

  // 자동 수정 적용
  const handleAutoFix = () => {
    if (titleValidation?.suggestions && titleValidation.suggestions.length > 0) {
      const corrected = titleValidation.suggestions[0];
      setFormData({...formData, title: corrected});
      setTitleValidation(null);
      setShowValidation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsResting(true);
    const typeToSend: ScheduleType = isMonk ? 'temple' : 'personal';

    // 참석 인원 설정
    const maxParts = !isUnlimited ? formData.maxParticipants : 0;

    await Promise.all([
      dbService.addSchedule({
        ...formData,
        type: typeToSend,
        maxParticipants: maxParts,
        attachmentUrl: attachmentUrl.trim() || undefined,
        attachmentName: attachmentName.trim() || undefined
      }, currentUser.email),
      new Promise(resolve => setTimeout(resolve, 1500))
    ]);

    onComplete();
  };

  return (
    <>
      <div className="px-6 pt-14 pb-32 animate-slide-up">
        <h2 className="text-[28px] font-bold text-dark mb-8">
          <ArrowLeft size={28} className="inline-block mr-2 align-middle cursor-pointer hover:text-primary transition-colors" onClick={onComplete} />
          새로운 일정
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Type Selection - Role Based */}
          {isMonk ? (
            <div className="w-full py-4 rounded-[16px] font-bold text-lg border-2 border-primary bg-primary/10 text-primary flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Globe size={18} />
                <span>절 행사</span>
              </div>
              <span className="text-xs font-normal text-primary/70">
                모든 신도에게 보입니다
              </span>
            </div>
          ) : (
            <div className="w-full py-4 rounded-[16px] font-bold text-lg border-2 border-secondary bg-secondary/10 text-secondary flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Lock size={18} />
                <span>개인 행사</span>
              </div>
              <span className="text-xs font-normal text-secondary/70">
                나와 초대받은 법명 유저에게만 보입니다
              </span>
            </div>
          )}

          {/* Title Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-500">이름</label>
            <div className="relative">
              <input
                type="text"
                placeholder="일정 이름을 입력하세요"
                className={`w-full p-4 text-lg bg-white border rounded-[16px] focus:outline-none focus:ring-1 transition-colors ${
                  showValidation && titleValidation && !titleValidation.isValid
                    ? 'border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500'
                    : 'border-gray-200 focus:border-secondary focus:ring-secondary'
                }`}
                value={formData.title}
                onChange={e => handleTitleChange(e.target.value)}
                required
              />
              {/* 검증 상태 아이콘 */}
              {formData.title.length >= 2 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {titleValidation?.isValid ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : (
                    <AlertCircle size={20} className="text-yellow-500" />
                  )}
                </div>
              )}
            </div>

            {/* 검증 경고 및 제안 */}
            {showValidation && titleValidation && !titleValidation.isValid && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-yellow-800 mb-1">입력 확인</p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {titleValidation.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 자동 수정 제안 */}
                {titleValidation.suggestions && titleValidation.suggestions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-yellow-200">
                    <button
                      type="button"
                      onClick={handleAutoFix}
                      className="w-full px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} />
                      자동 수정: "{titleValidation.suggestions[0]}"
                    </button>
                  </div>
                )}

                {/* 무시하기 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowValidation(false)}
                  className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 font-medium underline"
                >
                  무시하기
                </button>
              </div>
            )}
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[16px]">
            <label className="text-sm font-bold text-gray-700">하루종일</label>
            <button
              type="button"
              onClick={() => setIsAllDay(!isAllDay)}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                isAllDay ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  isAllDay ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Start Date & Time */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-500">시작</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                className="w-full p-4 bg-white border border-gray-200 rounded-[16px]"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
              {!isAllDay && (
                <input
                  type="time"
                  className="w-full p-4 bg-white border border-gray-200 rounded-[16px]"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              )}
            </div>
          </div>

          {/* End Date & Time */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-500">종료</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                className="w-full p-4 bg-white border border-gray-200 rounded-[16px]"
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                required
              />
              {!isAllDay && (
                <input
                  type="time"
                  className="w-full p-4 bg-white border border-gray-200 rounded-[16px]"
                  value={formData.endTime}
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                />
              )}
            </div>
          </div>

          {/* Participants (스님이 절 행사 등록할 때만) */}
          {isMonk && formData.type === 'temple' && (
            <div className="flex flex-col gap-3 p-4 bg-blue-50 rounded-[16px] border border-blue-200">
              <label className="text-sm font-bold text-blue-900">참석 인원</label>

              {/* 누구나 체크박스 */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUnlimited}
                  onChange={e => {
                    setIsUnlimited(e.target.checked);
                    if (e.target.checked) setFormData({...formData, maxParticipants: 0});
                  }}
                  className="w-5 h-5 rounded border-2 border-blue-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-blue-900">누구나 참석 가능 (무제한)</span>
              </label>

              {/* 인원 제한 입력 */}
              {!isUnlimited && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-blue-700">최대</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={formData.maxParticipants || ''}
                    onChange={e => setFormData({...formData, maxParticipants: parseInt(e.target.value) || 0})}
                    className="flex-1 p-3 bg-white border-2 border-blue-200 rounded-lg text-lg font-bold text-center focus:outline-none focus:border-primary"
                    placeholder="0"
                  />
                  <span className="text-sm text-blue-700">명</span>
                </div>
              )}
            </div>
          )}

          {/* Invitation (개인 일정만) */}
          {formData.type === 'personal' && (
            <div className="flex flex-col gap-3 p-4 bg-green-50 rounded-[16px] border border-green-200">
              <label className="text-sm font-bold text-green-900">초대하기 (선택사항)</label>
              <p className="text-xs text-green-700">이름 또는 법명으로 검색하세요</p>

              <div className="relative">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={inviteInput}
                      onChange={e => handleSearchUsers(e.target.value)}
                      onFocus={() => inviteInput && setShowUserDropdown(filteredUsers.length > 0)}
                      placeholder="이름, 법명 검색..."
                      className="w-full pl-10 pr-3 py-3 bg-white border-2 border-green-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Search Results Dropdown */}
                {showUserDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-green-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.map((user, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0"
                      >
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {user.name?.[0] || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-dark">{user.name}</p>
                          {user.dharmaName && (
                            <p className="text-xs text-gray-500">{user.dharmaName}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {formData.invitedEmails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.invitedEmails.map((email, idx) => {
                    const user = allUsers.find(u => u.email === email);
                    const displayName = user ? (user.dharmaName || user.name) : email;
                    return (
                      <div key={idx} className="bg-white px-3 py-1.5 rounded-full text-sm font-medium text-green-700 flex items-center gap-2 border border-green-300">
                        <span>{displayName}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, invitedEmails: formData.invitedEmails.filter((_, i) => i !== idx)})}
                          className="text-green-500 hover:text-red-500 font-bold text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isResting}
            className="mt-8 w-full bg-primary hover:bg-[#5E947A] text-white font-bold text-xl py-5 rounded-[20px] shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            저장하기
          </button>
        </form>
      </div>

      {/* 휴식 오버레이 */}
      {isResting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md animate-fade-in">
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
              <Flower2 size={40} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-serif font-bold text-dark mb-2">
                {appConfig?.loadingMessage || '1초의 휴식...'}
              </h3>
              <p className="text-gray-500 text-sm">잠시 숨을 고르세요</p>
            </div>
          </div>
        </div>
      )}

      {/* Drive File Picker Modal */}
      {showDrivePicker && (
        <DriveFilePicker
          folderId={MONK_DRIVE_FOLDER_ID}
          onSelect={handleSelectDriveFile}
          onClose={() => setShowDrivePicker(false)}
        />
      )}
    </>
  );
};

export default AddView;
