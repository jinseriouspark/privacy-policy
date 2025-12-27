/**
 * Authentication API
 * Google OAuth 및 세션 관리
 */

import { signInWithGoogle, signOut as supabaseSignOut } from '../../lib/supabase/auth';
import { supabase } from '../../lib/supabase/client';

export const authAPI = {
  /**
   * Google OAuth 로그인
   */
  loginWithGoogle: async () => {
    return await signInWithGoogle();
  },

  /**
   * 로그아웃
   */
  logout: async () => {
    return await supabaseSignOut();
  },

  /**
   * 현재 세션 가져오기
   */
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  /**
   * 세션 변경 리스너 등록
   */
  onAuthStateChange: (callback: (session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session);
    });
  }
};
