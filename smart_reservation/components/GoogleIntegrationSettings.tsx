import React, { useState, useEffect } from 'react';
import { Video, HardDrive, FileText, CheckCircle, AlertCircle, Loader2, ExternalLink, Settings } from 'lucide-react';
import { getGoogleIntegrationStatus, connectGoogleService, disconnectGoogleService } from '../lib/supabase/google-integrations';

interface GoogleIntegrationSettingsProps {
  userId: string;
}

interface IntegrationStatus {
  meet: boolean;
  drive: boolean;
  docs: boolean;
  connectedAt?: string;
  folderName?: string;
}

const GoogleIntegrationSettings: React.FC<GoogleIntegrationSettingsProps> = ({ userId }) => {
  const [status, setStatus] = useState<IntegrationStatus>({
    meet: false,
    drive: false,
    docs: false,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<'meet' | 'drive' | 'docs' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrationStatus();
  }, [userId]);

  const loadIntegrationStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getGoogleIntegrationStatus(userId);
      setStatus(result);
    } catch (err) {
      console.error('Failed to load integration status:', err);
      setError('연동 상태를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (service: 'meet' | 'drive' | 'docs') => {
    setConnecting(service);
    setError(null);

    try {
      // 필요한 OAuth 스코프 정의
      const scopes: Record<string, string[]> = {
        meet: [
          'https://www.googleapis.com/auth/meetings.space.readonly',
        ],
        drive: [
          'https://www.googleapis.com/auth/drive.readonly',
        ],
        docs: [
          'https://www.googleapis.com/auth/documents.readonly',
        ],
      };

      // OAuth 플로우 시작
      const result = await connectGoogleService(userId, service, scopes[service]);

      if (result.success) {
        await loadIntegrationStatus();
      } else {
        setError(result.error || '연동에 실패했습니다.');
      }
    } catch (err: any) {
      console.error(`Failed to connect ${service}:`, err);
      setError(err.message || '연동 중 오류가 발생했습니다.');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (service: 'meet' | 'drive' | 'docs') => {
    if (!confirm(`${getServiceName(service)} 연동을 해제하시겠습니까?\n\n자동 녹화 분석 기능이 비활성화됩니다.`)) {
      return;
    }

    try {
      const result = await disconnectGoogleService(userId, service);

      if (result.success) {
        await loadIntegrationStatus();
      } else {
        setError(result.error || '연동 해제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error(`Failed to disconnect ${service}:`, err);
      setError(err.message || '연동 해제 중 오류가 발생했습니다.');
    }
  };

  const getServiceName = (service: 'meet' | 'drive' | 'docs'): string => {
    const names = {
      meet: 'Google Meet',
      drive: 'Google Drive',
      docs: 'Google Docs',
    };
    return names[service];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-orange-500" />
        <span className="ml-2 text-slate-600">연동 상태 확인 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-slate-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-start gap-3">
          <Settings size={24} className="text-orange-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Google 서비스 연동 (선택 사항)
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Google Meet, Drive, Docs를 연동하면 <strong>녹화 파일 자동 분석</strong> 기능을 사용할 수 있습니다.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>수업 녹화 파일을 자동으로 찾아 예약과 매칭</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>음성 전사 파일(.vtt)을 자동으로 추출</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>AI가 수업 내용을 분석하여 Notion에 저장</span>
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

      {/* Integration Cards */}
      <div className="grid gap-4">
        {/* Google Meet */}
        <IntegrationCard
          icon={<Video size={24} className="text-orange-600" />}
          title="Google Meet"
          description="녹화 파일 및 참가자 정보를 가져옵니다"
          connected={status.meet}
          connecting={connecting === 'meet'}
          onConnect={() => handleConnect('meet')}
          onDisconnect={() => handleDisconnect('meet')}
          features={[
            '회의 녹화 파일 자동 감지',
            '참가자 목록 확인',
            '회의 시간 및 길이 정보',
          ]}
        />

        {/* Google Drive */}
        <IntegrationCard
          icon={<HardDrive size={24} className="text-orange-600" />}
          title="Google Drive"
          description="녹화 파일 및 전사 파일을 다운로드합니다"
          connected={status.drive}
          connecting={connecting === 'drive'}
          onConnect={() => handleConnect('drive')}
          onDisconnect={() => handleDisconnect('drive')}
          features={[
            '녹화 파일(.mp4) 다운로드',
            '전사 파일(.vtt) 자동 파싱',
            '파일 자동 정리 및 보관',
          ]}
          folderName={status.folderName}
        />

        {/* Google Docs */}
        <IntegrationCard
          icon={<FileText size={24} className="text-orange-600" />}
          title="Google Docs"
          description="전사 문서의 내용을 읽어옵니다"
          connected={status.docs}
          connecting={connecting === 'docs'}
          onConnect={() => handleConnect('docs')}
          onDisconnect={() => handleDisconnect('docs')}
          features={[
            '전사 문서 텍스트 추출',
            'AI 분석용 데이터 준비',
            '타임스탬프 포함 전사',
          ]}
        />
      </div>

      {/* Status Summary */}
      {(status.meet || status.drive || status.docs) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-800 font-medium">자동 분석 활성화됨</p>
              <p className="text-sm text-orange-700 mt-1">
                Google Meet에서 녹화를 완료하면 자동으로 분석하여 Notion에 저장됩니다.
                {status.connectedAt && (
                  <span className="block mt-1 text-xs opacity-75">
                    연동 시작: {new Date(status.connectedAt).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-orange-800">
          <strong>💡 Tip:</strong> 세 가지 서비스를 모두 연동해야 자동 분석 기능이 완벽하게 작동합니다.
          Meet은 녹화 정보를, Drive는 파일 접근을, Docs는 전사 내용을 제공합니다.
        </p>
      </div>

      {/* Privacy Note */}
      <div className="text-xs text-slate-500 text-center">
        예약매니아는 사용자의 명시적 허가가 있을 때만 Google 서비스에 접근하며,
        <br />
        수집된 데이터는 수업 분석 목적으로만 사용됩니다.
        <a href="/privacy" target="_blank" className="text-orange-600 hover:underline ml-1">
          개인정보 처리방침 보기
        </a>
      </div>
    </div>
  );
};

interface IntegrationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  features: string[];
  folderName?: string;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  icon,
  title,
  description,
  connected,
  connecting,
  onConnect,
  onDisconnect,
  features,
  folderName,
}) => {
  return (
    <div
      className={`border-2 rounded-xl p-5 transition-all ${
        connected
          ? 'border-green-300 bg-orange-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              {title}
              {connected && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                  연동됨
                </span>
              )}
            </h4>
            <p className="text-sm text-slate-600 mt-1">{description}</p>
            {folderName && connected && (
              <p className="text-xs text-slate-500 mt-1">
                📁 폴더: {folderName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Features List */}
      <ul className="space-y-1.5 mb-4">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start text-sm text-slate-600">
            <CheckCircle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      {connected ? (
        <button
          onClick={onDisconnect}
          className="w-full py-2.5 bg-white border-2 border-red-200 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
        >
          연동 해제
        </button>
      ) : (
        <button
          onClick={onConnect}
          disabled={connecting}
          className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-slate-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {connecting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              연동 중...
            </>
          ) : (
            <>
              <ExternalLink size={18} />
              {title} 연동하기
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default GoogleIntegrationSettings;
