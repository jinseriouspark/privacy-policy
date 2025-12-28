
import React, { useState } from 'react';
import { X, CalendarDays, MapPin, Users, CheckCircle, XCircle, Trash2, Edit2, Ban, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showParticipants, setShowParticipants] = useState(false);
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState('');

  if (!schedule) return null;

  const isTempleEvent = schedule.type === 'temple';
  const isPersonalEvent = schedule.type === 'personal';
  const isBeliever = currentUser?.role === 'believer';
  const participants = schedule.participants || [];
  const maxParticipants = schedule.maxParticipants || 0;
  const isUnlimited = maxParticipants === 0;
  const isFull = !isUnlimited && participants.length >= maxParticipants;
  const hasJoined = currentUser ? participants.includes(currentUser.email) : false;

  // RSVP 버튼 표시 조건: 정수사 일정 && 참석 인원 설정이 있는 경우
  const showRSVPButton = isTempleEvent && currentUser;

  // 삭제 버튼 표시 조건:
  // 1) 개인 행사 && 본인이 만든 경우
  // 2) 정수사 일정 && 스님 관리자인 경우
  const canDelete = currentUser && (
    (isPersonalEvent && schedule.ownerEmail === currentUser.email) ||
    (isTempleEvent && currentUser.role === 'monk')
  );

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

  const handleCancelEvent = async () => {
    if (!schedule.id || isProcessing) return;

    const confirmMsg = participants.length > 0
      ? `참석 신청한 ${participants.length}명의 신청이 모두 취소됩니다.\n일정을 취소하시겠습니까?`
      : '일정을 취소하시겠습니까?';

    if (!confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      // 모든 참석자 제거
      await dbService.cancelAllRSVP(schedule.id);
      alert('일정이 취소되었습니다.');
      await onUpdate();
      onClose();
    } catch (error) {
      console.error('Cancel Event Error:', error);
      alert('일정 취소에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCapacity = async () => {
    if (!schedule.id || isProcessing) return;

    const capacity = parseInt(newCapacity);
    if (isNaN(capacity) || capacity < 0) {
      alert('올바른 숫자를 입력해주세요.');
      return;
    }

    if (capacity > 0 && capacity < participants.length) {
      alert(`현재 참석 인원(${participants.length}명)보다 적은 정원으로 변경할 수 없습니다.`);
      return;
    }

    setIsProcessing(true);
    try {
      await dbService.updateEventCapacity(schedule.id, capacity);
      alert('정원이 변경되었습니다.');
      setIsEditingCapacity(false);
      setNewCapacity('');
      await onUpdate();
    } catch (error) {
      console.error('Update Capacity Error:', error);
      alert('정원 변경에 실패했습니다.');
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
              {isTempleEvent ? '정수사 일정' : '개인 행사'}
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

          {/* Participants (정수사 일정만) */}
          {isTempleEvent && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Users size={17} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[12px] font-medium text-gray-500">참석 인원</p>
                  {currentUser?.role === 'monk' && participants.length > 0 && (
                    <button
                      onClick={() => setShowParticipants(!showParticipants)}
                      className="text-[11px] text-primary font-bold flex items-center gap-1 hover:underline"
                    >
                      {showParticipants ? '숨기기' : '명단 보기'}
                      {showParticipants ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>

                {/* 정원 표시 및 수정 (스님 전용) */}
                {currentUser?.role === 'monk' && !isEditingCapacity && (
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => {
                        setIsEditingCapacity(true);
                        setNewCapacity(maxParticipants.toString());
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Edit2 size={14} className="text-gray-400" />
                    </button>
                  </div>
                )}

                {/* 정원 수정 폼 (스님 전용) */}
                {currentUser?.role === 'monk' && isEditingCapacity && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(e.target.value)}
                        placeholder="0 = 무제한"
                        className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        min="0"
                      />
                      <button
                        onClick={handleUpdateCapacity}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-primary text-white text-[12px] font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingCapacity(false);
                          setNewCapacity('');
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 text-[12px] font-bold rounded-lg hover:bg-gray-200"
                      >
                        취소
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500">현재 참석자: {participants.length}명 (이보다 적게 설정 불가)</p>
                  </div>
                )}

                {/* 일반 사용자 뷰 */}
                {currentUser?.role !== 'monk' && (
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
                )}

                {/* 참석자 명단 (스님 전용) */}
                {currentUser?.role === 'monk' && showParticipants && participants.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-[11px] font-bold text-gray-600 mb-2">참석 신청자 ({participants.length}명)</p>
                    <div className="space-y-1.5">
                      {participants.map((email, idx) => (
                        <div key={idx} className="text-[12px] text-gray-700 bg-white px-2.5 py-1.5 rounded border border-gray-100">
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

        {/* Action Buttons */}
        {(showRSVPButton || canDelete) && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5">
            <div className="space-y-2.5">
              {/* RSVP 버튼 (정수사 일정, 일반 신도) */}
              {showRSVPButton && !hasJoined && !canDelete && (
                <button
                  onClick={() => handleRSVP(true)}
                  disabled={isProcessing || isFull}
                  className="w-full py-3.5 bg-primary text-white rounded-[14px] font-bold text-[15px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  {isFull ? '정원 마감' : '참석 신청하기'}
                </button>
              )}

              {/* 참석 취소 버튼 (정수사 일정, 일반 신도) */}
              {showRSVPButton && hasJoined && !canDelete && (
                <button
                  onClick={() => handleRSVP(false)}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-[14px] font-bold text-[15px] hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  참석 신청 취소하기
                </button>
              )}

              {/* 스님 전용: 일정 취소 버튼 (정수사 일정) */}
              {isTempleEvent && currentUser?.role === 'monk' && participants.length > 0 && (
                <button
                  onClick={handleCancelEvent}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-orange-500 text-white rounded-[14px] font-bold text-[15px] hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Ban size={18} />
                  일정 취소하기 (참석자 {participants.length}명 취소)
                </button>
              )}

              {/* 삭제 버튼 (개인 행사 본인, 정수사 일정 스님) */}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-red-500 text-white rounded-[14px] font-bold text-[15px] hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  일정 삭제하기
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleDetailModal;
