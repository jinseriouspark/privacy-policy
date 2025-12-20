
export enum UserType {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor'
}

export interface User {
  email: string;
  name: string;
  remaining: number;
  total?: number; // For coach view
  picture?: string;
  userType?: UserType;
  username?: string; // For public booking link (e.g., /book/username)
  bio?: string; // Instructor bio
  isProfileComplete?: boolean; // Has completed onboarding
  studioName?: string; // [NEW] 강사용 스튜디오 이름
  phone?: string; // [NEW] 연락처
  packages?: ClassPackage[]; // [NEW] 판매 중인 수강권
}

export interface Instructor {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string;
}

export enum ClassType {
  PRIVATE = 'private',     // 개인 레슨 (1:1)
  GROUP = 'group'          // 그룹 수업
}

export interface ClassPackage {
  id: string;
  name: string;
  type: ClassType;
  credits: number;         // 횟수
  validDays: number;       // 유효기간 (일)
  price: number;
  isActive: boolean;
}

export interface ClassSession {
  id: string;
  instructorEmail: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: ClassType;
  maxCapacity: number;     // 정원 (그룹 수업만)
  currentCount: number;    // 현재 인원
  title: string;           // 수업명
  status: 'scheduled' | 'cancelled' | 'completed';
}

export interface Reservation {
  reservationId: string;
  sessionId?: string;      // [NEW] 그룹 수업용
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: string;
  meetLink?: string | null;
  instructorName?: string; // 예약 목록 표시용
  studentName?: string;    // [Coach Mode] 수강생 이름
  studentEmail?: string;   // [Coach Mode] 수강생 이메일
  classType?: ClassType;   // [NEW]
  attendanceStatus?: 'pending' | 'attended' | 'absent' | 'late'; // [NEW] 출석 상태
}

export interface DashboardData {
  remaining: number;
  reservations: Reservation[];
  isCoach?: boolean; // 현재 데이터가 코치용인지 여부
}

export interface WorkingHour {
  start: string; // "10:00"
  end: string;   // "19:00"
  isWorking: boolean;
}

export interface BusyRange {
  start: string; // ISO String
  end: string;   // ISO String
  source: 'calendar' | 'system';
}

export interface AvailabilityData {
  workingHours: { [key: string]: WorkingHour }; // Key: "0" ~ "6" (Day Index)
  busyRanges: BusyRange[];
}

export interface CalendarCheckResult {
  isConnected: boolean;
  adminEmail: string;
  instructorId: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export enum ViewState {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  STUDIO_SETUP = 'STUDIO_SETUP',
  DASHBOARD = 'DASHBOARD',
  INSTRUCTOR_SELECT = 'INSTRUCTOR_SELECT',
  RESERVATION = 'RESERVATION',
  PROFILE = 'PROFILE',
}