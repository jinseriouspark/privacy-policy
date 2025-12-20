import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Calendar, Package as PackageIcon } from 'lucide-react';
import { createPackage, updatePackage, deletePackage, getCoachings } from '../lib/supabase/database';
import { User } from '../types';

interface UserEditModalProps {
  user: User;
  instructorId: string;
  packages: any[];
  onClose: () => void;
  onSave: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  instructorId,
  packages: initialPackages,
  onClose,
  onSave
}) => {
  const [packages, setPackages] = useState(initialPackages);
  const [coachings, setCoachings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New package form
  const [newPackage, setNewPackage] = useState({
    coaching_id: '',
    name: '',
    total_sessions: 10,
    remaining_sessions: 10,
    start_date: new Date().toISOString().split('T')[0],
    validity_days: 30
  });

  useEffect(() => {
    loadCoachings();
  }, []);

  useEffect(() => {
    setPackages(initialPackages);
  }, [initialPackages]);

  const loadCoachings = async () => {
    try {
      const data = await getCoachings(instructorId);
      setCoachings(data || []);
    } catch (e) {
      console.error('Failed to load coachings:', e);
      setCoachings([]);
    }
  };

  const calculateExpiryDate = (startDate: string, days: number) => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + days);
    return start.toISOString();
  };

  const handleAddPackage = async () => {
    if (!newPackage.coaching_id && !newPackage.name) {
      alert('수강권 이름 또는 코칭을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const selectedCoaching = coachings.find(c => c.id === newPackage.coaching_id);
      const packageName = newPackage.name || selectedCoaching?.title || '수강권';
      const expiresAt = calculateExpiryDate(newPackage.start_date, newPackage.validity_days);

      await createPackage({
        student_id: user.id,
        instructor_id: instructorId,
        coaching_id: newPackage.coaching_id || undefined,
        name: packageName,
        total_sessions: newPackage.total_sessions,
        remaining_sessions: newPackage.remaining_sessions,
        start_date: newPackage.start_date,
        expires_at: expiresAt
      });

      // Reset form
      setNewPackage({
        coaching_id: '',
        name: '',
        total_sessions: 10,
        remaining_sessions: 10,
        start_date: new Date().toISOString().split('T')[0],
        validity_days: 30
      });
      setShowAddForm(false);

      // Reload packages
      onSave();
    } catch (e: any) {
      console.error('Failed to add package:', e);
      alert('수강권 추가 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('이 수강권을 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      await deletePackage(packageId);
      onSave();
    } catch (e: any) {
      alert('삭제 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSessions = async (packageId: string, remaining: number) => {
    setLoading(true);
    try {
      await updatePackage(packageId, { remaining_sessions: remaining });
      onSave();
    } catch (e: any) {
      alert('업데이트 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl backdrop-blur-sm">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-orange-100">{user.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Packages List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <PackageIcon size={20} className="text-orange-500" />
                보유 수강권
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                추가
              </button>
            </div>

            {packages.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                수강권이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const expiresAt = pkg.expires_at ? new Date(pkg.expires_at) : null;
                  const startDate = pkg.start_date ? new Date(pkg.start_date) : null;
                  const isExpired = expiresAt && expiresAt < new Date();

                  return (
                    <div key={pkg.id} className={`p-4 border rounded-xl ${isExpired ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{pkg.name || pkg.coaching?.title || '수강권'}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-slate-500">
                              {pkg.remaining_sessions} / {pkg.total_sessions}회
                            </span>
                            {startDate && (
                              <span className="text-xs text-slate-400">
                                시작: {startDate.toLocaleDateString()}
                              </span>
                            )}
                            {expiresAt && (
                              <span className={`text-xs ${isExpired ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                                만료: {expiresAt.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          disabled={loading}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateSessions(pkg.id, Math.max(0, pkg.remaining_sessions - 1))}
                          disabled={loading || pkg.remaining_sessions <= 0}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm disabled:opacity-50"
                        >
                          -1
                        </button>
                        <div className="flex-1 text-center">
                          <span className="text-sm font-medium text-slate-700">잔여: {pkg.remaining_sessions}회</span>
                        </div>
                        <button
                          onClick={() => handleUpdateSessions(pkg.id, pkg.remaining_sessions + 1)}
                          disabled={loading}
                          className="px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-sm"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Package Form */}
          {showAddForm && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-4">
              <h4 className="font-bold text-slate-900">새 수강권 추가</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">수강권 이름</label>
                  <input
                    type="text"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    placeholder="예: 1:1 프리미엄 10회"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">코칭 선택 (선택사항)</label>
                  <select
                    value={newPackage.coaching_id}
                    onChange={(e) => setNewPackage({ ...newPackage, coaching_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">선택 안함</option>
                    {coachings.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">총 횟수</label>
                    <input
                      type="number"
                      value={newPackage.total_sessions}
                      onChange={(e) => setNewPackage({ ...newPackage, total_sessions: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">잔여 횟수</label>
                    <input
                      type="number"
                      value={newPackage.remaining_sessions}
                      onChange={(e) => setNewPackage({ ...newPackage, remaining_sessions: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">시작일</label>
                    <input
                      type="date"
                      value={newPackage.start_date}
                      onChange={(e) => setNewPackage({ ...newPackage, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">유효기간 (일)</label>
                    <input
                      type="number"
                      value={newPackage.validity_days}
                      onChange={(e) => setNewPackage({ ...newPackage, validity_days: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  만료일: {new Date(calculateExpiryDate(newPackage.start_date, newPackage.validity_days)).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddPackage}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    <Save size={16} className="inline mr-1" />
                    저장
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
