import { supabase } from './client';

/**
 * Google 서비스 연동 상태 조회
 */
export async function getGoogleIntegrationStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('google_calendar_id, google_drive_connected_at, google_drive_recordings_folder_id')
      .eq('instructor_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Settings query error:', error);
      return {
        meet: false,
        drive: false,
        docs: false,
        connectedAt: undefined,
        folderName: undefined,
      };
    }

    const hasDrive = !!data?.google_drive_connected_at;

    return {
      meet: false, // 준비 중
      drive: hasDrive,
      docs: false, // 준비 중
      connectedAt: hasDrive ? data.google_drive_connected_at : undefined,
      folderName: data?.google_drive_recordings_folder_id ? 'Meet Recordings' : undefined,
    };
  } catch (error) {
    console.error('Failed to get integration status:', error);
    return {
      meet: false,
      drive: false,
      docs: false,
      connectedAt: undefined,
      folderName: undefined,
    };
  }
}

/**
 * Google Drive 연동 활성화
 * - 로그인 시 이미 drive.readonly 스코프가 포함됨
 * - 이 함수는 settings에 연동 플래그를 설정
 */
export async function connectGoogleService(
  userId: string,
  service: 'meet' | 'drive' | 'docs',
  _scopes: string[]
) {
  try {
    if (service !== 'drive') {
      return { success: false, error: `${service} 연동은 준비 중입니다.` };
    }

    // 사용자가 Google로 로그인되어 있는지 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('google_access_token')
      .eq('id', userId)
      .single();

    if (userError || !userData?.google_access_token) {
      return {
        success: false,
        error: 'Google 로그인이 필요합니다. 먼저 Google로 로그인해주세요.',
      };
    }

    // Drive API 접근 테스트 (drive.readonly 스코프 확인)
    const testRes = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=1&q=mimeType%3D%27video%2Fmp4%27',
      { headers: { 'Authorization': `Bearer ${userData.google_access_token}` } }
    );

    if (!testRes.ok) {
      // 토큰에 Drive 스코프가 없음 → 재로그인 필요
      return {
        success: false,
        error: 'Drive 권한이 없습니다. 로그아웃 후 다시 로그인해주세요.',
      };
    }

    // settings에 Drive 연동 플래그 설정
    const { error: updateError } = await supabase
      .from('settings')
      .update({
        google_drive_connected_at: new Date().toISOString(),
        google_drive_auto_sync: true,
      })
      .eq('instructor_id', userId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    console.error('Failed to connect Google service:', error);
    return {
      success: false,
      error: error.message || '연동에 실패했습니다.',
    };
  }
}

/**
 * Google 서비스 연동 해제
 */
export async function disconnectGoogleService(
  userId: string,
  service: 'meet' | 'drive' | 'docs'
) {
  try {
    if (service === 'drive') {
      const { error } = await supabase
        .from('settings')
        .update({
          google_drive_connected_at: null,
          google_drive_auto_sync: false,
          google_drive_recordings_folder_id: null,
          google_drive_watch_channel_id: null,
          google_drive_watch_resource_id: null,
          google_drive_watch_expiration: null,
        })
        .eq('instructor_id', userId);

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to disconnect Google service:', error);
    return {
      success: false,
      error: error.message || '연동 해제에 실패했습니다.',
    };
  }
}

/**
 * OAuth 콜백 처리 (API 엔드포인트에서 호출)
 * Google Calendar은 별도 플로우, Drive는 로그인 시 스코프 포함
 */
export async function handleGoogleOAuthCallback(
  userId: string,
  _code: string
) {
  try {
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Failed to handle OAuth callback:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Notion 연동 상태 조회
 */
export async function getNotionIntegrationStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('notion_access_token, notion_database_id, notion_connected_at')
      .eq('instructor_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Settings query error:', error);
      // Return default values instead of throwing
      return {
        connected: false,
        connectedAt: undefined,
        hasDatabaseId: false,
      };
    }

    return {
      connected: !!data?.notion_access_token && !!data?.notion_database_id,
      connectedAt: data?.notion_connected_at,
      hasDatabaseId: !!data?.notion_database_id,
    };
  } catch (error) {
    console.error('Failed to get Notion integration status:', error);
    // Return default values instead of throwing
    return {
      connected: false,
      connectedAt: undefined,
      hasDatabaseId: false,
    };
  }
}

/**
 * Notion 연동
 */
export async function connectNotion(userId: string) {
  try {
    const clientId = import.meta.env.VITE_NOTION_CLIENT_ID;
    const redirectUri = `${window.location.origin}/notion-callback`;

    console.log('[connectNotion] Starting Notion OAuth...');
    console.log('[connectNotion] clientId:', clientId);
    console.log('[connectNotion] redirectUri:', redirectUri);
    console.log('[connectNotion] userId:', userId);

    if (!clientId) {
      throw new Error('VITE_NOTION_CLIENT_ID 환경변수가 설정되지 않았습니다.');
    }

    const authUrl = `https://api.notion.com/v1/oauth/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `owner=user&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${encodeURIComponent(`notion_${userId}`)}`;

    console.log('[connectNotion] authUrl:', authUrl);

    // 새 창에서 OAuth 플로우 시작
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'Notion OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    console.log('[connectNotion] popup opened:', !!popup);

    if (!popup) {
      throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
    }

    // OAuth 완료 대기
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // 연동 상태 다시 확인
          getNotionIntegrationStatus(userId)
            .then((status) => {
              if (status.connected) {
                resolve({ success: true });
              } else {
                resolve({
                  success: false,
                  error: '연동이 완료되지 않았습니다. 다시 시도해주세요.',
                });
              }
            })
            .catch((error) => {
              resolve({
                success: false,
                error: error.message,
              });
            });
        }
      }, 500);

      // 5분 타임아웃
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!popup.closed) {
          popup.close();
        }
        resolve({
          success: false,
          error: '연동 시간이 초과되었습니다.',
        });
      }, 5 * 60 * 1000);
    });
  } catch (error: any) {
    console.error('Failed to connect Notion:', error);
    return {
      success: false,
      error: error.message || '연동에 실패했습니다.',
    };
  }
}

/**
 * Notion 연동 해제
 */
export async function disconnectNotion(userId: string) {
  try {
    const { error } = await supabase
      .from('settings')
      .update({
        notion_access_token: null,
        notion_database_id: null,
        notion_connected_at: null,
      })
      .eq('instructor_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Failed to disconnect Notion:', error);
    return {
      success: false,
      error: error.message || '연동 해제에 실패했습니다.',
    };
  }
}
