
import React, { useState } from 'react';
import { X, CalendarDays, MapPin, Users, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { ScheduleItem, User } from '../types';
import { dbService } from '../services/db';

interface ScheduleDetailModalProps {
  schedule: ScheduleItem | null;
  currentUser: User | null;
  onClose: () => void;
  onUpdate: () => void;
}

const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  schedule,
  currentUser,
  onClose,
  onUpdate
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!schedule) return null;

  const isTempleEvent = schedule.type === 'temple';
  const isPersonalEvent = schedule.type === 'personal';
  const isBeliever = currentUser?.role === 'believer';
  const participants = schedule.participants || [];
  const maxParticipants = schedule.maxParticipants || 0;
  const isUnlimited = maxParticipants === 0;
  const isFull = !isUnlimited && participants.length >= maxParticipants;
  const hasJoined = currentUser ? participants.includes(currentUser.email) : false;

  // RSVP 버튼 표시 조건: 절 행사 && 참석 인원 설정이 있는 경우
  const showRSVPButton = isTempleEvent && currentUser;

  // 삭제 버튼 표시 조건: 개인 행사 && 본인이 만든 경우
  const canDelete = isPersonalEvent && currentUser && schedule.ownerEmail === currentUser.email;

  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '';

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

    return `${year}년 ${month}월 ${day}일${timeStr ? ' ' + timeStr : ''}`;
  };

  const handleRSVP = async (join: boolean) => {
    if (!currentUser || !schedule.id || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await dbService.rsvpEvent(schedule.id, currentUser.email, join);
      if (result.status === 'error') {
        if (result.message === 'FULL') {
          alert('정원이 마감되었습니다.');
        } else {
          alert('신청 처리 중 오류가 발생했습니다.');
        }
      } else {
        await onUpdate(); // 목록 새로고침
        alert(join ? '참석 신청이 완료되었습니다!' : '참석 신청이 취소되었습니다.');
      }
    } catch (error) {
      console.error('RSVP Error:', error);
      alert('신청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule.id || isProcessing) return;

    if (!confirm('이 일정을 삭제하시겠습니까?')) return;

    setIsProcessing(true);
    try {
      await dbService.deleteSchedule(schedule.id);
      alert('일정이 삭제되었습니다.');
      await onUpdate();
      onClose();
    } catch (error) {
      console.error('Delete Error:', error);
      alert('일정 삭제에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-[24px] rounded-t-[24px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold mb-2 ${
              isTempleEvent ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
            }`}>
              {isTempleEvent ? '절 행사' : '개인 행사'}
            </div>
            <h3 className="text-[19px] font-bold text-dark leading-snug">{schedule.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={17} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-gray-500 mb-0.5">시작</p>
              <p className="text-[14px] font-bold text-dark">
                {formatDateTime(schedule.date, schedule.time)}
              </p>
              {schedule.endDate && (
                <>
                  <p className="text-[12px] font-medium text-gray-500 mt-2 mb-0.5">종료</p>
                  <p className="text-[14px] font-bold text-dark">
                    {formatDateTime(schedule.endDate, schedule.endTime)}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          {schedule.location && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={17} className="text-green-600" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-gray-500 mb-0.5">장소</p>
                <p className="text-[14px] font-bold text-dark">{schedule.location}</p>
              </div>
            </div>
          )}

          {/* Participants (절 행사만) */}
          {isTempleEvent && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Users size={17} className="text-purple-600" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-gray-500 mb-0.5">참석 인원</p>
                <p className="text-[14px] font-bold text-dark">
                  {isUnlimited ? (
                    <span>누구나 참석 가능 <span className="text-gray-400 text-[13px]">({participants.length}명 참석 중)</span></span>
                  ) : (
                    <span>
                      {participants.length} / {maxParticipants}명
                      {isFull && <span className="ml-2 text-red-500 text-[13px]">(마감)</span>}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Invited Users (개인 행사만) */}
          {isPersonalEvent && schedule.invitedEmails && schedule.invitedEmails.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Users size={17} className="text-purple-600" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-gray-500 mb-0.5">초대된 사람</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {schedule.invitedEmails.map((email, idx) => (
                    <div key={idx} className="bg-green-50 px-2.5 py-1 rounded-full text-[12px] font-medium text-green-700 border border-green-200">
                      {email}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Meta */}
          {schedule.meta && (
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-[13px] text-gray-600 whitespace-pre-wrap">{schedule.meta}</p>
            </div>
          )}

          {/* Attachment */}
          {schedule.attachmentUrl && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                <span className="text-[17px]">📎</span>
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-medium text-gray-500 mb-0.5">첨부파일</p>
                <a
                  href={schedule.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-bold text-blue-600 hover:underline break-all"
                >
                  {schedule.attachmentName || '첨부파일 보기'}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* RSVP Buttons (절 행사만, 로그인한 사용자만) */}
        {showRSVPButton && !hasJoined && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5">
            <button
              onClick={() => handleRSVP(true)}
              disabled={isProcessing || isFull}
              className="w-full py-3.5 bg-primary text-white rounded-[14px] font-bold text-[15px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              {isFull ? '정원 마감' : '참석 신청하기'}
            </button>
          </div>
        )}

        {/* 참석 취소 버튼 */}
        {showRSVPButton && hasJoined && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5">
            <button
              onClick={() => handleRSVP(false)}
              disabled={isProcessing}
              className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-[14px] font-bold text-[15px] hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              참석 신청 취소하기
            </button>
          </div>
        )}

        {/* 개인 행사 삭제 버튼 */}
        {canDelete && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5">
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="w-full py-3.5 bg-red-500 text-white rounded-[14px] font-bold text-[15px] hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              일정 삭제하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleDetailModal;
