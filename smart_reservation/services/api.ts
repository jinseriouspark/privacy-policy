
import { GAS_WEB_APP_URL } from '../constants';
import { ApiResponse } from '../types';

// Helper to parse URL: /book/{studio_slug}/{coaching_id} or /{coach_id}/{class_slug} (legacy)
const parseBookingUrl = () => {
  const path = window.location.pathname;
  const parts = path.split('/').filter(p => p);

  // Exclude dashboard/system routes
  const systemRoutes = [
    'summary', 'all-reservation', 'group', 'attend', 'student', 'membership', 'class',
    'onboarding', 'privacy-policy', 'terms-of-service', 'login', 'setup', 'dashboard',
    'reservations', 'students', 'attendance', 'packages', 'profile'
  ];

  // New format: /book/{studio_slug}/{coaching_id}
  if (parts.length >= 3 && parts[0] === 'book') {
    return {
      coachId: null,
      classSlug: parts[2],
      studioSlug: parts[1]
    };
  }

  // New format: /book/{studio_slug} (coach selection)
  if (parts.length === 2 && parts[0] === 'book') {
    return {
      coachId: null,
      classSlug: null,
      studioSlug: parts[1]
    };
  }

  // If first part is system route, not a booking URL
  if (parts.length > 0 && systemRoutes.includes(parts[0])) {
    return { coachId: null, classSlug: null, studioSlug: null };
  }

  // Legacy format: /{coach_id}/{class_slug}
  if (parts.length >= 2) {
    return {
      coachId: parts[0],
      classSlug: parts[1],
      studioSlug: null
    };
  }

  // Legacy format: /{class_slug} (single slug, backward compat)
  if (parts.length === 1) {
    return {
      coachId: null,
      classSlug: parts[0],
      studioSlug: null
    };
  }

  return { coachId: null, classSlug: null, studioSlug: null };
};

export const getCurrentProjectSlug = () => parseBookingUrl().classSlug;
export const getCurrentCoachId = () => parseBookingUrl().coachId;
export const getStudioSlug = () => parseBookingUrl().studioSlug;
export const getBookingUrlParams = () => parseBookingUrl();

// --- DEMO MODE MOCK DATA ---
let mockUser = {
  email: '',
  name: '데모 수강생',
  remaining: 5,
};

const mockReservations: any[] = [
  { reservationId: 'mock-1', date: '2024-05-20', time: '10:00', status: '확정됨', instructorName: '김코치' }
];

export const postToGAS = async <T>(payload: any): Promise<T> => {
  const coachId = getCurrentCoachId();
  const { action } = payload;

  // 회원가입/탈퇴/로그인은 coachId 불필요한 액션들
  const noCoachIdRequired = ['signup', 'deleteAccount', 'login'];

  // 1. 데모 모드 체크 (API URL 미설정 시)
  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes('AKfycbx')) {
    await new Promise(resolve => setTimeout(resolve, 600));

    if (action === 'login') {
      mockUser.email = payload.email || 'student@demo.com';
      return { ...mockUser } as unknown as T;
    }
    if (action === 'getRemainingSessions') {
      return { remaining: mockUser.remaining, reservations: [...mockReservations] } as unknown as T;
    }
    if (action === 'getAvailability') {
        return {
            workingHours: { 1: { start:'10:00', end:'19:00', isWorking: true } },
            busyRanges: []
        } as unknown as T;
    }
    if (action === 'makeReservation') {
        mockUser.remaining -= 1;
        return { status: '확정됨', remaining: mockUser.remaining } as unknown as T;
    }
    return {} as unknown as T;
  }

  // 2. coachId 체크 - instructorId가 payload에 이미 있으면 사용
  const instructorId = payload.instructorId || coachId;

  // GAS API를 사용하는 기능들은 모두 비활성화
  if (!noCoachIdRequired.includes(action) && !instructorId) {
    console.warn("⚠️ Supabase 마이그레이션 필요: 이 기능은 아직 GAS API를 사용합니다.");
    console.warn("⚠️ 현재 액션:", action);

    // Return empty/mock data instead of throwing error
    if (action.includes('get')) {
      return [] as unknown as T;
    }
    return {} as unknown as T;
  }

  // 2. 실제 API 호출 (SaaS Mode)
  try {
    // 모든 요청에 instructorId (coachId) 자동 주입
    const finalPayload = {
        ...payload,
        instructorId: coachId,
        instructorName: 'Coach' // 필요 시 확장 가능
    };

    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(finalPayload),
    });

    // [에러 진단] HTML 응답이 오면 배포 설정 문제일 가능성이 높음
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
        throw new Error("⚠️ 배포 설정 오류: 스크립트 권한 설정이 '모든 사용자(Anyone)'로 되어있지 않습니다. 앱스 스크립트 배포 설정을 확인하세요.");
    }

    if (!response.ok) {
      throw new Error(`HTTP 오류 (${response.status}): ${response.statusText || '서버 응답 오류'}`);
    }

    const json: ApiResponse<T> = await response.json();

    if (json.status === 'error') {
      throw new Error(json.message || 'API 오류가 발생했습니다.');
    }

    if (!json.data) {
      throw new Error('서버에서 데이터를 받지 못했습니다.');
    }

    return json.data as T;
  } catch (error: any) {
    console.error("API 호출 실패:", error);

    // 네트워크 오류 처리
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('네트워크 연결을 확인해주세요.');
    }

    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      throw new Error('서버 응답 형식이 올바르지 않습니다.');
    }

    // 기타 오류는 그대로 던짐
    throw error;
  }
};
