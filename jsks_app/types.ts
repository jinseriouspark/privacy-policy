
export interface DayData {
  dayLabel: string;
  dayNumber: number;
  status: 'complete' | 'today' | 'future' | 'missed';
  isToday: boolean;
  hasSchedule?: boolean;
  lunarDate?: string;
}

export type ScheduleType = 'temple' | 'personal' | 'practice';

export interface ScheduleItem {
  id: string;
  type: ScheduleType;
  time: string;
  title: string;
  meta?: string;
  ownerEmail?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  date?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  participants?: string[];
  invitedEmails?: string[];
}

export type UserRole = 'monk' | 'believer' | 'developer';

export interface User {
  name: string;
  email: string;
  photoUrl?: string;
  streak: number;
  trackingIds?: string[];
  role: UserRole;
  notificationSettings?: NotificationSettings | null; 
  dharmaName?: string;
}

export type MediaType = 'youtube' | 'drive-video' | 'drive-audio' | 'drive-pdf' | 'text' | 'text-file';
export type ContentStatus = 'draft' | 'published';
export type DharmaCategory = '경전공부' | '참선법회' | '공부자료';

export interface VideoContent {
  id: string;
  title: string;
  author: string;
  duration: string;
  thumbnailUrl: string;
  youtubeId?: string; // Optional now
  mediaType?: MediaType; // New field
  driveUrl?: string; // For Google Drive files
  driveFileId?: string; // For Google Drive file ID
  textContent?: string; // For direct text input
  status?: ContentStatus; // Draft or Published
  uploadedAt?: string; // Upload timestamp
  publishedAt?: string; // Publish timestamp
  tags?: DharmaCategory; // 경전공부 or 참선법회
}

export interface ChecklistItem {
  id: string;
  category: string;
  question: string;
}

export interface AppConfig {
  homeGreeting: string;
  dharmaTitle: string;
  dharmaDesc: string;
  loginTitle?: string;
  loginSubtitle?: string;
  loadingMessage?: string;
  calendarTitle?: string;
  scheduleTitle?: string;
  practiceCardTitle?: string;
  practiceCardSub?: string;
  onboardingTitle?: string;
  onboardingSubtitle?: string;
  practiceTitle?: string;
  practiceButtonComplete?: string;
  practiceButtonLater?: string;
  profileDharmaLabel?: string;
  notificationTitle?: string;
}

export interface NotificationSettings {
  practiceReminder: boolean;
  practiceTime: string;
  templeNews: boolean;
  dharmaVideo: boolean;
}

export type ViewType = 'login' | 'onboarding' | 'home' | 'schedule' | 'add' | 'practice' | 'dharma' | 'profile' | 'monk-home' | 'notification-settings' | 'practice-log' | 'add-practice' | 'my-events';
    
// Google Identity Services Types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}
