import React, { useState } from 'react';
import { Clock, Copy, Trash2, Plus, CheckCircle } from 'lucide-react';

interface TimeBlock {
  start: string;
  end: string;
}

interface DayWorkingHours {
  enabled: boolean;
  blocks: TimeBlock[];
}

interface WorkingHours {
  monday: DayWorkingHours;
  tuesday: DayWorkingHours;
  wednesday: DayWorkingHours;
  thursday: DayWorkingHours;
  friday: DayWorkingHours;
  saturday: DayWorkingHours;
  sunday: DayWorkingHours;
}

interface TimeBlockSelectorProps {
  workingHours: WorkingHours;
  onChange: (workingHours: WorkingHours) => void;
  isMobile?: boolean;
}

const DAYS = [
  { key: 'monday' as const, label: '월요일' },
  { key: 'tuesday' as const, label: '화요일' },
  { key: 'wednesday' as const, label: '수요일' },
  { key: 'thursday' as const, label: '목요일' },
  { key: 'friday' as const, label: '금요일' },
  { key: 'saturday' as const, label: '토요일' },
  { key: 'sunday' as const, label: '일요일' },
];

// 시간 옵션 생성 (30분 단위)
const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    options.push(`${hour.toString().padStart(2, '0')}:00`);
    options.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// 시간 템플릿
const TEMPLATES = [
  { name: '평일 오전', blocks: [{ start: '09:00', end: '12:00' }] },
  { name: '평일 오후', blocks: [{ start: '14:00', end: '18:00' }] },
  { name: '평일 종일', blocks: [{ start: '09:00', end: '18:00' }] },
  { name: '평일 풀타임', blocks: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  { name: '주말 단축', blocks: [{ start: '10:00', end: '14:00' }] },
];

export const TimeBlockSelector: React.FC<TimeBlockSelectorProps> = ({
  workingHours,
  onChange,
  isMobile = false,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const toggleDay = (day: keyof WorkingHours) => {
    onChange({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        enabled: !workingHours[day].enabled,
      },
    });
  };

  const addTimeBlock = (day: keyof WorkingHours) => {
    const newBlock: TimeBlock = { start: '09:00', end: '18:00' };
    onChange({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        blocks: [...workingHours[day].blocks, newBlock],
      },
    });
  };

  const updateTimeBlock = (
    day: keyof WorkingHours,
    blockIndex: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const updatedBlocks = [...workingHours[day].blocks];
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      [field]: value,
    };

    onChange({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        blocks: updatedBlocks,
      },
    });
  };

  const removeTimeBlock = (day: keyof WorkingHours, blockIndex: number) => {
    onChange({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        blocks: workingHours[day].blocks.filter((_, idx) => idx !== blockIndex),
      },
    });
  };

  const copyToAllDays = (sourceDay: keyof WorkingHours) => {
    const sourceBlocks = workingHours[sourceDay].blocks;
    const updated = { ...workingHours };

    DAYS.forEach(({ key }) => {
      if (updated[key].enabled && key !== sourceDay) {
        updated[key] = {
          ...updated[key],
          blocks: JSON.parse(JSON.stringify(sourceBlocks)), // Deep copy
        };
      }
    });

    onChange(updated);
  };

  const applyTemplate = (day: keyof WorkingHours, template: typeof TEMPLATES[0]) => {
    onChange({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        blocks: JSON.parse(JSON.stringify(template.blocks)),
      },
    });
  };

  const toggleAllDays = (enable: boolean) => {
    const updated = { ...workingHours };
    DAYS.forEach(({ key }) => {
      updated[key] = {
        ...updated[key],
        enabled: enable,
      };
    });
    onChange(updated);
  };

  const allEnabled = DAYS.every(({ key }) => workingHours[key].enabled);
  const allDisabled = DAYS.every(({ key }) => !workingHours[key].enabled);

  return (
    <div className="space-y-4">
      {/* 헤더 및 전체 컨트롤 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-orange-800 flex-1 min-w-[200px]">
          💡 각 요일별로 시간대를 추가하고 시작/종료 시간을 설정하세요
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleAllDays(true)}
            disabled={allEnabled}
            className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전체 활성화
          </button>
          <button
            onClick={() => toggleAllDays(false)}
            disabled={allDisabled}
            className="px-3 py-2 bg-slate-400 text-white rounded-lg text-sm font-medium hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전체 비활성화
          </button>
        </div>
      </div>

      {/* 요일별 시간 설정 */}
      <div className="space-y-3">
        {DAYS.map(({ key, label }) => {
          const isEnabled = workingHours[key].enabled;
          const blocks = workingHours[key].blocks;

          return (
            <div
              key={key}
              className={`border-2 rounded-xl transition-all ${
                isEnabled
                  ? 'border-orange-300 bg-white'
                  : 'border-slate-200 bg-slate-50 opacity-60'
              }`}
            >
              {/* 요일 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleDay(key)}
                      className="w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="font-bold text-slate-900">{label}</span>
                  </label>
                  {blocks.length > 0 && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      {blocks.length}개 시간대
                    </span>
                  )}
                </div>

                {isEnabled && blocks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-xs px-2 py-1 text-orange-600 hover:bg-orange-50 rounded transition-colors flex items-center gap-1"
                    >
                      <Clock size={14} />
                      템플릿
                    </button>
                    <button
                      onClick={() => copyToAllDays(key)}
                      className="text-xs px-2 py-1 text-orange-600 hover:bg-slate-50 rounded transition-colors flex items-center gap-1"
                      title="이 요일의 시간을 다른 모든 활성화된 요일에 복사"
                    >
                      <Copy size={14} />
                      전체 복사
                    </button>
                  </div>
                )}
              </div>

              {/* 시간대 입력 영역 */}
              {isEnabled && (
                <div className="p-4 space-y-3">
                  {/* 템플릿 선택 */}
                  {showTemplates && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-orange-900 mb-2">빠른 템플릿</p>
                      <div className="flex flex-wrap gap-2">
                        {TEMPLATES.map((template, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              applyTemplate(key, template);
                              setShowTemplates(false);
                            }}
                            className="text-xs px-3 py-1.5 bg-white border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 시간대 리스트 */}
                  {blocks.map((block, blockIndex) => (
                    <div
                      key={blockIndex}
                      className="flex items-center gap-2 bg-slate-50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={block.start}
                          onChange={(e) => updateTimeBlock(key, blockIndex, 'start', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          {TIME_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-500 font-medium">~</span>
                        <select
                          value={block.end}
                          onChange={(e) => updateTimeBlock(key, blockIndex, 'end', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          {TIME_OPTIONS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeTimeBlock(key, blockIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="시간대 삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {/* 시간대 추가 버튼 */}
                  <button
                    onClick={() => addTimeBlock(key)}
                    className="w-full py-2.5 border-2 border-dashed border-orange-300 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    시간대 추가
                  </button>

                  {/* 빈 상태 메시지 */}
                  {blocks.length === 0 && (
                    <div className="text-center py-4 text-sm text-slate-400">
                      시간대를 추가해주세요
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
