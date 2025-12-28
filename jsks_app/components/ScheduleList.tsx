
import React from 'react';
import { Plus, ChevronRight, Paperclip, CalendarDays, Trash2 } from 'lucide-react';
import { ScheduleItem, User } from '../types';
import { APP_STRINGS } from '../constants';

interface ScheduleListProps {
  items: ScheduleItem[];
  title?: string; // Allow overriding title
  onItemClick?: (item: ScheduleItem) => void;
  currentUser?: User | null;
  onAddSchedule?: () => void;
  onDeleteSchedule?: (scheduleId: string) => void;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ items, title, onItemClick, currentUser, onAddSchedule, onDeleteSchedule }) => {

  // 스님 또는 관리자 권한 체크
  const isAdmin = currentUser?.role === 'monk' || currentUser?.role === 'developer';

  // Helper to format date and time safely
  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    // 1. Clean Time (Handle 1899 Google Sheets bug or ISO strings)
    let cleanTime = '';
    if (timeStr) {
      if (timeStr.includes('T') || timeStr.includes('1899') || timeStr.length > 8) {
        const timeObj = new Date(timeStr);
        if (!isNaN(timeObj.getTime())) {
          const hours = String(timeObj.getHours()).padStart(2, '0');
          const minutes = String(timeObj.getMinutes()).padStart(2, '0');
          cleanTime = `${hours}:${minutes}`;
        }
      } else {
        cleanTime = timeStr;
      }
    }

    // 2. Format Date
    if (!dateStr) return cleanTime;
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return cleanTime;

    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

    // Simple format: "12월 8일 19:38"
    return cleanTime ? `${month}월 ${day}일 ${cleanTime}` : `${month}월 ${day}일`;
  };

  const handleDelete = (e: React.MouseEvent, scheduleId: string) => {
    e.stopPropagation();
    if (confirm('이 일정을 삭제하시겠습니까?')) {
      onDeleteSchedule?.(scheduleId);
    }
  };

  return (
    <div className="w-full pb-32">
      <div className="flex items-center justify-between mb-4 px-1">
        <h4 className="text-[11px] font-semibold text-gray-light uppercase tracking-widest">
          {title || APP_STRINGS.sectionSchedule}
        </h4>
        {isAdmin && onAddSchedule && (
          <button
            onClick={onAddSchedule}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-full text-[11px] font-semibold hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={14} />
            <span>일정 추가</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-6 bg-white rounded-[16px] border border-dashed border-gray-200 text-gray-400 text-[11px]">
            등록된 일정이 없습니다
          </div>
        ) : (
          items.map((item) => {
            // 절기/행사는 삭제 불가
            const isDeletable = isAdmin && item.type === 'temple' && item.meta !== '절기/행사';

            return (
              <div
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className={`
                  relative bg-white p-5 rounded-[16px] shadow-sm border-l-[5px] transition-transform active:scale-[0.99] cursor-pointer
                  ${item.type === 'temple' ? 'border-l-primary' : 'border-l-secondary'}
                `}
              >
                {/* 삭제 버튼 (스님/관리자 & 절 행사만) */}
                {isDeletable && onDeleteSchedule && (
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute top-3 right-3 p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <div className="flex flex-col gap-1.5 pr-10">
                  {/* Date & Time Badge */}
                  <div className="text-[12px] text-gray-500 font-medium">
                    {formatDateTime(item.date, item.time)}
                  </div>

                  <h3 className="text-[14px] font-bold text-dark leading-snug">
                    {item.title}
                  </h3>

                  {item.meta && (
                    <p className="text-[12px] text-gray-500 font-normal">
                      {item.meta}
                    </p>
                  )}

                  {/* Attachment Button */}
                  {item.attachmentUrl && (
                    <a
                      href={item.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-[12px] font-semibold text-blue-600 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      첨부파일 보기
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ScheduleList;