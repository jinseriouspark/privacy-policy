import React, { useState, useEffect } from 'react';
import { getStudentMemos, updateStudentMemo, deleteStudentMemo, getInstructorStudents, createStudentMemo } from '../lib/supabase/database';
import { Search, Calendar, Tag, FileText, Loader2, Filter, X, Edit2, Trash2, Check, XCircle, Settings as SettingsIcon, Plus } from 'lucide-react';
import { formatDateForCSV } from '../utils/csv';
import GoogleIntegrationSettings from './GoogleIntegrationSettings';
import NotionIntegrationSettings from './NotionIntegrationSettings';

interface ConsultationHistoryProps {
  instructorId: string;
}

interface StudentMemo {
  id: string;
  instructor_id: number;
  student_id: string;
  student_name: string;
  content: string;
  tags: string[];
  date: string;
  created_at: string;
  updated_at: string;
}

const ConsultationHistory: React.FC<ConsultationHistoryProps> = ({ instructorId }) => {
  const [memos, setMemos] = useState<StudentMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Edit state
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editDate, setEditDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Integration settings state
  const [showIntegrationSettings, setShowIntegrationSettings] = useState(false);

  // New memo modal state
  const [showNewMemoModal, setShowNewMemoModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [newMemoStudentId, setNewMemoStudentId] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  const [newMemoTags, setNewMemoTags] = useState<string[]>([]);
  const [newMemoDate, setNewMemoDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMemoTagInput, setNewMemoTagInput] = useState('');

  useEffect(() => {
    loadMemos();
    loadStudents();
  }, [instructorId]);

  const loadStudents = async () => {
    try {
      const data = await getInstructorStudents(instructorId);
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const loadMemos = async () => {
    setLoading(true);
    try {
      const data = await getStudentMemos(parseInt(instructorId));
      setMemos(data as any);
    } catch (error) {
      console.error('Failed to load memos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags from memos
  const allTags = Array.from(
    new Set(memos.flatMap(memo => memo.tags || []))
  ).sort();

  // Filter memos
  const filteredMemos = memos.filter(memo => {
    // Search filter
    const searchMatch =
      memo.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.student_id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    // Tag filter
    if (selectedTags.length > 0) {
      const hasSelectedTag = selectedTags.some(tag => memo.tags?.includes(tag));
      if (!hasSelectedTag) return false;
    }

    // Date filter
    const memoDate = new Date(memo.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        return memo.date === todayStr;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return memoDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return memoDate >= monthAgo;
      default:
        return true;
    }
  });

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleStartEdit = (memo: StudentMemo) => {
    setEditingMemoId(memo.id || null);
    setEditContent(memo.content);
    setEditTags(memo.tags || []);
    setEditDate(memo.date);
  };

  const handleCancelEdit = () => {
    setEditingMemoId(null);
    setEditContent('');
    setEditTags([]);
    setEditDate('');
  };

  const handleSaveEdit = async () => {
    if (!editingMemoId || !editContent.trim()) return;

    setSaving(true);
    try {
      const result = await updateStudentMemo(editingMemoId, {
        content: editContent.trim(),
        tags: editTags,
        date: editDate,
      });

      if (result.success) {
        // Reload memos
        await loadMemos();
        handleCancelEdit();
      } else {
        alert(`수정 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to save memo:', error);
      alert('메모 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (memoId: string, studentName: string) => {
    if (!confirm(`${studentName}님의 메모를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const result = await deleteStudentMemo(memoId);

      if (result.success) {
        // Reload memos
        await loadMemos();
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to delete memo:', error);
      alert('메모 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleEditTag = (tag: string) => {
    if (editTags.includes(tag)) {
      setEditTags(editTags.filter(t => t !== tag));
    } else {
      setEditTags([...editTags, tag]);
    }
  };

  const handleAddNewMemoTag = () => {
    if (newMemoTagInput.trim() && !newMemoTags.includes(newMemoTagInput.trim())) {
      setNewMemoTags([...newMemoTags, newMemoTagInput.trim()]);
      setNewMemoTagInput('');
    }
  };

  const handleRemoveNewMemoTag = (tag: string) => {
    setNewMemoTags(newMemoTags.filter(t => t !== tag));
  };

  const handleCreateMemo = async () => {
    if (!newMemoStudentId || !newMemoContent.trim()) {
      alert('학생과 메모 내용을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const selectedStudent = students.find(s => s.id === newMemoStudentId);
      await createStudentMemo({
        instructorId: parseInt(instructorId),
        studentId: newMemoStudentId,
        studentName: selectedStudent?.name || '',
        content: newMemoContent,
        tags: newMemoTags,
        date: newMemoDate
      });

      // Reset and close
      setShowNewMemoModal(false);
      setNewMemoStudentId('');
      setNewMemoContent('');
      setNewMemoTags([]);
      setNewMemoDate(new Date().toISOString().split('T')[0]);
      setNewMemoTagInput('');

      // Reload memos
      await loadMemos();
    } catch (error) {
      console.error('Failed to create memo:', error);
      alert('메모 생성 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500 mb-3" />
        <p className="text-slate-500 text-sm">상담 기록 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center mb-2">
            <FileText size={24} className="mr-2 text-orange-600" />
            상담 기록
          </h2>
          <p className="text-sm text-slate-500">학생들과의 상담 내용을 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewMemoModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all"
          >
            <Plus size={18} />
            새 기록 추가
          </button>
          <button
            onClick={() => setShowIntegrationSettings(!showIntegrationSettings)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              showIntegrationSettings
                ? 'bg-orange-500 text-white'
                : 'bg-white border-2 border-orange-200 text-orange-700 hover:bg-orange-50'
            }`}
          >
            <SettingsIcon size={18} />
            {showIntegrationSettings ? '설정 닫기' : '연동 설정'}
          </button>
        </div>
      </div>

      {/* Integration Settings Panel */}
      {showIntegrationSettings && (
        <div className="bg-white rounded-xl border-2 border-orange-200 p-6 space-y-8">
          <NotionIntegrationSettings userId={instructorId} />

          <div className="border-t border-slate-200 pt-8">
            <GoogleIntegrationSettings userId={instructorId} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="학생 이름, 메모 내용 검색..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        {/* Date Filter */}
        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setDateFilter('all')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              dateFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              dateFilter === 'today'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              dateFilter === 'week'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            최근 7일
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              dateFilter === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            최근 30일
          </button>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">태그 필터</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                >
                  <X size={14} className="inline mr-1" />
                  필터 해제
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
          <p className="text-xs font-medium text-orange-700 opacity-80">전체 메모</p>
          <p className="text-2xl font-bold text-orange-900">{memos.length}</p>
        </div>
        <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-3">
          <p className="text-xs font-medium text-orange-700 opacity-80">필터링된 메모</p>
          <p className="text-2xl font-bold text-orange-900">{filteredMemos.length}</p>
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
          <p className="text-xs font-medium text-orange-700 opacity-80">학생 수</p>
          <p className="text-2xl font-bold text-orange-900">
            {new Set(memos.map(m => m.student_id)).size}
          </p>
        </div>
      </div>

      {/* Memo List */}
      {filteredMemos.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium mb-2">상담 메모가 없습니다</p>
          <p className="text-sm text-slate-400">
            {searchTerm || selectedTags.length > 0 || dateFilter !== 'all'
              ? '필터 조건에 맞는 메모가 없습니다'
              : '학생과 상담 후 메모를 작성해보세요'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemos.map((memo) => (
            <div
              key={memo.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-700 font-bold text-sm">
                      {memo.student_name[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{memo.student_name}</h3>
                    <p className="text-xs text-slate-500">{memo.student_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Calendar size={14} />
                      <span>{formatDateForCSV(memo.date)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      작성: {new Date(memo.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  {editingMemoId !== memo.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(memo)}
                        className="p-2 text-orange-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(memo.id, memo.student_name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editingMemoId === memo.id ? (
                // Edit Mode
                <>
                  {/* Edit Date */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
                    />
                  </div>

                  {/* Edit Content */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      메모 내용
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                      placeholder="메모 내용을 입력하세요..."
                    />
                  </div>

                  {/* Edit Tags */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      태그 선택
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleToggleEditTag(tag)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            editTags.includes(tag)
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      취소
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving || !editContent.trim()}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          저장
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  {/* Content */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-3">
                    <p className="text-slate-800 whitespace-pre-wrap">{memo.content}</p>
                  </div>

                  {/* Tags */}
                  {memo.tags && memo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {memo.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Memo Modal */}
      {showNewMemoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">새 상담 기록 추가</h3>
              <button
                onClick={() => setShowNewMemoModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  학생 선택 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newMemoStudentId}
                  onChange={(e) => setNewMemoStudentId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
                >
                  <option value="">학생을 선택하세요</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  상담 날짜
                </label>
                <input
                  type="date"
                  value={newMemoDate}
                  onChange={(e) => setNewMemoDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  상담 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newMemoContent}
                  onChange={(e) => setNewMemoContent(e.target.value)}
                  placeholder="상담 내용을 입력하세요..."
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  태그
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newMemoTagInput}
                    onChange={(e) => setNewMemoTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNewMemoTag()}
                    placeholder="태그 입력 후 Enter"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                  <button
                    onClick={handleAddNewMemoTag}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    추가
                  </button>
                </div>
                {newMemoTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newMemoTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveNewMemoTag(tag)}
                          className="hover:bg-orange-200 rounded-full p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewMemoModal(false)}
                disabled={saving}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateMemo}
                disabled={saving || !newMemoStudentId || !newMemoContent.trim()}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationHistory;
