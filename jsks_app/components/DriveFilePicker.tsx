import React, { useState, useEffect } from 'react';
import { X, Search, File, FileText, Image, Video, Music, Loader, Folder, ChevronLeft } from 'lucide-react';
import { driveService, DriveFile } from '../services/googleDrive';

interface DriveFilePickerProps {
  folderId: string;
  onSelect: (fileUrl: string, fileName: string) => void;
  onClose: () => void;
}

const DriveFilePicker: React.FC<DriveFilePickerProps> = ({ folderId: initialFolderId, onSelect, onClose }) => {
  const [currentFolderId, setCurrentFolderId] = useState(initialFolderId);
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [currentFolderId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const driveFiles = await driveService.listFilesInFolder(currentFolderId);
      setFiles(driveFiles);
      setFilteredFiles(driveFiles);
    } catch (err: any) {
      console.error('Failed to load Drive files:', err);

      if (err.message.includes('popup_closed')) {
        setError('드라이브 권한 요청이 취소되었습니다.\n\n"다시 시도" 버튼을 눌러 권한을 허용해주세요.');
      } else if (err.message.includes('401') || err.message.includes('access token')) {
        setError('드라이브 접근 권한이 만료되었습니다.\n\n"다시 시도" 버튼을 눌러 권한을 다시 허용해주세요.');
      } else {
        setError(err.message || '파일을 불러오는데 실패했습니다.\n\n인터넷 연결을 확인하고 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (file: DriveFile) => {
    // 폴더인 경우
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      // 현재 폴더를 히스토리에 추가
      setFolderHistory(prev => [...prev, { id: currentFolderId, name: '이전 폴더' }]);
      // 새 폴더로 이동
      setCurrentFolderId(file.id);
    } else {
      // 파일인 경우 선택
      onSelect(file.webViewLink, file.name);
      onClose();
    }
  };

  const goBack = () => {
    if (folderHistory.length > 0) {
      const lastFolder = folderHistory[folderHistory.length - 1];
      setCurrentFolderId(lastFolder.id);
      setFolderHistory(prev => prev.slice(0, -1));
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder size={20} className="text-yellow-500" />;
    if (mimeType.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video size={20} className="text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music size={20} className="text-green-500" />;
    if (mimeType.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    if (mimeType.includes('document')) return <FileText size={20} className="text-blue-600" />;
    return <File size={20} className="text-gray-500" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const size = parseInt(bytes);
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)}MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  };


  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-[24px] rounded-t-[24px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {folderHistory.length > 0 && (
                <button
                  onClick={goBack}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} className="text-gray-600" />
                </button>
              )}
              <h3 className="text-2xl font-bold text-dark">드라이브 파일 선택</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="파일 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader size={32} className="text-primary animate-spin" />
              <p className="text-gray-500 text-sm">파일 목록을 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <X size={32} className="text-red-500" />
              </div>
              <p className="text-red-600 text-sm font-medium">{error}</p>
              <button
                onClick={loadFiles}
                className="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && filteredFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <File size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">
                {searchQuery ? '검색 결과가 없습니다' : '파일이 없습니다'}
              </p>
            </div>
          )}

          {!loading && !error && filteredFiles.length > 0 && (
            <div className="space-y-2">
              {filteredFiles.map((file) => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

                return (
                  <button
                    key={file.id}
                    onClick={() => handleItemClick(file)}
                    className={`w-full p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center gap-4 text-left group
                      ${isFolder ? 'border-l-4 border-l-yellow-400' : ''}`}
                  >
                  {/* Thumbnail or Icon */}
                  <div className="flex-shrink-0">
                    {file.thumbnailLink ? (
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getFileIcon(file.mimeType)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark group-hover:text-primary transition-colors truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Select Indicator */}
                  {isFolder ? (
                    <ChevronLeft size={24} className="text-gray-400 group-hover:text-primary rotate-180 flex-shrink-0" />
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-primary group-hover:bg-primary/10 transition-colors" />
                  )}
                </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4">
          <p className="text-xs text-gray-500 text-center">
            총 {filteredFiles.length}개의 파일
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriveFilePicker;
