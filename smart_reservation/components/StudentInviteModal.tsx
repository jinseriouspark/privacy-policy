import React, { useState } from 'react';
import { X, Mail, Copy, Check, UserPlus, Info } from 'lucide-react';
import { createInvitation } from '../lib/supabase/database';

interface StudentInviteModalProps {
  instructorId: string;
  coachingId: string;
  coachingSlug: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentInviteModal: React.FC<StudentInviteModalProps> = ({
  instructorId,
  coachingId,
  coachingSlug,
  onClose,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const invitation = await createInvitation(coachingId, email.toLowerCase());
      setInvitationCode(invitation.invitation_code);
    } catch (e: any) {
      console.error(e);
      setError(e.message || '초대 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  const getInviteLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${coachingSlug}?invite=${invitationCode}`;
  };

  const handleCopyLink = () => {
    const link = getInviteLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">학생 초대하기</h2>
              <p className="text-sm text-orange-100 mt-1">이메일로 초대 링크를 생성하세요</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {!invitationCode ? (
            <>
              {/* 설명 섹션 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 space-y-2">
                    <p className="font-bold">초대 방법:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800">
                      <li>학생의 이메일 주소를 입력하세요</li>
                      <li>생성된 초대 링크를 학생에게 전달하세요</li>
                      <li>학생이 해당 이메일로 로그인하면 자동 연결됩니다</li>
                    </ol>
                    <p className="text-xs text-blue-700 mt-2">
                      💡 초대 링크는 <strong>7일간 유효</strong>합니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 이메일 입력 */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  학생 이메일
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  학생이 로그인할 때 사용할 이메일 주소를 입력하세요
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <button
                onClick={handleInvite}
                disabled={loading || !email}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? '생성 중...' : '초대 링크 생성'}
              </button>
            </>
          ) : (
            <>
              {/* 성공 화면 */}
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">초대 링크 생성 완료!</h3>
                <p className="text-slate-600 text-sm">
                  {email}님에게 아래 링크를 전달하세요
                </p>
              </div>

              {/* 초대 코드 */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 mb-2">초대 코드</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="flex-1 text-2xl font-bold text-orange-600 tracking-wider">
                    {invitationCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* 초대 링크 */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <p className="text-xs font-bold text-orange-700 mb-2">초대 링크 (클릭하여 복사)</p>
                <div
                  onClick={handleCopyLink}
                  className="bg-white p-3 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-700 break-all flex-1">
                      {getInviteLink()}
                    </p>
                    {copied ? (
                      <Check size={20} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <Copy size={20} className="text-orange-500 flex-shrink-0 group-hover:text-orange-600" />
                    )}
                  </div>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 font-medium mt-2 text-center">
                    ✓ 복사되었습니다!
                  </p>
                )}
              </div>

              {/* 사용 방법 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-bold text-slate-900 mb-3">📱 학생에게 전달 방법</p>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-600">1.</span>
                    <p>위의 초대 링크를 카카오톡, 이메일 등으로 전달</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-600">2.</span>
                    <p>학생이 링크를 클릭하고 <strong>{email}</strong>로 로그인</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-600">3.</span>
                    <p>자동으로 회원으로 등록되고 예약 가능!</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEmail('');
                    setInvitationCode(null);
                    setError(null);
                  }}
                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  다른 학생 초대
                </button>
                <button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all"
                >
                  완료
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
