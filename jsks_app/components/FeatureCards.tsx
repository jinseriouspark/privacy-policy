
import React from 'react';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { APP_STRINGS } from '../constants';
import { AppConfig, VideoContent } from '../types';

interface FeatureCardsProps {
  onStartPractice: () => void;
  onOpenDharma: () => void;
  appConfig: AppConfig | null;
  latestVideo: VideoContent | null;
  progressLabel: string; // New prop for dynamic progress
  dharmaProgress?: { listened: number; total: number }; // 법문 진행률
  isCompleted?: boolean; // 오늘의 수행 완료 여부
}

const FeatureCards: React.FC<FeatureCardsProps> = ({ onStartPractice, onOpenDharma, appConfig, latestVideo, progressLabel, dharmaProgress, isCompleted = false }) => {
  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Practice Card */}
      <button
        className={`group w-full relative rounded-[16px] p-4 text-left shadow-lg active:scale-[0.98] transition-all duration-300 overflow-hidden ${
          isCompleted
            ? 'bg-primary shadow-[0_20px_40px_rgba(111,166,138,0.4)]'
            : 'bg-white border-[2px] border-primary shadow-[0_16px_32px_rgba(111,166,138,0.15)]'
        }`}
        onClick={onStartPractice}
      >
        {isCompleted && <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />}
        <div className="relative z-10 flex flex-col h-full justify-between gap-3">
          <div className="flex justify-between items-start">
             <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm mb-1.5 ${
                  isCompleted
                    ? 'bg-white/20 text-white'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {progressLabel}
                </span>
                <h3 className={`text-[16px] font-bold leading-tight tracking-tight max-w-[90%] whitespace-nowrap ${
                  isCompleted ? 'text-white' : 'text-primary'
                }`}>
                  {appConfig?.practiceCardTitle || APP_STRINGS.cardDarkTitle}
                </h3>
                <p className={`text-[11px] mt-1 font-medium ${
                  isCompleted ? 'text-white/90' : 'text-primary/70'
                }`}>
                  {appConfig?.practiceCardSub || APP_STRINGS.cardDarkSub}
                </p>
             </div>
             {/* Icon Removed per request */}
          </div>
          <div className={`flex items-center gap-1 font-semibold text-[11px] ${
            isCompleted ? 'text-white' : 'text-primary'
          }`}>
            <span>시작하기</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </button>

      {/* Dharma Card */}
      <button
        className="group w-full relative bg-[#FFEDD5] rounded-[16px] p-4 text-left shadow-[0_16px_32px_rgba(232,168,124,0.15)] active:scale-[0.98] transition-all duration-300"
        onClick={onOpenDharma}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5 w-3/4">
            <h3 className="text-dark text-[13px] font-bold leading-tight line-clamp-2">
              오늘의 법문
            </h3>
             <p className="text-dark/60 text-[10px] font-medium">
              법문을 들어보세요
            </p>
          </div>
          <div className="bg-secondary p-2 rounded-full text-white shadow-lg shadow-secondary/30 group-hover:scale-110 transition-transform">
            <PlayCircle size={20} fill="currentColor" className="text-white" />
          </div>
        </div>

      </button>
    </div>
  );
};

export default FeatureCards;
