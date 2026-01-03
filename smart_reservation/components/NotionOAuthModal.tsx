import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Database, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getNotionAccessToken,
  saveNotionDatabaseId,
  deleteNotionAccessToken,
} from '../lib/supabase/database';
import { initiateNotionOAuth } from '../lib/notion-oauth';

interface NotionOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructorId: string;
}

export default function NotionOAuthModal({
  isOpen,
  onClose,
  instructorId,
}: NotionOAuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [notionData, setNotionData] = useState<{
    workspace_name: string | null;
    database_id: string | null;
    access_token: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing Notion connection
  useEffect(() => {
    if (isOpen) {
      loadNotionData();
    }
  }, [isOpen, instructorId]);

  const loadNotionData = async () => {
    try {
      setLoading(true);
      const data = await getNotionAccessToken(instructorId);
      setNotionData({
        workspace_name: data?.notion_workspace_name || null,
        database_id: data?.notion_database_id || null,
        access_token: data?.notion_access_token || null,
      });
    } catch (err) {
      console.error('Failed to load Notion data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectNotion = () => {
    try {
      setError(null);
      initiateNotionOAuth(instructorId);
    } catch (err) {
      setError('Notion 연동을 시작할 수 없습니다.');
      console.error(err);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Notion 연동을 해제하시겠습니까?')) return;

    try {
      setLoading(true);
      setError(null);
      await deleteNotionAccessToken(instructorId);
      setNotionData(null);
    } catch (err) {
      setError('Notion 연동 해제에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseSelect = async (databaseId: string) => {
    try {
      setLoading(true);
      setError(null);
      await saveNotionDatabaseId(instructorId, databaseId);
      await loadNotionData();
    } catch (err) {
      setError('데이터베이스 선택에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isConnected = notionData?.access_token;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Notion 연동</h2>
              <p className="text-xs text-slate-500">수업 노트를 Notion에 자동 저장</p>
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
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : isConnected ? (
            <>
              {/* Connected Status */}
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900">
                    연동 완료
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    워크스페이스: {notionData.workspace_name}
                  </p>
                </div>
              </div>

              {/* Database Info */}
              {notionData.database_id && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    연결된 데이터베이스
                  </label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-600">
                      수업 노트가 자동으로 저장됩니다
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      ID: {notionData.database_id}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <a
                  href={`https://notion.so`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Notion에서 열기
                </a>

                <button
                  onClick={handleDisconnect}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-colors"
                >
                  연동 해제
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not Connected */}
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Notion과 연동하기
                  </h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    출석 체크 후 수업 노트를 작성하면 자동으로 Notion 데이터베이스에 저장됩니다
                  </p>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    포함 기능
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>출석 체크 후 자동 노트 생성</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>AI 분석 및 인사이트</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>수업 내용, 숙제, 다음 계획 관리</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>PDF 내보내기 및 이메일 발송</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleConnectNotion}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Notion 연동하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
