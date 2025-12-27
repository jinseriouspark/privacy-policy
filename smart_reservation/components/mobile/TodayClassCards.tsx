import React from 'react';
import { Video, Users, User, Clock } from 'lucide-react';

interface TodayClass {
  id: string;
  time: string;
  endTime: string;
  studentName?: string;
  isGroup: boolean;
  participantCount?: number;
  meetLink: string;
}

interface TodayClassCardsProps {
  classes: TodayClass[];
}

export const TodayClassCards: React.FC<TodayClassCardsProps> = ({ classes }) => {
  if (classes.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <p className="text-slate-600 font-medium">오늘 예정된 수업이 없습니다</p>
        <p className="text-sm text-slate-400 mt-2">편안한 하루 보내세요!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6 px-6 pb-2">
      <div className="flex gap-4 min-w-max">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="w-80 bg-white border-2 border-orange-500 rounded-2xl p-6 shadow-xl flex-shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {cls.isGroup ? (
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users size={24} className="text-orange-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-orange-600" />
                  </div>
                )}
                <span className="text-sm font-medium bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                  {cls.isGroup ? '그룹 수업' : '개인 레슨'}
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Clock size={16} />
                <span className="text-xs">수업 시간</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900">
                {cls.time}
              </h3>
              <p className="text-slate-600 text-sm mt-1">
                {cls.endTime}까지 (1시간)
              </p>
            </div>

            {/* Meet Link Button */}
            <a
              href={cls.meetLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors active:scale-95"
            >
              <Video size={20} />
              Meet 입장
            </a>
          </div>
        ))}
      </div>

      {/* Scroll Indicator */}
      {classes.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {classes.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-orange-300"
            />
          ))}
        </div>
      )}
    </div>
  );
};
