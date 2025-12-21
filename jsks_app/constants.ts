
import { DayData, ScheduleItem, ChecklistItem } from './types';

export const WEEK_DAYS: DayData[] = [
  { dayLabel: 'SUN', dayNumber: 19, status: 'complete', isToday: false },
  { dayLabel: 'MON', dayNumber: 20, status: 'complete', isToday: false },
  { dayLabel: 'TUE', dayNumber: 21, status: 'complete', isToday: false },
  { dayLabel: 'WED', dayNumber: 22, status: 'complete', isToday: false },
  { dayLabel: 'THU', dayNumber: 23, status: 'complete', isToday: false },
  { dayLabel: 'FRI', dayNumber: 24, status: 'today', isToday: true },
  { dayLabel: 'SAT', dayNumber: 25, status: 'future', isToday: false },
];

export const SCHEDULES: ScheduleItem[] = [
  {
    id: '1',
    type: 'temple',
    time: '저녁 7시',
    title: '참선 법회',
    meta: '절 일정 • 예상 참여 28명'
  },
  {
    id: '2',
    type: 'personal',
    time: '오후 8시',
    title: '개인 기도 시간',
    meta: '🏠 자택 • 108배'
  },
];

export const MASTER_CHECKLIST: ChecklistItem[] = [
  // 필수 수행
  { id: 'required-1', category: '필수수행', question: '경전읽기' },
  { id: 'required-2', category: '필수수행', question: '염불' },
  // 선택 수행
  { id: 'optional-1', category: '선택수행', question: '108배' },
  { id: 'optional-2', category: '선택수행', question: '사경' },
  // 정견·공관
  { id: '1', category: '정견·공관', question: '나/사물에 대한 집착을 자각했는가?' },
  { id: '2', category: '정견·공관', question: '모든것이 인연따라 이루어 짐을 떠올렸는가?' },
  { id: '3', category: '정견·공관', question: '공을 허무가 아닌 관계로 체험했는가?' },
  // 보리심
  { id: '4', category: '보리심', question: '하루 시작 하기 전 발원을 했는가?' },
  { id: '5', category: '보리심', question: '힘들 때도 발원을 상기했는가?' },
  { id: '6', category: '보리심', question: '성과를 내 것이라 집착하지 않았는가?' },
  // 육바라밀
  { id: '7', category: '보시', question: '재물·말·지혜의 보시를 실천했는가?' },
  { id: '8', category: '지계', question: '타인에게 해를 끼치지 않았는가?' },
  { id: '9', category: '인욕', question: '분노 대신 알아차림을 유지했는가?' },
  { id: '10', category: '정진', question: '수행·학습·봉사를 게을리하지 않았는가?' },
  { id: '11', category: '선정', question: '좌선·호흡관을 실천했는가?' },
  { id: '12', category: '반야', question: '바라밀을 공관과 연결했는가?' },
  // 방편·자비
  { id: '13', category: '방편·자비', question: '상대의 상황에 맞춰 말했는가?' },
  { id: '14', category: '방편·자비', question: '옳고 그름보다 이익을 우선했는가?' },
  { id: '15', category: '방편·자비', question: '행위 후 집착이 남지 않았는가?' },
  // 두 진리
  { id: '16', category: '두 진리', question: '세속제에서 도덕·규범을 지켰는가?' },
  { id: '17', category: '두 진리', question: '승의제에서 무자성을 기억했는가?' },
  { id: '18', category: '두 진리', question: '두 진리를 균형 있게 적용했는가?' },
  // 무주열반
  { id: '19', category: '무주열반', question: '열반에 집착하지 않았는가?' },
  { id: '20', category: '무주열반', question: '득실에 매이지 않았는가?' },
  { id: '21', category: '무주열반', question: '머물 곳 없음의 태도를 적용했는가?' },
  // 자기 성찰
  { id: '22', category: '자기 성찰', question: '집착 패턴을 기록했는가?' },
  { id: '23', category: '자기 성찰', question: '마음비움과 자비가 서로를 보완했는가?' },
];

// 기본값 (app_settings에서 조회 실패 시 사용)
export const APP_STRINGS = {
  greeting: '평안하신가요',
  sectionSchedule: '오늘의 일정',
  addSchedule: '일정 추가'
};
