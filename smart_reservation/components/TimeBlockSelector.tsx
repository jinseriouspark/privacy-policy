import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface TimeBlock {
  start: string; // "08:00", "08:30", etc.
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
  { key: 'monday' as const, label: '월' },
  { key: 'tuesday' as const, label: '화' },
  { key: 'wednesday' as const, label: '수' },
  { key: 'thursday' as const, label: '목' },
  { key: 'friday' as const, label: '금' },
  { key: 'saturday' as const, label: '토' },
  { key: 'sunday' as const, label: '일' },
];

// Generate 30-minute intervals from 00:00 to 23:30
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export const TimeBlockSelector: React.FC<TimeBlockSelectorProps> = ({
  workingHours,
  onChange,
  isMobile = false,
}) => {
  const [selectedDay, setSelectedDay] = useState<keyof WorkingHours>('monday');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set());

  // Check if a time slot is selected
  const isTimeSelected = (day: keyof WorkingHours, time: string): boolean => {
    const dayHours = workingHours[day];
    if (!dayHours.enabled) return false;

    return dayHours.blocks.some(block => {
      const blockStartMinutes = timeToMinutes(block.start);
      const blockEndMinutes = timeToMinutes(block.end);
      const currentMinutes = timeToMinutes(time);
      return currentMinutes >= blockStartMinutes && currentMinutes < blockEndMinutes;
    });
  };

  // Convert time string to minutes for comparison
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes back to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Toggle day enabled/disabled
  const toggleDay = (day: keyof WorkingHours) => {
    onChange({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        enabled: !workingHours[day].enabled,
      },
    });
  };

  // Desktop: Start drag selection
  const handleMouseDown = (time: string) => {
    if (!workingHours[selectedDay].enabled) return;
    setIsSelecting(true);
    setSelectionStart(time);
    setTempSelection(new Set([time]));
  };

  // Desktop: Continue drag selection
  const handleMouseEnter = (time: string) => {
    if (!isSelecting || !selectionStart) return;

    const startMinutes = timeToMinutes(selectionStart);
    const currentMinutes = timeToMinutes(time);
    const minTime = Math.min(startMinutes, currentMinutes);
    const maxTime = Math.max(startMinutes, currentMinutes);

    const selectedTimes = new Set<string>();
    TIME_SLOTS.forEach(slot => {
      const slotMinutes = timeToMinutes(slot);
      if (slotMinutes >= minTime && slotMinutes <= maxTime) {
        selectedTimes.add(slot);
      }
    });

    setTempSelection(selectedTimes);
  };

  // Desktop: End drag selection
  const handleMouseUp = () => {
    if (!isSelecting || tempSelection.size === 0) {
      setIsSelecting(false);
      setSelectionStart(null);
      setTempSelection(new Set());
      return;
    }

    const times = Array.from(tempSelection).map(timeToMinutes).sort((a, b) => a - b);
    const start = minutesToTime(times[0]);
    const end = minutesToTime(times[times.length - 1] + 30); // Add 30 min to last slot

    const newBlock: TimeBlock = { start, end };
    const dayHours = workingHours[selectedDay];

    // Check if new block overlaps with existing blocks
    const overlappingIndex = dayHours.blocks.findIndex(block => {
      const blockStart = timeToMinutes(block.start);
      const blockEnd = timeToMinutes(block.end);
      const newStart = timeToMinutes(newBlock.start);
      const newEnd = timeToMinutes(newBlock.end);
      return !(newEnd <= blockStart || newStart >= blockEnd);
    });

    let newBlocks: TimeBlock[];
    if (overlappingIndex !== -1) {
      // Remove overlapping block (toggle behavior)
      newBlocks = dayHours.blocks.filter((_, i) => i !== overlappingIndex);
    } else {
      // Add new block
      newBlocks = [...dayHours.blocks, newBlock].sort((a, b) =>
        timeToMinutes(a.start) - timeToMinutes(b.start)
      );
    }

    onChange({
      ...workingHours,
      [selectedDay]: {
        ...dayHours,
        blocks: newBlocks,
      },
    });

    setIsSelecting(false);
    setSelectionStart(null);
    setTempSelection(new Set());
  };

  // Mobile: Toggle single time slot
  const handleTimeSlotTap = (time: string) => {
    if (!workingHours[selectedDay].enabled) return;

    const dayHours = workingHours[selectedDay];
    const currentMinutes = timeToMinutes(time);

    // Find if this slot is part of an existing block
    const blockIndex = dayHours.blocks.findIndex(block => {
      const blockStart = timeToMinutes(block.start);
      const blockEnd = timeToMinutes(block.end);
      return currentMinutes >= blockStart && currentMinutes < blockEnd;
    });

    let newBlocks: TimeBlock[];
    if (blockIndex !== -1) {
      // Remove the entire block containing this slot
      newBlocks = dayHours.blocks.filter((_, i) => i !== blockIndex);
    } else {
      // Add new 30-minute block
      const newBlock: TimeBlock = {
        start: time,
        end: minutesToTime(currentMinutes + 30),
      };
      newBlocks = [...dayHours.blocks, newBlock].sort((a, b) =>
        timeToMinutes(a.start) - timeToMinutes(b.start)
      );
    }

    onChange({
      ...workingHours,
      [selectedDay]: {
        ...dayHours,
        blocks: newBlocks,
      },
    });
  };

  // Render desktop version
  const renderDesktop = () => (
    <div className="space-y-6">
      {/* Day selector */}
      <div className="flex gap-2">
        {DAYS.map(({ key, label }) => {
          const isEnabled = workingHours[key].enabled;
          const isSelected = selectedDay === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(key)}
              onDoubleClick={() => toggleDay(key)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                isSelected
                  ? isEnabled
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-slate-300 text-white shadow-md'
                  : isEnabled
                  ? 'bg-white text-slate-700 border border-slate-200 hover:border-orange-300'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="bg-slate-50 p-4 rounded-xl">
        <p className="text-sm text-slate-600">
          <span className="font-medium">드래그</span>로 시간대를 선택하세요.
          <span className="font-medium ml-2">더블클릭</span>으로 요일을 활성화/비활성화할 수 있습니다.
        </p>
      </div>

      {/* Time grid */}
      <div
        className="relative bg-white rounded-2xl p-6 shadow-md select-none"
        onMouseLeave={() => {
          if (isSelecting) handleMouseUp();
        }}
      >
        {!workingHours[selectedDay].enabled && (
          <div className="absolute inset-0 bg-slate-100/80 rounded-2xl flex items-center justify-center z-10">
            <p className="text-slate-500 font-medium">비활성화된 요일입니다</p>
          </div>
        )}

        <div className="grid grid-cols-12 gap-2">
          {TIME_SLOTS.map((time, index) => {
            const isSelected = isTimeSelected(selectedDay, time);
            const isTempSelected = tempSelection.has(time);
            const shouldShow = isTempSelected || isSelected;

            return (
              <button
                key={time}
                onMouseDown={() => handleMouseDown(time)}
                onMouseEnter={() => handleMouseEnter(time)}
                onMouseUp={handleMouseUp}
                disabled={!workingHours[selectedDay].enabled}
                className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                  shouldShow
                    ? isTempSelected
                      ? 'bg-orange-300 text-white scale-105'
                      : 'bg-orange-500 text-white shadow-md'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
                title={time}
              >
                {index % 2 === 0 ? time.split(':')[0] : ':30'}
              </button>
            );
          })}
        </div>

        {/* Selected blocks summary */}
        {workingHours[selectedDay].blocks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-orange-500" />
              <span className="text-sm font-medium text-slate-700">선택된 시간대</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {workingHours[selectedDay].blocks.map((block, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium"
                >
                  {block.start} - {block.end}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render mobile version
  const renderMobile = () => (
    <div className="space-y-4">
      {/* Day selector - scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {DAYS.map(({ key, label }) => {
          const isEnabled = workingHours[key].enabled;
          const isSelected = selectedDay === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(key)}
              className={`flex-shrink-0 w-12 h-12 rounded-full font-medium transition-all ${
                isSelected
                  ? isEnabled
                    ? 'bg-orange-500 text-white shadow-lg scale-110'
                    : 'bg-slate-300 text-white shadow-lg scale-110'
                  : isEnabled
                  ? 'bg-white text-slate-700 border-2 border-slate-200'
                  : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Day toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md">
        <span className="font-medium text-slate-700">
          {DAYS.find(d => d.key === selectedDay)?.label}요일 활성화
        </span>
        <button
          onClick={() => toggleDay(selectedDay)}
          className={`w-14 h-8 rounded-full transition-all ${
            workingHours[selectedDay].enabled
              ? 'bg-orange-500'
              : 'bg-slate-200'
          }`}
        >
          <div
            className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
              workingHours[selectedDay].enabled
                ? 'translate-x-7'
                : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Time slots - vertical scrollable */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Clock size={18} className="text-orange-500" />
          <span className="font-medium text-slate-700">시간대 선택</span>
          <span className="text-xs text-slate-500 ml-auto">탭하여 선택/해제</span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2 p-4">
            {TIME_SLOTS.map((time) => {
              const isSelected = isTimeSelected(selectedDay, time);

              return (
                <button
                  key={time}
                  onClick={() => handleTimeSlotTap(time)}
                  disabled={!workingHours[selectedDay].enabled}
                  className={`h-11 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-md scale-105'
                      : 'bg-slate-50 text-slate-600 active:scale-95'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected blocks summary */}
        {workingHours[selectedDay].blocks.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="text-xs font-medium text-slate-600 mb-2">선택된 시간대</div>
            <div className="flex flex-wrap gap-2">
              {workingHours[selectedDay].blocks.map((block, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium"
                >
                  {block.start} - {block.end}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return isMobile ? renderMobile() : renderDesktop();
};
