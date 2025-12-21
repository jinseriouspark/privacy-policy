
import React, { useEffect, useState } from 'react';
import { Play, FileText, Headphones, FileVideo, ArrowLeft, Download, CheckCircle2 } from 'lucide-react';
import { dbService } from '../../services/db';
import { VideoContent, AppConfig, User } from '../../types';

interface DharmaViewProps {
  appConfig: AppConfig | null;
  onBack?: () => void;
}

const DharmaView: React.FC<DharmaViewProps> = ({ appConfig, onBack }) => {
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'전체' | '경전공부' | '참선법회' | '공부자료'>('전체');
  const [selectedFile, setSelectedFile] = useState<VideoContent | null>(null);
  const [readDharmaIds, setReadDharmaIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Load user
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);

        // Load read dharmas
        const readIds = await dbService.getReadDharmas(user.email);
        setReadDharmaIds(readIds);
      }

      // Load videos
      const data = await dbService.getVideos();
      const publishedOnly = data.filter(v => v.status === 'published');
      setVideos(publishedOnly);
      setLoading(false);
    };
    loadData();
  }, []);

  const markAsRead = async (dharmaId: string) => {
    if (currentUser && !readDharmaIds.includes(dharmaId)) {
      await dbService.markDharmaAsRead(currentUser.email, dharmaId);
      setReadDharmaIds([...readDharmaIds, dharmaId]);
    }
  };

  const handlePlayVideo = (video: VideoContent) => {
    console.log('🎬 Video clicked:', {
      mediaType: video.mediaType,
      title: video.title,
      hasYoutubeId: !!video.youtubeId,
      hasDriveUrl: !!video.driveUrl,
      hasTextContent: !!video.textContent,
      hasDescription: !!video.description
    });

    // YouTube 영상 - 새 창으로 열기
    if (video.mediaType === 'youtube' || video.youtubeId) {
      console.log('▶️ Opening YouTube:', video.youtubeId);
      window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank');
      markAsRead(video.id);
      return;
    }

    // 드라이브 파일 - 전체 화면으로 표시
    if (video.driveUrl || video.driveFileId) {
      console.log('📁 Opening Drive file in fullscreen');
      setSelectedFile(video);
      markAsRead(video.id);
      return;
    }

    // 위 조건에 해당하지 않으면 텍스트 콘텐츠로 간주
    console.log('📝 Opening as text content');
    setSelectedText(video);
    markAsRead(video.id);
  };

  const getMediaIcon = (video: VideoContent) => {
    const mediaType = video.mediaType || (video.youtubeId ? 'youtube' : 'drive-video');
    switch (mediaType) {
      case 'youtube':
      case 'drive-video':
        return <Play fill="white" className="text-white ml-1" size={24} />;
      case 'drive-audio':
        return <Headphones className="text-white" size={24} />;
      case 'drive-pdf':
        return <FileText className="text-white" size={24} />;
      default:
        return <FileVideo className="text-white" size={24} />;
    }
  };

  const getMediaTypeLabel = (video: VideoContent) => {
    const mediaType = video.mediaType || (video.youtubeId ? 'youtube' : 'drive-video');
    switch (mediaType) {
      case 'youtube':
        return 'YouTube';
      case 'drive-video':
        return '영상';
      case 'drive-audio':
        return '음성';
      case 'drive-pdf':
        return 'PDF';
      case 'text':
        return '법문';
      case 'text-file':
        return '텍스트';
      default:
        return '파일';
    }
  };

  const [selectedText, setSelectedText] = useState<VideoContent | null>(null);

  // Filter videos based on selected filter
  const filteredVideos = selectedFilter === '전체'
    ? videos
    : videos.filter(v => {
        // tags가 배열인 경우와 문자열인 경우 모두 처리
        if (Array.isArray(v.tags)) {
          return v.tags.includes(selectedFilter);
        }
        return v.tags === selectedFilter;
      });

  return (
    <div className="px-6 pt-14 pb-32 animate-fade-in">
      {/* Back Button */}
      {onBack && (
        <div className="mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={28} className="text-dark" />
          </button>
        </div>
      )}

      <h2 className="text-[28px] font-bold text-dark mb-2">
        {appConfig?.dharmaTitle || '오늘의 법문'}
      </h2>
      <p className="text-gray-500 mb-4">
        {appConfig?.dharmaDesc || '지혜의 말씀을 듣고 마음을 밝히세요.'}
      </p>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['전체', '경전공부', '참선법회', '공부자료'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedFilter === filter
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[24px] shadow-sm">
          <p className="text-lg font-bold text-gray-400 mb-2">
            {selectedFilter === '전체' ? '아직 등록된 법문이 없습니다' : `${selectedFilter} 법문이 없습니다`}
          </p>
          <p className="text-sm text-gray-300">스님이 곧 좋은 말씀을 올려주실 거예요 🙏</p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => handlePlayVideo(video)}
              className="group bg-white rounded-[24px] overflow-hidden shadow-card cursor-pointer active:scale-[0.98] transition-transform"
            >
              {/* YouTube 영상일 때만 썸네일 표시 */}
              {(video.mediaType === 'youtube' || video.youtubeId) && (
                <div className="relative aspect-video bg-gray-200">
                   <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                     <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                       {getMediaIcon(video)}
                     </div>
                   </div>
                   <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                     <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-md font-medium">
                       YouTube
                     </span>
                     {video.duration && (
                       <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-md font-medium">
                         {video.duration}
                       </span>
                     )}
                   </div>
                </div>
              )}
              <div className={(video.mediaType === 'youtube' || video.youtubeId) ? 'p-5' : 'p-8'}>
                <div className="flex items-center gap-2 mb-2">
                  {video.tags && (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[12px] font-bold rounded-full">
                      {Array.isArray(video.tags) ? video.tags[0] : video.tags}
                    </span>
                  )}
                  {readDharmaIds.includes(video.id) && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 text-[11px] font-bold rounded-full">
                      <CheckCircle2 size={13} />
                      읽음
                    </span>
                  )}
                </div>
                <h3 className={`font-bold text-dark leading-snug ${(video.mediaType === 'youtube' || video.youtubeId) ? 'text-xl line-clamp-2 mb-2' : 'text-2xl mb-3'}`}>
                  {video.title}
                </h3>
                {(video.mediaType === 'youtube' || video.youtubeId) ? (
                  // YouTube: 저자 표시
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                       <div className="w-full h-full bg-secondary/30" />
                    </div>
                    <span className="text-gray-500 font-medium">{video.author}</span>
                  </div>
                ) : (
                  // 파일/텍스트: 설명만 표시
                  video.description && (
                    <p className="text-gray-600 text-[14px] line-clamp-3">{video.description}</p>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Text Content Full Screen View */}
      {selectedText && (
        <div className="fixed inset-0 z-50 bg-[#F8F9FA] animate-fade-in overflow-y-auto">
          {/* Header with Back Button */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm z-10">
            <button
              onClick={() => setSelectedText(null)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-dark" />
            </button>
            <h2 className="text-[16px] font-bold text-dark">법문 읽기</h2>
          </div>

          {/* Content */}
          <div className="px-6 py-8 pb-20">
            {/* 태그 */}
            {selectedText.tags && (
              <span className="inline-block px-3 py-1.5 bg-primary/10 text-primary text-[12px] font-bold rounded-full mb-4">
                {Array.isArray(selectedText.tags) ? selectedText.tags[0] : selectedText.tags}
              </span>
            )}

            {/* 제목 */}
            <h1 className="text-[28px] font-bold text-dark mb-3 leading-tight">
              {selectedText.title}
            </h1>

            {/* 저자 */}
            <p className="text-gray-500 text-[15px] mb-8">{selectedText.author}</p>

            {/* 본문 */}
            <div className="prose prose-lg max-w-none text-dark whitespace-pre-wrap leading-relaxed text-[16px]">
              {selectedText.textContent || selectedText.description || '내용이 없습니다.'}
            </div>
          </div>
        </div>
      )}

      {/* File Full Screen View */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-[#F8F9FA] animate-fade-in overflow-y-auto">
          {/* Header with Back Button */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm z-10">
            <button
              onClick={() => setSelectedFile(null)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-dark" />
            </button>
            <h2 className="text-[16px] font-bold text-dark">첨부파일</h2>
          </div>

          {/* Content */}
          <div className="px-6 py-8 pb-20">
            {/* 태그 */}
            {selectedFile.tags && (
              <span className="inline-block px-3 py-1.5 bg-primary/10 text-primary text-[12px] font-bold rounded-full mb-4">
                {Array.isArray(selectedFile.tags) ? selectedFile.tags[0] : selectedFile.tags}
              </span>
            )}

            {/* 제목 */}
            <h1 className="text-[28px] font-bold text-dark mb-3 leading-tight">
              {selectedFile.title}
            </h1>

            {/* 저자 */}
            <p className="text-gray-500 text-[15px] mb-6">{selectedFile.author}</p>

            {/* 설명 */}
            {selectedFile.description && (
              <p className="text-gray-700 text-[15px] mb-8 leading-relaxed">
                {selectedFile.description}
              </p>
            )}

            {/* 다운로드 버튼 */}
            <button
              onClick={() => {
                const downloadUrl = selectedFile.driveUrl ||
                  (selectedFile.driveFileId ? `https://drive.google.com/uc?export=download&id=${selectedFile.driveFileId}` : '');
                if (downloadUrl) {
                  window.open(downloadUrl, '_blank');
                }
              }}
              className="w-full py-4 bg-primary text-white rounded-[16px] font-bold text-[16px] shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-3"
            >
              <Download size={22} />
              파일 다운받기
            </button>

            {/* 미리보기 (iframe) */}
            {selectedFile.driveFileId && (
              <div className="mt-8">
                <h3 className="text-[16px] font-bold text-dark mb-4">미리보기</h3>
                <div className="bg-white rounded-[16px] overflow-hidden shadow-md" style={{ height: '600px' }}>
                  <iframe
                    src={`https://drive.google.com/file/d/${selectedFile.driveFileId}/preview`}
                    className="w-full h-full"
                    allow="autoplay"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DharmaView;
