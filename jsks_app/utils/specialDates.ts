// 2026년 절기와 특별한 날들
const specialDates2026: Record<string, string> = {
  '2026-01-01': '음력 11.13',
  '2026-01-05': '소한',
  '2026-01-07': '방학특강',
  '2026-01-11': '정수결사67',
  '2026-01-12': '음력 11.24',
  '2026-01-19': '음력 12.1',
  '2026-01-20': '대한',
  '2026-01-21': '방학특강',
  '2026-01-26': '성도재일',
  '2026-02-02': '음력 12.15',
  '2026-02-04': '방학특강(입춘)',
  '2026-02-09': '음력 12.22',
  '2026-02-16': '음력 12.29',
  '2026-02-17': '설날 음력 1.1',
  '2026-02-19': '우수',
  '2026-02-21': '정초산림 음력 1.6',
  '2026-02-22': '정초산림',
  '2026-02-23': '정초산림 음력 1.7',
  '2026-03-01': '삼일절',
  '2026-03-02': '대체휴일',
  '2026-03-03': '동안거 해제 음력 1.15',
  '2026-03-05': '경칩',
  '2026-03-08': '위문법회',
  '2026-03-09': '음력 1.21',
  '2026-03-11': '개강',
  '2026-03-13': '개강',
  '2026-03-16': '음력 1.28',
  '2026-03-20': '춘분',
  '2026-04-01': '템플스테이 음력 2.14',
  '2026-04-02': '템플스테이',
  '2026-04-05': '식목일 청명',
  '2026-04-06': '음력 2.19',
  '2026-04-12': '정수결사68',
  '2026-04-13': '음력 2.26',
  '2026-04-20': '곡우',
  '2026-04-27': '음력 3.11',
  '2026-05-04': '음력 3.18',
  '2026-05-05': '어린이날 입하',
  '2026-05-11': '음력 3.25',
  '2026-05-18': '음력 4.2',
  '2026-05-21': '소만',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체휴일 음력 4.9',
  '2026-05-31': '하안거결재 음력 4.15',
  '2026-06-06': '현충일 망종',
  '2026-06-19': '단오',
  '2026-07-07': '소서',
  '2026-07-08': '우란분재입재',
  '2026-07-12': '정수결사69',
  '2026-07-15': '초재 초복',
  '2026-07-17': '종강',
  '2026-07-23': '대서',
  '2026-07-25': '중복',
  '2026-07-29': '3재',
  '2026-08-07': '입추',
  '2026-08-14': '말복',
  '2026-08-15': '광복절',
  '2026-08-17': '대체휴일',
  '2026-08-19': '칠석',
  '2026-08-23': '처서',
  '2026-08-27': '우란분재 음력 7.15',
  '2026-09-01': '템플스테이',
  '2026-09-02': '템플스테이',
  '2026-09-07': '백로',
  '2026-09-09': '개강',
  '2026-09-11': '개강',
  '2026-09-23': '추분',
  '2026-09-25': '추석 음력 8.15',
  '2026-10-03': '개천절',
  '2026-10-05': '대체휴일',
  '2026-10-08': '한로',
  '2026-10-09': '한글날',
  '2026-10-11': '정수결사70',
  '2026-10-23': '상강',
  '2026-11-07': '입동',
  '2026-11-08': '위문법회',
  '2026-11-22': '소설',
  '2026-11-24': '음력 10.16',
  '2026-12-02': '종강',
  '2026-12-07': '대설',
  '2026-12-18': '종강',
  '2026-12-22': '동지',
  '2026-12-25': 'X-mas',
};

// 모든 연도의 데이터를 합침
const allSpecialDates: Record<string, string> = {
  ...specialDates2026,
};

// 숨김 처리된 절기 데이터 관리
export function getHiddenDates(): string[] {
  const hidden = localStorage.getItem('hiddenSpecialDates');
  return hidden ? JSON.parse(hidden) : [];
}

export function hideSpecialDate(dateKey: string) {
  const hidden = getHiddenDates();
  if (!hidden.includes(dateKey)) {
    hidden.push(dateKey);
    localStorage.setItem('hiddenSpecialDates', JSON.stringify(hidden));
  }
}

export function showSpecialDate(dateKey: string) {
  const hidden = getHiddenDates();
  const filtered = hidden.filter(d => d !== dateKey);
  localStorage.setItem('hiddenSpecialDates', JSON.stringify(filtered));
}

export function getAllSpecialDates(): Record<string, string> {
  return { ...allSpecialDates };
}

// 24절기 목록
const SOLAR_TERMS = ['소한', '대한', '입춘', '우수', '경칩', '춘분', '청명', '곡우', '입하', '소만', '망종', '하지', '소서', '대서', '입추', '처서', '백로', '추분', '한로', '상강', '입동', '소설', '대설', '동지'];

// 24절기인지 확인
export function isSolarTerm(title: string): boolean {
  return SOLAR_TERMS.some(term => title.includes(term));
}

// 특별한 날에서 음력 정보와 절기/행사 분리
export function getSpecialDate(dateKey: string, isMonday: boolean): { lunarInfo?: string; event?: string } {
  // 숨김 처리된 날짜 확인
  const hidden = getHiddenDates();
  if (hidden.includes(dateKey)) {
    return {};
  }

  const special = allSpecialDates[dateKey];
  if (!special) return {};

  // "음력 X.X" 패턴 찾기
  const lunarMatch = special.match(/음력\s*(\d+\.\d+)/);

  if (lunarMatch) {
    const lunarPart = lunarMatch[0]; // "음력 11.13"
    const eventPart = special.replace(lunarPart, '').trim(); // 나머지 부분

    return {
      lunarInfo: isMonday ? undefined : lunarMatch[1], // 월요일이면 음력 안 보여줌
      event: eventPart || undefined
    };
  }

  // 음력 정보 없으면 전체를 행사로
  return { event: special };
}
