/**
 * Reservations API
 * 예약 관리
 */

import {
  getReservationsByUser,
  getReservationsByCoaching,
  createReservation,
  updateReservation,
  cancelReservation,
  getTodayReservations
} from '../../lib/supabase/database';

export const reservationsAPI = {
  /**
   * 사용자의 예약 조회
   */
  getByUser: async (userId: string, status?: string) => {
    return await getReservationsByUser(userId, status);
  },

  /**
   * 코칭의 예약 조회
   */
  getByCoaching: async (coachingId: string, status?: string) => {
    return await getReservationsByCoaching(coachingId, status);
  },

  /**
   * 오늘의 예약 조회 (강사용)
   */
  getToday: async (instructorId: string) => {
    return await getTodayReservations(instructorId);
  },

  /**
   * 예약 생성
   */
  create: async (data: {
    coaching_id: string;
    student_id: string;
    date: string;
    time: string;
    meet_link?: string;
  }) => {
    return await createReservation(data);
  },

  /**
   * 예약 업데이트
   */
  update: async (reservationId: string, data: any) => {
    return await updateReservation(reservationId, data);
  },

  /**
   * 예약 취소
   */
  cancel: async (reservationId: string) => {
    return await cancelReservation(reservationId);
  }
};
