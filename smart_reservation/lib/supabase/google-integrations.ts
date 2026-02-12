import { supabase } from './client';

/**
 * Google 서비스 연동 상태 조회
 */
export async function getGoogleIntegrationStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('google_calendar_id')
      .eq('instructor_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Settings query error:', error);
      // Return default values instead of throwing
      return {
        meet: false,
        drive: false,
        docs: false,
        connectedAt: undefined,
        folderName: undefined,
      };
    }

    // 연동 상태 판단 - Google Calendar만 지원
    const hasCalendar = !!data?.google_calendar_id;

    return {
      meet: false, // 현재 미지원
      drive: false, // 현재 미지원
      docs: false, // 현재 미지원
      connectedAt: hasCalendar ? new Date().toISOString() : undefined,
      folderName: undefined,
    };
  } catch (error) {
    console.error('Failed to get integration status:', error);
    // Return default values instead of throwing
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
 * Google 서비스 연동
 */
export async function connectGoogleService(
  userId: string,
  service: 'meet' | 'drive' | 'docs',
  scopes: string[]
) {
  try {
    // OAuth URL 생성
    const redirectUri = `${window.location.origin}/google-callback`;
    const scopeString = scopes.join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopeString)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${userId}`;

    // 새 창에서 OAuth 플로우 시작
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
    }

    // OAuth 완료 대기
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // 연동 상태 다시 확인
          getGoogleIntegrationStatus(userId)
            .then((status) => {
              const connected = service === 'meet' ? status.meet :
                               service === 'drive' ? status.drive :
                               status.docs;

              if (connected) {
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
    // Google Calendar 연동 해제
    const { error } = await supabase
      .from('settings')
      .update({
        google_calendar_id: null,
        linked_calendars: [],
        busy_times_cache: [],
        last_synced_at: null,
      })
      .eq('instructor_id', userId);

    if (error) throw error;

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
 * 현재는 Google Calendar만 지원
 */
export async function handleGoogleOAuthCallback(
  userId: string,
  code: string
) {
  try {
    // 현재 Google Drive/Meet 연동 미지원
    // Google Calendar 연동은 별도 플로우 사용
    return {
      success: false,
      error: 'Google Drive 연동은 현재 지원하지 않습니다.',
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
