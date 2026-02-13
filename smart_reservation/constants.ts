
/**
 * 1. 백엔드 주소 (Google Apps Script Web App URL)
 * - 스프레드시트 > 확장 프로그램 > Apps Script > 배포 > 새 배포 > '웹 앱 URL'을 복사해서 아래에 넣으세요.
 * - 주의: Cloud Run 주소가 아닙니다! 'script.google.com'으로 시작해야 합니다.
 */
export const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzkYhEv3pn2Iex-8lpdb84h44iFeF_3DantYHnUKs3dc42zllCI0m176Kqr9G0YD8xf/exec'; 

/**
 * 2. 구글 로그인 클라이언트 ID (Google Cloud Client ID)
 * - https://console.cloud.google.com/apis/credentials 에서 생성한 ID를 넣으세요.
 *
 * [필수 설정] Google Cloud Console > 사용자 인증 정보 > OAuth 2.0 클라이언트 ID 설정에서:
 * - '승인된 자바스크립트 원본'에 당신의 Cloud Run 주소를 반드시 추가해야 합니다.
 * - 예: https://smart-coaching-reservation-888183052808.us-west1.run.app
 */
export const GOOGLE_CLIENT_ID = '888183052808-gd3ftmi69baff6igje6srtamk340n8hi.apps.googleusercontent.com';

/**
 * 3. Google OAuth 스코프 (권한 요청 범위)
 * - 로그인 시 요청할 권한 목록
 * - 캘린더 API 사용을 위해 calendar 스코프 필요
 */
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar',           // 캘린더 읽기/쓰기
  'https://www.googleapis.com/auth/calendar.events',    // 이벤트 생성/수정/삭제
  'https://www.googleapis.com/auth/drive.readonly',     // Drive 녹화 파일 읽기
].join(' ');
