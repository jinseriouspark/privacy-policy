import React, { useState, useEffect } from 'react';
import { User, Instructor } from '../types';
import { postToGAS } from '../services/api';
import { Calendar, Clock, Loader2, CheckCircle2, Mail, User as UserIcon, AlertTriangle } from 'lucide-react';

interface PublicBookingProps {
  instructorEmail: string;
}

const PublicBooking: React.FC<PublicBookingProps> = ({ instructorEmail }) => {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'booking'>('info');

  useEffect(() => {
    fetchInstructorInfo();
  }, [instructorEmail]);

  const fetchInstructorInfo = async () => {
    setLoading(true);
    try {
      const result = await postToGAS<Instructor>({
        action: 'getInstructorPublicInfo',
        instructorEmail
      });
      setInstructor(result);
    } catch (err: any) {
      setError(err.message || '강사 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
        <p className="text-slate-500 text-sm">강사 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-slate-500 text-sm">{error || '올바른 예약 링크로 접속해주세요.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructor Info Card */}
      <div className="bg-gradient-to-br from-orange-50 to-indigo-50 rounded-2xl p-6 border border-orange-100">
        <div className="flex items-start space-x-4">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={instructor.name}
              className="w-16 h-16 rounded-full border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-sm">
              {instructor.name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{instructor.name}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{instructor.bio || '전문 코치입니다.'}</p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center">
          <Calendar size={18} className="mr-2 text-orange-500" />
          예약 안내
        </h3>
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start">
            <Clock size={16} className="mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-slate-700">세션 시간</p>
              <p>1회당 60분</p>
            </div>
          </div>
          <div className="flex items-start">
            <Mail size={16} className="mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-slate-700">예약 확정</p>
              <p>예약 시 자동으로 Google Meet 링크가 이메일로 발송됩니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => setStep('booking')}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
      >
        예약하기
      </button>

      <div className="text-center">
        <p className="text-xs text-slate-400">
          예약하려면 로그인이 필요합니다
        </p>
      </div>
    </div>
  );
};

export default PublicBooking;
