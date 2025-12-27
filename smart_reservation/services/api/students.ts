/**
 * Students API
 * 학생 관리 (강사용)
 */

import {
  getStudentsByInstructor,
  inviteStudent,
  acceptInvitation,
  getInvitationByCode
} from '../../lib/supabase/database';

export const studentsAPI = {
  /**
   * 강사의 학생 목록 조회
   */
  getByInstructor: async (instructorId: string) => {
    return await getStudentsByInstructor(instructorId);
  },

  /**
   * 학생 초대
   */
  invite: async (instructorId: string, studentEmail: string) => {
    return await inviteStudent(instructorId, studentEmail);
  },

  /**
   * 초대 수락
   */
  acceptInvite: async (inviteCode: string, studentId: string, studentEmail: string) => {
    return await acceptInvitation(inviteCode, studentId, studentEmail);
  },

  /**
   * 초대 코드로 초대 정보 조회
   */
  getInvite: async (inviteCode: string) => {
    return await getInvitationByCode(inviteCode);
  }
};
