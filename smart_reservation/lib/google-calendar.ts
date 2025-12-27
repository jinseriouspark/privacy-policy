import { supabase } from './supabase/client';

/**
 * Google Calendar API를 사용하여 새 캘린더 생성
 */
export async function createCoachingCalendar(calendarName: string = '코칭 예약') {
  try {
    // 현재 세션에서 Google access token 가져오기
    const { data: { session } } = await supabase.auth.getSession();

    console.log('[createCoachingCalendar] Session check:', {
      hasSession: !!session,
      hasProviderToken: !!session?.provider_token,
      provider: session?.user?.app_metadata?.provider
    });

    if (!session?.provider_token) {
      throw new Error('캘린더 권한이 필요합니다. 우측 상단에서 로그아웃 후 다시 로그인해주세요.');
    }

    const accessToken = session.provider_token;

    // Google Calendar API로 새 캘린더 생성
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: calendarName,
        description: '예약매니아를 통한 코칭 예약 전용 캘린더',
        timeZone: 'Asia/Seoul'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '캘린더 생성에 실패했습니다.');
    }

    const calendar = await response.json();

    console.log('[createCoachingCalendar] Calendar created:', calendar.id);

    // 캘린더 목록에 명시적으로 추가 (사용자 UI에 표시되도록)
    await addCalendarToList(calendar.id, accessToken);

    // 생성된 캘린더를 공유 가능하도록 설정 (선택사항)
    await makeCalendarPublic(calendar.id, accessToken);

    return {
      id: calendar.id,
      name: calendar.summary,
      link: getCalendarPublicUrl(calendar.id),
      subscribeUrl: getCalendarSubscribeUrl(calendar.id)
    };
  } catch (error: any) {
    console.error('캘린더 생성 오류:', error);
    throw error;
  }
}

/**
 * 캘린더를 사용자의 캘린더 목록에 명시적으로 추가
 * (Google Calendar UI에 표시되도록)
 */
async function addCalendarToList(calendarId: string, accessToken: string) {
  try {
    console.log('[addCalendarToList] Adding calendar to list:', calendarId);

    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: calendarId,
        selected: true,  // 캘린더를 선택된 상태로 표시
        defaultReminders: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 1440 }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn('[addCalendarToList] Failed:', error);
      // 이미 목록에 있을 수 있으므로 에러 무시
    } else {
      console.log('[addCalendarToList] Successfully added to calendar list');
    }
  } catch (error) {
    console.warn('[addCalendarToList] Error:', error);
    // 캘린더 목록 추가 실패는 무시 (이미 존재할 수 있음)
  }
}

/**
 * 캘린더를 공개 설정 (선택사항)
 */
async function makeCalendarPublic(calendarId: string, accessToken: string) {
  try {
    // Grant write access so students can create reservations
    // Note: In production, consider more restrictive permissions
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/acl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'writer', // Changed from 'reader' to 'writer' to allow event creation
        scope: {
          type: 'default'
        }
      })
    });
  } catch (error) {
    console.warn('캘린더 공개 설정 실패:', error);
    // 공개 설정 실패는 무시 (필수가 아님)
  }
}

/**
 * 🆕 기존 캘린더의 public 권한을 writer로 업데이트
 * (테스트/개발용 - 기존 캘린더 권한 수정)
 */
export async function upgradeCalendarToWriter(calendarId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.provider_token) {
      throw new Error('Google 인증이 필요합니다.');
    }

    console.log('[upgradeCalendarToWriter] Updating calendar ACL to writer:', calendarId);

    // 1. 먼저 기존 default ACL 찾기
    const listResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`,
      {
        headers: {
          'Authorization': `Bearer ${session.provider_token}`,
        }
      }
    );

    if (!listResponse.ok) {
      throw new Error('Failed to list ACLs');
    }

    const aclList = await listResponse.json();
    const defaultRule = aclList.items?.find((item: any) => item.scope.type === 'default');

    if (defaultRule) {
      // 2. 기존 default rule을 삭제
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl/${defaultRule.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.provider_token}`,
          }
        }
      );
      console.log('[upgradeCalendarToWriter] Deleted old default ACL');
    }

    // 3. 새로운 writer 권한 추가
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.provider_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          scope: {
            type: 'default'
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[upgradeCalendarToWriter] Failed:', error);
      throw new Error(error.error?.message || '권한 업데이트 실패');
    }

    console.log('[upgradeCalendarToWriter] Successfully upgraded to writer');
    alert('✅ 캘린더 권한이 writer로 업데이트되었습니다!\n이제 학생이 예약 시 Google Calendar에 자동으로 추가됩니다.');
    return true;
  } catch (error: any) {
    console.error('[upgradeCalendarToWriter] Error:', error);
    alert('❌ 권한 업데이트 실패: ' + error.message);
    throw error;
  }
}

/**
 * 사용자에게 캘린더 writer 권한 부여
 */
export async function addCalendarWriter(calendarId: string, userEmail: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.provider_token) {
      throw new Error('Google 인증이 필요합니다.');
    }

    console.log('[addCalendarWriter] Adding writer:', { calendarId, userEmail });

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/acl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.provider_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'writer',
        scope: {
          type: 'user',
          value: userEmail
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[addCalendarWriter] Failed:', error);
      throw new Error(error.error?.message || '권한 추가 실패');
    }

    console.log('[addCalendarWriter] Successfully added writer');
    return true;
  } catch (error) {
    console.error('[addCalendarWriter] Error:', error);
    throw error;
  }
}

/**
 * Google Calendar에 이벤트 추가
 */
export async function addEventToCalendar(params: {
  calendarId: string;
  title: string;
  start: string; // ISO 8601 format
  end: string;   // ISO 8601 format
  description?: string;
  attendees?: string[]; // email addresses
  instructorId?: number; // 🆕 instructor's user ID to use their token
}) {
  try {
    let accessToken: string;

    // 🆕 Use instructor's token if provided
    if (params.instructorId) {
      const { getInstructorTokens } = await import('./supabase/database');
      const tokens = await getInstructorTokens(params.instructorId);

      if (!tokens?.google_access_token) {
        throw new Error('강사의 Google 인증 토큰이 없습니다. 강사에게 다시 로그인하도록 요청하세요.');
      }

      // Check if token is expired
      const expiresAt = tokens.google_token_expires_at ? new Date(tokens.google_token_expires_at) : null;
      const isExpired = expiresAt && expiresAt < new Date();

      if (isExpired && tokens.google_refresh_token) {
        // TODO: Refresh token logic (for now, ask instructor to re-login)
        throw new Error('강사의 Google 토큰이 만료되었습니다. 강사에게 다시 로그인하도록 요청하세요.');
      }

      accessToken = tokens.google_access_token;
      console.log('[addEventToCalendar] Using instructor token for instructor:', params.instructorId);
    } else {
      // Use current logged-in user's token (fallback for backward compatibility)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.provider_token) {
        throw new Error('Google 인증 토큰이 없습니다.');
      }

      accessToken = session.provider_token;
      console.log('[addEventToCalendar] Using current user token');
    }

    const requestBody = {
      summary: params.title,
      description: params.description,
      start: {
        dateTime: params.start,
        timeZone: 'Asia/Seoul'
      },
      end: {
        dateTime: params.end,
        timeZone: 'Asia/Seoul'
      },
      attendees: params.attendees?.map(email => ({
        email,
        responseStatus: 'accepted' // 자동으로 수락된 상태로 설정
      })),
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    console.log('Google Calendar API Request:', {
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events?conferenceDataVersion=1`,
      body: requestBody
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(params.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Calendar API Error:', error);
      throw new Error(error.error?.message || '이벤트 생성에 실패했습니다.');
    }

    const event = await response.json();
    console.log('Google Calendar Event Created:', event);

    return {
      id: event.id,
      meetLink: event.hangoutLink,
      htmlLink: event.htmlLink
    };
  } catch (error: any) {
    console.error('이벤트 생성 오류:', error);
    throw error;
  }
}

/**
 * 🆕 수강생의 primary 캘린더에 이벤트 추가
 * (강사 캘린더의 Meet 링크 포함)
 */
export async function addEventToStudentCalendar(params: {
  title: string;
  start: string;
  end: string;
  meetLink: string;
  instructorName: string;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.provider_token) {
      console.warn('[addEventToStudentCalendar] No provider token, skipping');
      return null; // Don't throw - student calendar is optional
    }

    const accessToken = session.provider_token;

    const requestBody = {
      summary: params.title,
      description: `강사: ${params.instructorName}\n\nGoogle Meet 링크: ${params.meetLink}`,
      start: {
        dateTime: params.start,
        timeZone: 'Asia/Seoul'
      },
      end: {
        dateTime: params.end,
        timeZone: 'Asia/Seoul'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    console.log('[addEventToStudentCalendar] Adding event to student calendar');

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[addEventToStudentCalendar] Error:', error);
      return null; // Don't throw - student calendar is optional
    }

    const event = await response.json();
    console.log('[addEventToStudentCalendar] Event added successfully:', event.htmlLink);

    return {
      id: event.id,
      htmlLink: event.htmlLink
    };
  } catch (error: any) {
    console.error('[addEventToStudentCalendar] Error:', error);
    return null; // Don't throw - student calendar is optional
  }
}

/**
 * 사용자의 캘린더 목록 가져오기
 */
export async function getCalendarList() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.provider_token) {
      throw new Error('캘린더 권한이 필요합니다. 우측 상단에서 로그아웃 후 다시 로그인해주세요.');
    }

    const accessToken = session.provider_token;

    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      throw new Error('캘린더 목록을 가져올 수 없습니다.');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error: any) {
    console.error('캘린더 목록 조회 오류:', error);
    throw error;
  }
}

/**
 * 🆕 기존 캘린더가 목록에 없으면 자동으로 추가
 * (이미 생성된 캘린더를 사용자 UI에 표시)
 */
export async function ensureCalendarInList(calendarId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.provider_token) {
      console.warn('[ensureCalendarInList] No provider token, skipping');
      return false;
    }

    const accessToken = session.provider_token;

    console.log('[ensureCalendarInList] Checking calendar:', calendarId);

    // 1. 현재 캘린더 목록 가져오기
    const calendarList = await getCalendarList();
    const exists = calendarList.some((cal: any) => cal.id === calendarId);

    if (exists) {
      console.log('[ensureCalendarInList] Calendar already in list');
      return true;
    }

    // 2. 목록에 없으면 추가
    console.log('[ensureCalendarInList] Adding calendar to list...');
    await addCalendarToList(calendarId, accessToken);

    console.log('[ensureCalendarInList] ✅ Calendar added to list successfully');
    return true;
  } catch (error: any) {
    console.error('[ensureCalendarInList] Error:', error);
    return false;
  }
}

/**
 * 🆕 캘린더 공개 URL 생성
 */
export function getCalendarPublicUrl(calendarId: string): string {
  const encodedId = encodeURIComponent(calendarId);
  return `https://calendar.google.com/calendar/embed?src=${encodedId}&ctz=Asia%2FSeoul`;
}

/**
 * 🆕 캘린더 구독 URL 생성 (클릭 한 번에 내 캘린더에 추가)
 */
export function getCalendarSubscribeUrl(calendarId: string): string {
  const encodedId = encodeURIComponent(calendarId);
  return `https://calendar.google.com/calendar/u/0/r?cid=${encodedId}`;
}

/**
 * 여러 캘린더의 busy 시간 조회 (시간 충돌 방지용)
 */
export async function getCalendarBusyTimes(params: {
  calendarIds: string[];  // 확인할 캘린더 ID 목록
  timeMin: string;        // ISO 8601 format
  timeMax: string;        // ISO 8601 format
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.provider_token) {
      throw new Error('캘린더 권한이 필요합니다. 우측 상단에서 로그아웃 후 다시 로그인해주세요.');
    }

    const accessToken = session.provider_token;

    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        items: params.calendarIds.map(id => ({ id }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Busy 시간 조회에 실패했습니다.');
    }

    const data = await response.json();

    // 모든 캘린더의 busy 시간을 하나의 배열로 합치기
    const allBusyTimes: Array<{ start: string; end: string }> = [];

    Object.values(data.calendars || {}).forEach((calendar: any) => {
      if (calendar.busy && Array.isArray(calendar.busy)) {
        allBusyTimes.push(...calendar.busy);
      }
    });

    return allBusyTimes;
  } catch (error: any) {
    console.error('Busy 시간 조회 오류:', error);
    throw error;
  }
}
