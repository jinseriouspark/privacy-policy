// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정 (환경변수와 동일하게)
firebase.initializeApp({
  apiKey: "AIzaSyAY8LIOao1uh26cq1Iy7f1gB_EbKvC55F0",
  authDomain: "jungsukyulsa.firebaseapp.com",
  projectId: "jungsukyulsa",
  storageBucket: "jungsukyulsa.firebasestorage.app",
  messagingSenderId: "207152218307",
  appId: "1:207152218307:web:37ae7f7acbe31d2be9bec2",
  measurementId: "G-TLTL0FH3HC"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 처리
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification.title || '정수결사';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo.jpeg',
    badge: '/logo.jpeg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] 알림 클릭:', event);
  event.notification.close();

  // 앱 열기
  event.waitUntil(
    clients.openWindow('/')
  );
});
