import React, { useState, useEffect } from 'react';
import { X, Save, Key, Phone, MessageSquare, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { getSolapiSettings, saveSolapiSettings, SolapiSettings } from '../../lib/supabase/database';

interface SolapiSettingsModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const SolapiSettingsModal: React.FC<SolapiSettingsModalProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<SolapiSettings>>({
    apiKey: '',
    apiSecret: '',
    senderPhone: '',
    kakaoSenderKey: '',
    templateId: 'booking_link_v1',
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, userId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSolapiSettings(userId);
      if (data) {
        setSettings({
          apiKey: data.apiKey,
          apiSecret: data.apiSecret,
          senderPhone: data.senderPhone,
          kakaoSenderKey: data.kakaoSenderKey || '',
          templateId: data.templateId || 'booking_link_v1',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.apiKey || !settings.apiSecret || !settings.senderPhone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      await saveSolapiSettings(userId, {
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
        senderPhone: settings.senderPhone,
        kakaoSenderKey: settings.kakaoSenderKey,
        templateId: settings.templateId,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50">
      <div className="w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto pb-safe">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Solapi 설정</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-16 bg-slate-200 rounded"></div>
              <div className="h-16 bg-slate-200 rounded"></div>
              <div className="h-16 bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Solapi API 키는 암호화되어 안전하게 저장됩니다</p>
                  <p className="text-blue-700">
                    <a
                      href="https://console.solapi.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Solapi 콘솔
                    </a>
                    에서 API 키를 발급받으세요
                  </p>
                </div>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Key size={16} />
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="NCSXXXXXXXXXXXXXXXXX"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* API Secret */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Key size={16} />
                API Secret <span className="text-red-500">*</span>
              </label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={settings.apiSecret}
                onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
                placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Show/Hide Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showSecrets"
                checked={showSecrets}
                onChange={(e) => setShowSecrets(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="showSecrets" className="text-sm text-slate-600">
                API 키 보기
              </label>
            </div>

            {/* Sender Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Phone size={16} />
                발신번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={settings.senderPhone}
                onChange={(e) => setSettings({ ...settings, senderPhone: e.target.value })}
                placeholder="01012345678"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">
                Solapi에 등록된 발신번호를 입력하세요 (하이픈 제외)
              </p>
            </div>

            {/* Kakao Sender Key */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <MessageSquare size={16} />
                카카오 발신프로필 키 (선택)
              </label>
              <input
                type="text"
                value={settings.kakaoSenderKey}
                onChange={(e) => setSettings({ ...settings, kakaoSenderKey: e.target.value })}
                placeholder="알림톡 발신프로필 키"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">
                카카오 알림톡을 사용하려면 입력하세요
              </p>
            </div>

            {/* Template ID */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <FileText size={16} />
                템플릿 ID
              </label>
              <input
                type="text"
                value={settings.templateId}
                onChange={(e) => setSettings({ ...settings, templateId: e.target.value })}
                placeholder="booking_link_v1"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">
                Solapi에 등록한 템플릿 ID를 입력하세요
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || saveSuccess}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                saveSuccess
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle size={20} />
                  저장 완료!
                </>
              ) : saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <Save size={20} />
                  설정 저장
                </>
              )}
            </button>

            {/* Guide Link */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-2">설정 방법:</p>
              <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                <li>Solapi 콘솔에서 API 키/시크릿 생성</li>
                <li>발신번호 등록 (SMS 용)</li>
                <li>카카오 알림톡 발신프로필 생성 (선택)</li>
                <li>템플릿 등록 및 ID 복사</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
