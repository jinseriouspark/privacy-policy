import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { ScheduleItem } from '../../types';
import { dbService } from '../../services/db';

interface MyEventsViewProps {
  userEmail: string | null;
  onBack: () => void;
  onScheduleClick?: (schedule: ScheduleItem) => void;
}

const MyEventsView: React.FC<MyEventsViewProps> = ({ userEmail, onBack, onScheduleClick }) => {
  const [myEvents, setMyEvents] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyEvents();
  }, [userEmail]);

  const loadMyEvents = async () => {
    if (!userEmail) return;

    setLoading(true);
    try {
      const allSchedules = await dbService.getSchedules(userEmail);

      // Filter only temple events where user has joined
      const joined = allSchedules.filter(s =>
        s.type === 'temple' &&
        s.participants?.includes(userEmail)
      );

      // Sort by date
      joined.sort((a, b) => {
        const dateA = new Date(a.date || '');
        const dateB = new Date(b.date || '');
        return dateA.getTime() - dateB.getTime();
      });

      setMyEvents(joined);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '';

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

    return `${year}년 ${month}월 ${day}일${timeStr ? ' ' + timeStr : ''}`;
  };

  return (
    <div className="px-6 pt-14 pb-32 animate-fade-in">
      {/* Header */}
      <h2 className="text-[28px] font-bold text-dark mb-8">
        <ArrowLeft
          size={28}
          className="inline-block mr-2 align-middle cursor-pointer hover:text-primary transition-colors"
          onClick={onBack}
        />
        참석 신청한 일정
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : myEvents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-400 text-[15px]">참석 신청한 일정이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onScheduleClick?.(event)}
              className="bg-white p-6 rounded-[20px] shadow-sm border-l-[6px] border-l-primary transition-transform active:scale-[0.99] cursor-pointer"
            >
              <div className="flex flex-col gap-3">
                {/* Date & Time */}
                <div className="flex items-center gap-2 text-[14px] text-gray-500 font-medium">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{formatDateTime(event.date, event.time)}</span>
                </div>

                {/* Title */}
                <h3 className="text-[20px] font-bold text-dark leading-snug">
                  {event.title}
                </h3>

                {/* Location */}
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>
                )}

                {/* Participants */}
                {event.participants && event.participants.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users size={14} />
                    <span>{event.participants.length}명 참석 중</span>
                  </div>
                )}

                {/* Meta */}
                {event.meta && (
                  <p className="text-[15px] text-gray-400 font-normal">
                    {event.meta}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEventsView;
