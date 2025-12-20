import { supabase } from './client';
import { User, UserType } from '../../types';

/**
 * 사용자 생성 또는 업데이트 (Google 로그인 후)
 */
export async function upsertUser(data: {
  email: string;
  name: string;
  picture?: string;
  userType?: UserType;
  username?: string;
  bio?: string;
}) {
  // Get current auth user
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('Not authenticated');
  }

  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      id: authUser.id, // Use Supabase Auth user ID
      email: data.email,
      name: data.name,
      picture: data.picture,
      user_type: data.userType,
      username: data.username,
      bio: data.bio,
    }, {
      onConflict: 'email'
    })
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * 이메일로 사용자 조회
 */
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

/**
 * Username으로 강사 조회
 */
export async function getInstructorByUsername(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('user_type', 'instructor')
    .single();

  if (error) throw error;
  return data;
}

/**
 * 강사의 코칭 목록 조회 (모든 코칭, 활성/비활성 포함)
 */
export async function getCoachings(instructorId: string) {
  const { data, error } = await supabase
    .from('coachings')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * 코칭 생성
 */
export async function createCoaching(data: {
  instructor_id: string;
  title: string;
  description?: string;
  duration: number;
  price?: number;
  is_active?: boolean;
}) {
  const { data: coaching, error } = await supabase
    .from('coachings')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return coaching;
}

/**
 * 코칭 업데이트
 */
export async function updateCoaching(
  coachingId: string,
  data: {
    title?: string;
    description?: string;
    duration?: number;
    price?: number;
    is_active?: boolean;
  }
) {
  const { data: coaching, error } = await supabase
    .from('coachings')
    .update(data)
    .eq('id', coachingId)
    .select()
    .single();

  if (error) throw error;
  return coaching;
}

/**
 * 코칭 삭제
 */
export async function deleteCoaching(coachingId: string) {
  const { error } = await supabase
    .from('coachings')
    .delete()
    .eq('id', coachingId);

  if (error) throw error;
}

/**
 * ClassPackage 형식으로 코칭 조회 (PackageManagement용)
 */
export async function getClassPackages(instructorId: string) {
  const { data, error } = await supabase
    .from('coachings')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Convert to ClassPackage format
  return (data || []).map(coaching => ({
    id: coaching.id,
    name: coaching.title,
    type: coaching.type || 'individual',
    credits: coaching.credits || 0,
    validDays: coaching.valid_days || 0,
    price: coaching.price || 0,
    isActive: coaching.is_active
  }));
}

/**
 * ClassPackage 생성
 */
export async function createClassPackage(instructorId: string, packageData: {
  name: string;
  type: string;
  credits: number;
  validDays: number;
  price: number;
  isActive: boolean;
}) {
  const { data, error } = await supabase
    .from('coachings')
    .insert({
      instructor_id: instructorId,
      title: packageData.name,
      type: packageData.type,
      credits: packageData.credits,
      valid_days: packageData.validDays,
      price: packageData.price,
      is_active: packageData.isActive,
      duration: 60, // Default duration
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.title,
    type: data.type,
    credits: data.credits,
    validDays: data.valid_days,
    price: data.price,
    isActive: data.is_active
  };
}

/**
 * ClassPackage 업데이트
 */
export async function updateClassPackage(packageId: string, packageData: {
  name?: string;
  type?: string;
  credits?: number;
  validDays?: number;
  price?: number;
  isActive?: boolean;
}) {
  const updateData: any = {};
  if (packageData.name !== undefined) updateData.title = packageData.name;
  if (packageData.type !== undefined) updateData.type = packageData.type;
  if (packageData.credits !== undefined) updateData.credits = packageData.credits;
  if (packageData.validDays !== undefined) updateData.valid_days = packageData.validDays;
  if (packageData.price !== undefined) updateData.price = packageData.price;
  if (packageData.isActive !== undefined) updateData.is_active = packageData.isActive;

  const { data, error } = await supabase
    .from('coachings')
    .update(updateData)
    .eq('id', packageId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.title,
    type: data.type,
    credits: data.credits,
    validDays: data.valid_days,
    price: data.price,
    isActive: data.is_active
  };
}

/**
 * ClassPackage 삭제
 */
export async function deleteClassPackage(packageId: string) {
  const { error } = await supabase
    .from('coachings')
    .delete()
    .eq('id', packageId);

  if (error) throw error;
}

/**
 * 예약 생성
 */
export async function createReservation(data: {
  student_id: string;
  instructor_id: string;
  coaching_id?: string;
  package_id?: string;
  start_time: string;
  end_time: string;
  notes?: string;
}) {
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return reservation;
}

/**
 * 예약 취소
 */
export async function cancelReservation(reservationId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 사용자의 예약 목록 조회
 */
export async function getReservations(userId: string, userType: 'instructor' | 'student') {
  const column = userType === 'instructor' ? 'instructor_id' : 'student_id';

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      coaching:coaching_id(*),
      student:student_id(*),
      instructor:instructor_id(*)
    `)
    .eq(column, userId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * 모든 사용자 목록 조회 (학생만)
 */
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_type', 'student')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * 강사의 패키지 목록 조회
 */
export async function getPackages(instructorId: string) {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * 강사의 설정 조회
 */
export async function getInstructorSettings(instructorId: string) {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('instructor_id', instructorId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

/**
 * 강사의 설정 업데이트 또는 생성
 */
export async function upsertInstructorSettings(instructorId: string, settings: {
  calendar_id?: string;
  timezone?: string;
  business_hours?: any;
  buffer_time?: number;
}) {
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      instructor_id: instructorId,
      ...settings,
    }, {
      onConflict: 'instructor_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 특정 기간의 예약 목록 조회 (instructor 기준)
 */
export async function getReservationsByDateRange(
  instructorId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('instructor_id', instructorId)
    .gte('start_time', startDate)
    .lte('end_time', endDate)
    .in('status', ['confirmed', 'pending']);

  if (error) throw error;
  return data || [];
}

/**
 * 강사의 가용성 조회 (설정 + 예약 정보)
 */
export async function getInstructorAvailability(
  instructorId: string,
  startDate: string,
  endDate: string
) {
  // Get instructor settings
  const settingsData = await getInstructorSettings(instructorId);

  const workingHours = settingsData?.business_hours || {
    '0': { start: '09:00', end: '18:00', isWorking: false },
    '1': { start: '09:00', end: '18:00', isWorking: true },
    '2': { start: '09:00', end: '18:00', isWorking: true },
    '3': { start: '09:00', end: '18:00', isWorking: true },
    '4': { start: '09:00', end: '18:00', isWorking: true },
    '5': { start: '09:00', end: '18:00', isWorking: true },
    '6': { start: '09:00', end: '18:00', isWorking: false },
  };

  // Get reservations in the date range
  const reservations = await getReservationsByDateRange(
    instructorId,
    startDate,
    endDate
  );

  const busyRanges = reservations.map(r => ({
    start: r.start_time,
    end: r.end_time
  }));

  return { workingHours, busyRanges };
}

/**
 * 그룹 수업 세션 조회
 */
export async function getGroupSessions(instructorId: string) {
  const { data, error } = await supabase
    .from('group_classes')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * 그룹 수업 세션 생성
 */
export async function createGroupSession(instructorId: string, sessionData: {
  title: string;
  date: string;
  time: string;
  type: string;
  maxCapacity: number;
  status: string;
}) {
  const { data, error } = await supabase
    .from('group_classes')
    .insert({
      instructor_id: instructorId,
      title: sessionData.title,
      date: sessionData.date,
      time: sessionData.time,
      type: sessionData.type,
      max_capacity: sessionData.maxCapacity,
      current_count: 0,
      status: sessionData.status
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 그룹 수업 세션 업데이트
 */
export async function updateGroupSession(sessionId: string, sessionData: {
  title?: string;
  date?: string;
  time?: string;
  type?: string;
  maxCapacity?: number;
  status?: string;
}) {
  const updateData: any = {};
  if (sessionData.title !== undefined) updateData.title = sessionData.title;
  if (sessionData.date !== undefined) updateData.date = sessionData.date;
  if (sessionData.time !== undefined) updateData.time = sessionData.time;
  if (sessionData.type !== undefined) updateData.type = sessionData.type;
  if (sessionData.maxCapacity !== undefined) updateData.max_capacity = sessionData.maxCapacity;
  if (sessionData.status !== undefined) updateData.status = sessionData.status;

  const { data, error } = await supabase
    .from('group_classes')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 그룹 수업 세션 삭제
 */
export async function deleteGroupSession(sessionId: string) {
  const { error } = await supabase
    .from('group_classes')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}
