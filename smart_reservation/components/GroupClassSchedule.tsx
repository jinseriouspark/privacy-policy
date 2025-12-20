import React, { useState, useEffect } from 'react';
import { ClassSession, ClassType } from '../types';
import { postToGAS } from '../services/api';
import { Calendar as CalendarIcon, Plus, Edit2, Trash2, Users, Clock, Loader2, X, Save } from 'lucide-react';

interface GroupClassScheduleProps {
  instructorEmail: string;
  instructorId?: string;
}

const GroupClassSchedule: React.FC<GroupClassScheduleProps> = ({ instructorEmail, instructorId }) => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ClassSession>>({
    date: '',
    time: '',
    type: ClassType.GROUP,
    maxCapacity: 6,
    title: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const result = await postToGAS<ClassSession[]>({
        action: 'getGroupSessions',
        instructorEmail,
        instructorId
      });
      setSessions(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      date: today,
      time: '10:00',
      type: ClassType.GROUP,
      maxCapacity: 6,
      title: '',
      status: 'scheduled',
      currentCount: 0
    });
  };

  const handleEdit = (session: ClassSession) => {
    setEditingId(session.id);
    setFormData(session);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      const result = await postToGAS<ClassSession>({
        action: editingId ? 'updateGroupSession' : 'createGroupSession',
        instructorEmail,
        instructorId,
        sessionId: editingId,
        sessionData: formData
      });

      if (editingId) {
        setSessions(sessions.map(s => s.id === editingId ? result : s));
      } else {
        setSessions([...sessions, result]);
      }

      setEditingId(null);
      setIsCreating(false);
      setFormData({});
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 예약된 회원이 있다면 알림이 발송됩니다.')) return;

    try {
      await postToGAS({
        action: 'deleteGroupSession',
        instructorEmail,
        instructorId,
        sessionId: id
      });
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err: any) {
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
          {editingId ? '수업 수정' : '새 그룹 수업 추가'}
        </h3>
        <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">수업명 *</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="예: 오전 필라테스 그룹 수업"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">날짜 *</label>
          <input
            type="date"
            value={formData.date || ''}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">시간 *</label>
          <input
            type="time"
            value={formData.time || ''}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">정원 *</label>
          <input
            type="number"
            value={formData.maxCapacity || 6}
            onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
            min="1"
            max="20"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">상태 *</label>
          <select
            value={formData.status || 'scheduled'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
          >
            <option value="scheduled">예정</option>
            <option value="cancelled">취소</option>
            <option value="completed">완료</option>
          </select>
        </div>
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

  const renderSessionCard = (session: ClassSession) => {
    const isFull = session.currentCount >= session.maxCapacity;
    const isPast = new Date(`${session.date}T${session.time}`) < new Date();

    return (
      <div
        key={session.id}
        className={`bg-white rounded-xl border-2 p-5 transition-all ${
          session.status === 'cancelled'
            ? 'border-red-200 bg-red-50 opacity-60'
            : isFull
            ? 'border-orange-200 bg-orange-50'
            : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 mb-2">{session.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center">
                <CalendarIcon size={14} className="mr-1" />
                {session.date}
              </div>
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                {session.time}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(session)}
              className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(session.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isFull ? 'bg-orange-100' : 'bg-orange-100'
            }`}>
              <Users size={18} className={isFull ? 'text-orange-600' : 'text-orange-500'} />
            </div>
            <div>
              <p className="text-xs text-slate-500">예약 현황</p>
              <p className="font-bold text-slate-900">
                {session.currentCount} / {session.maxCapacity}명
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {session.status === 'cancelled' && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                취소됨
              </span>
            )}
            {session.status === 'completed' && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                완료
              </span>
            )}
            {session.status === 'scheduled' && isFull && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                마감
              </span>
            )}
            {session.status === 'scheduled' && !isFull && !isPast && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                예약 가능
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500 mb-3" />
        <p className="text-slate-500 text-sm">수업 목록 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <CalendarIcon size={24} className="mr-2 text-orange-500" />
            그룹 수업 스케줄
          </h2>
          <p className="text-sm text-slate-500 mt-1">그룹 수업 일정을 관리하세요</p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center shadow-md"
          >
            <Plus size={18} className="mr-2" />
            수업 추가
          </button>
        )}
      </div>

      {(isCreating || editingId) && renderForm()}

      {sessions.length === 0 && !isCreating ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium mb-2">등록된 그룹 수업이 없습니다</p>
          <p className="text-sm text-slate-400 mb-6">첫 그룹 수업을 추가해보세요</p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors inline-flex items-center"
          >
            <Plus size={18} className="mr-2" />
            그룹 수업 추가하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions
            .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
            .map(renderSessionCard)}
        </div>
      )}
    </div>
  );
};

export default GroupClassSchedule;
