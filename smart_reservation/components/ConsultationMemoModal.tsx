import React, { useState } from 'react';
import { X, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { createStudentMemo } from '../services/notion';

interface ConsultationMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

const PRESET_TAGS = ['상담', '피드백', '수업 계획', '목표 설정', '진도 체크', '부상/통증'];

export default function ConsultationMemoModal({
  isOpen,
  onClose,
  userId,
  student,
}: ConsultationMemoModalProps) {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; pageUrl?: string; error?: string } | null>(null);

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
      const result = await createStudentMemo(userId, {
        studentName: student.name,
        studentId: student.id,
        content: content.trim(),
        tags: selectedTags,
        date,
      });

      if (result.success) {
        setSaveResult({
          success: true,
          pageUrl: result.pageUrl,
        });

        // 2초 후 자동으로 모달 닫기
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setSaveResult({
          success: false,
          error: result.error,
        });
      }
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">📝 상담 메모 작성</h2>
            <p className="text-sm text-slate-500 mt-1">
              {student.name}님과의 상담 내용을 Notion에 저장합니다
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
              💡 작성한 메모는 Notion Database에 페이지로 저장됩니다
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

          {/* Save Result */}
          {saveResult && (
            <div
              className={`p-4 rounded-xl border ${
                saveResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {saveResult.success ? (
                  <CheckCircle size={20} className="text-green-600 mt-0.5" />
                ) : (
                  <X size={20} className="text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      saveResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {saveResult.success
                      ? '✅ Notion에 저장되었습니다!'
                      : `❌ 저장 실패: ${saveResult.error}`}
                  </p>
                  {saveResult.pageUrl && (
                    <a
                      href={saveResult.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      Notion에서 보기
                      <ExternalLink size={12} />
                    </a>
                  )}
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
              {isSaving ? 'Notion에 저장 중...' : 'Notion에 저장'}
            </button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> Notion 연동이 되지 않았다면 프로필/설정에서 먼저 Notion을 연동해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
