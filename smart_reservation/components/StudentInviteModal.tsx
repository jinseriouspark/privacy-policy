import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus, Info, Package } from 'lucide-react';
import { getClassPackages, addPendingStudent } from '../lib/supabase/database';
import { ClassPackage } from '../types';

interface StudentInviteModalProps {
  instructorId: string;
  coachingId: string;
  coachingSlug: string;
  studioSlug?: string;
  onClose: () => void;
  onSuccess: (invitedEmail?: string) => void;
}

export const StudentInviteModal: React.FC<StudentInviteModalProps> = ({
  instructorId,
  coachingId,
  onClose,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          ) : (
            /* Input Form */
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-700">
                    <p className="font-semibold mb-1">직접 추가 방식</p>
                    <p className="text-slate-600">
                      • 학생 정보를 입력하면 즉시 목록에 추가됩니다<br />
                      • 학생이 해당 이메일로 로그인하면 자동으로 연결됩니다<br />
                      • 수강권을 미리 할당하고 예약을 대신 잡아줄 수 있습니다
                    </p>
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
                              {pkg.credits}회 · {pkg.validDays}일
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
                  onClick={handleDirectAdd}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      처리 중...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      학생 추가
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
