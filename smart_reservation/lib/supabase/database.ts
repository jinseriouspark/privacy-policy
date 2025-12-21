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
 * Slug 생성 (코칭명 -> URL-friendly slug)
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거
    .trim()
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 중복 하이픈 제거
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
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
  type?: 'private' | 'group';
}) {
  // Generate slug from title
  let slug = generateSlug(data.title);

  // Slug 중복 체크 및 번호 추가
  let counter = 1;
  let finalSlug = slug;

  while (true) {
    const { data: existing } = await supabase
      .from('coaching')
      .select('id')
      .eq('slug', finalSlug)
      .single();

    if (!existing) break;

    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const { data: coaching, error } = await supabase
    .from('coaching')
    .insert({
      ...data,
      slug: finalSlug,
      type: data.type || 'private', // Default to 'private' if not specified
      status: 'active' // Default status
    })
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
    type?: 'private' | 'group';
  }
) {
  const { data: coaching, error } = await supabase
    .from('coaching')
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
    .from('coaching')
    .delete()
    .eq('id', coachingId);

  if (error) throw error;
}

/**
 * 강사의 코칭 목록 가져오기
 */
export async function getInstructorCoachings(instructorId: string) {
  const { data, error } = await supabase
    .from('coaching')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Slug로 코칭 가져오기
 */
export async function getCoachingBySlug(slug: string) {
  const { data, error } = await supabase
    .from('coaching')
    .select(`
      *,
      instructor:instructor_id(*)
    `)
    .eq('slug', slug)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
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
      instructor:instructor_id(*),
      package:package_id(*)
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
 * 특정 학생의 패키지 목록 조회 (강사별)
 */
export async function getStudentPackages(studentId: string, instructorId: string) {
  const { data, error } = await supabase
    .from('packages')
    .select(`
      *,
      coaching:coaching_id(*)
    `)
    .eq('student_id', studentId)
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * 패키지 생성
 */
export async function createPackage(data: {
  student_id: string;
  instructor_id: string;
  coaching_id?: string;
  name?: string;
  total_sessions: number;
  remaining_sessions: number;
  start_date?: string;
  expires_at?: string;
}) {
  const { data: pkg, error } = await supabase
    .from('packages')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return pkg;
}

/**
 * 패키지 업데이트
 */
export async function updatePackage(
  packageId: string,
  updates: {
    total_sessions?: number;
    remaining_sessions?: number;
    start_date?: string;
    expires_at?: string;
    name?: string;
  }
) {
  const { data, error } = await supabase
    .from('packages')
    .update(updates)
    .eq('id', packageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 패키지 삭제
 */
export async function deletePackage(packageId: string) {
  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', packageId);

  if (error) throw error;
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
    .select(`
      *,
      coaching:coaching_id(*)
    `)
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
    end: r.end_time,
    type: r.coaching?.type || 'private',
    coachingTitle: r.coaching?.title || '수업'
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

/**
 * 출석 체크를 위한 예약 목록 조회
 */
export async function getAttendanceList(
  instructorId: string,
  filter: 'all' | 'today' | 'pending'
) {
  let query = supabase
    .from('reservations')
    .select(`
      *,
      student:student_id(*),
      coaching:coaching_id(*)
    `)
    .eq('instructor_id', instructorId)
    .in('status', ['confirmed', 'pending'])
    .order('start_time', { ascending: false });

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (filter === 'today') {
    const todayStart = `${today}T00:00:00Z`;
    const todayEnd = `${today}T23:59:59Z`;
    query = query.gte('start_time', todayStart).lte('start_time', todayEnd);
  } else if (filter === 'pending') {
    query = query.is('attendance_status', null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * 출석 상태 업데이트
 */
export async function updateAttendance(
  reservationId: string,
  attendanceStatus: 'attended' | 'absent' | 'late'
) {
  const { data, error } = await supabase
    .from('reservations')
    .update({ attendance_status: attendanceStatus })
    .eq('id', reservationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 강사 통계 데이터 조회
 */
export async function getInstructorStats(
  instructorId: string,
  period: 'week' | 'month' | 'year'
) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const startDateStr = startDate.toISOString();

  // Get reservations for the period
  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select(`
      *,
      coaching:coaching_id(price),
      student:student_id(*)
    `)
    .eq('instructor_id', instructorId)
    .gte('start_time', startDateStr)
    .in('status', ['confirmed', 'completed']);

  if (reservationsError) throw reservationsError;

  // Get all students (unique)
  const { data: allStudents, error: studentsError } = await supabase
    .from('reservations')
    .select('student_id')
    .eq('instructor_id', instructorId)
    .in('status', ['confirmed', 'completed']);

  if (studentsError) throw studentsError;

  const uniqueStudentIds = new Set(allStudents?.map(r => r.student_id) || []);
  const totalStudents = uniqueStudentIds.size;

  // Calculate revenue
  const totalRevenue = (reservations || []).reduce((sum, r) => {
    return sum + (r.coaching?.price || 0);
  }, 0);

  const monthlyRevenue = totalRevenue; // For the selected period

  // Count active students (students with reservations in the period)
  const activeStudentIds = new Set(reservations?.map(r => r.student_id) || []);
  const activeStudents = activeStudentIds.size;

  // Total reservations
  const totalReservations = reservations?.length || 0;

  // Calculate attendance rate
  const attendedCount = (reservations || []).filter(
    r => r.attendance_status === 'attended'
  ).length;
  const attendanceRate = totalReservations > 0
    ? (attendedCount / totalReservations) * 100
    : 0;

  // Popular time slots
  const timeSlotCounts: { [key: string]: number } = {};
  (reservations || []).forEach(r => {
    const time = new Date(r.start_time).toTimeString().split(':').slice(0, 2).join(':');
    timeSlotCounts[time] = (timeSlotCounts[time] || 0) + 1;
  });

  const popularTimeSlots = Object.entries(timeSlotCounts)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count);

  // Recent transactions (mock data for now - would need a transactions table)
  const recentTransactions: any[] = [];

  return {
    totalRevenue,
    monthlyRevenue,
    totalStudents,
    activeStudents,
    totalReservations,
    attendanceRate,
    popularTimeSlots,
    recentTransactions
  };
}

/**
 * ==========================================
 * INVITATION FUNCTIONS (학생 초대 시스템)
 * ==========================================
 */

/**
 * 초대 코드 생성 (6자리 랜덤 코드)
 */
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 문자 제외
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 학생 초대하기 (코칭 기반)
 */
export async function createInvitation(coachingId: string, studentEmail: string) {
  // 이미 초대한 적 있는지 확인
  const { data: existing } = await supabase
    .from('invitations')
    .select('*')
    .eq('coaching_id', coachingId)
    .eq('email', studentEmail)
    .eq('status', 'pending')
    .single();

  if (existing) {
    // 기존 초대가 있으면 코드 반환
    return existing;
  }

  // 새 초대 코드 생성
  const invitationCode = generateInvitationCode();

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      coaching_id: coachingId,
      email: studentEmail,
      invitation_code: invitationCode,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 초대 코드로 초대 정보 조회 (코칭 정보 포함)
 */
export async function getInvitationByCode(invitationCode: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      coaching:coaching_id(
        *,
        instructor:instructor_id(*)
      )
    `)
    .eq('invitation_code', invitationCode)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 초대 수락 (학생-코칭 연결)
 */
export async function acceptInvitation(invitationCode: string, studentId: string, studentEmail: string) {
  // 초대 정보 조회
  const invitation = await getInvitationByCode(invitationCode);

  if (!invitation) {
    throw new Error('유효하지 않은 초대 코드입니다.');
  }

  if (invitation.status !== 'pending') {
    throw new Error('이미 사용된 초대 코드입니다.');
  }

  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('초대 코드가 만료되었습니다.');
  }

  if (invitation.email.toLowerCase() !== studentEmail.toLowerCase()) {
    throw new Error('초대된 이메일과 로그인 이메일이 일치하지 않습니다.');
  }

  // 학생-코칭 관계 생성
  const { error: relationError } = await supabase
    .from('student_instructors')
    .insert({
      student_id: studentId,
      instructor_id: invitation.coaching.instructor_id,
      coaching_id: invitation.coaching_id
    });

  if (relationError && relationError.code !== '23505') { // 중복 에러 무시
    throw relationError;
  }

  // 초대 상태 업데이트
  const { error: updateError } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', invitation.id);

  if (updateError) throw updateError;

  return invitation.instructor;
}

/**
 * 코칭의 초대 목록 조회
 */
export async function getCoachingInvitations(coachingId: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('coaching_id', coachingId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * 학생의 강사 목록 조회
 */
export async function getStudentInstructors(studentId: string) {
  const { data, error } = await supabase
    .from('student_instructors')
    .select(`
      *,
      instructor:instructor_id(*)
    `)
    .eq('student_id', studentId);

  if (error) throw error;
  return data || [];
}

