import React, { useState } from 'react';
import { User, UserType } from '../types';
import { postToGAS } from '../services/api';
import { Settings, Save, Copy, Share2, Loader2, CheckCircle2, User as UserIcon, Mail, Trash2, AlertTriangle } from 'lucide-react';

interface InstructorProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onBack: () => void;
  onLogout: () => void;
}

const InstructorProfile: React.FC<InstructorProfileProps> = ({ user, onUpdate, onBack, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const shareUrl = typeof window !== 'undefined' && username
    ? `${window.location.origin}${window.location.pathname}?coach=${user.email}`
    : '';

  const publicBookingUrl = typeof window !== 'undefined' && username
    ? `${window.location.origin}/book/${username}`
    : '';

  const handleSave = async () => {
    if (!username.trim()) {
      setError('사용자 이름을 입력해주세요.');
      return;
    }
    if (username.length < 3) {
      setError('사용자 이름은 3자 이상이어야 합니다.');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      setError('사용자 이름은 영문 소문자, 숫자, -, _ 만 사용 가능합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await postToGAS<User>({
        action: 'updateInstructorProfile',
        email: user.email,
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim()
      });

      setSuccess(true);
      setTimeout(() => {
        onUpdate({ ...user, name, username, bio });
        onBack();
      }, 1500);
    } catch (err: any) {
      setError(err.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      alert('링크가 복사되었습니다!');
    });
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setError(null);

    try {
      await postToGAS({
        action: 'deleteAccount',
        email: user.email
      });

      alert('계정이 삭제되었습니다.');
      onLogout();
    } catch (err: any) {
      setError(err.message || '계정 삭제에 실패했습니다.');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">저장 완료</h2>
        <p className="text-slate-500 text-sm">프로필이 업데이트되었습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Settings size={20} className="mr-2 text-orange-500" />
            프로필 설정
          </h2>
          <p className="text-sm text-slate-500 mt-1">강사 정보를 관리합니다</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center space-x-3">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
              <UserIcon size={24} />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-900">{user.name}</p>
            <div className="flex items-center text-xs text-slate-500">
              <Mail size={12} className="mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            사용자 이름 (URL) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="username"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-mono text-sm"
            />
            <p className="text-xs text-slate-400">
              영문 소문자, 숫자, -, _ 만 사용 가능 (최소 3자)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            소개
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="예: 10년 경력의 커리어 코치입니다."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none"
          />
        </div>

        {username && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center">
              <Share2 size={16} className="mr-2 text-orange-500" />
              예약 링크
            </h3>

            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">현재 링크 (이메일 기반)</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 truncate">
                    {shareUrl}
                  </div>
                  <button
                    onClick={() => copyLink(shareUrl)}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Copy size={14} className="text-slate-600" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">공개 예약 페이지 (향후 지원 예정)</p>
                <div className="flex items-center gap-2 opacity-50">
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 truncate">
                    {publicBookingUrl}
                  </div>
                  <button
                    disabled
                    className="p-2 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                  >
                    <Copy size={14} className="text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <Save size={18} className="mr-2" />
                저장
              </>
            )}
          </button>
        </div>

        {/* 계정 탈퇴 섹션 */}
        <div className="border-t border-slate-200 pt-6 mt-6">
          <h3 className="text-sm font-bold text-slate-700 mb-2">위험 구역</h3>
          <p className="text-xs text-slate-500 mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-200 flex items-center justify-center"
          >
            <Trash2 size={18} className="mr-2" />
            계정 탈퇴
          </button>
        </div>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              정말 탈퇴하시겠습니까?
            </h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              모든 예약 데이터, 회원 정보, 통계가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 mb-4">
                {error}
              </div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleteLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  '탈퇴하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorProfile;
