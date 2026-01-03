import React, { useState, useEffect } from 'react';
import { X, Sparkles, Bell } from 'lucide-react';

interface AnnouncementModalProps {
  title: string;
  content: string;
  buttonText?: string;
  onClose?: () => void;
  storageKey?: string; // 로컬스토리지 키 (하루 동안 숨김용)
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  title,
  content,
  buttonText = '확인',
  onClose,
  storageKey = 'announcement_closed'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 오늘 날짜 체크
    const today = new Date().toDateString();
    const closedDate = localStorage.getItem(storageKey);

    // 오늘 이미 닫았으면 표시 안 함
    if (closedDate === today) {
      return;
    }

    // 1초 후 모달 표시 (페이지 로드 후 자연스럽게)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [storageKey]);

  const handleClose = () => {
    setIsVisible(false);

    // 오늘 날짜 저장 (하루 동안 안 보기)
    const today = new Date().toDateString();
    localStorage.setItem(storageKey, today);

    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-fadeIn">
      {/* 배경 클릭으로 닫기 */}
      <div
        className="absolute inset-0"
        onClick={handleClose}
      />

      {/* 모달 콘텐츠 */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 그라데이션 헤더 */}
        <div className="bg-gradient-to-r bg-orange-500 p-6 text-white relative overflow-hidden">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>

          {/* 아이콘 & 제목 */}
          <div className="relative flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-orange-100 mt-1">예약매니아 공지</p>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6">
          <div className="text-slate-700 leading-relaxed whitespace-pre-line">
            {content}
          </div>

          {/* 버튼 */}
          <button
            onClick={handleClose}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-r bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {buttonText}
          </button>

          {/* 하루 동안 보지 않기 안내 */}
          <p className="text-xs text-slate-400 text-center mt-3">
            닫으시면 오늘 하루 동안 표시되지 않습니다
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementModal;
