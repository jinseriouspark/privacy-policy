/**
 * User Roles Management
 * 사용자 역할 관리 (instructor, student)
 */

import { supabase } from './client';
import type { UserRole } from '../../types';

/**
 * 사용자의 모든 역할 조회
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to get user roles:', error);
    return [];
  }

  return data?.map(r => r.role as UserRole) || [];
}

/**
 * 사용자가 특정 역할을 가지고 있는지 확인
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const { count, error } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', role);

  if (error) {
    console.error('Failed to check role:', error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * 사용자의 주 역할 가져오기
 * instructor 역할이 있으면 instructor, 아니면 student
 */
export async function getPrimaryRole(userId: string): Promise<UserRole | null> {
  const roles = await getUserRoles(userId);

  if (roles.length === 0) return null;
  if (roles.includes('instructor')) return 'instructor';
  return 'student';
}

/**
 * 사용자에게 역할 추가
 */
export async function addRole(userId: string, role: UserRole): Promise<boolean> {
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role });

  if (error) {
    // Unique constraint violation (이미 있는 역할)
    if (error.code === '23505') {
      return true; // 이미 있으면 성공으로 간주
    }
    console.error('Failed to add role:', error);
    return false;
  }

  return true;
}

/**
 * 사용자에게 여러 역할 추가
 */
export async function addRoles(userId: string, roles: UserRole[]): Promise<boolean> {
  // 기존 role 확인
  const { data: existingRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  const existingRoleSet = new Set(existingRoles?.map(r => r.role) || []);

  // 중복되지 않은 role만 추가
  const newRoles = roles.filter(role => !existingRoleSet.has(role));

  if (newRoles.length === 0) {
    console.log('[addRoles] All roles already exist, skipping');
    return true;
  }

  const { error } = await supabase
    .from('user_roles')
    .insert(newRoles.map(role => ({ user_id: userId, role })));

  if (error) {
    console.error('Failed to add roles:', error);
    return false;
  }

  return true;
}

/**
 * 사용자에서 역할 제거
 */
export async function removeRole(userId: string, role: UserRole): Promise<boolean> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);

  if (error) {
    console.error('Failed to remove role:', error);
    return false;
  }

  return true;
}

/**
 * 온보딩: 사용자 타입 선택 시 역할 설정
 */
export async function setInitialRole(userId: string, selectedType: 'instructor' | 'student'): Promise<boolean> {
  // 기존 역할 모두 삭제
  await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  // 선택한 역할 추가
  if (selectedType === 'instructor') {
    // 강사는 자동으로 학생 역할도 가짐 (다른 강사 수업 들을 수 있음)
    return await addRoles(userId, ['instructor', 'student']);
  } else {
    // 학생은 학생 역할만
    return await addRole(userId, 'student');
  }
}

/**
 * 강사 권한 확인
 */
export async function canTeach(userId: string): Promise<boolean> {
  return await hasRole(userId, 'instructor');
}

/**
 * 예약 가능 여부 확인 (모든 사용자 가능)
 */
export async function canBook(userId: string): Promise<boolean> {
  return await hasRole(userId, 'student');
}

/**
 * 역할 통계 조회 (관리자용)
 */
export async function getRoleStats(): Promise<{ role: string; count: number }[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .then(result => {
      if (result.error) throw result.error;

      const stats: { [key: string]: number } = {};
      result.data?.forEach(r => {
        stats[r.role] = (stats[r.role] || 0) + 1;
      });

      return Object.entries(stats).map(([role, count]) => ({ role, count }));
    });

  if (error) {
    console.error('Failed to get role stats:', error);
    return [];
  }

  return data || [];
}
