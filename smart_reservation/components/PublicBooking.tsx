import React, { useState, useEffect } from 'react';
import { User, Instructor, Coaching } from '../types';
import { Calendar, Clock, Loader2, CheckCircle2, Mail, User as UserIcon, AlertTriangle, BookOpen, ChevronRight } from 'lucide-react';
import { getInstructorCoachings } from '../lib/supabase/database';

interface PublicBookingProps {
  instructor: Instructor;
  user: User | null;
  onSelectCoaching: (coachingSlug: string) => void;
  onBack: () => void;
}

const PublicBooking: React.FC<PublicBookingProps> = ({ instructor, user, onSelectCoaching, onBack }) => {
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoachings();
  }, [instructor.id]);

  const fetchCoachings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInstructorCoachings(instructor.id);
      // Filter only active coachings
      const activeCoachings = data.filter(c => c.status === 'active');
      setCoachings(activeCoachings);
    } catch (err: any) {
      console.error('Failed to fetch coachings:', err);
      setError(err.message || '코칭 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-indigo-50">
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
          <p className="text-slate-500 text-sm">코칭 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-indigo-50 p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors"
        >
          ← 돌아가기
        </button>

        {/* Instructor Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="flex items-start space-x-4">
            {instructor.avatarUrl ? (
              <img
                src={instructor.avatarUrl}
                alt={instructor.name}
                className="w-20 h-20 rounded-full border-2 border-orange-200 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-md">
                {instructor.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{instructor.name}</h1>
              <p className="text-slate-600 leading-relaxed">{instructor.bio || '전문 코치입니다.'}</p>
            </div>
          </div>
        </div>

        {/* Coachings List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={24} className="text-orange-500" />
              예약 가능한 코칭
            </h2>
            {user && (
              <div className="text-sm text-slate-500">
                로그인: {user.name}
              </div>
            )}
          </div>

          {coachings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium mb-2">현재 예약 가능한 코칭이 없습니다</p>
              <p className="text-sm text-slate-400">강사가 코칭을 추가하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {coachings.map((coaching) => (
                <button
                  key={coaching.id}
                  onClick={() => onSelectCoaching(coaching.slug)}
                  className="bg-white rounded-xl border-2 border-slate-200 hover:border-orange-500 p-6 text-left transition-all hover:shadow-lg group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                        {coaching.title}
                      </h3>
                      {coaching.description && (
                        <p className="text-slate-600 text-sm leading-relaxed mb-3">
                          {coaching.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>{coaching.duration}분</span>
                        </div>
                        <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                          {coaching.type === 'private' ? '개인 레슨' : '그룹 수업'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={24} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Login Notice */}
          {!user && coachings.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-800">
                <Mail size={14} className="inline mr-1" />
                예약하려면 Google 계정으로 로그인해주세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
