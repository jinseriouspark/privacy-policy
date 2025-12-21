
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Check } from 'lucide-react';
import { User, ScheduleItem } from '../../types';
import { dbService } from '../../services/db';

interface PracticeItem {
  id: string;
  category: string;
  question: string;
  order: number;
}

interface AddPracticeViewProps {
  onComplete: () => void;
  currentUser: User | null;
}

const AddPracticeView: React.FC<AddPracticeViewProps> = ({ onComplete, currentUser }) => {
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [todayRecords, setTodayRecords] = useState<string[]>([]); // 오늘 이미 기록한 항목 제목들
  const [loading, setLoading] = useState(true);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // DB에서 모든 수행 항목 로드 + 오늘 기록 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. 모든 수행 항목 로드
        const items = await dbService.getPracticeItems();
        setPracticeItems(items);

        // 2. 오늘의 수행 기록 로드
        if (currentUser) {
          const schedules = await dbService.getSchedules(currentUser.email);
          const today = new Date().toISOString().split('T')[0];

          // practice_ 로 시작하고 오늘 날짜인 것만 필터링
          const todayPractices = schedules.filter(
            s => s.id.startsWith('practice_') && s.date === today
          );

          // 이미 기록한 항목의 제목들 저장
          const recordedTitles = todayPractices.map(s => s.title);
          setTodayRecords(recordedTitles);
        }
      } catch (e) {
        console.error('데이터 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const toggleCheck = (item: PracticeItem) => {
    setCheckedIds(prev =>
      prev.includes(item.id)
        ? prev.filter(id => id !== item.id)
        : [...prev, item.id]
    );
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다');
      return;
    }

    if (checkedIds.length === 0) {
      alert('최소 1개 이상 선택해주세요');
      return;
    }

    setIsSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      // 체크한 항목들을 각각 저장
      const selectedItems = practiceItems.filter(item => checkedIds.includes(item.id));

      for (const item of selectedItems) {
        const scheduleId = `practice_${Date.now()}_${item.id}`;

        await dbService.addSchedule({
          id: scheduleId,
          type: 'practice',
          title: item.question,
          date: today,
          time: currentTime,
          endDate: today,
          endTime: currentTime,
          meta: '수행 완료',
          maxParticipants: 0,
          invitedEmails: []
        }, currentUser.email);
      }

      alert(`✅ ${checkedIds.length}개 수행 기록이 저장되었습니다!`);
      onComplete();
    } catch (error) {
      console.error('수행 기록 저장 실패:', error);
      alert('❌ 수행 기록 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-6 pt-14 pb-32 animate-slide-up">
      {/* Header */}
      <h2 className="text-[28px] font-bold text-dark mb-8">
        <ArrowLeft
          size={28}
          className="inline-block mr-2 align-middle cursor-pointer hover:text-primary transition-colors"
          onClick={onComplete}
        />
        새 수행 기록
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Checklist - 별 표시 항목을 가장 아래로 정렬 */}
          <div className="space-y-3 mb-6">
            {practiceItems
              .filter(item => !todayRecords.includes(item.question)) // 오늘 기록한 항목 제외
              .sort((a, b) => {
                const aIsGoal = currentUser?.trackingIds?.includes(a.id) ? 1 : 0;
                const bIsGoal = currentUser?.trackingIds?.includes(b.id) ? 1 : 0;
                return aIsGoal - bIsGoal; // 별 없는 것(0) 먼저, 별 있는 것(1) 나중
              })
              .map((item) => {
                const isMyGoal = currentUser?.trackingIds?.includes(item.id);
                const isChecked = checkedIds.includes(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item)}
                    className={`w-full p-4 rounded-[20px] text-left transition-all flex items-center justify-between shadow-sm active:scale-[0.98]
                      ${isChecked
                        ? 'bg-primary text-white shadow-primary/30'
                        : 'bg-white text-dark shadow-gray-200/50'}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isMyGoal && (
                        <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <Star size={14} fill="white" stroke="white" />
                        </div>
                      )}
                      <span className={`text-[17px] font-bold leading-snug ${isChecked ? 'text-white' : 'text-dark'}`}>
                        {item.question}
                      </span>
                    </div>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                      ${isChecked
                        ? 'border-white bg-white text-primary'
                        : 'border-gray-200 bg-transparent'}`}
                    >
                      {isChecked && <Check size={16} strokeWidth={4} />}
                    </div>
                  </button>
                );
              })}
          </div>

          {practiceItems.filter(item => !todayRecords.includes(item.question)).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              오늘 모든 수행을 완료했습니다! 🎉
            </div>
          )}

          {/* Save Button - 중앙 배치 */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent z-10 flex justify-center">
            <button
              onClick={handleSave}
              disabled={checkedIds.length === 0 || isSaving}
              className={`w-full max-w-lg h-[64px] rounded-[20px] font-bold text-xl shadow-xl transition-all active:scale-[0.98]
                ${checkedIds.length > 0
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isSaving ? '저장 중...' : `${checkedIds.length}개 수행 기록 저장`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AddPracticeView;
