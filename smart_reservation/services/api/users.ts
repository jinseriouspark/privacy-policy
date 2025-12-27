/**
 * Users API
 * 사용자 정보 CRUD
 */

import {
  getUserByEmail,
  getUserById,
  updateUserProfile,
  selectUserType
} from '../../lib/supabase/database';

export const usersAPI = {
  /**
   * 이메일로 사용자 조회
   */
  getByEmail: async (email: string) => {
    return await getUserByEmail(email);
  },

  /**
   * ID로 사용자 조회
   */
  getById: async (id: string) => {
    return await getUserById(id);
  },

  /**
   * 사용자 프로필 업데이트
   */
  updateProfile: async (userId: string, data: {
    name?: string;
    username?: string;
    bio?: string;
    picture?: string;
  }) => {
    return await updateUserProfile(userId, data);
  },

  /**
   * 사용자 타입 선택 (온보딩)
   */
  selectType: async (userId: string, userType: 'instructor' | 'student') => {
    return await selectUserType(userId, userType);
  }
};
