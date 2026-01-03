import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { getNotionIntegrationStatus, connectNotion, disconnectNotion } from '../lib/supabase/google-integrations';

interface NotionIntegrationSettingsProps {
  userId: string;
}

interface NotionStatus {
  connected: boolean;
  connectedAt?: string;
  hasDatabaseId: boolean;
}

const NotionIntegrationSettings: React.FC<NotionIntegrationSettingsProps> = ({ userId }) => {
  const [status, setStatus] = useState<NotionStatus>({
    connected: false,
    hasDatabaseId: false,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotionStatus();
  }, [userId]);

  const loadNotionStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNotionIntegrationStatus(userId);
      setStatus(result);
    } catch (err) {
      console.error('Failed to load Notion status:', err);
      setError('Notion 연동 상태를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    console.log('[handleConnect] Button clicked!');
    console.log('[handleConnect] userId:', userId);

    setConnecting(true);
    setError(null);

    try {
      console.log('[handleConnect] Calling connectNotion...');
      const result = await connectNotion(userId);
      console.log('[handleConnect] connectNotion result:', result);

      if (result.success) {
        await loadNotionStatus();
      } else {
        setError(result.error || 'Notion 연동에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('[handleConnect] Error:', err);
      setError(err.message || 'Notion 연동 중 오류가 발생했습니다.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Notion 연동을 해제하시겠습니까?\n\n저장된 데이터베이스는 유지되지만, 자동 저장이 비활성화됩니다.')) {
      return;
    }

    try {
      const result = await disconnectNotion(userId);

      if (result.success) {
        await loadNotionStatus();
      } else {
        setError(result.error || 'Notion 연동 해제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to disconnect Notion:', err);
      setError(err.message || 'Notion 연동 해제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-orange-500" />
        <span className="ml-2 text-slate-600">Notion 연동 상태 확인 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r bg-orange-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-start gap-3">
          <Database size={24} className="text-orange-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Notion 연동
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Notion과 연동하면 상담 기록과 수업 노트를 자동으로 저장할 수 있습니다.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Base 데이터베이스</strong>: 기본 상담 기록 저장</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Advanced 데이터베이스</strong>: AI 분석 포함 수업 노트</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>업종별 맞춤 분석 (필라테스, 요가, 피트니스 등)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">오류 발생</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Integration Card */}
      <div
        className={`border-2 rounded-xl p-6 transition-all ${
          status.connected
            ? 'border-orange-300 bg-orange-50'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Database size={24} className="text-orange-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                Notion 워크스페이스
                {status.connected && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                    연동됨
                  </span>
                )}
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                {status.connected
                  ? '상담 기록이 Notion에 자동으로 저장됩니다'
                  : 'Notion과 연동하여 데이터를 체계적으로 관리하세요'}
              </p>
              {status.connectedAt && (
                <p className="text-xs text-slate-500 mt-1">
                  연동 시작: {new Date(status.connectedAt).toLocaleDateString('ko-KR')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        {status.connected && (
          <div className="mb-4 space-y-2">
            <div className="flex items-start text-sm text-slate-700">
              <CheckCircle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Base Database</strong>: 기본 상담 기록 자동 저장
              </span>
            </div>
            <div className="flex items-start text-sm text-slate-700">
              <CheckCircle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Advanced Database</strong>: AI 분석 포함 수업 노트
              </span>
            </div>
            <div className="flex items-start text-sm text-slate-700">
              <Sparkles size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                업종별 맞춤 AI 분석 (8가지 코치 타입 지원)
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {status.connected ? (
          <button
            onClick={handleDisconnect}
            className="w-full py-2.5 bg-white border-2 border-red-200 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
          >
            Notion 연동 해제
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-2.5 bg-gradient-to-r bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {connecting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Notion 연동 중...
              </>
            ) : (
              <>
                <ExternalLink size={18} />
                Notion 연동하기
              </>
            )}
          </button>
        )}
      </div>

      {/* Status Summary */}
      {status.connected && status.hasDatabaseId && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-800 font-medium">Notion 데이터베이스 준비 완료</p>
              <p className="text-sm text-orange-700 mt-1">
                상담 메모 작성 시 "Notion에도 저장" 옵션을 활성화하면 자동으로 동기화됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-orange-800">
          <strong>💡 Tip:</strong> Notion 연동 후 첫 저장 시 Base와 Advanced 데이터베이스가 자동으로 생성됩니다.
          Google Drive까지 연동하면 녹화 파일 자동 분석도 가능합니다.
        </p>
      </div>

      {/* Feature Comparison */}
      {!status.connected && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h4 className="font-bold text-slate-900 mb-3 text-sm">Notion 연동 시 제공되는 기능</h4>
          <div className="space-y-2">
            <div className="flex items-start text-sm">
              <CheckCircle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">
                <strong>자동 백업</strong>: 모든 상담 기록을 Notion에 안전하게 보관
              </span>
            </div>
            <div className="flex items-start text-sm">
              <CheckCircle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">
                <strong>체계적 관리</strong>: 날짜, 학생별로 정리된 데이터베이스
              </span>
            </div>
            <div className="flex items-start text-sm">
              <CheckCircle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">
                <strong>AI 인사이트</strong>: Gemini AI가 분석한 수업 피드백 자동 저장
              </span>
            </div>
            <div className="flex items-start text-sm">
              <CheckCircle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">
                <strong>업종별 분석</strong>: 필라테스, 요가 등 8가지 타입별 맞춤 분석
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Note */}
      <div className="text-xs text-slate-500 text-center">
        예약매니아는 사용자의 명시적 허가가 있을 때만 Notion 워크스페이스에 접근하며,
        <br />
        수집된 데이터는 상담 기록 저장 목적으로만 사용됩니다.
        <a href="/privacy" target="_blank" className="text-orange-600 hover:underline ml-1">
          개인정보 처리방침 보기
        </a>
      </div>
    </div>
  );
};

export default NotionIntegrationSettings;
