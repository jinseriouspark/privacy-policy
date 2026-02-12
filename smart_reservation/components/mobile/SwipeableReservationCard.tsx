import React, { useState } from 'react';
import { Calendar, Clock, User, Video, Trash2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { Reservation, User as UserType } from '../../types';

interface SwipeableReservationCardProps {
  reservation: Reservation;
  userType: 'instructor' | 'student';
  onCancel: (id: string) => void;
}

export const SwipeableReservationCard: React.FC<SwipeableReservationCardProps> = ({
  reservation,
  userType,
  onCancel
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const startTime = new Date(reservation.start_time);
  const endTime = new Date(reservation.end_time);
  const isPast = startTime < new Date();
  const isCancelled = reservation.status === 'cancelled';
  const canCancel = !isPast && !isCancelled;

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (!canCancel) return;

      setIsSwiping(true);
      // Only allow left swipe (negative deltaX)
      if (eventData.deltaX < 0) {
        // Max swipe distance is 80px
        setTranslateX(Math.max(eventData.deltaX, -80));
      } else {
        setTranslateX(0);
      }
    },
    onSwiped: (eventData) => {
      if (!canCancel) return;

      setIsSwiping(false);
      // If swiped more than 40px, show cancel button
      if (eventData.deltaX < -40) {
        setTranslateX(-80);
      } else {
        setTranslateX(0);
      }
    },
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: true
  });

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('정말 이 예약을 취소하시겠습니까?')) {
      onCancel(reservation.id);
      setTranslateX(0);
    }
  };

  const handleCardClick = () => {
    if (translateX !== 0) {
      setTranslateX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete button (revealed on swipe) */}
      {canCancel && (
        <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center">
          <button
            onClick={handleCancel}
            className="flex flex-col items-center justify-center h-full w-full text-white"
          >
            <Trash2 size={24} />
            <span className="text-xs mt-1">취소</span>
          </button>
        </div>
      )}

      {/* Card content */}
      <div
        {...handlers}
        onClick={handleCardClick}
        className={`bg-white border ${
          isCancelled
            ? 'border-slate-200 opacity-60'
            : isPast
            ? 'border-slate-200'
            : 'border-orange-200 shadow-sm'
        } rounded-xl p-4 transition-transform ${
          isSwiping ? 'duration-0' : 'duration-300'
        }`}
        style={{
          transform: `translateX(${translateX}px)`
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isCancelled
                  ? 'bg-slate-100 text-slate-600'
                  : isPast
                  ? 'bg-slate-100 text-orange-600'
                  : 'bg-orange-100 text-orange-600'
              }`}>
                {isCancelled ? '취소됨' : isPast ? '완료' : '예정'}
              </span>
              {reservation.coaching?.type === 'group' && (
                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 font-medium">
                  그룹
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900">
              {reservation.coaching?.title || '수업'}
            </h3>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={16} />
            <span>
              {startTime.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock size={16} />
            <span>
              {startTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
              {' - '}
              {endTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZoneName: 'short'
              })}
            </span>
          </div>

          {userType === 'instructor' ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User size={16} />
              <span>{reservation.student?.name || '수강생'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User size={16} />
              <span>{reservation.instructor?.name || '강사님'}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isPast && !isCancelled && reservation.meet_link && (
          <div className="mt-4">
            <a
              href={reservation.meet_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <Video size={18} />
              Meet 입장
            </a>
          </div>
        )}
      </div>

      {/* Swipe hint indicator */}
      {canCancel && translateX === 0 && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-300 pointer-events-none">
          <div className="flex items-center gap-1 text-xs">
            <span>←</span>
            <span>밀어서 취소</span>
          </div>
        </div>
      )}
    </div>
  );
};
