/**
 * Onboarding Tutorial - Driver.js 설정
 *
 * 처음 로그인한 강사에게 단계별 가이드를 제공합니다.
 */

import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';

const TUTORIAL_KEY = 'hasSeenOnboarding';

/**
 * 사용자가 이미 튜토리얼을 봤는지 확인
 */
export function hasSeenTutorial(): boolean {
  return localStorage.getItem(TUTORIAL_KEY) === 'true';
}

/**
 * 튜토리얼을 본 것으로 표시
 */
export function markTutorialAsSeen(): void {
  localStorage.setItem(TUTORIAL_KEY, 'true');
}

/**
 * 튜토리얼 상태 초기화 (다시 보기용)
 */
export function resetTutorial(): void {
  localStorage.removeItem(TUTORIAL_KEY);
}

/**
 * 온보딩 튜토리얼 단계 정의
 */
const steps: DriveStep[] = [
  {
    element: '[data-tour="welcome"]',
    popover: {
      title: '👋 예약매니아에 오신 것을 환영합니다!',
      description: '처음 시작하시는 분들을 위해 간단한 가이드를 준비했어요. 함께 둘러볼까요?',
      side: 'bottom',
      align: 'center',
    }
  },
  {
    element: '[data-tour="class-tab"]',
    popover: {
      title: '1️⃣ 코칭 관리',
      description: '가장 먼저 코칭을 생성하세요. 코칭은 여러분의 수업 카테고리예요. (예: 필라테스, 요가 등)',
      side: 'bottom',
      align: 'start',
    },
    onHighlighted: (element) => {
      if (element && element instanceof HTMLElement) {
        element.click();
      }
    }
  },
  {
    element: '[data-tour="packages-tab"]',
    popover: {
      title: '2️⃣ 수강권 설정',
      description: '학생들에게 판매할 수강권을 만들어요. 개인 레슨용, 그룹 수업용으로 나눠서 만들 수 있어요.',
      side: 'bottom',
      align: 'start',
    },
    onHighlighted: (element) => {
      if (element && element instanceof HTMLElement) {
        element.click();
      }
    }
  },
  {
    element: '[data-tour="users-tab"]',
    popover: {
      title: '3️⃣ 회원 관리',
      description: '학생을 초대하고 수강권을 할당하세요. 카카오톡으로 예약 링크를 보낼 수도 있어요!',
      side: 'bottom',
      align: 'start',
    },
    onHighlighted: (element) => {
      if (element && element instanceof HTMLElement) {
        element.click();
      }
    }
  },
  {
    element: '[data-tour="stats-tab"]',
    popover: {
      title: '4️⃣ 통계 대시보드',
      description: '매출, 예약 현황, 인기 시간대 등을 한눈에 확인하세요!',
      side: 'bottom',
      align: 'start',
    },
    onHighlighted: (element) => {
      if (element && element instanceof HTMLElement) {
        element.click();
      }
    }
  },
  {
    element: '[data-tour="reservations-tab"]',
    popover: {
      title: '5️⃣ 예약 확인',
      description: '학생들이 예약한 수업을 확인하고 관리할 수 있어요. 예약 취소도 여기서!',
      side: 'bottom',
      align: 'start',
    },
    onHighlighted: (element) => {
      if (element && element instanceof HTMLElement) {
        element.click();
      }
    }
  },
  {
    element: '[data-tour="attendance-tab"]',
    popover: {
      title: '6️⃣ 출석 체크',
      description: '수업 후 출석/지각/결석을 체크하고, 메모를 남길 수 있어요.',
      side: 'bottom',
      align: 'start',
    },
    onHighlighted: (element) => {
      if (element && element instanceof HTMLElement) {
        element.click();
      }
    }
  },
  {
    popover: {
      title: '🎉 준비 완료!',
      description: '이제 시작할 준비가 되었어요! 언제든지 우측 상단의 "?" 버튼을 눌러 가이드를 다시 볼 수 있습니다.',
      side: 'top',
      align: 'center',
    }
  }
];

/**
 * Driver.js 설정
 */
const driverConfig: Config = {
  showProgress: true,
  progressText: '{{current}}/{{total}}',
  nextBtnText: '다음',
  prevBtnText: '이전',
  doneBtnText: '완료',
  showButtons: ['next', 'previous', 'close'],

  // 스타일링
  popoverClass: 'driverjs-theme-custom',

  // 애니메이션
  animate: true,

  // 부드러운 스크롤
  smoothScroll: true,

  // 오버레이 클릭 시 닫기 방지
  allowClose: true,
  overlayClickNext: false,

  // 하이라이트 요소 주변 여백 (픽셀)
  padding: 10,

  // 팝오버와 요소 사이 간격
  popoverOffset: 10,

  // 콜백
  onDestroyStarted: () => {
    // 튜토리얼이 끝나면 "본 것으로 표시"
    markTutorialAsSeen();
  },

  steps: steps,
};

/**
 * 온보딩 튜토리얼 시작
 */
export function startOnboarding(): void {
  const driverObj = driver({
    ...driverConfig,
    onDestroyStarted: () => {
      // 튜토리얼이 끝나면 "본 것으로 표시"
      markTutorialAsSeen();
      // 명시적으로 destroy 호출
      driverObj.destroy();
    },
  });
  driverObj.drive();
}

/**
 * 특정 단계로 이동
 */
export function startOnboardingAtStep(stepIndex: number): void {
  const driverObj = driver({
    ...driverConfig,
    onDestroyStarted: () => {
      markTutorialAsSeen();
      driverObj.destroy();
    },
  });
  driverObj.drive(stepIndex);
}
