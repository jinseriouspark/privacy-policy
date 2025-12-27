import React, { useState, useEffect } from 'react';
import { X, Plus, FolderOpen, Trash2, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';
import { Coaching, ClassType } from '../types';
import {
  getInstructorCoachings,
  createCoaching,
  updateCoaching,
  deleteCoaching,
  getInstructorSettings
} from '../lib/supabase/database';
import { InstructorSetupModal } from './InstructorSetupModal';

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
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedCoachingForSetup, setSelectedCoachingForSetup] = useState<Coaching | null>(null);

  useEffect(() => {
    loadCoachings();
    checkCalendarStatus();
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

  const checkCalendarStatus = async () => {
    try {
      // CHANGED: Check if ALL coachings have google_calendar_id (not instructor settings)
      const data = await getInstructorCoachings(instructorId);
      // At least one coaching should have calendar for overall status
      const anyHasCalendar = data.some(c => c.google_calendar_id);
      setCalendarConnected(anyHasCalendar);
    } catch (e) {
      console.error('Failed to check calendar status:', e);
    }
  };

  const handleCreateCoaching = async () => {
    if (!newCoachingTitle.trim()) return;

    try {
      const newCoaching = await createCoaching({
        instructor_id: instructorId,
        title: newCoachingTitle,
        description: newCoachingDesc,
        type: 'private', // Always private by default
        duration: 60, // Default 60 minutes
        price: 0,
        is_active: true
      });
      setCoachings([newCoaching, ...coachings]);
      setNewCoachingTitle('');
      setNewCoachingDesc('');
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
    <>
      {showSetupModal && selectedCoachingForSetup && (
        <InstructorSetupModal
          adminEmail=""
          instructorId={instructorId}
          coachingId={selectedCoachingForSetup.id}
          defaultCalendarName={selectedCoachingForSetup.title}
          onClose={() => {
            setShowSetupModal(false);
            setSelectedCoachingForSetup(null);
            loadCoachings(); // Reload to show updated calendar status
            checkCalendarStatus();
          }}
        />
      )}

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
          {/* Info Banner: Show only if NO coachings have calendar yet */}
          {!calendarConnected && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-900 mb-1">캘린더 연동이 필요합니다</p>
                  <p className="text-xs text-slate-600">예약을 받으려면 Google 캘린더를 연동해주세요. 각 코칭마다 별도 캘린더를 생성할 수 있습니다.</p>
                </div>
              </div>
            </div>
          )}

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
                  className={`p-4 rounded-xl border-2 transition-all ${
                    currentCoaching?.id === coaching.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        onSelectCoaching(coaching);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {coaching.google_calendar_id && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full font-medium flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            캘린더 연동됨
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        {window.location.origin}/{coaching.slug}
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
    </>
  );
};
