import React, { useState, useEffect } from 'react';
import { X, FileText, Save, Sparkles, Loader2 } from 'lucide-react';
import { getNotionAccessToken } from '../lib/supabase/database';
import { createLessonNotePage, getIndustryPrompt } from '../lib/notion-oauth';

interface LessonNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructorId: string;
  studentName: string;
  reservationDate: string;
  attendanceStatus: 'attended' | 'absent' | 'late';
  onSuccess?: () => void;
}

const COACH_INDUSTRIES = ['필라테스', '요가', '피트니스', '음악', '언어', '미술', '댄스', '기타'] as const;
const PROGRESS_LEVELS = ['매우 우수', '우수', '보통', '개선 필요', '많은 개선 필요'] as const;

export default function LessonNoteModal({
  isOpen,
  onClose,
  instructorId,
  studentName,
  reservationDate,
  attendanceStatus,
  onSuccess,
}: LessonNoteModalProps) {
  const [coachIndustry, setCoachIndustry] = useState<typeof COACH_INDUSTRIES[number]>('기타');
  const [lessonContent, setLessonContent] = useState('');
  const [studentGoal, setStudentGoal] = useState('');
  const [feedback, setFeedback] = useState('');
  const [homework, setHomework] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [progressLevel, setProgressLevel] = useState<typeof PROGRESS_LEVELS[number] | ''>('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check Notion connection
  useEffect(() => {
    if (isOpen) {
      checkNotionConnection();
    }
  }, [isOpen, instructorId]);

  const checkNotionConnection = async () => {
    try {
      const data = await getNotionAccessToken(instructorId);
      setNotionConnected(!!data?.notion_access_token);
    } catch (err) {
      console.error('Failed to check Notion connection:', err);
      setNotionConnected(false);
    }
  };

  const handleAIAnalyze = async () => {
    if (!lessonContent.trim()) {
      setError('수업 내용을 먼저 작성해주세요.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      // Get industry-specific prompt
      const prompt = getIndustryPrompt(coachIndustry, lessonContent, studentName);

      // Call Gemini API for analysis
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
        }),
      });

      if (!response.ok) {
        throw new Error('AI 분석 실패');
      }

      const data = await response.json();
      const analysis = data.candidates[0]?.content?.parts[0]?.text || 'AI 분석 결과를 가져올 수 없습니다.';
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('AI analysis error:', err);
      setError('AI 분석에 실패했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!lessonContent.trim()) {
      setError('수업 내용을 입력해주세요.');
      return;
    }

    if (!notionConnected) {
      setError('Notion이 연동되지 않았습니다. 먼저 Notion을 연동해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get Notion access token and database ID
      const notionData = await getNotionAccessToken(instructorId);
      if (!notionData?.notion_access_token || !notionData?.notion_database_id) {
        throw new Error('Notion 데이터베이스가 설정되지 않았습니다.');
      }

      // Create Notion page
      await createLessonNotePage({
        accessToken: notionData.notion_access_token,
        databaseId: notionData.notion_database_id,
        studentName,
        date: reservationDate,
        lessonContent,
        studentGoal: studentGoal || undefined,
        feedback: feedback || undefined,
        homework: homework || undefined,
        nextPlan: nextPlan || undefined,
        attendanceStatus,
        recordingUrl: recordingUrl || undefined,
        aiAnalysis: aiAnalysis || undefined,
        coachIndustry,
        progressLevel: progressLevel || undefined,
      });

      // Success
      if (onSuccess) onSuccess();
      onClose();

      // Reset form
      setCoachIndustry('기타');
      setLessonContent('');
      setStudentGoal('');
      setFeedback('');
      setHomework('');
      setNextPlan('');
      setProgressLevel('');
      setRecordingUrl('');
      setAiAnalysis('');
    } catch (err: any) {
      console.error('Failed to save lesson note:', err);
      setError(err.message || '수업 노트 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const attendanceStatusMap = {
    attended: '출석',
    absent: '결석',
    late: '지각',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br bg-orange-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">수업 노트 작성</h2>
              <p className="text-xs text-slate-500">{studentName} · {reservationDate} · {attendanceStatusMap[attendanceStatus]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {!notionConnected && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ Notion이 연동되지 않았습니다. Dashboard에서 Notion을 먼저 연동해주세요.
              </p>
            </div>
          )}

          {/* Coach Industry */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              코치 업종 <span className="text-red-500">*</span>
            </label>
            <select
              value={coachIndustry}
              onChange={(e) => setCoachIndustry(e.target.value as typeof COACH_INDUSTRIES[number])}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {COACH_INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              업종을 선택하면 맞춤형 AI 분석을 받을 수 있습니다.
            </p>
          </div>

          {/* Lesson Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              수업 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              placeholder="오늘 진행한 수업 내용을 작성해주세요.&#10;예: 플랭크 자세 교정, 스쿼트 10회 3세트, 복부 운동 등"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={5}
            />
          </div>

          {/* Student Goal/State */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              학생 상태 / 목표 (선택)
            </label>
            <textarea
              value={studentGoal}
              onChange={(e) => setStudentGoal(e.target.value)}
              placeholder="학생의 현재 상태나 목표를 기록해주세요.&#10;예: 다이어트 목표, 체력 향상, 자세 교정, 유연성 개선"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              주요 피드백 (선택)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="학생에게 전달한 주요 피드백이나 관찰 사항을 기록해주세요.&#10;예: 자세가 많이 좋아졌음, 호흡 조절 필요"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Homework */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              숙제 (선택)
            </label>
            <textarea
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="다음 수업까지 학생이 해야 할 과제가 있다면 적어주세요.&#10;예: 매일 플랭크 30초 3세트, 스트레칭 10분"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Next Plan */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              다음 수업 계획 (선택)
            </label>
            <textarea
              value={nextPlan}
              onChange={(e) => setNextPlan(e.target.value)}
              placeholder="다음 수업에서 진행할 내용을 미리 계획해주세요.&#10;예: 코어 강화 운동 집중, 유연성 개선 프로그램"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Progress Level */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              진전도 (선택)
            </label>
            <select
              value={progressLevel}
              onChange={(e) => setProgressLevel(e.target.value as typeof PROGRESS_LEVELS[number] | '')}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">선택하지 않음</option>
              {PROGRESS_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Recording URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              녹화 링크 (선택)
            </label>
            <input
              type="url"
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              placeholder="Google Meet 녹화 링크를 입력하세요 (향후 자동 연동 예정)"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-slate-500">
              🔜 향후 Google Drive 연동 시 자동으로 녹화 파일을 감지하고 전사합니다.
            </p>
          </div>

          {/* AI Analysis Section */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-slate-700">
                AI 분석 (선택)
              </label>
              <button
                onClick={handleAIAnalyze}
                disabled={analyzing || !lessonContent.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI 분석하기
                  </>
                )}
              </button>
            </div>
            {aiAnalysis && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                  {aiAnalysis}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !notionConnected || !lessonContent.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Notion에 저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
