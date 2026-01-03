import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { saveNotionSettings, getNotionSettings } from '../lib/supabase/database';
import { testNotionConnection } from '../services/notion';

interface NotionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

export default function NotionSettingsModal({ isOpen, onClose, userId }: NotionSettingsModalProps) {
  const [integrationToken, setIntegrationToken] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (isOpen && userId) {
      loadSettings();
    }
  }, [isOpen, userId]);

  const loadSettings = async () => {
    try {
      const settings = await getNotionSettings(userId);
      if (settings) {
        setIntegrationToken(settings.integrationToken);
        setDatabaseId(settings.databaseId);
      }
    } catch (error) {
      console.error('Failed to load Notion settings:', error);
    }
  };

  const handleTest = async () => {
    if (!integrationToken || !databaseId) {
      setTestResult({
        success: false,
        message: 'Integration Token과 Database ID를 모두 입력해주세요.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // 먼저 저장
      await saveNotionSettings(userId, {
        integrationToken,
        databaseId,
      });

      // 연동 테스트
      const result = await testNotionConnection(userId);

      if (result.success) {
        setTestResult({
          success: true,
          message: '✅ Notion 연동 성공! 이제 학생 상담 메모를 Notion에 저장할 수 있습니다.',
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ 연동 실패: ${result.error}`,
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ 오류 발생: ${error.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!integrationToken || !databaseId) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await saveNotionSettings(userId, {
        integrationToken,
        databaseId,
      });

      alert('✅ Notion 설정이 저장되었습니다!');
      onClose();
    } catch (error: any) {
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">🔗 Notion 연동 설정</h2>
            <p className="text-sm text-slate-500 mt-1">학생 상담 메모를 Notion Database에 자동 저장</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      currentStep > step ? 'bg-orange-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Integration 생성 */}
          <div className={`space-y-4 ${currentStep === 1 ? 'block' : 'hidden'}`}>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <h3 className="font-bold text-lg text-slate-900 mb-3">
                Step 1. Notion Integration 생성
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                <li>
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline inline-flex items-center gap-1"
                  >
                    Notion Integrations 페이지
                    <ExternalLink size={14} />
                  </a>
                  로 이동
                </li>
                <li>"+ New integration" 버튼 클릭</li>
                <li>이름: "예약매니아" 입력</li>
                <li>"Submit" 클릭</li>
                <li>생성된 "Internal Integration Token" 복사</li>
              </ol>

              <div className="mt-4 bg-white rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-2">📸 설정 화면 예시 (추가 예정)</p>
                <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                  스크린샷 영역
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              다음 단계로
            </button>
          </div>

          {/* Step 2: Token 입력 */}
          <div className={`space-y-4 ${currentStep === 2 ? 'block' : 'hidden'}`}>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <h3 className="font-bold text-lg text-slate-900 mb-3">
                Step 2. Integration Token 입력
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                방금 복사한 "Internal Integration Token"을 아래에 붙여넣으세요.
              </p>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Integration Token
              </label>
              <input
                type="password"
                value={integrationToken}
                onChange={(e) => setIntegrationToken(e.target.value)}
                placeholder="secret_..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 Token은 암호화되어 안전하게 저장됩니다 (Supabase Vault)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                이전
              </button>
              <button
                onClick={() => {
                  if (!integrationToken) {
                    alert('Integration Token을 입력해주세요.');
                    return;
                  }
                  setCurrentStep(3);
                }}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                다음 단계로
              </button>
            </div>
          </div>

          {/* Step 3: Database 연결 */}
          <div className={`space-y-4 ${currentStep === 3 ? 'block' : 'hidden'}`}>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <h3 className="font-bold text-lg text-slate-900 mb-3">
                Step 3. Notion Database 생성 및 연결
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                <li>Notion에서 새 페이지 생성</li>
                <li>"Table - Inline" 또는 "Table - Full page" 추가</li>
                <li>컬럼 생성:
                  <ul className="list-disc list-inside ml-6 mt-1 text-slate-600">
                    <li>학생명 (Title)</li>
                    <li>날짜 (Date)</li>
                    <li>태그 (Multi-select)</li>
                    <li>학생 ID (Text)</li>
                  </ul>
                </li>
                <li>Database 페이지에서 "..." 메뉴 → "Add connections" → "예약매니아" 선택</li>
                <li>Database URL에서 ID 복사 (32자리 영문+숫자)</li>
              </ol>

              <div className="mt-4 bg-white rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-2">📸 설정 화면 예시 (추가 예정)</p>
                <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                  스크린샷 영역
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Database ID
                </label>
                <input
                  type="text"
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                  placeholder="abc123def456..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 URL 예시: notion.so/myworkspace/<span className="font-mono bg-slate-100 px-1">abc123def456</span>?v=...
                </p>
              </div>

              {/* Test Result */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    testResult.success
                      ? 'bg-orange-50 border-orange-200 text-orange-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle size={20} className="text-orange-600" />
                    ) : (
                      <AlertCircle size={20} className="text-red-600" />
                    )}
                    <p className="text-sm font-medium">{testResult.message}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleTest}
                  disabled={isTesting || !integrationToken || !databaseId}
                  className="flex-1 py-3 bg-slate-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isTesting && <Loader2 size={18} className="animate-spin" />}
                  연동 테스트
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !integrationToken || !databaseId}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 size={18} className="animate-spin" />}
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
