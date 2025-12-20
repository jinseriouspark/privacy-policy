import React, { useState, useEffect } from 'react';
import { ClassPackage, ClassType } from '../types';
import { getClassPackages, createClassPackage, updateClassPackage, deleteClassPackage } from '../lib/supabase/database';
import { Package, Plus, Edit2, Trash2, Save, X, Loader2, DollarSign, Calendar, Users } from 'lucide-react';

interface PackageManagementProps {
  instructorEmail: string;
  instructorId?: string;
}

const PackageManagement: React.FC<PackageManagementProps> = ({ instructorEmail, instructorId }) => {
  const [packages, setPackages] = useState<ClassPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ClassPackage>>({
    name: '',
    type: ClassType.PRIVATE,
    credits: 10,
    validDays: 30,
    price: 0,
    isActive: true
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const result = await getClassPackages(instructorId);
      setPackages(result);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      type: ClassType.PRIVATE,
      credits: 10,
      validDays: 30,
      price: 0,
      isActive: true
    });
  };

  const handleEdit = (pkg: ClassPackage) => {
    setEditingId(pkg.id);
    setFormData(pkg);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !instructorId) {
      alert('수강권 이름과 가격을 입력해주세요.');
      return;
    }

    try {
      let result;
      if (editingId) {
        result = await updateClassPackage(editingId, formData);
        setPackages(packages.map(p => p.id === editingId ? result : p));
      } else {
        result = await createClassPackage(instructorId, formData as any);
        setPackages([...packages, result]);
      }

      setEditingId(null);
      setIsCreating(false);
      setFormData({});
    } catch (err: any) {
      console.error('Failed to save package:', err);
      alert(err.message || '저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteClassPackage(id);
      setPackages(packages.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Failed to delete package:', err);
      alert(err.message || '삭제에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({});
  };

  const renderForm = () => (
    <div className="bg-white border-2 border-orange-200 rounded-xl p-6 space-y-4 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-900">
          {editingId ? '수강권 수정' : '새 수강권 추가'}
        </h3>
        <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">수강권 이름 *</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="예: 개인 레슨 10회권"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">수업 타입 *</label>
          <select
            value={formData.type || ClassType.PRIVATE}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ClassType })}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          >
            <option value={ClassType.PRIVATE}>개인 레슨 (1:1)</option>
            <option value={ClassType.GROUP}>그룹 수업</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">횟수 *</label>
          <input
            type="number"
            value={formData.credits || 0}
            onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
            min="1"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">유효기간 (일) *</label>
          <input
            type="number"
            value={formData.validDays || 0}
            onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) })}
            min="1"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">가격 (원) *</label>
          <input
            type="number"
            value={formData.price || 0}
            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
            min="0"
            step="1000"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400"
        />
        <label htmlFor="isActive" className="text-sm text-slate-700">판매 활성화</label>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          onClick={handleCancel}
          className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center"
        >
          <Save size={18} className="mr-2" />
          저장
        </button>
      </div>
    </div>
  );

  const renderPackageCard = (pkg: ClassPackage) => (
    <div
      key={pkg.id}
      className={`bg-white rounded-xl border-2 p-5 transition-all ${
        pkg.isActive ? 'border-slate-200 hover:border-purple-300 hover:shadow-md' : 'border-slate-100 bg-slate-50 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 mb-1">{pkg.name}</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
              pkg.type === ClassType.PRIVATE
                ? 'bg-orange-100 text-orange-600'
                : 'bg-orange-100 text-orange-600'
            }`}>
              {pkg.type === ClassType.PRIVATE ? '개인 레슨' : '그룹 수업'}
            </span>
            {!pkg.isActive && (
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-200 text-slate-600">
                판매 중지
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(pkg)}
            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(pkg.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <Users size={16} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">횟수</p>
            <p className="font-bold text-slate-900">{pkg.credits}회</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <Calendar size={16} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">유효기간</p>
            <p className="font-bold text-slate-900">{pkg.validDays}일</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
            <DollarSign size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">가격</p>
            <p className="font-bold text-slate-900">{(pkg.price || 0).toLocaleString()}원</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500 mb-3" />
        <p className="text-slate-500 text-sm">수강권 목록 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Package size={24} className="mr-2 text-orange-500" />
            수강권 관리
          </h2>
          <p className="text-sm text-slate-500 mt-1">판매할 수강권을 추가하고 관리하세요</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center shadow-md"
          >
            <Plus size={18} className="mr-2" />
            추가
          </button>
        )}
      </div>

      {(isCreating || editingId) && renderForm()}

      {packages.length === 0 && !isCreating ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium mb-2">등록된 수강권이 없습니다</p>
          <p className="text-sm text-slate-400 mb-6">첫 수강권을 추가해보세요</p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors inline-flex items-center"
          >
            <Plus size={18} className="mr-2" />
            수강권 추가하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map(renderPackageCard)}
        </div>
      )}
    </div>
  );
};

export default PackageManagement;
