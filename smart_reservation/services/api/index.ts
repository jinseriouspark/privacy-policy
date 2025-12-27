/**
 * API 계층 통합 Export
 *
 * 사용 예시:
 * import { authAPI, usersAPI } from '@/services/api';
 * const user = await usersAPI.getByEmail('user@example.com');
 */

export { authAPI } from './auth';
export { usersAPI } from './users';
export { coachingsAPI } from './coachings';
export { reservationsAPI } from './reservations';
export { studentsAPI } from './students';

/**
 * 전체 API 객체 (선택적 사용)
 */
import { authAPI } from './auth';
import { usersAPI } from './users';
import { coachingsAPI } from './coachings';
import { reservationsAPI } from './reservations';
import { studentsAPI } from './students';

export const api = {
  auth: authAPI,
  users: usersAPI,
  coachings: coachingsAPI,
  reservations: reservationsAPI,
  students: studentsAPI
};

export default api;
