
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Video, FileText, Bell, LogOut, ArrowLeft, Plus, Trash2, ExternalLink, Settings as SettingsIcon, Image, FolderOpen, BarChart3, TrendingUp } from 'lucide-react';
import { User, VideoContent, AppConfig, ScheduleItem } from '../../types';
import { dbService } from '../../services/db';
import DriveFilePicker from '../DriveFilePicker';

interface MonkModeViewProps {
  user: User;
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'videos' | 'content-review' | 'settings' | 'schedule-manager' | 'practice-monitor';

const MonkModeView: React.FC<MonkModeViewProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Video Manager State
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoContent | null>(null);
  const [addMode, setAddMode] = useState<'drive' | 'youtube'>('drive');
  const [showDrivePickerForContent, setShowDrivePickerForContent] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    author: '지월스님',
    description: '',
    driveUrl: '',
    driveFileName: '',
    youtubeLink: '',
    tags: '전체' as '전체' | '경전공부' | '참선법회' | '공부자료'
  });

  // Settings State
  const [settings, setSettings] = useState<AppConfig | null>(null);

  // Schedule Manager State
  const [newSchedule, setNewSchedule] = useState({ title: '', date: '', time: '', attachmentUrl: '', attachmentName: '', maxParticipants: 0 });
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [showScheduleDrivePicker, setShowScheduleDrivePicker] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedScheduleForManagement, setSelectedScheduleForManagement] = useState<ScheduleItem | null>(null);
  const [participantsList, setParticipantsList] = useState<Array<{ email: string; name: string }>>([]);

  // Practice Monitor State
  const [practiceMonitorView, setPracticeMonitorView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPracticeLogs, setAllPracticeLogs] = useState<any[]>([]);
  const [practiceItems, setPracticeItems] = useState<any[]>([]);

  // 드라이브 폴더 ID (AddView와 동일)
  const MONK_DRIVE_FOLDER_ID = '1Iw3aFnn0cimoiD2WaTbuEQRcFflwdFkC';

  // Fetch Data on Component Mount and Tab Change
  useEffect(() => {
    // 컴포넌트 마운트 시 videos 미리 로드
    fetchVideos();
  }, []);

  // Fetch Data on Tab Change
  useEffect(() => {
    if (activeTab === 'videos') fetchVideos();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'schedule-manager') fetchSchedules();
    if (activeTab === 'practice-monitor') fetchPracticeMonitorData();
  }, [activeTab]);

  const fetchVideos = async () => {
    const data = await dbService.getVideos(true); // 스님 모드에서는 모든 비디오 가져오기
    setVideos(data);
  };

  const fetchSettings = async () => {
    const data = await dbService.getSettings();
    setSettings(data);
  };

  const fetchSchedules = async () => {
    const data = await dbService.getSchedules(user.email, false);
    // 절 행사만 필터링
    const templeEvents = data.filter(s => s.type === 'temple');
    setSchedules(templeEvents);
  };

  const fetchPracticeMonitorData = async () => {
    try {
      // Fetch all users (assuming there's a method to get all users)
      const users = await dbService.getAllUsers();
      setAllUsers(users);

      // Fetch all practice logs
      const logs = await dbService.getAllPracticeLogs();
      setAllPracticeLogs(logs);

      // Fetch practice items
      const items = await dbService.getPracticeItems();
      setPracticeItems(items);
    } catch (e) {
      console.error('Failed to fetch practice monitor data:', e);
    }
  };


  // 한국 시간으로 현재 시각 얻기
  const getKoreanTime = () => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreanTime.toISOString();
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let videoData: Partial<VideoContent> = {
        title: newVideo.title,
        author: newVideo.author,
        description: newVideo.description,
        duration: editingVideo ? editingVideo.duration : '00:00',
        status: editingVideo ? editingVideo.status : 'draft',
        uploadedAt: editingVideo ? editingVideo.uploadedAt : getKoreanTime(),
      };

      if (addMode === 'youtube') {
        // YouTube 링크 처리
        if (!newVideo.youtubeLink || !newVideo.title) {
          alert('제목과 YouTube 링크를 입력해주세요.');
          return;
        }

        let videoId = '';
        try {
          const url = new URL(newVideo.youtubeLink);
          if (url.hostname.includes('youtube.com')) videoId = url.searchParams.get('v') || '';
          else if (url.hostname.includes('youtu.be')) videoId = url.pathname.slice(1);
        } catch { /* ignore */ }

        if (!videoId) {
          alert('유효한 YouTube 링크를 입력해주세요.');
          return;
        }

        videoData = {
          ...videoData,
          youtubeId: videoId,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          mediaType: 'youtube',
          tags: [newVideo.tags]
        };
      } else {
        // 드라이브 파일 처리
        if (!newVideo.title) {
          alert('제목을 입력해주세요.');
          return;
        }

        // 편집 모드이고 파일 정보가 변경되지 않았으면 기존 정보 유지
        if (editingVideo && newVideo.driveFileName === '기존 파일') {
          videoData = {
            ...videoData,
            driveUrl: editingVideo.driveUrl,
            driveFileId: editingVideo.driveFileId,
            mediaType: editingVideo.mediaType,
            thumbnailUrl: editingVideo.thumbnailUrl,
            tags: [newVideo.tags],
            textContent: newVideo.description
          };
        } else if (newVideo.driveUrl) {
          // 새 파일이 선택된 경우
          let driveFileId = '';
          try {
            const url = new URL(newVideo.driveUrl);
            const match = url.pathname.match(/\/d\/([^/]+)/);
            if (match) driveFileId = match[1];
          } catch { /* ignore */ }

          videoData = {
            ...videoData,
            driveUrl: newVideo.driveUrl,
            driveFileId: driveFileId || undefined,
            mediaType: 'drive-video',
            thumbnailUrl: 'https://via.placeholder.com/1280x720/8B7355/FFFFFF?text=Drive+File',
            tags: [newVideo.tags]
          };
        } else {
          // 파일 없이 텍스트만 등록
          videoData = {
            ...videoData,
            mediaType: editingVideo ? editingVideo.mediaType : 'text-only',
            thumbnailUrl: editingVideo ? editingVideo.thumbnailUrl : 'https://via.placeholder.com/1280x720/8B7355/FFFFFF?text=Text+Content',
            tags: [newVideo.tags],
            textContent: newVideo.description
          };
        }
      }

      if (editingVideo) {
        // 편집 모드
        console.log('🔄 비디오 수정 시작:', editingVideo.id, videoData);
        await dbService.updateVideo(editingVideo.id, videoData);
        console.log('✅ 비디오 수정 완료');
        alert('콘텐츠가 수정되었습니다.');
        setEditingVideo(null);
      } else {
        // 새로 추가
        console.log('➕ 비디오 추가 시작:', videoData);
        await dbService.addVideo(videoData);
        console.log('✅ 비디오 추가 완료');
        alert('콘텐츠가 등록되었습니다.');
      }

      setIsAddingVideo(false);
      setNewVideo({ title: '', author: '지월스님', description: '', driveUrl: '', driveFileName: '', youtubeLink: '', tags: '전체' });
      await fetchVideos();
      setActiveTab('content-review');
    } catch (error) {
      console.error('❌ 비디오 저장 실패:', error);
      alert(`저장에 실패했습니다.\n\n에러: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (confirm('삭제하시겠습니까?')) {
      await dbService.deleteVideo(id);
      fetchVideos();
    }
  };


  const handlePublishContent = async (id: string) => {
    if (confirm('이 콘텐츠를 법문으로 게시하시겠습니까?\n신도들에게 공개됩니다.')) {
      await dbService.updateVideoStatus(id, 'published');
      alert('법문으로 게시되었습니다!');
      fetchVideos();
    }
  };

  const handleUnpublishContent = async (id: string) => {
    if (confirm('이 콘텐츠를 비공개로 전환하시겠습니까?')) {
      await dbService.updateVideoStatus(id, 'draft');
      alert('대기 상태로 변경되었습니다.');
      fetchVideos();
    }
  };

  const handleEditVideo = (video: VideoContent) => {
    setEditingVideo(video);
    setNewVideo({
      title: video.title,
      author: video.author || '지월스님',
      description: video.description || '',
      driveUrl: video.driveUrl || '',
      driveFileName: video.driveUrl ? '기존 파일' : '',
      youtubeLink: video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : '',
      tags: (video.tags && video.tags[0]) || '전체'
    });
    setAddMode(video.mediaType === 'youtube' ? 'youtube' : 'drive');
    setIsAddingVideo(true);
    setActiveTab('videos');
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      try {
        console.log('💾 설정 저장 시작:', settings);
        await dbService.updateSettings(settings);
        console.log('✅ 설정 저장 성공');
        alert('설정이 저장되었습니다. 페이지를 새로고침합니다.');

        // 페이지 새로고침하여 변경사항 반영
        window.location.reload();
      } catch (error) {
        console.error('❌ 설정 저장 실패:', error);
        alert('설정 저장에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.title || !newSchedule.date || !newSchedule.time) {
      alert('제목, 날짜, 시간은 필수입니다.');
      return;
    }

    await dbService.addSchedule({
      type: 'temple',
      title: newSchedule.title,
      date: newSchedule.date,
      time: newSchedule.time,
      attachmentUrl: newSchedule.attachmentUrl,
      attachmentName: newSchedule.attachmentName,
      maxParticipants: newSchedule.maxParticipants,
      meta: '절 공식 일정'
    }, user.email);
    alert('일정이 등록되었습니다.');
    setIsAddingSchedule(false);
    setNewSchedule({ title: '', date: '', time: '', attachmentUrl: '', attachmentName: '', maxParticipants: 0 });
    fetchSchedules(); // 목록 새로고침
  };

  const Header = ({ title, onBack }: { title: string; onBack?: () => void }) => (
    <div className="flex items-center gap-4 mb-6">
      <button onClick={onBack || (() => setActiveTab('dashboard'))} className="p-2 -ml-2 hover:bg-gray-200 rounded-full">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-2xl font-bold text-dark">{title}</h2>
    </div>
  );

  // Content Review Dashboard
  if (activeTab === 'content-review') {
    const draftVideos = videos.filter(v => v.status === 'draft' || !v.status);
    const publishedVideos = videos.filter(v => v.status === 'published');

    return (
      <div className="px-6 pt-14 pb-10 animate-fade-in min-h-screen bg-[#F8F9FA]">
        <Header title="오늘의법문 자료관리" />

        {/* Upload Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => { setAddMode('drive'); setIsAddingVideo(true); setActiveTab('videos'); }}
            className="flex-1 py-4 bg-dark text-white rounded-[20px] font-bold flex items-center justify-center gap-2"
          >
            <Plus size={20} /> 콘텐츠 추가
          </button>
          <button
            onClick={() => { setAddMode('youtube'); setIsAddingVideo(true); setActiveTab('videos'); }}
            className="flex-1 py-4 bg-red-500 text-white rounded-[20px] font-bold flex items-center justify-center gap-2"
          >
            <Video size={20} /> YouTube 링크
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50 p-4 rounded-[20px] border-2 border-orange-200">
            <div className="text-orange-600 text-sm font-bold mb-1">대기 중</div>
            <div className="text-3xl font-bold text-orange-900">{draftVideos.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-[20px] border-2 border-green-200">
            <div className="text-green-600 text-sm font-bold mb-1">게시됨</div>
            <div className="text-3xl font-bold text-green-900">{publishedVideos.length}</div>
          </div>
        </div>

        {/* Draft Content */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            대기 중인 콘텐츠 ({draftVideos.length})
          </h3>

          {draftVideos.length === 0 ? (
            <div className="bg-white p-8 rounded-[20px] text-center text-gray-400">
              대기 중인 콘텐츠가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {draftVideos.map(v => (
                <div key={v.id} className="bg-white p-5 rounded-[20px] shadow-sm">
                  <div className="flex gap-4">
                    <img src={v.thumbnailUrl} className="w-32 h-20 object-cover rounded-lg flex-shrink-0" alt={v.title} />
                    <div className="flex-1">
                      <h4 className="font-bold text-dark mb-1">{v.title}</h4>
                      <p className="text-sm text-gray-500 mb-2">{v.author} • {v.duration}</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleEditVideo(v)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handlePublishContent(v.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600"
                        >
                          ✓ 법문으로 게시
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(v.id)}
                          className="px-4 py-2 bg-red-50 text-red-500 rounded-lg font-bold text-sm hover:bg-red-100"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Published Content */}
        <div>
          <h3 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            게시된 법문 ({publishedVideos.length})
          </h3>

          <div className="space-y-3">
            {publishedVideos.map(v => (
              <div key={v.id} className="bg-white p-5 rounded-[20px] shadow-sm border-l-4 border-green-500">
                <div className="flex gap-4">
                  <img src={v.thumbnailUrl} className="w-32 h-20 object-cover rounded-lg flex-shrink-0" alt={v.title} />
                  <div className="flex-1">
                    <h4 className="font-bold text-dark mb-1">{v.title}</h4>
                    <p className="text-sm text-gray-500 mb-2">{v.author} • {v.duration}</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleEditVideo(v)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100"
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handleUnpublishContent(v.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200"
                      >
                        비공개로 전환
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(v.id)}
                        className="px-4 py-2 bg-red-50 text-red-500 rounded-lg font-bold text-sm hover:bg-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'videos') {
    return (
      <div className="px-6 pt-14 pb-10 animate-fade-in min-h-screen bg-[#F8F9FA]">
        <Header
          title={editingVideo ? "콘텐츠 편집" : "오늘의법문 업로드"}
          onBack={() => {
            setIsAddingVideo(false);
            setEditingVideo(null);
            setActiveTab('content-review');
          }}
        />
        {isAddingVideo ? (
          <form onSubmit={handleAddVideo} className="bg-white p-6 rounded-[24px] shadow-card space-y-4">
            {addMode === 'youtube' ? (
              /* YouTube 링크 입력 */
              <div className="flex flex-col gap-3 p-4 bg-red-50 rounded-[16px] border border-red-200">
                <label className="text-sm font-bold text-red-900">YouTube 링크</label>
                <input
                  className="w-full p-3 bg-white border border-red-200 rounded-xl"
                  value={newVideo.youtubeLink}
                  onChange={e => setNewVideo({...newVideo, youtubeLink: e.target.value})}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-red-700">
                  💡 YouTube 영상 URL을 복사하여 붙여넣기 하세요
                </p>
              </div>
            ) : (
              /* 드라이브 파일 선택 */
              <div className="flex flex-col gap-3 p-4 bg-blue-50 rounded-[16px] border border-blue-200">
                <label className="text-sm font-bold text-blue-900">법문 파일</label>
                <button
                  type="button"
                  onClick={() => setShowDrivePickerForContent(true)}
                  className="w-full py-3 px-4 bg-white border-2 border-blue-300 text-blue-700 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FolderOpen size={20} />
                  드라이브에서 파일 선택
                </button>
                {newVideo.driveFileName && (
                  <div className="p-3 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                    <span className="text-sm text-dark truncate">{newVideo.driveFileName}</span>
                    <button
                      type="button"
                      onClick={() => setNewVideo({...newVideo, driveUrl: '', driveFileName: ''})}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      제거
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 제목 */}
            <input
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
              value={newVideo.title}
              onChange={e => setNewVideo({...newVideo, title: e.target.value})}
              placeholder="제목"
              required
            />

            {/* 법사명 */}
            <input
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
              value={newVideo.author}
              onChange={e => setNewVideo({...newVideo, author: e.target.value})}
              placeholder="법사명"
              required
            />

            {/* 설명 */}
            <textarea
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl h-32"
              value={newVideo.description}
              onChange={e => setNewVideo({...newVideo, description: e.target.value})}
              placeholder="법문 설명 (선택사항)"
            />

            {/* 필터 태그 선택 */}
            <div className="flex flex-col gap-3 p-4 bg-green-50 rounded-[16px] border border-green-200">
              <label className="text-sm font-bold text-green-900">카테고리 선택</label>
              <div className="grid grid-cols-2 gap-2">
                {(['전체', '경전공부', '참선법회', '공부자료'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewVideo({...newVideo, tags: tag})}
                    className={`py-3 rounded-xl font-bold text-sm transition-all ${
                      newVideo.tags === tag
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-white text-green-600 border-2 border-green-200 hover:border-green-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingVideo(false);
                  setEditingVideo(null);
                }}
                className="flex-1 py-3 bg-gray-100 rounded-xl"
              >
                취소
              </button>
              <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">
                {editingVideo ? '수정 완료' : '등록'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => { setAddMode('drive'); setIsAddingVideo(true); }}
                className="flex-1 py-4 bg-dark text-white rounded-[20px] font-bold flex items-center justify-center gap-2"
              >
                <Plus size={20} /> 콘텐츠 추가
              </button>
              <button
                onClick={() => { setAddMode('youtube'); setIsAddingVideo(true); }}
                className="flex-1 py-4 bg-red-500 text-white rounded-[20px] font-bold flex items-center justify-center gap-2"
              >
                <Video size={20} /> YouTube 링크 달기
              </button>
            </div>

            <div className="space-y-4">
              {videos.map(v => (
                <div key={v.id} className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                  {/* YouTube 영상만 썸네일 표시 */}
                  {(v.mediaType === 'youtube' || v.youtubeId) && (
                    <img src={v.thumbnailUrl} className="w-full aspect-video object-cover" />
                  )}

                  {/* 콘텐츠 정보 */}
                  <div className={(v.mediaType === 'youtube' || v.youtubeId) ? 'p-4' : 'p-6'}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        {/* 태그 */}
                        {v.tags && (
                          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full mb-2">
                            {Array.isArray(v.tags) ? v.tags[0] : v.tags}
                          </span>
                        )}
                        {/* 제목 */}
                        <h4 className={`font-bold text-dark ${(v.mediaType === 'youtube' || v.youtubeId) ? 'text-[15px]' : 'text-[18px]'}`}>
                          {v.title}
                        </h4>
                        {/* 텍스트 콘텐츠는 설명 표시 */}
                        {(v.mediaType === 'text-only' || (!v.youtubeId && !v.driveUrl)) && v.description && (
                          <p className="text-gray-600 text-[13px] mt-2 line-clamp-2">{v.description}</p>
                        )}
                        {/* 상태 표시 */}
                        <div className="mt-2">
                          {v.status === 'published' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded-full">
                              <CheckCircle size={12} /> 게시됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-full">
                              <Clock size={12} /> 대기중
                            </span>
                          )}
                        </div>
                      </div>
                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleDeleteVideo(v.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    {/* 게시/게시취소 버튼 */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {v.status === 'published' ? (
                        <button
                          onClick={() => handleUnpublishContent(v.id)}
                          className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-[13px] hover:bg-gray-200 transition-colors"
                        >
                          게시 취소
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublishContent(v.id)}
                          className="w-full py-2 bg-primary text-white rounded-lg font-medium text-[13px] hover:bg-primary/90 transition-colors"
                        >
                          법문으로 게시하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Drive File Picker Modal */}
        {showDrivePickerForContent && (
          <DriveFilePicker
            folderId={MONK_DRIVE_FOLDER_ID}
            onSelect={(fileUrl, fileName) => {
              setNewVideo({...newVideo, driveUrl: fileUrl, driveFileName: fileName});
              setShowDrivePickerForContent(false);
            }}
            onClose={() => setShowDrivePickerForContent(false)}
          />
        )}
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="px-6 pt-14 pb-10 animate-fade-in min-h-screen bg-[#F8F9FA]">
        <Header title="앱 설정 관리" />
        {settings ? (
          <form onSubmit={handleUpdateSettings} className="space-y-8 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
            
            {/* 로그인 화면 설정 */}
            <section className="bg-white p-6 rounded-[24px] shadow-sm space-y-4">
              <h3 className="font-bold text-dark text-lg border-b pb-2">로그인 화면</h3>
              <div>
                <label className="text-sm font-bold text-gray-500">앱 이름 (타이틀)</label>
                <input className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl" value={settings.loginTitle || ''} onChange={e => setSettings({...settings, loginTitle: e.target.value})} placeholder="정수결사" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">앱 설명 (부제)</label>
                <textarea className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl h-24" value={settings.loginSubtitle || ''} onChange={e => setSettings({...settings, loginSubtitle: e.target.value})} placeholder="매일의 수행을..." />
              </div>
            </section>

            {/* 홈 화면 설정 */}
            <section className="bg-white p-6 rounded-[24px] shadow-sm space-y-4">
              <h3 className="font-bold text-dark text-lg border-b pb-2">홈 화면</h3>
              <div>
                <label className="text-sm font-bold text-gray-500">인사말 뒷부분</label>
                <input className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl" value={settings.homeGreeting} onChange={e => setSettings({...settings, homeGreeting: e.target.value})} placeholder="평안하신가요" />
              </div>
            </section>

            {/* 법문 & 기타 */}
            <section className="bg-white p-6 rounded-[24px] shadow-sm space-y-4">
              <h3 className="font-bold text-dark text-lg border-b pb-2">법문 & 시스템</h3>
              <div>
                <label className="text-sm font-bold text-gray-500">법문 화면 제목</label>
                <input className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl" value={settings.dharmaTitle} onChange={e => setSettings({...settings, dharmaTitle: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">법문 화면 설명</label>
                <input className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl" value={settings.dharmaDesc} onChange={e => setSettings({...settings, dharmaDesc: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500">로딩 메시지</label>
                <input className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-xl" value={settings.loadingMessage || ''} onChange={e => setSettings({...settings, loadingMessage: e.target.value})} placeholder="1초의 휴식..." />
              </div>
            </section>

            <button type="submit" className="w-full py-4 bg-dark text-white rounded-[20px] font-bold text-lg sticky bottom-6 shadow-xl">설정 저장하기</button>
          </form>
        ) : (
          <div className="text-center py-10">설정 불러오는 중...</div>
        )}
      </div>
    );
  }

  if (activeTab === 'schedule-manager') {
    return (
      <div className="px-6 pt-14 pb-10 animate-fade-in min-h-screen bg-[#F8F9FA]">
        <Header title="일정 관리" />

        {/* 행사 등록 버튼 */}
        <button
          onClick={() => setIsAddingSchedule(!isAddingSchedule)}
          className="w-full mb-4 py-3 bg-primary text-white rounded-[16px] font-bold text-base shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          {isAddingSchedule ? '등록 취소' : '행사 등록'}
        </button>

        {/* 일정 등록 폼 */}
        {isAddingSchedule && (
          <div className="bg-white p-4 rounded-[20px] shadow-card space-y-3 mb-4">
            <h3 className="font-bold text-lg text-dark">새 일정 등록</h3>
           <input
             className="w-full p-4 bg-gray-50 text-dark placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
             value={newSchedule.title}
             onChange={e => setNewSchedule({...newSchedule, title: e.target.value})}
             placeholder="일정 제목 (예: 정기법회)"
           />
           <div className="flex gap-2">
             <input
               type="date"
               className="flex-1 p-4 bg-gray-50 text-dark placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
               value={newSchedule.date}
               onChange={e => setNewSchedule({...newSchedule, date: e.target.value})}
             />
             <input
               type="time"
               className="flex-1 p-4 bg-gray-50 text-dark placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
               value={newSchedule.time}
               onChange={e => setNewSchedule({...newSchedule, time: e.target.value})}
             />
           </div>

           {/* 참석자수 설정 */}
           <div className="flex flex-col gap-3 p-4 bg-purple-50 rounded-[16px] border border-purple-200">
             <label className="text-sm font-bold text-purple-900">참석 인원 설정</label>
             <div className="flex gap-2">
               <button
                 type="button"
                 onClick={() => setNewSchedule({...newSchedule, maxParticipants: 0})}
                 className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                   newSchedule.maxParticipants === 0
                     ? 'bg-purple-500 text-white'
                     : 'bg-white text-purple-600 border-2 border-purple-200'
                 }`}
               >
                 무제한
               </button>
               <button
                 type="button"
                 onClick={() => setNewSchedule({...newSchedule, maxParticipants: 10})}
                 className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                   newSchedule.maxParticipants !== 0
                     ? 'bg-purple-500 text-white'
                     : 'bg-white text-purple-600 border-2 border-purple-200'
                 }`}
               >
                 인원 제한
               </button>
             </div>
             {newSchedule.maxParticipants !== 0 && (
               <input
                 type="number"
                 min="1"
                 className="w-full p-3 bg-white text-dark border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                 value={newSchedule.maxParticipants}
                 onChange={e => setNewSchedule({...newSchedule, maxParticipants: parseInt(e.target.value) || 0})}
                 placeholder="최대 인원수"
               />
             )}
           </div>

           {/* 첨부파일 섹션 */}
           <div className="flex flex-col gap-3 p-4 bg-blue-50 rounded-[16px] border border-blue-200">
             <label className="text-sm font-bold text-blue-900">첨부파일 (선택사항)</label>

             {/* 드라이브 파일 선택 버튼 */}
             <button
               type="button"
               onClick={() => setShowScheduleDrivePicker(true)}
               className="w-full py-3 px-4 bg-white border-2 border-blue-300 text-blue-700 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
             >
               <FolderOpen size={20} />
               드라이브에서 파일 선택
             </button>

             {/* 선택된 파일 표시 */}
             {newSchedule.attachmentName && (
               <div className="p-3 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                 <span className="text-sm text-dark truncate">{newSchedule.attachmentName}</span>
                 <button
                   type="button"
                   onClick={() => setNewSchedule({...newSchedule, attachmentUrl: '', attachmentName: ''})}
                   className="text-red-500 hover:text-red-700 text-sm font-medium"
                 >
                   제거
                 </button>
               </div>
             )}

             {/* 또는 직접 URL 입력 */}
             <div className="relative">
               <span className="text-xs text-gray-500 mb-1 block">또는 URL 직접 입력</span>
               <input
                 className="w-full p-3 bg-white text-dark placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                 value={newSchedule.attachmentUrl}
                 onChange={e => setNewSchedule({...newSchedule, attachmentUrl: e.target.value, attachmentName: ''})}
                 placeholder="https://drive.google.com/..."
               />
             </div>
           </div>

           <button onClick={handleAddSchedule} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:bg-primary/90 transition-colors">
             일정 등록
           </button>
          </div>
        )}

        {/* 등록된 일정 목록 */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-dark">등록된 행사</h3>
          {schedules.length === 0 ? (
            <div className="bg-white p-8 rounded-[24px] text-center text-gray-400">
              등록된 행사가 없습니다
            </div>
          ) : (
            schedules.map(schedule => {
              const participants = schedule.participants || [];
              const maxParts = schedule.maxParticipants || 0;
              const isUnlimited = maxParts === 0;

              return (
                <div key={schedule.id} className="bg-white p-6 rounded-[24px] shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-dark mb-2">{schedule.title}</h4>
                      <p className="text-sm text-gray-500">
                        {schedule.date} {schedule.time}
                      </p>
                      {schedule.meta && (
                        <p className="text-sm text-gray-400 mt-1">{schedule.meta}</p>
                      )}
                    </div>
                    {/* 삭제 버튼 */}
                    <button
                      onClick={async () => {
                        if (confirm(`"${schedule.title}" 일정을 삭제하시겠습니까?${participants.length > 0 ? `\n참석 신청한 ${participants.length}명의 신청도 함께 삭제됩니다.` : ''}`)) {
                          try {
                            await dbService.deleteSchedule(schedule.id!);
                            alert('일정이 삭제되었습니다.');
                            fetchSchedules();
                          } catch (error) {
                            console.error('Delete error:', error);
                            alert('삭제에 실패했습니다.');
                          }
                        }
                      }}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* 참석 인원 현황 */}
                  <div className="bg-purple-50 p-4 rounded-xl mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-purple-900">참석 인원</span>
                      <span className="text-lg font-bold text-purple-700">
                        {participants.length}{isUnlimited ? '명' : ` / ${maxParts}명`}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${maxParts > 0 ? (participants.length / maxParts) * 100 : 0}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 등록한 유저 확인 버튼 */}
                  <button
                    onClick={async () => {
                      setSelectedScheduleForManagement(schedule);
                      // Fetch participant details
                      const users = await dbService.getAllUsers();
                      const participantDetails = participants.map(email => {
                        const user = users.find(u => u.email === email);
                        return {
                          email,
                          name: user?.dharma_name || user?.name || email
                        };
                      });
                      setParticipantsList(participantDetails);
                    }}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                  >
                    등록한 유저 확인하기 ({participants.length}명)
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* 참가자 목록 모달 */}
        {selectedScheduleForManagement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedScheduleForManagement(null)}>
            <div className="bg-white rounded-[24px] p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-dark mb-4">{selectedScheduleForManagement.title}</h3>
              <p className="text-sm text-gray-500 mb-6">참석 신청자 명단</p>

              {participantsList.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  아직 참석 신청자가 없습니다
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
                  {participantsList.map((participant, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-dark">{participant.name}</p>
                        <p className="text-sm text-gray-500">{participant.email}</p>
                      </div>
                      <span className="text-2xl">👤</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelectedScheduleForManagement(null)}
                className="w-full py-3 bg-gray-200 text-dark font-bold rounded-xl hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* Drive File Picker Modal */}
        {showScheduleDrivePicker && (
          <DriveFilePicker
            folderId={MONK_DRIVE_FOLDER_ID}
            onSelect={(fileUrl, fileName) => {
              setNewSchedule({...newSchedule, attachmentUrl: fileUrl, attachmentName: fileName});
              setShowScheduleDrivePicker(false);
            }}
            onClose={() => setShowScheduleDrivePicker(false)}
          />
        )}
      </div>
    );
  }

  // Practice Monitor
  if (activeTab === 'practice-monitor') {
    // Filter logs based on view mode
    const getFilteredData = () => {
      if (practiceMonitorView === 'daily') {
        // 날짜별: 특정 날짜의 모든 회원 현황
        const data = allPracticeLogs
          .filter(log => log.date === selectedDate)
          .map(log => {
            const userInfo = allUsers.find(u => u.email === log.email);
            return { ...log, userName: userInfo?.name || userInfo?.dharma_name || log.email };
          });

        return sortOrder === 'desc'
          ? data.sort((a, b) => b.progress - a.progress)
          : data.sort((a, b) => a.progress - b.progress);
      } else {
        // 주간/월간: 기간 내 각 회원의 수행 횟수
        let start = startDate;
        let end = endDate;

        if (practiceMonitorView === 'weekly') {
          const today = new Date();
          const dayOfWeek = today.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const monday = new Date(today);
          monday.setDate(today.getDate() + mondayOffset);
          start = monday.toISOString().split('T')[0];
          end = new Date().toISOString().split('T')[0];
        } else if (practiceMonitorView === 'monthly') {
          const today = new Date();
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          start = firstDay.toISOString().split('T')[0];
          end = new Date().toISOString().split('T')[0];
        }

        const userStats: Record<string, { count: number; name: string; email: string }> = {};

        allPracticeLogs
          .filter(log => log.date >= start && log.date <= end)
          .forEach(log => {
            if (!userStats[log.email]) {
              const userInfo = allUsers.find(u => u.email === log.email);
              userStats[log.email] = {
                count: 0,
                name: userInfo?.name || userInfo?.dharma_name || log.email,
                email: log.email
              };
            }
            userStats[log.email].count += 1;
          });

        const data = Object.values(userStats);
        return sortOrder === 'desc'
          ? data.sort((a, b) => b.count - a.count)
          : data.sort((a, b) => a.count - b.count);
      }
    };

    const filteredData = getFilteredData();

    return (
      <div className="px-6 pt-14 pb-32 animate-fade-in min-h-screen bg-[#F8F9FA]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-dark" />
            </button>
            <div>
              <h2 className="text-[28px] font-bold text-dark">회원 수행 현황</h2>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="grid grid-cols-3 gap-2 mb-4 bg-white p-2 rounded-[16px] shadow-sm">
          <button
            onClick={() => setPracticeMonitorView('daily')}
            className={`py-2.5 rounded-[12px] font-bold text-[12px] transition-all ${
              practiceMonitorView === 'daily'
                ? 'bg-primary text-white shadow-md'
                : 'bg-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            📅 날짜별
          </button>
          <button
            onClick={() => setPracticeMonitorView('weekly')}
            className={`py-2.5 rounded-[12px] font-bold text-[12px] transition-all ${
              practiceMonitorView === 'weekly'
                ? 'bg-primary text-white shadow-md'
                : 'bg-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            📊 주간
          </button>
          <button
            onClick={() => setPracticeMonitorView('monthly')}
            className={`py-2.5 rounded-[12px] font-bold text-[12px] transition-all ${
              practiceMonitorView === 'monthly'
                ? 'bg-primary text-white shadow-md'
                : 'bg-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            📈 월간
          </button>
        </div>

        {/* Sort Order Toggle */}
        <div className="mb-4 bg-white p-3 rounded-[16px] shadow-sm flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700">정렬</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder('desc')}
              className={`px-4 py-2 rounded-[10px] text-[12px] font-bold transition-all ${
                sortOrder === 'desc'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              높은순 ↓
            </button>
            <button
              onClick={() => setSortOrder('asc')}
              className={`px-4 py-2 rounded-[10px] text-[12px] font-bold transition-all ${
                sortOrder === 'asc'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              낮은순 ↑
            </button>
          </div>
        </div>

        {/* Date Selector - Only for Daily View */}
        {practiceMonitorView === 'daily' && (
          <div className="mb-4 bg-white p-4 rounded-[16px] shadow-sm">
            <label className="block text-sm font-bold text-gray-700 mb-2">조회 날짜</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-[12px] text-base font-medium"
            />
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[20px] border border-dashed border-gray-200">
              <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-bold text-gray-400 mb-2">데이터가 없습니다</p>
              <p className="text-sm text-gray-300">선택한 조건의 수행 기록이 없습니다</p>
            </div>
          ) : (
            <>
              {practiceMonitorView === 'daily' ? (
                // 날짜별: 회원별 수행 항목 표시
                filteredData.map((log: any, idx: number) => {
                  const items = log.checkedIds?.map((id: string) => {
                    const item = practiceItems.find(p => p.id === id);
                    return item?.question || '';
                  }).filter(Boolean) || [];

                  return (
                    <div key={idx} className="bg-white p-5 rounded-[20px] shadow-sm border-l-4 border-l-primary">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-lg font-bold text-dark">{log.userName}</p>
                          <p className="text-sm text-gray-500">{log.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">{log.progress}%</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {items.map((name: string, i: number) => (
                          <span key={i} className="text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg font-medium">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                // 주간/월간: 수행 횟수 표시
                filteredData.map((stat: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-[20px] shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-dark">{stat.name}</p>
                      <p className="text-sm text-gray-500">{stat.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{stat.count}</p>
                      <p className="text-xs text-gray-400">회</p>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="px-6 pt-14 pb-32 animate-fade-in min-h-screen bg-[#F8F9FA]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="text-secondary font-bold text-sm uppercase tracking-wider">Administrator</span>
          <h1 className="text-[28px] font-bold text-dark mt-1">{user.name}</h1>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
           <img src={user.photoUrl} alt="Monk" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="space-y-4">
        <button onClick={() => setActiveTab('content-review')} className="w-full bg-gradient-to-r from-orange-400 to-orange-500 p-6 rounded-[20px] shadow-md flex items-center gap-4 active:scale-[0.98] text-white">
           <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><FileText size={28} /></div>
           <div className="flex-1 text-left">
             <h4 className="text-xl font-bold">오늘의법문 자료관리</h4>
             <p className="text-sm text-white/80">업로드 → 검토 → 게시</p>
           </div>
           <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
             {videos.filter(v => v.status === 'draft' || !v.status).length} 대기
           </div>
        </button>

        <button onClick={() => setActiveTab('practice-monitor')} className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 p-6 rounded-[20px] shadow-md flex items-center gap-4 active:scale-[0.98] text-white">
           <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><BarChart3 size={28} /></div>
           <div className="flex-1 text-left">
             <h4 className="text-xl font-bold">회원 수행 현황</h4>
             <p className="text-sm text-white/80">일자별 · 회원별 조회</p>
           </div>
        </button>

        <button onClick={() => setActiveTab('schedule-manager')} className="w-full bg-gradient-to-r from-blue-400 to-blue-500 p-6 rounded-[20px] shadow-md flex items-center gap-4 active:scale-[0.98] text-white">
           <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><Calendar size={28} /></div>
           <div className="flex-1 text-left">
             <h4 className="text-xl font-bold">일정 관리</h4>
             <p className="text-sm text-white/80">행사 등록 및 첨부파일</p>
           </div>
        </button>

        <button onClick={() => setActiveTab('settings')} className="w-full bg-gradient-to-r from-slate-400 to-slate-500 p-6 rounded-[20px] shadow-md flex items-center gap-4 active:scale-[0.98] text-white">
           <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><SettingsIcon size={28} /></div>
           <div className="flex-1 text-left">
             <h4 className="text-xl font-bold">앱 문구 설정</h4>
             <p className="text-sm text-white/80">인사말 및 제목 수정</p>
           </div>
        </button>
      </div>

      <button onClick={onLogout} className="mt-12 w-full py-4 flex items-center justify-center gap-2 text-gray-400 font-medium hover:text-red-500">
        <LogOut size={20} /> 로그아웃
      </button>
    </div>
  );
};

export default MonkModeView;
