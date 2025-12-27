/**
 * Coachings API
 * 코칭 클래스(수업) 관리
 */

import {
  getCoachingBySlug,
  getCoachingByCoachAndSlug,
  getCoachingsByInstructor,
  createCoaching,
  updateCoaching,
  deleteCoaching
} from '../../lib/supabase/database';

export const coachingsAPI = {
  /**
   * 슬러그로 코칭 조회 (레거시)
   */
  getBySlug: async (slug: string) => {
    return await getCoachingBySlug(slug);
  },

  /**
   * 강사 ID + 슬러그로 코칭 조회 (신규)
   */
  getByCoachAndSlug: async (coachId: string, slug: string) => {
    return await getCoachingByCoachAndSlug(coachId, slug);
  },

  /**
   * 강사의 모든 코칭 조회
   */
  getByInstructor: async (instructorId: string) => {
    return await getCoachingsByInstructor(instructorId);
  },

  /**
   * 코칭 생성
   */
  create: async (data: {
    instructor_id: string;
    title: string;
    slug?: string; // Optional - not currently used
    type: 'private' | 'group';
    description?: string;
    google_calendar_id?: string;
  }) => {
    return await createCoaching(data);
  },

  /**
   * 코칭 업데이트
   */
  update: async (coachingId: string, data: any) => {
    return await updateCoaching(coachingId, data);
  },

  /**
   * 코칭 삭제
   */
  delete: async (coachingId: string) => {
    return await deleteCoaching(coachingId);
  }
};
