import { supabase } from './supabase/client';

/**
 * Google Calendar API를 사용하여 새 캘린더 생성
 */
export async function createCoachingCalendar(calendarName: string = '코칭 예약') {
  try {
    // 현재 세션에서 Google access token 가져오기
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.provider_token) {
      throw new Error('Google 인증 토큰이 없습니다. 다시 로그인해주세요.');
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

    // 생성된 캘린더를 공유 가능하도록 설정 (선택사항)
    await makeCalendarPublic(calendar.id, accessToken);

    return {
      id: calendar.id,
      name: calendar.summary,
      link: `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendar.id)}`
    };
  } catch (error: any) {
    console.error('캘린더 생성 오류:', error);
    throw error;
  }
}

/**
 * 캘린더를 공개 설정 (선택사항)
 */
async function makeCalendarPublic(calendarId: string, accessToken: string) {
  try {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/acl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
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
 * Google Calendar에 이벤트 추가
 */
export async function addEventToCalendar(params: {
  calendarId: string;
  title: string;
  start: string; // ISO 8601 format
  end: string;   // ISO 8601 format
  description?: string;
  attendees?: string[]; // email addresses
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.provider_token) {
      throw new Error('Google 인증 토큰이 없습니다.');
    }

    const accessToken = session.provider_token;

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
      attendees: params.attendees?.map(email => ({ email })),
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
 * 사용자의 캘린더 목록 가져오기
 */
export async function getCalendarList() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.provider_token) {
      throw new Error('Google 인증 토큰이 없습니다.');
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
