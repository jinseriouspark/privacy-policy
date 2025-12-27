import React, { useState } from 'react';
import { User, UserType } from '../types';
import { UserCircle, Briefcase, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { upsertUser } from '../lib/supabase/database';
import { getCurrentUser } from '../lib/supabase/auth';

interface SignupProps {
  googleUser: {
    email: string;
    name: string;
    picture?: string;
  };
  onComplete: (user: User) => void;
  onBack: () => void;
}

const Signup: React.FC<SignupProps> = ({ googleUser, onComplete, onBack }) => {
  const [step, setStep] = useState<'type' | 'profile'>('type');
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [shortId, setShortId] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeSelect = (type: UserType) => {
    setSelectedType(type);
    if (type === UserType.STUDENT) {
      // 학생은 바로 완료
      handleComplete(type, '', '');
    } else {
      // 강사는 프로필 입력 단계로
      setStep('profile');
    }
  };

  const handleComplete = async (type: UserType, shortId: string, bio: string) => {
    setLoading(true);
    setError(null);

    try {
      // Supabase에 사용자 정보 저장
      const user = await upsertUser({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        userType: type,
        short_id: type === UserType.INSTRUCTOR ? shortId : undefined,
        bio: type === UserType.INSTRUCTOR ? bio : undefined,
      });

      // 성공 후 로그인 처리
      onComplete({
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        userType: user.user_type,
        short_id: user.short_id,
        bio: user.bio,
        isProfileComplete: true
      } as User);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = () => {
    if (!shortId.trim()) {
      setError('사용자 ID를 입력해주세요.');
      return;
    }
    if (shortId.length < 3) {
      setError('사용자 ID는 3자 이상이어야 합니다.');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(shortId)) {
      setError('사용자 ID는 영문 소문자, 숫자, -, _만 사용 가능합니다.');
      return;
    }

    handleComplete(UserType.INSTRUCTOR, shortId, bio);
  };

  if (step === 'type') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-500 mb-2">
            <UserCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">계정 유형 선택</h2>
          <p className="text-sm text-slate-500">어떤 용도로 사용하시나요?</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleTypeSelect(UserType.INSTRUCTOR)}
            disabled={loading}
            className="w-full p-6 rounded-2xl border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-orange-200 transition-colors">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">강사 / 코치</h3>
                  <p className="text-sm text-slate-500">
                    수강생을 관리하고 예약을 받습니다.<br/>
                    Calendly 스타일 예약 링크를 생성할 수 있습니다.
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleTypeSelect(UserType.STUDENT)}
            disabled={loading}
            className="w-full p-6 rounded-2xl border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-orange-200 transition-colors">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">수강생</h3>
                  <p className="text-sm text-slate-500">
                    강사의 예약 링크를 통해<br/>
                    코칭 세션을 예약합니다.
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
            </div>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin h-6 w-6 text-orange-500" />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full py-2 text-slate-400 text-sm hover:text-slate-600 transition-colors"
        >
          ← 로그인으로 돌아가기
        </button>
      </div>
    );
  }

  // Profile setup for instructors
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-500 mb-2">
          <Briefcase size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">강사 프로필 설정</h2>
        <p className="text-sm text-slate-500">예약 링크에 사용될 정보를 입력하세요</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            사용자 이름 (URL) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-1">
            <input
              type="text"
              value={shortId}
              onChange={(e) => setShortId(e.target.value.toLowerCase())}
              placeholder="short-id"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            />
            <p className="text-xs text-slate-400">
              예약 링크: <span className="font-mono text-slate-600">yoursite.com/{shortId || 'your-id'}</span>
            </p>
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

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleProfileSubmit}
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center"
        >
          {loading ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            <>완료</>
          )}
        </button>

        <button
          onClick={() => setStep('type')}
          disabled={loading}
          className="w-full py-2 text-slate-400 text-sm hover:text-slate-600 transition-colors"
        >
          ← 이전 단계
        </button>
      </div>
    </div>
  );
};

export default Signup;
