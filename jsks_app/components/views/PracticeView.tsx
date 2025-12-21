
import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { dbService } from '../../services/db';

interface PracticeItem {
  id: string;
  category: string;
  question: string;
  order: number;
}

interface PracticeViewProps {
  selectedIds: string[];
  initialCheckedIds?: string[];
  onBack: () => void;
  onComplete: (checkedIds: string[], progress: number) => void;
}

const PracticeView: React.FC<PracticeViewProps> = ({ selectedIds, initialCheckedIds = [], onBack, onComplete }) => {
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>(initialCheckedIds);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await dbService.getPracticeItems();
        setPracticeItems(items);
      } catch (e) {
        console.error('수행 항목 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  // Filter to show: 1) required items (always) + 2) user selected items
  const userItems = practiceItems.filter(item =>
    item.category === '필수' || selectedIds.includes(item.id)
  );

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const progress = Math.round((checkedIds.length / userItems.length) * 100) || 0;

  if (loading) {
    return (
      <div className="px-6 pt-14 pb-32 min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-14 pb-32 animate-slide-up min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={28} className="text-dark" />
        </button>
        <span className="text-lg font-bold text-gray-400">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-dark mb-4">오늘의 수행 점검</h1>
        
        {/* Progress Bar */}
        <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm font-bold text-gray-500">
          <span>{checkedIds.length} 완료</span>
          <span>{userItems.length} 목표</span>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-4 max-h-[calc(100vh-420px)] overflow-y-auto pr-2">
        {userItems.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            선택된 수행 항목이 없습니다.<br/>
            프로필 설정에서 항목을 추가해주세요.
          </div>
        ) : (
          userItems.map(item => {
            const isChecked = checkedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`
                  w-full p-5 rounded-[20px] text-left transition-all duration-300 flex items-center justify-between shadow-sm active:scale-[0.98]
                  ${isChecked
                    ? 'bg-primary text-white shadow-primary/30'
                    : 'bg-white text-dark shadow-gray-200/50'}
                `}
              >
                <span className={`text-[17px] font-bold leading-snug max-w-[85%] ${isChecked ? 'text-white' : 'text-dark'}`}>
                  {item.question}
                </span>
                <div className={`
                  w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors
                  ${isChecked
                    ? 'border-white bg-white text-primary'
                    : 'border-gray-200 bg-transparent'}
                `}>
                  {isChecked && <Check size={16} strokeWidth={4} />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Complete Button - 중앙 배치 */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent z-10 flex justify-center">
        <button
          onClick={() => onComplete(checkedIds, progress)}
          className={`
            w-full max-w-lg h-[64px] rounded-[20px] font-bold text-xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center
            ${progress === 100
              ? 'bg-dark text-white'
              : 'bg-white text-dark border border-gray-200'}
          `}
        >
          {progress === 100 ? '수행 완료하기 🎉' : '나중에 이어서 하기'}
        </button>
      </div>
    </div>
  );
};

export default PracticeView;