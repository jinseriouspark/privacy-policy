import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, UserPlus, Info, Package, Link as LinkIcon } from 'lucide-react';
import { createInvitation, getClassPackages, addPendingStudent } from '../lib/supabase/database';
import { ClassPackage } from '../types';

interface StudentInviteModalProps {
  instructorId: string;
  coachingId: string;
  coachingSlug: string;
  studioSlug?: string;
  onClose: () => void;
  onSuccess: (invitedEmail?: string) => void;
}

type AddMode = 'direct' | 'link';

export const StudentInviteModal: React.FC<StudentInviteModalProps> = ({
  instructorId,
  coachingId,
  coachingSlug,
  studioSlug,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<AddMode>('link');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [packages, setPackages] = useState<ClassPackage[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPackages();
  }, [instructorId]);

  const loadPackages = async () => {
    try {
      console.log('[StudentInviteModal] Loading packages for instructor:', instructorId);
      const data = await getClassPackages(instructorId);
      console.log('[StudentInviteModal] Loaded packages:', data);
      const activePackages = data.filter(p => p.isActive);
      console.log('[StudentInviteModal] Active packages:', activePackages);
      setPackages(activePackages);
    } catch (error) {
      console.error('[StudentInviteModal] Failed to load packages:', error);
    }
  };

  const handleDirectAdd = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    if (selectedPackageIds.length === 0) {
      setError('최소 1개 이상의 수강권을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await addPendingStudent({
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        instructorId,
        coachingId,
        packageIds: selectedPackageIds,
      });

      console.log('[StudentInviteModal] Student added:', result);
      setSuccess(true);

      // 2초 후 자동 닫기 및 목록 갱신
      setTimeout(() => {
        onSuccess(email);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('[StudentInviteModal] Error adding student:', err);
      setError(err.message || '학생 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteLink = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    if (selectedPackageIds.length === 0) {
      setError('최소 1개 이상의 수강권을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[StudentInviteModal] Creating invitation for:', email);
      const invitation = await createInvitation({
        instructorId,
        coachingId,
        studentEmail: email.trim(),
        packageIds: selectedPackageIds,
      });

      console.log('[StudentInviteModal] Invitation created:', invitation);
      setInvitationCode(invitation.invitation_code);

      // 초대 링크 생성 완료 -> 바로 회원 목록 갱신
      setTimeout(() => {
        onSuccess(email);
      }, 100);
    } catch (err: any) {
      console.error('[StudentInviteModal] Error creating invitation:', err);
      setError(err.message || '초대 링크 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = invitationCode && studioSlug
    ? `${window.location.origin}/invite/${studioSlug}/${coachingSlug}/${invitationCode}`
    : null;

  const handleCopy = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const togglePackage = (packageId: string) => {
    setSelectedPackageIds(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-br bg-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <UserPlus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">학생 추가</h2>
                <p className="text-sm text-orange-100 mt-1">
                  학생을 추가하고 수강권을 할당하세요
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {success ? (
            /* Success State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">학생 추가 완료!</h3>
              <p className="text-slate-600 text-sm">
                {name}님({email})이 학생 목록에 추가되었습니다.
              </p>
              <p className="text-slate-500 text-xs mt-2">
                잠시 후 자동으로 닫힙니다...
              </p>
            </div>
          ) : invitationCode ? (
            /* Invitation Link Generated */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">초대 링크 생성 완료!</h3>
                <p className="text-slate-600 text-sm">
                  {email}님에게 아래 링크를 전달하세요
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">초대 링크</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink || ''}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        copied
                          ? 'bg-orange-500 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check size={18} className="inline mr-1" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy size={18} className="inline mr-1" />
                          복사
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-slate-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-700">
                      <p className="font-semibold mb-1">안내사항</p>
                      <ul className="space-y-1 text-slate-600">
                        <li>• 이 링크는 {email}님만 사용할 수 있습니다</li>
                        <li>• 학생이 링크를 통해 가입하면 자동으로 연결됩니다</li>
                        <li>• 선택한 수강권이 자동으로 할당됩니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setInvitationCode(null);
                    setEmail('');
                    setSelectedPackageIds([]);
                  }}
                  className="flex-1 py-3 border-2 border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  새로 추가
                </button>
                <button
                  onClick={() => {
                    onSuccess(email);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all"
                >
                  완료
                </button>
              </div>
            </div>
          ) : (
            /* Input Form */
            <div className="space-y-6">
              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setMode('direct')}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    mode === 'direct'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus size={18} className="inline mr-2" />
                  직접 추가 (즉시 반영)
                </button>
                <button
                  onClick={() => setMode('link')}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    mode === 'link'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon size={18} className="inline mr-2" />
                  초대 링크
                </button>
              </div>

              {/* Info Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-700">
                    {mode === 'direct' ? (
                      <>
                        <p className="font-semibold mb-1">직접 추가 방식</p>
                        <p className="text-slate-600">
                          • 학생 정보를 입력하면 즉시 목록에 추가됩니다<br />
                          • 학생이 해당 이메일로 로그인하면 자동으로 연결됩니다<br />
                          • 수강권을 미리 할당하고 예약을 대신 잡아줄 수 있습니다
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold mb-1">초대 링크 방식</p>
                        <p className="text-slate-600">
                          • 학생에게 링크를 전달하면 직접 가입합니다<br />
                          • 학생이 가입 완료 후 목록에 추가됩니다<br />
                          • 더 안전하지만 즉시 반영되지 않습니다
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {mode === 'direct' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="홍길동"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        전화번호 (선택)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-1234-5678"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </>
                )}

                {/* Package Selection */}
                {packages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      수강권 할당 (필수)
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {packages.map((pkg) => (
                        <label
                          key={pkg.id}
                          className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-orange-300 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPackageIds.includes(pkg.id)}
                            onChange={() => togglePackage(pkg.id)}
                            className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{pkg.name}</p>
                            <p className="text-xs text-slate-500">
                              {pkg.total_sessions}회 · {pkg.validity_days}일
                            </p>
                          </div>
                          <Package size={18} className="text-orange-500" />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border-2 border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={mode === 'direct' ? handleDirectAdd : handleInviteLink}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      처리 중...
                    </>
                  ) : mode === 'direct' ? (
                    <>
                      <UserPlus size={18} />
                      학생 추가
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      초대 링크 생성
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
