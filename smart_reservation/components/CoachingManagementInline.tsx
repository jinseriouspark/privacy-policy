import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Trash2, CheckCircle2, Calendar, AlertCircle, Edit2 } from 'lucide-react';
import { Coaching, ClassType } from '../types';
import {
  getInstructorCoachings,
  createCoaching,
  updateCoaching,
  deleteCoaching,
  getUserById,
} from '../lib/supabase/database';
import { ensureCalendarInList, upgradeCalendarToWriter } from '../lib/google-calendar';
import { InstructorSetupModal } from './InstructorSetupModal';
import { TimeBlockSelector } from './TimeBlockSelector';

interface CoachingManagementInlineProps {
  instructorId: string;
  currentCoaching: Coaching | null;
  onSelectCoaching: (coaching: Coaching) => void;
}

export const CoachingManagementInline: React.FC<CoachingManagementInlineProps> = ({
  instructorId,
  currentCoaching,
  onSelectCoaching
}) => {
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 🆕 새로운 블록 기반 working_hours 기본값 (모두 비활성화 - 나중에 설정 가능)
  const defaultWorkingHours = {
    monday: { enabled: false, blocks: [] },
    tuesday: { enabled: false, blocks: [] },
    wednesday: { enabled: false, blocks: [] },
    thursday: { enabled: false, blocks: [] },
    friday: { enabled: false, blocks: [] },
    saturday: { enabled: false, blocks: [] },
    sunday: { enabled: false, blocks: [] }
  };

  const [newCoachingTitle, setNewCoachingTitle] = useState('');
  const [newCoachingDesc, setNewCoachingDesc] = useState('');
  const [newCoachingDuration, setNewCoachingDuration] = useState(30);
  const [newWorkingHours, setNewWorkingHours] = useState<any>(defaultWorkingHours);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedCoachingForSetup, setSelectedCoachingForSetup] = useState<Coaching | null>(null);
  const [instructorShortId, setInstructorShortId] = useState<string>('');
  const [editingCoachingId, setEditingCoachingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editWorkingHours, setEditWorkingHours] = useState<any>({});

  useEffect(() => {
    loadCoachings();
    loadInstructorInfo();

    // 모바일 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [instructorId]);

  const loadInstructorInfo = async () => {
    try {
      const instructor = await getUserById(instructorId);
      if (instructor && instructor.short_id) {
        setInstructorShortId(instructor.short_id);
      }
    } catch (e) {
      console.error('Failed to load instructor info:', e);
    }
  };

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
        type: 'private', // Always private by default
        duration: newCoachingDuration,
        price: 0,
        is_active: true,
        working_hours: newWorkingHours
      });
      setCoachings([newCoaching, ...coachings]);
      setNewCoachingTitle('');
      setNewCoachingDesc('');
      setNewCoachingDuration(30);
      setNewWorkingHours(defaultWorkingHours);
      setCreating(false);

      // 첫 코칭이면 자동 선택
      if (coachings.length === 0) {
        onSelectCoaching(newCoaching);
      }
    } catch (e: any) {
      alert(e.message || '코칭 생성 실패');
    }
  };

  const handleStartEdit = (coaching: Coaching) => {
    setEditingCoachingId(coaching.id);
    setEditTitle(coaching.title);
    setEditDesc(coaching.description || '');
    setEditDuration(coaching.duration);
    setEditWorkingHours(coaching.working_hours || {});
  };

  const handleUpdateCoaching = async (coachingId: string) => {
    if (!editTitle.trim()) return;

    try {
      const updated = await updateCoaching(coachingId, {
        title: editTitle,
        description: editDesc,
        duration: editDuration,
        working_hours: editWorkingHours
      });
      setCoachings(coachings.map(c => c.id === coachingId ? updated : c));
      setEditingCoachingId(null);

      // 현재 선택된 코칭을 업데이트한 경우, 선택 상태 갱신
      if (currentCoaching?.id === coachingId) {
        onSelectCoaching(updated);
      }
    } catch (e: any) {
      alert(e.message || '코칭 업데이트 실패');
    }
  };

  const handleCancelEdit = () => {
    setEditingCoachingId(null);
    setEditTitle('');
    setEditDesc('');
    setEditDuration(30);
    setEditWorkingHours({});
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

  const handleUpgradeCalendar = async (e: React.MouseEvent, calendarId: string) => {
    e.stopPropagation();
    try {
      await upgradeCalendarToWriter(calendarId);
    } catch (error) {
      console.error('Calendar upgrade failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
          }}
        />
      )}

      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">코칭 관리</h2>
          <p className="text-sm text-slate-600">여러 코칭을 운영하고 전환하세요</p>
        </div>

        {/* Info Banner: Per-coaching calendar setup */}
        <div className="mb-4 p-4 bg-gradient-to-r from-slate-50 to-indigo-50 border-2 border-slate-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Calendar size={20} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm text-slate-900 mb-1">코칭별 캘린더 관리</p>
              <p className="text-xs text-slate-600">각 코칭마다 기존 Google 캘린더를 연동하여 예약을 관리할 수 있습니다.</p>
            </div>
          </div>
        </div>

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
          <div className="mb-4 p-6 border-2 border-orange-300 rounded-xl bg-orange-50 space-y-4">
            <h3 className="font-bold text-slate-900 mb-3">새 코칭</h3>
            <input
              type="text"
              value={newCoachingTitle}
              onChange={(e) => setNewCoachingTitle(e.target.value)}
              placeholder="Class ID (예: pilates-private, yoga-group)"
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none"
            />
            <textarea
              value={newCoachingDesc}
              onChange={(e) => setNewCoachingDesc(e.target.value)}
              placeholder="코칭 설명 (선택사항)"
              rows={2}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  수업 시간
                </label>
                <select
                  value={newCoachingDuration}
                  onChange={(e) => setNewCoachingDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value={30}>30분</option>
                  <option value={45}>45분</option>
                  <option value={60}>1시간</option>
                  <option value={90}>1시간 30분</option>
                  <option value={120}>2시간</option>
                  <option value={150}>2시간 30분</option>
                  <option value={180}>3시간</option>
                </select>
              </div>
            </div>

            {/* Working Hours - 🆕 Time Block Selector (접이식) */}
            <details className="bg-white rounded-xl border-2 border-orange-200">
              <summary className="p-4 cursor-pointer text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>예약 가능 시간 설정 (선택사항)</span>
                <span className="text-xs font-normal text-slate-500">나중에 설정 가능</span>
              </summary>
              <div className="px-4 pb-4">
                <p className="text-xs text-slate-600 mb-4">
                  {isMobile
                    ? '요일을 선택하고 시간대를 탭하여 예약 가능 시간을 설정하세요 (30분 단위)'
                    : '드래그로 시간대를 선택하고, 더블클릭으로 요일을 활성화/비활성화하세요 (30분 단위)'}
                </p>
                <TimeBlockSelector
                  workingHours={newWorkingHours}
                  onChange={setNewWorkingHours}
                  isMobile={isMobile}
                />
              </div>
            </details>

            <div className="flex gap-2">
              <button
                onClick={handleCreateCoaching}
                disabled={!newCoachingTitle.trim()}
                className="flex-1 py-2 bg-gradient-to-r bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all disabled:opacity-50"
              >
                생성
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setNewCoachingTitle('');
                  setNewCoachingDesc('');
                  setNewCoachingDuration(30);
                  setNewWorkingHours(defaultWorkingHours);
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
            coachings.map(coaching => {
              const isEditing = editingCoachingId === coaching.id;

              return (
                <div
                  key={coaching.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isEditing
                      ? 'border-slate-500 bg-slate-50'
                      : currentCoaching?.id === coaching.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {isEditing ? (
                    /* 편집 모드 */
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-900 mb-3">코칭 편집</h3>

                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="코칭 제목"
                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-slate-500 focus:outline-none"
                      />

                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="코칭 설명 (선택사항)"
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-slate-500 focus:outline-none"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        {/* Duration Selection */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            수업 시간
                          </label>
                          <select
                            value={editDuration}
                            onChange={(e) => setEditDuration(Number(e.target.value))}
                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-slate-500 focus:outline-none"
                          >
                            <option value={30}>30분</option>
                            <option value={45}>45분</option>
                            <option value={60}>1시간</option>
                            <option value={90}>1시간 30분</option>
                            <option value={120}>2시간</option>
                            <option value={150}>2시간 30분</option>
                            <option value={180}>3시간</option>
                          </select>
                        </div>

                      </div>

                      {/* Working Hours - 🆕 Time Block Selector */}
                      <div className="bg-white p-4 rounded-xl border-2 border-slate-200">
                        <h4 className="text-sm font-bold text-slate-900 mb-3">예약 가능 시간 설정</h4>
                        <p className="text-xs text-slate-600 mb-4">
                          {isMobile
                            ? '요일을 선택하고 시간대를 탭하여 예약 가능 시간을 설정하세요 (30분 단위)'
                            : '드래그로 시간대를 선택하고, 더블클릭으로 요일을 활성화/비활성화하세요 (30분 단위)'}
                        </p>
                        <TimeBlockSelector
                          workingHours={editWorkingHours}
                          onChange={setEditWorkingHours}
                          isMobile={isMobile}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateCoaching(coaching.id)}
                          disabled={!editTitle.trim()}
                          className="flex-1 py-2 bg-gradient-to-r from-slate-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold transition-all disabled:opacity-50"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 일반 모드 */
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onSelectCoaching(coaching)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900">{coaching.title}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            coaching.type === ClassType.GROUP
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-slate-100 text-orange-600'
                          }`}>
                            {coaching.type === ClassType.GROUP ? '그룹' : '개인'}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                            {coaching.duration >= 60
                              ? `${Math.floor(coaching.duration / 60)}시간${coaching.duration % 60 > 0 ? ` ${coaching.duration % 60}분` : ''}`
                              : `${coaching.duration}분`
                            }
                          </span>
                          {coaching.google_calendar_id ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full font-medium flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              연동완료
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCoachingForSetup(coaching);
                                setShowSetupModal(true);
                              }}
                              className="px-2 py-0.5 bg-red-100 text-red-600 hover:bg-red-200 text-xs rounded-full font-medium flex items-center gap-1 transition-colors"
                            >
                              <Calendar size={10} />
                              연동미완료
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          예약 URL: /{instructorShortId || '...'}/{coaching.slug}
                        </p>
                        {coaching.description && (
                          <p className="text-sm text-slate-600 mt-2">{coaching.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(coaching);
                          }}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition-colors"
                          title="코칭 편집"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCoaching(coaching.id);
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="코칭 삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
