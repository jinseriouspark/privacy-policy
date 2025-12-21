import { UserRole, User, ScheduleItem, VideoContent, AppConfig } from '../types';
import { supabase } from './supabase';
import { driveService } from './googleDrive';

// Google Client ID (from .env)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '207152218307-5bab17pik3kiosq3jvdo8fiilp373bmn.apps.googleusercontent.com';

// ============================================================
// Google Auth Service (유지)
// ============================================================
export const googleAuthService = {
  signIn: async (role: UserRole): Promise<User> => {
    return new Promise((resolve, reject) => {
      if (!window.google) return reject("Google SDK not loaded");

      // Drive API는 스님과 개발자에게 필요
      const scopes = (role === 'monk' || role === 'developer')
        ? 'email profile openid https://www.googleapis.com/auth/drive.readonly'
        : 'email profile openid';

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: scopes,
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              // Save access token for Drive API (스님과 개발자)
              if (role === 'monk' || role === 'developer') {
                driveService.setAccessToken(tokenResponse.access_token);
                console.log('✅ Drive API access token saved');
              }

              // 1. Get Google Profile
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const userInfo = await userInfoResponse.json();

              const tempUser: User = {
                name: userInfo.name,
                email: userInfo.email,
                photoUrl: userInfo.picture,
                streak: 1,
                role: role,
                trackingIds: []
              };

              // 2. SYNC with Supabase
              const syncedUser = await dbService.syncUser(tempUser);
              resolve(syncedUser);

            } catch (e) {
              reject(e);
            }
          } else {
            reject("No access token");
          }
        },
        error_callback: (error: any) => {
           if (error.type === 'popup_closed') {
             // Ignore popup closed
           } else {
             reject(new Error(`Google Login Error: ${error.type}`));
             if(error.type === 'invalid_request' || error.type === 'redirect_uri_mismatch') {
               alert(`구글 로그인 설정 오류입니다.\nGoogle Cloud Console에 아래 주소를 등록해주세요:\n${window.location.origin}`);
             }
           }
        }
      });

      client.requestAccessToken();
    });
  },

  signOut: async () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
};

// ============================================================
// Supabase DB Service
// ============================================================
export const dbService = {
  // --- Settings ---
  getSettings: async (): Promise<AppConfig> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) throw error;

      const settings: AppConfig = {};
      data?.forEach(item => {
        settings[item.key] = item.value;
      });

      localStorage.setItem('appConfig', JSON.stringify(settings));
      return settings;
    } catch (e) {
      console.warn('Settings 로드 실패, 캐시 사용:', e);
      const cache = localStorage.getItem('appConfig');
      return cache ? JSON.parse(cache) : {};
    }
  },

  updateSettings: async (settings: AppConfig) => {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value)
    }));

    const { error } = await supabase
      .from('app_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) throw error;

    localStorage.setItem('appConfig', JSON.stringify(settings));
    return { message: 'ok' };
  },

  // --- Videos ---
  getVideos: async (includeAll: boolean = false): Promise<VideoContent[]> => {
    try {
      let query = supabase
        .from('videos')
        .select('*');

      // includeAll이 false면 published만, true면 모두
      if (!includeAll) {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const videos = data?.map(v => ({
        id: v.id,
        title: v.title,
        author: v.author,
        duration: v.duration,
        thumbnailUrl: v.thumbnail_url,
        description: v.description,
        status: v.status,
        publishedAt: v.published_at,
        youtubeId: v.youtube_id,
        driveUrl: v.drive_url,
        tags: v.tags,
        // mediaType 추론: youtube_id가 있으면 youtube, drive_url이 있으면 drive
        mediaType: v.youtube_id ? 'youtube' : v.drive_url ? 'drive-pdf' : undefined
      })) || [];

      localStorage.setItem('videos', JSON.stringify(videos));
      return videos;
    } catch (e) {
      console.warn('Videos 로드 실패, 캐시 사용:', e);
      const cache = localStorage.getItem('videos');
      return cache ? JSON.parse(cache) : [];
    }
  },

  addVideo: async (video: Partial<VideoContent>) => {
    const insertData = {
      title: video.title,
      author: video.author,
      duration: video.duration || '00:00',
      youtube_id: video.youtubeId || null,
      drive_url: video.driveUrl || null,
      thumbnail_url: video.thumbnailUrl,
      description: video.description,
      status: video.status || 'draft',
      tags: video.tags || null
    };

    const { error } = await supabase
      .from('videos')
      .insert(insertData);

    if (error) throw error;
    return { message: 'ok' };
  },

  updateVideo: async (id: string, videoData: Partial<VideoContent>) => {
    console.log('📝 updateVideo 호출:', { id, videoData });

    const updateData: any = {
      title: videoData.title,
      author: videoData.author,
      description: videoData.description,
      duration: videoData.duration,
      youtube_id: videoData.youtubeId,
      thumbnail_url: videoData.thumbnailUrl,
      media_type: videoData.mediaType,
      tags: videoData.tags,
      drive_url: videoData.driveUrl,
      drive_file_id: videoData.driveFileId,
      text_content: videoData.textContent,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('📤 Supabase 업데이트 데이터:', updateData);

    const { data, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase 업데이트 에러:', error);
      throw error;
    }

    console.log('✅ Supabase 업데이트 성공:', data);
    return { message: 'ok' };
  },

  updateVideoStatus: async (id: string, status: 'draft' | 'published') => {
    const updates: any = { status };
    if (status === 'published') {
      updates.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { message: 'ok' };
  },

  deleteVideo: async (id: string) => {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'ok' };
  },

  // --- Schedules ---
  getSchedules: async (email: string, useCache: boolean = true): Promise<ScheduleItem[]> => {
    // 캐시 우선 로딩
    if (useCache) {
      const cache = localStorage.getItem(`schedules_${email}`);
      if (cache) {
        console.log('💾 캐시에서 일정 로드');

        // 백그라운드 업데이트
        setTimeout(() => {
          dbService.getSchedules(email, false).catch(e =>
            console.warn('백그라운드 업데이트 실패:', e)
          );
        }, 100);

        return JSON.parse(cache);
      }
    }

    try {
      // 모든 일정 가져오기
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      // 스님 이메일 목록 가져오기
      const { data: users } = await supabase
        .from('users')
        .select('email')
        .eq('role', 'monk');

      const monks = users?.map(u => u.email) || [];

      // 필터링: 절 일정 OR 내 일정 OR 초대받은 일정 OR 스님 일정
      const filtered = schedules?.filter(s =>
        s.type === 'temple' ||
        s.owner_email === email ||
        (s.invited_emails && s.invited_emails.includes(email)) ||
        monks.includes(s.owner_email)
      ) || [];

      // RSVP 데이터 가져오기
      const scheduleIds = filtered.map(s => s.id);
      const { data: rsvps } = await supabase
        .from('event_rsvp')
        .select('schedule_id, user_email')
        .in('schedule_id', scheduleIds)
        .eq('status', 'joined');

      // participants 배열 구성
      const rsvpMap: { [key: string]: string[] } = {};
      rsvps?.forEach(r => {
        if (!rsvpMap[r.schedule_id]) rsvpMap[r.schedule_id] = [];
        rsvpMap[r.schedule_id].push(r.user_email);
      });

      const result: ScheduleItem[] = filtered.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        date: s.date,
        time: s.time,
        endDate: s.end_date,
        endTime: s.end_time,
        location: s.location,
        meta: s.meta,
        attachmentUrl: s.attachment_url,
        ownerEmail: s.owner_email,
        maxParticipants: s.max_participants,
        participants: rsvpMap[s.id] || [],
        invitedEmails: s.invited_emails || [],
        createdAt: s.created_at
      }));

      localStorage.setItem(`schedules_${email}`, JSON.stringify(result));
      return result;
    } catch (e) {
      console.warn('일정 로드 실패, 캐시 사용:', e);
      const cache = localStorage.getItem(`schedules_${email}`);
      return cache ? JSON.parse(cache) : [];
    }
  },

  addSchedule: async (schedule: Partial<ScheduleItem>, email: string) => {
    const { error } = await supabase
      .from('schedules')
      .insert({
        type: schedule.type,
        title: schedule.title,
        date: schedule.date,
        time: schedule.time,
        end_date: schedule.endDate,
        end_time: schedule.endTime,
        location: schedule.location,
        meta: schedule.meta,
        attachment_url: schedule.attachmentUrl,
        owner_email: email,
        max_participants: schedule.maxParticipants || 0,
        invited_emails: schedule.invitedEmails || []
      });

    if (error) throw error;
    return { message: 'ok' };
  },

  updateSchedule: async (schedule: Partial<ScheduleItem>) => {
    const { error } = await supabase
      .from('schedules')
      .update({
        type: schedule.type,
        title: schedule.title,
        date: schedule.date,
        time: schedule.time,
        end_date: schedule.endDate,
        end_time: schedule.endTime,
        location: schedule.location,
        meta: schedule.meta,
        attachment_url: schedule.attachmentUrl,
        max_participants: schedule.maxParticipants,
        invited_emails: schedule.invitedEmails
      })
      .eq('id', schedule.id);

    if (error) throw error;
    return { message: 'ok' };
  },

  deleteSchedule: async (id: string) => {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'ok' };
  },

  rsvpEvent: async (scheduleId: string, userEmail: string, isJoining: boolean) => {
    try {
      if (isJoining) {
        // 참석 신청
        const { data: user } = await supabase
          .from('users')
          .select('name')
          .eq('email', userEmail)
          .single();

        const { error } = await supabase
          .from('event_rsvp')
          .upsert({
            schedule_id: scheduleId,
            user_email: userEmail,
            user_name: user?.name || userEmail,
            status: 'joined'
          }, { onConflict: 'schedule_id,user_email' });

        if (error) {
          console.error('❌ RSVP 신청 에러:', error);
          return { status: 'error', message: error.message };
        }
        console.log('✅ RSVP 신청 성공:', scheduleId, userEmail);
      } else {
        // 참석 취소
        const { error } = await supabase
          .from('event_rsvp')
          .delete()
          .eq('schedule_id', scheduleId)
          .eq('user_email', userEmail);

        if (error) {
          console.error('❌ RSVP 취소 에러:', error);
          return { status: 'error', message: error.message };
        }
        console.log('✅ RSVP 취소 성공:', scheduleId, userEmail);
      }

      return { status: 'ok', message: 'success' };
    } catch (error: any) {
      console.error('❌ RSVP 처리 에러:', error);
      return { status: 'error', message: error.message || 'Unknown error' };
    }
  },

  // 일정 취소 (모든 참석자 제거)
  cancelAllRSVP: async (scheduleId: string) => {
    const { error } = await supabase
      .from('event_rsvp')
      .delete()
      .eq('schedule_id', scheduleId);

    if (error) throw error;
    console.log('✅ 일정 취소 완료:', scheduleId);
    return { message: 'ok' };
  },

  // 참석 정원 변경
  updateEventCapacity: async (scheduleId: string, maxParticipants: number) => {
    const { error } = await supabase
      .from('schedules')
      .update({ max_participants: maxParticipants })
      .eq('id', scheduleId);

    if (error) throw error;
    console.log('✅ 정원 변경 완료:', scheduleId, maxParticipants);
    return { message: 'ok' };
  },

  // --- Users ---
  updateUserGoals: async (email: string, trackingIds: string[]) => {
    console.log('🔄 UPDATE_GOALS:', { email, trackingIds });

    const { error } = await supabase
      .from('users')
      .update({ tracking_ids: trackingIds })
      .eq('email', email);

    if (error) {
      console.error('❌ UPDATE_GOALS 실패:', error);
      throw error;
    }

    console.log('✅ UPDATE_GOALS 성공');
    return { message: 'ok' };
  },

  syncUser: async (user: User) => {
    try {
      // 사용자 존재 확인
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (existing) {
        // 기존 사용자: 로그인 정보만 업데이트
        const { data, error } = await supabase
          .from('users')
          .update({
            name: user.name,
            photo_url: user.photoUrl
          })
          .eq('email', user.email)
          .select()
          .single();

        if (error) throw error;

        return {
          ...user,
          trackingIds: data.tracking_ids || [],
          dharmaName: data.dharma_name,
          streak: data.streak || 0
        };
      } else {
        // 신규 사용자: 생성
        const { data, error } = await supabase
          .from('users')
          .insert({
            email: user.email,
            name: user.name,
            role: user.role,
            photo_url: user.photoUrl,
            tracking_ids: []
          })
          .select()
          .single();

        if (error) throw error;

        return {
          ...user,
          trackingIds: [],
          streak: 0
        };
      }
    } catch (e) {
      console.warn('⚠️ 서버 동기화 실패, 로컬 데이터 사용:', e);
      return user;
    }
  },

  updateUserProfile: async (email: string, updates: any) => {
    const { error } = await supabase
      .from('users')
      .update({ dharma_name: updates.dharmaName })
      .eq('email', email);

    if (error) throw error;
    return { message: 'ok' };
  },

  updateNotificationSettings: async (email: string, settings: any) => {
    const { error } = await supabase
      .from('users')
      .update({ notification_settings: settings })
      .eq('email', email);

    if (error) throw error;
    return { message: 'ok' };
  },

  // --- Practice Logs ---
  getPracticeLogs: async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('practice_logs')
        .select('*')
        .eq('email', email)
        .order('date', { ascending: false });

      if (error) throw error;

      const logs = data?.map(log => ({
        id: log.id,
        email: log.email,
        date: log.date,
        progress: log.progress,
        checkedIds: log.checked_ids || [],
        timestamp: log.created_at
      })) || [];

      localStorage.setItem(`logs_${email}`, JSON.stringify(logs));
      return logs;
    } catch (e) {
      console.warn('수행 기록 로드 실패, 캐시 사용:', e);
      const cache = localStorage.getItem(`logs_${email}`);
      return cache ? JSON.parse(cache) : [];
    }
  },

  savePracticeLog: async (log: any) => {
    console.log('📡 수행 기록 저장:', log);

    const { error } = await supabase
      .from('practice_logs')
      .upsert({
        id: log.id,
        email: log.email,
        date: log.date,
        progress: log.progress,
        checked_ids: log.checkedIds
      }, { onConflict: 'id' });

    if (error) {
      console.error('❌ 수행 기록 저장 실패:', error);
      throw error;
    }

    console.log('✅ 수행 기록 저장 성공');

    // 로컬 캐시 업데이트
    const cacheKey = `logs_${log.email}`;
    const cached = localStorage.getItem(cacheKey);
    const logs = cached ? JSON.parse(cached) : [];
    const updated = logs.filter((l: any) => l.id !== log.id);
    updated.push(log);
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    return { message: 'ok' };
  },

  getUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      const users = data?.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        photoUrl: u.photo_url,
        dharmaName: u.dharma_name,
        trackingIds: u.tracking_ids || [],
        streak: u.streak || 0
      })) || [];

      localStorage.setItem('users', JSON.stringify(users));
      return users;
    } catch (e) {
      console.warn('사용자 목록 로드 실패:', e);
      const cache = localStorage.getItem('users');
      return cache ? JSON.parse(cache) : [];
    }
  },

  // --- Practice Items ---
  getPracticeItems: async () => {
    try {
      const { data, error } = await supabase
        .from('practice_items')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;

      const items = data?.map(item => ({
        id: item.id,
        category: item.category,
        question: item.question,
        order: item.order
      })) || [];

      localStorage.setItem('practiceItems', JSON.stringify(items));
      return items;
    } catch (e) {
      console.warn('수행 항목 로드 실패, 캐시 사용:', e);
      const cache = localStorage.getItem('practiceItems');
      if (cache) return JSON.parse(cache);

      // Fallback: 기본 항목
      return [
        { id: '1', category: '필수', question: '경전읽기', order: 1 },
        { id: '2', category: '필수', question: '염불/참선', order: 2 }
      ];
    }
  },

  // --- Admin: Get All Users ---
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('email', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('모든 사용자 로드 실패:', e);
      return [];
    }
  },

  // --- Admin: Get All Practice Logs ---
  getAllPracticeLogs: async () => {
    try {
      const { data, error } = await supabase
        .from('practice_logs')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('모든 수행 기록 로드 실패:', e);
      return [];
    }
  },

  // --- Get User Profile ---
  getUserProfile: async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('사용자 프로필 로드 실패:', e);
      return null;
    }
  },

  // --- 법문 읽음 기록 ---
  markDharmaAsRead: async (userEmail: string, dharmaId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('dharma_read_log')
        .upsert({
          user_email: userEmail,
          dharma_id: dharmaId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'user_email,dharma_id'
        });

      if (error) throw error;
    } catch (e) {
      console.error('법문 읽음 기록 실패:', e);
    }
  },

  getReadDharmas: async (userEmail: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('dharma_read_log')
        .select('dharma_id')
        .eq('user_email', userEmail);

      if (error) throw error;
      return data?.map(d => d.dharma_id) || [];
    } catch (e) {
      console.error('법문 읽음 기록 조회 실패:', e);
      return [];
    }
  },

  // --- FCM 토큰 관리 ---
  saveFCMToken: async (userEmail: string, token: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_email: userEmail,
          token: token,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_email'
        });

      if (error) throw error;
      console.log('✅ FCM 토큰 저장 성공');
    } catch (e) {
      console.error('FCM 토큰 저장 실패:', e);
    }
  },

  deleteFCMToken: async (userEmail: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_email', userEmail);

      if (error) throw error;
      console.log('✅ FCM 토큰 삭제 성공');
    } catch (e) {
      console.error('FCM 토큰 삭제 실패:', e);
    }
  }
};
