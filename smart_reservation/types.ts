
export enum UserType {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor'
}

export type UserRole = 'instructor' | 'student';

export interface User {
  id?: string; // Supabase user UUID - optional for backward compatibility
  email: string;
  name: string;
  remaining: number;
  total?: number; // For coach view
  picture?: string;

  // 🆕 Role-based system (사용자는 여러 역할을 가질 수 있음)
  roles?: UserRole[]; // ['instructor', 'student'] - 강사이면서 학생 가능
  primaryRole?: UserRole; // 주 역할 (instructor 우선)

  // ⚠️ Deprecated (하위 호환성 유지)
  userType?: UserType; // primaryRole로 대체됨

  short_id?: string; // For public booking link (e.g., /book/short_id)
  bio?: string; // Instructor bio
  isProfileComplete?: boolean; // Has completed onboarding
  studioName?: string; // 강사용 스튜디오 이름
  phone?: string; // 연락처
  packages?: ClassPackage[]; // 판매 중인 수강권
  created_at?: string; // 가입일
}

export interface Instructor {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string;
}

export interface Coaching {
  id: string;
  instructor_id: string;
  title: string;
  slug?: string; // Optional - not currently used
  type: ClassType;
  description?: string;
  duration: number;
  cancellation_hours?: number;
  google_calendar_id?: string;
  status: 'active' | 'inactive';
  working_hours?: { [key: string]: WorkingHour };
  created_at: string;
  updated_at: string;
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

// ViewState enum removed - now using URL-based routing
// See utils/router.ts for route definitions

// Subscription & Pricing Types
export type PlanId = 'free' | 'standard' | 'teams' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  display_name: string;
  description: string | null;
  monthly_price: number; // 원 단위
  yearly_price: number;
  features: Record<string, boolean>;
  limits: {
    max_students: number | null; // null = unlimited
    max_reservations_per_month: number | null;
    max_coachings: number | null;
    max_instructors: number | null;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: PlanId;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  reservations_count: number;
  students_count: number;
  coachings_count: number;
  instructors_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlanLimitCheck {
  allowed: boolean;
  current_count: number;
  max_limit: number | null;
  message: string;
}