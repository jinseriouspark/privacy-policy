
import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { dbService } from '../../services/db';

interface PracticeItem {
  id: string;
  category: string;
  question: string;
  order: number;
  section?: string;
}

interface OnboardingViewProps {
  onComplete: (selectedIds: string[]) => void;
  initialSelection?: string[];
  onBack?: () => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, initialSelection = [], onBack }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelection);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await dbService.getPracticeItems();
        setPracticeItems(items);

        // 필수 항목 자동 선택 (초기 선택이 없는 경우만)
        if (initialSelection.length === 0) {
          const requiredIds = items.filter(item => item.category === '필수').map(item => item.id);
          setSelectedIds(requiredIds);
        }
      } catch (e) {
        console.error('수행 항목 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const toggleSelection = (id: string) => {
    // 필수 항목은 선택 해제 불가
    const item = practiceItems.find(i => i.id === id);
    if (item?.category === '필수') return;

    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="px-6 pt-10 pb-40 bg-white min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-10 pb-40 animate-fade-in bg-white min-h-screen">
      {/* 뒤로가기 버튼 (프로필에서 온 경우에만 표시) */}
      {onBack && (
        <div className="mb-6">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={28} className="text-dark" />
          </button>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">수행 목표 선택</h1>
        <p className="text-lg text-gray-500 leading-relaxed">
          필수 항목 2개와 함께 매일 점검하고 싶은 수행 항목을 추가로 선택해주세요.<br/>
          언제든 내 정보에서 수정할 수 있습니다.
        </p>
      </div>

      <div className="space-y-6">
        {/* Group items by section */}
        {(() => {
          const groupedItems: { [key: string]: PracticeItem[] } = {};
          practiceItems.forEach(item => {
            const section = item.section || '기타';
            if (!groupedItems[section]) {
              groupedItems[section] = [];
            }
            groupedItems[section].push(item);
          });

          return Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className="space-y-3">
              {/* Section Header */}
              <h3 className="text-[15px] font-bold text-dark px-1">
                {section}
              </h3>

              {/* Items in this section */}
              {items.map(item => {
                const isSelected = selectedIds.includes(item.id);
                const isRequired = item.category === '필수';
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`
                      w-full p-5 rounded-[20px] text-left transition-all duration-300 flex items-center gap-4 border-2 group
                      ${isRequired
                        ? 'border-secondary bg-secondary/5 cursor-default'
                        : isSelected
                          ? 'border-dark bg-white shadow-card'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold uppercase tracking-wide mb-1 ${isRequired ? 'text-secondary' : isSelected ? 'text-secondary' : 'text-gray-400'}`}>
                        {item.category}
                      </div>
                      <div className={`text-[17px] font-medium leading-snug transition-colors ${isSelected || isRequired ? 'text-dark font-bold' : 'text-gray-700'}`}>
                        {item.question}
                      </div>
                    </div>

                    <div className={`
                      w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
                      ${isRequired || isSelected
                        ? 'bg-secondary text-white shadow-md scale-110'
                        : 'bg-white border-2 border-gray-200 text-transparent group-hover:border-gray-300'}
                    `}>
                      <Check size={18} strokeWidth={3} className={isRequired || isSelected ? 'opacity-100' : 'opacity-0'} />
                    </div>
                  </button>
                );
              })}
            </div>
          ));
        })()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-20 pb-8 pt-12">
        <button
          onClick={() => onComplete(selectedIds)}
          disabled={selectedIds.length === 0}
          className={`
            w-full max-w-lg mx-auto h-[64px] rounded-[20px] font-bold text-xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2
            ${selectedIds.length > 0 
              ? 'bg-dark text-white hover:bg-black shadow-dark/20' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          <span>{selectedIds.length}개 선택 완료</span>
          {selectedIds.length > 0 && <Check size={20} strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
};

export default OnboardingView;
