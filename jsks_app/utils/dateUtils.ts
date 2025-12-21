// 한국 시간대(UTC+9) 기준 날짜 유틸리티

/**
 * 한국 시간 기준 현재 날짜 객체 반환
 */
export const getKoreanDate = (): Date => {
  const now = new Date();
  // UTC 시간에 9시간 추가
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (9 * 60 * 60 * 1000));
};

/**
 * 한국 시간 기준 오늘 날짜 문자열 (YYYY-MM-DD)
 */
export const getKoreanToday = (): string => {
  const kst = getKoreanDate();
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Date 객체를 한국 시간 기준으로 변환
 */
export const toKoreanDate = (date: Date): Date => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (9 * 60 * 60 * 1000));
};
