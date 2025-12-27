import React from 'react';
import { Clock } from 'lucide-react';

interface WorkingHour {
  start: string;
  end: string;
  isWorking: boolean;
}

interface WeeklyWorkingHoursProps {
  workingHours: { [key: string]: WorkingHour };
  onChange: (workingHours: { [key: string]: WorkingHour }) => void;
  disabled?: boolean;
}

const WEEKDAYS = [
  { key: '0', label: '일요일', short: '일' },
  { key: '1', label: '월요일', short: '월' },
  { key: '2', label: '화요일', short: '화' },
  { key: '3', label: '수요일', short: '수' },
  { key: '4', label: '목요일', short: '목' },
  { key: '5', label: '금요일', short: '금' },
  { key: '6', label: '토요일', short: '토' },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export const WeeklyWorkingHours: React.FC<WeeklyWorkingHoursProps> = ({
  workingHours,
  onChange,
  disabled = false
}) => {
  const handleToggleDay = (dayKey: string) => {
    const updated = {
      ...workingHours,
      [dayKey]: {
        ...workingHours[dayKey],
        isWorking: !workingHours[dayKey]?.isWorking
      }
    };
    onChange(updated);
  };

  const handleTimeChange = (dayKey: string, field: 'start' | 'end', value: string) => {
    const updated = {
      ...workingHours,
      [dayKey]: {
        ...workingHours[dayKey],
        [field]: value
      }
    };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-orange-600" />
        <h3 className="font-bold text-slate-900">주간 업무 시간</h3>
      </div>

      {WEEKDAYS.map((day) => {
        const dayHours = workingHours[day.key] || { start: '09:00', end: '18:00', isWorking: false };

        return (
          <div
            key={day.key}
            className={`p-4 rounded-xl border-2 transition-all ${
              dayHours.isWorking
                ? 'border-orange-300 bg-orange-50'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Day Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer min-w-[80px]">
                <input
                  type="checkbox"
                  checked={dayHours.isWorking}
                  onChange={() => handleToggleDay(day.key)}
                  disabled={disabled}
                  className="w-5 h-5 text-orange-600 border-slate-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                />
                <span className={`font-medium ${dayHours.isWorking ? 'text-slate-900' : 'text-slate-400'}`}>
                  {day.label}
                </span>
              </label>

              {/* Time Selectors */}
              {dayHours.isWorking && (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={dayHours.start}
                    onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                    disabled={disabled}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <span className="text-slate-600">~</span>
                  <select
                    value={dayHours.end}
                    onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                    disabled={disabled}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Quick Set Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            const weekdayHours: { [key: string]: WorkingHour } = {};
            ['1', '2', '3', '4', '5'].forEach(key => {
              weekdayHours[key] = { start: '09:00', end: '18:00', isWorking: true };
            });
            onChange({ ...workingHours, ...weekdayHours });
          }}
          disabled={disabled}
          className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
        >
          평일 9-18시
        </button>
        <button
          type="button"
          onClick={() => {
            const allDaysHours: { [key: string]: WorkingHour } = {};
            WEEKDAYS.forEach(day => {
              allDaysHours[day.key] = { start: '09:00', end: '18:00', isWorking: true };
            });
            onChange(allDaysHours);
          }}
          disabled={disabled}
          className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
        >
          매일 9-18시
        </button>
        <button
          type="button"
          onClick={() => {
            const cleared: { [key: string]: WorkingHour } = {};
            WEEKDAYS.forEach(day => {
              cleared[day.key] = { start: '09:00', end: '18:00', isWorking: false };
            });
            onChange(cleared);
          }}
          disabled={disabled}
          className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors disabled:opacity-50"
        >
          모두 해제
        </button>
      </div>
    </div>
  );
};
