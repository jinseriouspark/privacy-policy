import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

// Firebase 설정
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// VAPID 키 (Firebase Console > Project Settings > Cloud Messaging에서 생성)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const messagingService = {
  // 알림 권한 요청 및 토큰 발급
  requestPermission: async (): Promise<string | null> => {
    try {
      console.log('🔔 알림 권한 요청 중...');

      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('✅ 알림 권한 허용됨');

        // FCM 토큰 발급
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY
        });

        console.log('📱 FCM 토큰:', token);
        return token;
      } else {
        console.log('❌ 알림 권한 거부됨');
        return null;
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return null;
    }
  },

  // 포그라운드 메시지 수신 리스너
  onMessageListener: () =>
    new Promise((resolve) => {
      onMessage(messaging, (payload) => {
        console.log('📩 포그라운드 메시지 수신:', payload);
        resolve(payload);
      });
    }),

  // 알림 권한 상태 확인
  checkPermission: (): NotificationPermission => {
    return Notification.permission;
  }
};
