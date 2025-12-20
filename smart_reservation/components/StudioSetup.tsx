import React, { useState } from 'react';
import { User, UserType } from '../types';
import { postToGAS } from '../services/api';
import { Building2, Save, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

interface StudioSetupProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const StudioSetup: React.FC<StudioSetupProps> = ({ user, onComplete }) => {
  const [studioName, setStudioName] = useState(user.studioName || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!studioName.trim()) {
      setError('스튜디오 이름을 입력해주세요.');
      return;
    }
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
        action: 'updateStudioProfile',
        email: user.email,
        studioName: studioName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        phone: phone.trim()
      });

      setSuccess(true);
      setTimeout(() => {
        onComplete({
          ...user,
          studioName,
          username,
          bio,
          phone,
          isProfileComplete: true
        });
      }, 1500);
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-lg">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">스튜디오 설정 완료!</h2>
        <p className="text-slate-600 mb-2">{studioName}</p>
        <p className="text-sm text-slate-400">잠시 후 대시보드로 이동합니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-400 text-white mb-3">
          <Building2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">스튜디오 설정</h2>
        <p className="text-sm text-slate-500">
          회원들이 보게 될 스튜디오 정보를 설정하세요
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            스튜디오 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="예: 강남 필라테스 스튜디오"
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            사용자 이름 (URL) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="studio-name"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-mono text-sm"
            />
            <p className="text-xs text-slate-400">
              예약 링크: <span className="font-mono text-slate-600">yoursite.com/?coach={username || 'username'}</span>
            </p>
            <p className="text-xs text-slate-400">
              영문 소문자, 숫자, -, _ 만 사용 가능 (최소 3자)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            연락처
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            스튜디오 소개
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="예: 10년 경력의 전문 필라테스 강사진이 운영하는 프라이빗 스튜디오입니다."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start">
            <span className="flex-1">{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <Loader2 className="animate-spin h-6 w-6" />
          ) : (
            <>
              시작하기
              <ArrowRight size={20} className="ml-2" />
            </>
          )}
        </button>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-slate-400">
          설정은 나중에 대시보드에서 변경할 수 있습니다
        </p>
      </div>
    </div>
  );
};

export default StudioSetup;
