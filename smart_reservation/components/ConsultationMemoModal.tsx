import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, Database, Sparkles } from 'lucide-react';
import { createStudentMemo, getNotionAccessToken } from '../lib/supabase/database';
import { createLessonNotePage } from '../lib/notion-oauth';

interface ConsultationMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  student: {
    id: string;
    name: string;
    email: string;
  };
  onSave?: () => void; // Optional callback after successful save
}

interface SaveResult {
  success: boolean;
  error?: string;
}

const PRESET_TAGS = ['상담', '피드백', '수업 계획', '목표 설정', '진도 체크', '부상/통증'];

export default function ConsultationMemoModal({
  isOpen,
  onClose,
  userId,
  student,
  onSave,
}: ConsultationMemoModalProps) {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [saveToNotion, setSaveToNotion] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Check Notion connection
  useEffect(() => {
    if (isOpen) {
      checkNotionConnection();
    }
  }, [isOpen, userId]);

  const checkNotionConnection = async () => {
    try {
      const data = await getNotionAccessToken(userId.toString());
      setNotionConnected(!!data?.notion_access_token && !!data?.notion_database_id);
      setSaveToNotion(!!data?.notion_access_token && !!data?.notion_database_id);
    } catch (err) {
      console.error('Failed to check Notion connection:', err);
      setNotionConnected(false);
      setSaveToNotion(false);
    }
  };

  const handleAIAnalyze = async () => {
    if (!content.trim()) {
      alert('메모 내용을 먼저 작성해주세요.');
      return;
    }

    try {
      setAnalyzing(true);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `다음은 ${student.name} 학생의 상담 메모입니다. 내용을 분석하고 인사이트를 제공해주세요.\n\n태그: ${selectedTags.join(', ')}\n\n내용:\n${content}\n\n분석 결과를 다음 형식으로 작성해주세요:\n1. 주요 내용 요약\n2. 학생의 현재 상태 분석\n3. 개선 제안\n4. 다음 액션 아이템`
            }]
          }],
        }),
      });

      if (!response.ok) throw new Error('AI 분석 실패');

      const data = await response.json();
      const analysis = data.candidates[0]?.content?.parts[0]?.text || 'AI 분석 결과를 가져올 수 없습니다.';
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('AI analysis error:', err);
      alert('AI 분석에 실패했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag && !selectedTags.includes(customTag)) {
      setSelectedTags([...selectedTags, customTag]);
      setCustomTag('');
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      alert('메모 내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      // Save to Supabase (existing)
      const result = await createStudentMemo({
        instructorId: userId,
        studentId: student.id,
        studentName: student.name,
        content: content.trim(),
        tags: selectedTags,
        date,
      });

      if (!result.success) {
        setSaveResult({
          success: false,
          error: result.error,
        });
        return;
      }

      // Also save to Notion if enabled
      if (saveToNotion && notionConnected) {
        try {
          const notionData = await getNotionAccessToken(userId.toString());
          if (notionData?.notion_access_token && notionData?.notion_database_id) {
            const lessonContentWithTags = selectedTags.length > 0
              ? `**태그**: ${selectedTags.join(', ')}\n\n${content.trim()}`
              : content.trim();

            await createLessonNotePage({
              accessToken: notionData.notion_access_token,
              databaseId: notionData.notion_database_id,
              studentName: student.name,
              date: date,
              lessonContent: lessonContentWithTags,
              attendanceStatus: 'attended',
              aiAnalysis: aiAnalysis || undefined,
            });
          }
        } catch (notionError) {
          console.error('Notion save failed:', notionError);
          // Don't fail the entire save if Notion fails
        }
      }

      setSaveResult({
        success: true,
      });

      // onSave 콜백 호출 (출석 체크 등에서 사용)
      if (onSave) {
        onSave();
      }

      // 2초 후 자동으로 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: any) {
      setSaveResult({
        success: false,
        error: error.message || 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setSelectedTags([]);
    setDate(new Date().toISOString().split('T')[0]);
    setSaveResult(null);
    setAiAnalysis('');
    setAnalyzing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">상담 메모 작성</h2>
            <p className="text-sm text-slate-500 mt-1">
              {student.name}님과의 상담 내용을 기록합니다
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Student Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {student.name[0]}
              </div>
              <div>
                <p className="font-bold text-slate-900">{student.name}</p>
                <p className="text-sm text-slate-500">{student.email}</p>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              상담 날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              메모 내용 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상담 내용을 자유롭게 작성하세요...&#10;&#10;예시:&#10;- 오늘 자세 교정 진행 (어깨 라인 개선)&#10;- 다음 주부터 강도 UP 예정&#10;- 무릎 통증 주의 필요"
              rows={8}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              작성한 메모는 안전하게 보관됩니다
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              태그 (선택)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="커스텀 태그 추가..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleAddCustomTag}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                추가
              </button>
            </div>

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-2">선택된 태그:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notion Integration Section */}
          {notionConnected && (
            <div className="border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-orange-500" />
                  <label className="block text-sm font-medium text-slate-700">
                    Notion에도 저장
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToNotion}
                    onChange={(e) => setSaveToNotion(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                상담 메모를 Notion 데이터베이스에도 자동으로 저장합니다
              </p>
            </div>
          )}

          {/* AI Analysis Section */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">
                AI 분석 (선택)
              </label>
              <button
                onClick={handleAIAnalyze}
                disabled={analyzing || !content.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    AI 분석하기
                  </>
                )}
              </button>
            </div>
            {aiAnalysis && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                  {aiAnalysis}
                </pre>
              </div>
            )}
            {!aiAnalysis && !analyzing && (
              <p className="text-xs text-slate-500">
                메모 내용을 작성한 후 AI 분석을 요청하면 인사이트를 제공합니다
              </p>
            )}
          </div>

          {/* Save Result */}
          {saveResult && (
            <div
              className={`p-4 rounded-xl border ${
                saveResult.success
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {saveResult.success ? (
                  <CheckCircle size={20} className="text-orange-600 mt-0.5" />
                ) : (
                  <X size={20} className="text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      saveResult.success ? 'text-orange-800' : 'text-red-800'
                    }`}
                  >
                    {saveResult.success
                      ? '메모가 저장되었습니다!'
                      : `저장 실패: ${saveResult.error}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 size={18} className="animate-spin" />}
              {isSaving ? '메모 저장 중...' : '메모 저장'}
            </button>
          </div>

          {/* Help Text */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-orange-800">
              <strong>Tip:</strong> 작성한 메모는 데이터베이스에 안전하게 저장됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
