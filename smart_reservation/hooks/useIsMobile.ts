import { useState, useEffect } from 'react';

/**
 * 모바일 디바이스 감지 Hook
 * - 768px 이하: 모바일
 * - 768px 초과: 데스크톱
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Check on mount
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * 터치 디바이스 감지 (더 정확한 모바일 감지)
 */
export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    setIsTouchDevice(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }, []);

  return isTouchDevice;
}
