import React, { useState } from 'react';
import { User, UserType } from '../types';
import { updateUser } from '../lib/supabase/database';
import { ArrowLeft, Settings, Save, Copy, Share2, Loader2, CheckCircle2, User as UserIcon, Mail } from 'lucide-react';

interface InstructorProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onBack: () => void;
  onLogout: () => void;
}

const InstructorProfile: React.FC<InstructorProfileProps> = ({ user, onUpdate, onBack, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?coach=${user.email}`
    : '';

  const handleSave = async () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateUser(user.id!, {
        name: name.trim(),
        bio: bio.trim()
      });

      setSuccess(true);
      setTimeout(() => {
        onUpdate({ ...user, name: name.trim(), bio: bio.trim() });
        setSuccess(false);
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">저장 완료</h2>
          <p className="text-slate-500 text-sm">프로필이 업데이트되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Settings size={20} className="text-orange-500" />
              프로필 설정
            </h1>
            <p className="text-sm text-slate-500">강사 정보를 관리합니다</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8">
            <div className="flex items-center gap-4">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <UserIcon size={40} className="text-orange-500" />
                </div>
              )}
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-2 mt-1 opacity-90">
                  <Mail size={14} />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                소개
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="예: 10년 경력의 커리어 코치입니다."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none"
              />
            </div>

            {/* Share Link Section */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Share2 size={18} className="text-orange-600" />
                예약 링크
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                학생들에게 이 링크를 공유하세요
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border-2 border-orange-200 rounded-lg px-4 py-3 font-mono text-sm text-slate-700 truncate">
                  {shareUrl}
                </div>
                <button
                  onClick={() => copyLink(shareUrl)}
                  className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold"
                >
                  <Copy size={16} />
                  복사
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border-2 border-red-200 font-medium">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onBack}
                disabled={loading}
                className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <Save size={18} />
                    저장
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onLogout}
            className="text-slate-500 hover:text-slate-700 text-sm font-medium underline"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfile;
