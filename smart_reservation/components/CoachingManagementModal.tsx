import React, { useState, useEffect } from 'react';
import { X, Plus, FolderOpen, Trash2 } from 'lucide-react';
import { Coaching, ClassType } from '../types';
import {
  getInstructorCoachings,
  createCoaching,
  updateCoaching,
  deleteCoaching
} from '../lib/supabase/database';

interface CoachingManagementModalProps {
  instructorId: string;
  currentCoaching: Coaching | null;
  onClose: () => void;
  onSelectCoaching: (coaching: Coaching) => void;
}

export const CoachingManagementModal: React.FC<CoachingManagementModalProps> = ({
  instructorId,
  currentCoaching,
  onClose,
  onSelectCoaching
}) => {
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCoachingTitle, setNewCoachingTitle] = useState('');
  const [newCoachingType, setNewCoachingType] = useState<ClassType>(ClassType.PRIVATE);
  const [newCoachingDesc, setNewCoachingDesc] = useState('');

  useEffect(() => {
    loadCoachings();
  }, [instructorId]);

  const loadCoachings = async () => {
    try {
      const data = await getInstructorCoachings(instructorId);
      setCoachings(data);
    } catch (e) {
      console.error('Failed to load coachings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoaching = async () => {
    if (!newCoachingTitle.trim()) return;

    try {
      const newCoaching = await createCoaching({
        instructor_id: instructorId,
        title: newCoachingTitle,
        description: newCoachingDesc,
        type: newCoachingType,
        duration: 60, // Default 60 minutes
        price: 0,
        is_active: true
      });
      setCoachings([newCoaching, ...coachings]);
      setNewCoachingTitle('');
      setNewCoachingDesc('');
      setNewCoachingType(ClassType.PRIVATE);
      setCreating(false);

      // 첫 코칭이면 자동 선택
      if (coachings.length === 0) {
        onSelectCoaching(newCoaching);
        onClose();
      }
    } catch (e: any) {
      alert(e.message || '코칭 생성 실패');
    }
  };

  const handleDeleteCoaching = async (coachingId: string) => {
    if (!confirm('정말 이 코칭을 삭제하시겠습니까? 코칭의 모든 데이터가 삭제됩니다.')) return;

    try {
      await deleteCoaching(coachingId);
      setCoachings(coachings.filter(c => c.id !== coachingId));

      // 현재 선택된 코칭을 삭제한 경우
      if (currentCoaching?.id === coachingId && coachings.length > 1) {
        const nextCoaching = coachings.find(c => c.id !== coachingId);
        if (nextCoaching) onSelectCoaching(nextCoaching);
      }
    } catch (e: any) {
      alert(e.message || '코칭 삭제 실패');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-slate-200">
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
              <FolderOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">코칭 관리</h2>
              <p className="text-sm text-orange-100 mt-1">여러 코칭을 운영하고 전환하세요</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Create New Coaching */}
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="w-full py-3 mb-4 border-2 border-dashed border-orange-300 hover:border-orange-500 rounded-xl text-orange-600 hover:text-orange-700 font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              새 코칭 만들기
            </button>
          ) : (
            <div className="mb-4 p-4 border-2 border-orange-300 rounded-xl bg-orange-50">
              <h3 className="font-bold text-slate-900 mb-3">새 코칭</h3>
              <input
                type="text"
                value={newCoachingTitle}
                onChange={(e) => setNewCoachingTitle(e.target.value)}
                placeholder="Class ID (예: pilates-private, yoga-group)"
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none mb-2"
              />
              <select
                value={newCoachingType}
                onChange={(e) => setNewCoachingType(e.target.value as ClassType)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none mb-2"
              >
                <option value={ClassType.PRIVATE}>개인 레슨 (1:1)</option>
                <option value={ClassType.GROUP}>그룹 수업</option>
              </select>
              <textarea
                value={newCoachingDesc}
                onChange={(e) => setNewCoachingDesc(e.target.value)}
                placeholder="코칭 설명 (선택사항)"
                rows={2}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateCoaching}
                  disabled={!newCoachingTitle.trim()}
                  className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  생성
                </button>
                <button
                  onClick={() => {
                    setCreating(false);
                    setNewCoachingTitle('');
                    setNewCoachingDesc('');
                    setNewCoachingType(ClassType.PRIVATE);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* Coaching List */}
          <div className="space-y-3">
            {coachings.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">아직 코칭이 없습니다</p>
                <p className="text-xs mt-1">새 코칭을 만들어보세요</p>
              </div>
            ) : (
              coachings.map(coaching => (
                <div
                  key={coaching.id}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    currentCoaching?.id === coaching.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  onClick={() => {
                    onSelectCoaching(coaching);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{coaching.title}</h3>
                        {currentCoaching?.id === coaching.id && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-bold">
                            사용중
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          coaching.type === ClassType.GROUP
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {coaching.type === ClassType.GROUP ? '그룹' : '개인'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        /{coaching.slug}
                      </p>
                      {coaching.description && (
                        <p className="text-sm text-slate-600 mt-2">{coaching.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCoaching(coaching.id);
                      }}
                      className="ml-2 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="코칭 삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
