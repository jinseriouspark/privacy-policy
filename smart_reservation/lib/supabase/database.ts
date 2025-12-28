import { supabase } from './client';
import { User, UserType, UserRole } from '../../types';
import { getUserRoles, getPrimaryRole, setInitialRole } from './roles';

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
  studioName?: string;
  phone?: string;
}) {
  // Get current auth user
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('Not authenticated');
  }

  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      email: data.email,
      name: data.name,
      picture: data.picture,
      studio_name: data.studioName,
      phone: data.phone,
      bio: data.bio,
    }, {
      onConflict: 'email'
    })
    .select()
    .single();

  if (error) throw error;

  // Set user role if provided
  if (data.userType && user) {
    await setInitialRole(user.id, data.userType === UserType.INSTRUCTOR ? 'instructor' : 'student');
  }

  return user;
}

/**
 * 이메일로 사용자 조회
 * 🆕 역할 정보 포함
 */
export async function getUserByEmail(email: string) {
  console.log('[getUserByEmail] Querying for:', email);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  console.log('[getUserByEmail] Query result:', { data, error });

  if (error && error.code !== 'PGRST116') {
    console.error('[getUserByEmail] Error:', error);
    throw error;
  }

  // 역할 정보 추가
  if (data) {
    console.log('[getUserByEmail] User found, fetching roles...');
    try {
      const roles = await getUserRoles(data.id);
      console.log('[getUserByEmail] Roles:', roles);

      const primaryRole = await getPrimaryRole(data.id);
      console.log('[getUserByEmail] Primary role:', primaryRole);

      return { ...data, roles, primaryRole };
    } catch (roleError) {
      console.error('[getUserByEmail] Error fetching roles:', roleError);
      // Return user without roles if role fetch fails
      return { ...data, roles: [], primaryRole: null };
    }
  }

  console.log('[getUserByEmail] No user found');
  return data;
}

/**
 * ID로 사용자 조회
 * 🆕 역할 정보 포함
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

  // 역할 정보 추가
  if (data) {
    const roles = await getUserRoles(data.id);
    const primaryRole = await getPrimaryRole(data.id);
    return { ...data, roles, primaryRole };
  }

  return data;
}

/**
 * 사용자 정보 업데이트
 */
export async function updateUser(userId: string, data: {
  name?: string;
  bio?: string;
  picture?: string;
  username?: string;
  studio_name?: string;
  phone?: string;
  is_profile_complete?: boolean;
}) {
  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.picture !== undefined) updateData.picture = data.picture;
  if (data.username !== undefined) updateData.username = data.username;
  if (data.studio_name !== undefined) updateData.studio_name = data.studio_name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.is_profile_complete !== undefined) updateData.is_profile_complete = data.is_profile_complete;

  console.log('[updateUser] Updating user:', userId, 'with data:', updateData);

  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[updateUser] Error:', error);
    throw error;
  }

  console.log('[updateUser] Success:', user);
  return user;
}

/**
 * 사용자 계정 유형 선택 (강사 또는 수강생)
 * 🆕 역할 기반 시스템 사용
 */
export async function selectUserType(userId: string, userType: 'instructor' | 'student') {
  // user_roles 테이블에 역할 추가
  await setInitialRole(userId, userType);

  // Return user data
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Username으로 강사 조회
 */
export async function getInstructorByUsername(username: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) throw error;

  // Verify user is an instructor
  if (user) {
    const roles = await getUserRoles(user.id);
    if (!roles.includes('instructor')) {
      throw new Error('User is not an instructor');
    }
  }

  return user;
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
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자와 한글 제거 (영문/숫자만 허용)
    .trim()
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 중복 하이픈 제거
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거

  // If slug is empty after processing, generate 8-character random slug (like calendar ID)
  if (!slug) {
    return Math.random().toString(36).substring(2, 10); // 8자리 랜덤 문자열
  }

  return slug;
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
  working_hours?: object;
}) {
  // Generate slug from title
  let slug = generateSlug(data.title);

  // Slug 중복 체크 (강사 계정 내에서만)
  let counter = 1;
  let finalSlug = slug;

  while (true) {
    const { data: existing } = await supabase
      .from('coachings')
      .select('id')
      .eq('slug', finalSlug)
      .eq('instructor_id', data.instructor_id) // 🔧 강사 ID 추가
      .single();

    if (!existing) break;

    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  console.log('[createCoaching] Creating coaching:', { ...data, slug: finalSlug });

  const { data: coaching, error } = await supabase
    .from('coachings')
    .insert({
      ...data,
      slug: finalSlug,
      type: data.type || 'private', // Default to 'private' if not specified
      working_hours: data.working_hours || {}
    })
    .select()
    .single();

  if (error) {
    console.error('[createCoaching] Error:', error);
    throw error;
  }

  console.log('[createCoaching] Coaching created:', coaching);
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
    working_hours?: object;
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
 * 강사의 코칭 목록 가져오기
 */
export async function getInstructorCoachings(instructorId: string) {
  const { data, error } = await supabase
    .from('coachings')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Slug로 코칭 가져오기
 */
/**
 * 코칭 조회 by slug (legacy support)
 * @deprecated Use getCoachingByCoachAndSlug instead for new format
 */
export async function getCoachingBySlug(slug: string) {
  const { data, error } = await supabase
    .from('coachings')
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
 * 코칭 조회 by coach short_id and slug (new format)
 * Supports /{coach_id}/{class_slug} URL format
 */
export async function getCoachingByCoachAndSlug(coachShortId: string, slug: string) {
  // First get instructor by short_id
  const { data: instructor, error: instructorError } = await supabase
    .from('users')
    .select('id')
    .eq('short_id', coachShortId)
    .single();

  if (instructorError || !instructor) {
    return null;
  }

  // Verify user is an instructor
  const roles = await getUserRoles(instructor.id);
  if (!roles.includes('instructor')) {
    return null;
  }

  // Then get coaching by instructor_id + slug
  const { data, error } = await supabase
    .from('coachings')
    .select(`
      *,
      instructor:instructor_id(*)
    `)
    .eq('instructor_id', instructor.id)
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
    .from('package_templates')
    .select('*')
    .eq('instructor_id', instructorId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[getClassPackages] Error:', error);
    throw error;
  }

  console.log('[getClassPackages] Raw data from package_templates:', data);

  // Convert to ClassPackage format
  return (data || []).map(template => ({
    id: template.id,
    name: template.name,
    type: template.type === 'session_based' ? 'private' : 'group',
    credits: template.total_sessions || 0,
    validDays: template.validity_days || 0,
    price: template.price || 0,
    isActive: template.is_active
  }));
}

/**
 * Save Google tokens for user
 */
export async function saveGoogleTokens(userId: number, tokens: {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
}) {
  const updateData: any = {
    google_access_token: tokens.access_token,
    google_token_expires_at: tokens.expires_at || new Date(Date.now() + 3600 * 1000).toISOString(),
  };

  // Only update refresh_token if provided (it's not always returned)
  if (tokens.refresh_token) {
    updateData.google_refresh_token = tokens.refresh_token;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[saveGoogleTokens] Error:', error);
    throw error;
  }

  return data;
}

/**
 * Get instructor's Google tokens
 */
export async function getInstructorTokens(instructorId: number) {
  const { data, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expires_at')
    .eq('id', instructorId)
    .single();

  if (error) {
    console.error('[getInstructorTokens] Error:', error);
    throw error;
  }

  return data;
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
  coachingId?: string;
}) {
  const { data, error } = await supabase
    .from('package_templates')
    .insert({
      instructor_id: instructorId,
      coaching_id: packageData.coachingId || null,
      name: packageData.name,
      total_sessions: packageData.credits,
      validity_days: packageData.validDays,
      price: packageData.price,
      type: 'session_based',
      is_active: packageData.isActive,
      display_order: 0
    })
    .select()
    .single();

  if (error) {
    console.error('[createClassPackage] Error:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    type: packageData.type,
    credits: data.total_sessions,
    validDays: data.validity_days,
    price: data.price,
    isActive: data.is_active,
    coachingId: data.coaching_id  // 🆕 코칭 ID 포함
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
  coachingId?: string;  // 🆕 코칭 ID 추가
}) {
  const updateData: any = {};
  if (packageData.name !== undefined) updateData.name = packageData.name;
  if (packageData.credits !== undefined) updateData.total_sessions = packageData.credits;
  if (packageData.validDays !== undefined) updateData.validity_days = packageData.validDays;
  if (packageData.price !== undefined) updateData.price = packageData.price;
  if (packageData.isActive !== undefined) updateData.is_active = packageData.isActive;
  if (packageData.coachingId !== undefined) updateData.coaching_id = packageData.coachingId;  // 🆕 코칭 ID 업데이트

  const { data, error } = await supabase
    .from('package_templates')
    .update(updateData)
    .eq('id', packageId)
    .select()
    .single();

  if (error) {
    console.error('[updateClassPackage] Error:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    credits: data.total_sessions,
    validDays: data.validity_days,
    price: data.price,
    isActive: data.is_active,
    coachingId: data.coaching_id  // 🆕 코칭 ID 포함
  };
}

/**
 * ClassPackage 삭제
 */
export async function deleteClassPackage(packageId: string) {
  const { error } = await supabase
    .from('package_templates')
    .delete()
    .eq('id', packageId);

  if (error) {
    console.error('[deleteClassPackage] Error:', error);
    throw error;
  }
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
  meet_link?: string;
  google_event_id?: string;
  status?: string;
}) {
  console.log('[createReservation] Creating reservation with data:', data);

  // Get instructor's Google Calendar ID
  const { data: settings } = await supabase
    .from('instructor_settings')
    .select('google_calendar_id')
    .eq('instructor_id', data.instructor_id)
    .single();

  const calendarId = settings?.google_calendar_id;

  // Get student info for attendee email
  const { data: student } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', data.student_id)
    .single();

  const studentEmail = student?.email;
  const studentName = student?.name || 'Student';

  let meetLink = data.meet_link;
  let googleEventId = data.google_event_id;

  // Add event to Google Calendar if calendar ID is set
  if (calendarId && studentEmail) {
    try {
      console.log('[createReservation] Adding event to Google Calendar:', calendarId);

      const { addEventToCalendar } = await import('../google-calendar');
      const result = await addEventToCalendar({
        calendarId,
        title: `${studentName}님과의 수업`,
        start: data.start_time,
        end: data.end_time,
        description: data.notes,
        attendees: [studentEmail],
        instructorId: parseInt(data.instructor_id)
      });

      meetLink = result.meetLink || meetLink;
      googleEventId = result.id || googleEventId;
      console.log('[createReservation] Google Calendar event created:', { meetLink, googleEventId });
    } catch (error) {
      console.error('[createReservation] Failed to add to Google Calendar:', error);
      // Continue with reservation creation even if calendar sync fails
    }
  }

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      ...data,
      meet_link: meetLink,
      google_event_id: googleEventId
    })
    .select()
    .single();

  if (error) {
    console.error('[createReservation] Error:', error);
    throw error;
  }

  console.log('[createReservation] Success:', reservation);
  return reservation;
}

/**
 * 예약 취소
 */
export async function cancelReservation(reservationId: string, skipTimeCheck: boolean = false) {
  console.log('[cancelReservation] Cancelling reservation:', reservationId);

  // 먼저 예약 정보를 가져와서 package_id 확인
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single();

  if (fetchError) {
    console.error('[cancelReservation] Fetch error:', fetchError);
    throw fetchError;
  }

  if (!reservation) {
    throw new Error('예약을 찾을 수 없습니다.');
  }

  // 취소 가능 시간 체크 (skipTimeCheck가 false인 경우만)
  let canRefund = true;
  if (!skipTimeCheck) {
    const startTime = new Date(reservation.start_time);
    const now = new Date();
    const cancellationHours = 24; // 기본 24시간 (하드코딩)
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    console.log('[cancelReservation] Hours until start:', hoursUntilStart);
    console.log('[cancelReservation] Cancellation policy:', cancellationHours, 'hours');

    if (hoursUntilStart < cancellationHours) {
      canRefund = false;
      console.log('[cancelReservation] Cancellation too late, no refund');
    }
  }

  // 예약 상태를 취소로 변경
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[cancelReservation] Error:', error);
    throw error;
  }

  if (!data) {
    console.error('[cancelReservation] No reservation found with ID:', reservationId);
    throw new Error('예약을 찾을 수 없습니다.');
  }

  // 수강권 회수 복귀 (취소 가능 시간 내에 취소하고 package_id가 있는 경우)
  if (canRefund && reservation.package_id) {
    console.log('[cancelReservation] Restoring package credit for package:', reservation.package_id);

    const { error: packageError } = await supabase.rpc('increment_package_sessions', {
      p_package_id: reservation.package_id,
      p_amount: 1
    });

    // RPC가 없으면 직접 업데이트
    if (packageError) {
      console.log('[cancelReservation] RPC not available, using direct update');
      const { data: pkg } = await supabase
        .from('packages')
        .select('remaining_sessions')
        .eq('id', reservation.package_id)
        .single();

      if (pkg) {
        await supabase
          .from('packages')
          .update({ remaining_sessions: pkg.remaining_sessions + 1 })
          .eq('id', reservation.package_id);

        console.log('[cancelReservation] Package credit restored');
      }
    } else {
      console.log('[cancelReservation] Package credit restored via RPC');
    }
  } else if (!canRefund && reservation.package_id) {
    console.log('[cancelReservation] Cancellation too late - credit NOT restored');
  }

  console.log('[cancelReservation] Cancelled successfully:', data);
  return { ...data, refunded: canRefund };
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
 * 오늘 예약 목록 조회 (모바일 홈 화면용)
 */
export async function getTodayReservations(instructorId: string) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      coaching:coaching_id(*),
      student:student_id(*),
      package:package_id(*)
    `)
    .eq('instructor_id', instructorId)
    .gte('start_time', todayStart.toISOString())
    .lt('start_time', todayEnd.toISOString())
    .in('status', ['confirmed', 'pending'])
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * 앞둔 예약 목록 조회 (현재 시각 이후의 모든 예약, 최신순)
 */
export async function getUpcomingReservations(userId: string) {
  const now = new Date();

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      coaching:coaching_id(*),
      instructor:instructor_id(*),
      package:package_id(*)
    `)
    .eq('student_id', userId)
    .gte('start_time', now.toISOString())
    .in('status', ['confirmed', 'pending'])
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * 모든 사용자 목록 조회 (학생만)
 */
export async function getAllStudents() {
  // Get all users with student role
  const { data: studentRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role_name', 'student');

  if (rolesError) throw rolesError;

  if (!studentRoles || studentRoles.length === 0) {
    return [];
  }

  const studentIds = studentRoles.map(r => r.user_id);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', studentIds)
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
  console.log('[getStudentPackages] Querying with:', { studentId, instructorId });

  const { data, error } = await supabase
    .from('packages')
    .select(`
      *,
      coaching:coaching_id(*),
      student:student_id(id, email, name),
      instructor:instructor_id(id, email, name)
    `)
    .eq('student_id', studentId)
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getStudentPackages] Error:', error);
    throw error;
  }

  console.log('[getStudentPackages] Found packages:', data);
  return data || [];
}

/**
 * 이메일로 학생의 수강권 조회 (fallback)
 */
export async function getStudentPackagesByEmail(studentEmail: string, instructorId: string) {
  console.log('[getStudentPackagesByEmail] Querying with:', { studentEmail, instructorId });

  // First get student by email
  const student = await getUserByEmail(studentEmail);
  if (!student) {
    console.warn('[getStudentPackagesByEmail] Student not found');
    return [];
  }

  return getStudentPackages(student.id, instructorId);
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
  console.log('[createPackage] Creating package with data:', data);

  const { data: pkg, error } = await supabase
    .from('packages')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('[createPackage] Error creating package:', error);
    throw error;
  }

  console.log('[createPackage] Package created successfully:', pkg);

  // CRITICAL FIX: Ensure student-instructor relationship exists
  // This is needed for getStudentPackages to work correctly
  console.log('[createPackage] Ensuring student-instructor relationship exists');

  // First check if relationship already exists
  const { data: existingRelation } = await supabase
    .from('student_instructors')
    .select('id')
    .eq('student_id', data.student_id)
    .eq('instructor_id', data.instructor_id)
    .maybeSingle();

  if (!existingRelation) {
    // Create new relationship
    const { error: relationError } = await supabase
      .from('student_instructors')
      .insert({
        student_id: data.student_id,
        instructor_id: data.instructor_id,
        coaching_id: data.coaching_id || null
      });

    if (relationError) {
      // Log error but don't fail - the package was created successfully
      console.error('[createPackage] Warning: Failed to create student-instructor relation:', relationError);
    } else {
      console.log('[createPackage] Student-instructor relationship created');
    }
  } else {
    console.log('[createPackage] Student-instructor relationship already exists');
  }

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
 * 수강권 1회 차감
 */
export async function deductPackageCredit(packageId: string) {
  // First get the current package
  const { data: pkg, error: fetchError } = await supabase
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .single();

  if (fetchError) throw fetchError;
  if (!pkg) throw new Error('Package not found');

  if (pkg.remaining_sessions <= 0) {
    throw new Error('수강권 잔여 횟수가 부족합니다.');
  }

  // Deduct one session
  const { data, error } = await supabase
    .from('packages')
    .update({ remaining_sessions: pkg.remaining_sessions - 1 })
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
 * 학생의 수강권 조회 (특정 강사 또는 모든 강사)
 */
export async function getAllStudentPackages(studentId: number, instructorId?: number) {
  console.log('[getAllStudentPackages] Querying for student:', studentId, 'instructor:', instructorId);

  let query = supabase
    .from('packages')
    .select(`
      *,
      coaching:coaching_id(*),
      instructor:instructor_id(id, email, name)
    `)
    .eq('student_id', studentId);

  // 특정 강사의 수강권만 필터링
  if (instructorId) {
    query = query.eq('instructor_id', instructorId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('[getAllStudentPackages] Error:', error);
    throw error;
  }

  console.log('[getAllStudentPackages] Found packages:', data);
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
  google_calendar_id?: string;
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

  // Get reservations in the date range (from DB)
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

  // 🆕 Google Calendar busy times 추가
  try {
    // 강사의 모든 코칭에서 google_calendar_id 가져오기
    const coachings = await getInstructorCoachings(instructorId);
    const calendarIds = coachings
      .map(c => c.google_calendar_id)
      .filter(Boolean) as string[];

    if (calendarIds.length > 0) {
      // Google Calendar API로 busy times 조회
      const { getCalendarBusyTimes } = await import('../google-calendar');
      const googleBusyTimes = await getCalendarBusyTimes({
        calendarIds,
        timeMin: startDate,
        timeMax: endDate
      });

      // Google Calendar busy times를 busyRanges에 추가
      googleBusyTimes.forEach(busy => {
        busyRanges.push({
          start: busy.start,
          end: busy.end,
          type: 'private',
          coachingTitle: 'Google Calendar 일정'
        });
      });
    }
  } catch (error) {
    console.warn('[getInstructorAvailability] Google Calendar busy times 조회 실패:', error);
    // Google Calendar 조회 실패해도 DB 예약은 계속 표시
  }

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

  // Get all students (from packages table - includes students without reservations yet)
  const { data: allStudents, error: studentsError } = await supabase
    .from('packages')
    .select('student_id')
    .eq('instructor_id', instructorId);

  if (studentsError) throw studentsError;

  const uniqueStudentIds = new Set(allStudents?.map(p => p.student_id) || []);
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
export async function createInvitation(coachingId: string, studentEmail: string, packageIds?: string[]) {
  // Get coaching info to get instructor_id
  const { data: coaching, error: coachingError } = await supabase
    .from('coachings')
    .select('instructor_id')
    .eq('id', coachingId)
    .single();

  if (coachingError) {
    console.error('Failed to get coaching:', coachingError);
    throw coachingError;
  }

  if (!coaching) {
    throw new Error('Coaching not found');
  }

  if (!coaching.instructor_id) {
    throw new Error('Coaching has no instructor_id');
  }

  console.log('Creating invitation with instructor_id:', coaching.instructor_id, 'coaching_id:', coachingId);

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

  const insertData = {
    instructor_id: coaching.instructor_id,
    coaching_id: coachingId,
    email: studentEmail,
    invitation_code: invitationCode,
    status: 'pending',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일
    package_ids: packageIds || null // 🆕 선택된 수강권 ID 목록
  };

  console.log('Inserting invitation:', insertData);

  const { data, error } = await supabase
    .from('invitations')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Failed to insert invitation:', error);
    throw error;
  }

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
  console.log('[acceptInvitation] Starting with:', { invitationCode, studentId, studentEmail });

  // 초대 정보 조회
  const invitation = await getInvitationByCode(invitationCode);

  if (!invitation) {
    throw new Error('유효하지 않은 초대 코드입니다.');
  }

  console.log('[acceptInvitation] Invitation found:', invitation);

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
  console.log('[acceptInvitation] Creating student_instructor relation:', {
    student_id: studentId,
    instructor_id: invitation.coaching.instructor_id,
    coaching_id: invitation.coaching_id
  });

  const { error: relationError } = await supabase
    .from('student_instructors')
    .insert({
      student_id: studentId,
      instructor_id: invitation.coaching.instructor_id,
      coaching_id: invitation.coaching_id
    });

  if (relationError && relationError.code !== '23505') { // 중복 에러 무시
    console.error('[acceptInvitation] Relation error:', relationError);
    throw relationError;
  }

  console.log('[acceptInvitation] Relation created successfully (or already exists)');

  // 🆕 선택된 수강권 자동 할당
  if (invitation.package_ids && invitation.package_ids.length > 0) {
    console.log('[acceptInvitation] Auto-assigning packages:', invitation.package_ids);

    for (const packageId of invitation.package_ids) {
      try {
        // Get package template details
        const { data: template } = await supabase
          .from('package_templates')
          .select('*')
          .eq('id', packageId)
          .single();

        if (template) {
          // Create package for student
          await createPackage({
            student_id: studentId,
            instructor_id: invitation.coaching.instructor_id,
            coaching_id: invitation.coaching_id,
            name: template.name,
            total_sessions: template.total_sessions,
            remaining_sessions: template.total_sessions,
            start_date: new Date().toISOString(),
            expires_at: new Date(Date.now() + template.validity_days * 24 * 60 * 60 * 1000).toISOString()
          });
          console.log('[acceptInvitation] Package assigned:', template.name);
        }
      } catch (pkgError) {
        console.error('[acceptInvitation] Failed to assign package:', packageId, pkgError);
        // Continue with other packages even if one fails
      }
    }
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

/**
 * 특정 강사의 학생 목록 조회
 */
export async function getInstructorStudents(instructorId: string) {
  console.log('[getInstructorStudents] Fetching students for instructor:', instructorId);

  const { data, error } = await supabase
    .from('student_instructors')
    .select(`
      *,
      student:student_id(*)
    `)
    .eq('instructor_id', instructorId);

  if (error) {
    console.error('[getInstructorStudents] Error:', error);
    throw error;
  }

  console.log('[getInstructorStudents] Found relations:', data);

  // Extract student objects from the relations
  const students = data?.map(rel => rel.student).filter(Boolean) || [];
  console.log('[getInstructorStudents] Extracted students:', students);

  return students;
}


/**
 * ===================
 * Activity Logging
 * ===================
 */

export type ActivityAction = 
  | 'view_tab'
  | 'create_coaching'
  | 'invite_student'
  | 'create_package'
  | 'schedule_group_class'
  | 'check_attendance'
  | 'view_stats';

export type TabName = 
  | 'dashboard'
  | 'packages'
  | 'group_classes'
  | 'attendance'
  | 'stats';

/**
 * 사용자 활동 로그 기록
 */
export async function logActivity(data: {
  user_id: string;
  action: ActivityAction;
  tab_name?: TabName;
  metadata?: Record<string, any>;
}) {
  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: data.user_id,
      action: data.action,
      tab_name: data.tab_name,
      metadata: data.metadata || {}
    });

  if (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * 사용자 활동 통계 조회
 */
export async function getUserActivityStats(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Analyze data
  const tabCounts: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};

  data?.forEach(log => {
    if (log.tab_name) {
      tabCounts[log.tab_name] = (tabCounts[log.tab_name] || 0) + 1;
    }
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });

  return {
    logs: data || [],
    tabCounts,
    actionCounts,
    totalActions: data?.length || 0
  };
}

// ============================================================================
// COACHING CALENDAR FUNCTIONS
// ============================================================================

/**
 * 코칭의 Google Calendar ID 업데이트
 * @param coachingId - 코칭 ID
 * @param calendarId - Google Calendar ID
 */
export async function updateCoachingCalendar(coachingId: string, calendarId: string) {
  // google_calendar_id의 앞 8자리를 slug로 사용
  const newSlug = calendarId.substring(0, 8);

  const { data, error } = await supabase
    .from('coachings')
    .update({
      google_calendar_id: calendarId,
      slug: newSlug  // slug도 함께 업데이트
    })
    .eq('id', coachingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 코칭의 캘린더 정보 조회
 * @param coachingId - 코칭 ID
 */
export async function getCoachingCalendar(coachingId: string) {
  const { data, error } = await supabase
    .from('coachings')
    .select('id, title, google_calendar_id')
    .eq('id', coachingId)
    .single();

  if (error) throw error;
  return data;
}


/**
 * ============================================
 * Solapi Settings Management
 * ============================================
 * 강사별 Solapi API 키 암호화 저장/조회
 */

export interface SolapiSettings {
  apiKey: string;
  apiSecret: string;
  senderPhone: string;
  kakaoSenderKey?: string;
  templateId?: string;
  isActive: boolean;
}

/**
 * Solapi 설정 저장 (암호화)
 */
export async function saveSolapiSettings(
  userId: number,
  settings: {
    apiKey: string;
    apiSecret: string;
    senderPhone: string;
    kakaoSenderKey?: string;
    templateId?: string;
  }
): Promise<void> {
  const { error } = await supabase.rpc("save_solapi_settings", {
    p_user_id: userId,
    p_api_key: settings.apiKey,
    p_api_secret: settings.apiSecret,
    p_sender_phone: settings.senderPhone,
    p_kakao_sender_key: settings.kakaoSenderKey || null,
    p_template_id: settings.templateId || "booking_link_v1",
  });

  if (error) throw error;
}

/**
 * Solapi 설정 조회 (복호화)
 */
export async function getSolapiSettings(userId: number): Promise<SolapiSettings | null> {
  const { data, error } = await supabase.rpc("get_solapi_settings", {
    p_user_id: userId,
  });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const settings = data[0];
  return {
    apiKey: settings.api_key,
    apiSecret: settings.api_secret,
    senderPhone: settings.sender_phone,
    kakaoSenderKey: settings.kakao_sender_key,
    templateId: settings.template_id,
    isActive: settings.is_active,
  };
}

/**
 * Solapi 설정 활성화 상태 확인
 */
export async function checkSolapiActive(userId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_solapi_secrets")
    .select("is_active")
    .eq("user_id", userId)
    .single();

  if (error) return false;
  return data?.is_active || false;
}

/**
 * 학생 알림 조회
 */
export async function getStudentNotifications(studentId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", parseInt(studentId))
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

/**
 * 알림 삭제
 */
export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw error;
}

/**
 * 강사의 특정 날짜 예약 가능 시간 조회
 */
export async function getAvailableTimeSlots(
  instructorId: string,
  coachingId: string,
  date: Date,
  packageId?: string  // 🆕 Optional: for package-specific working hours
) {
  try {
    // 해당 날짜의 시작과 끝 시간 계산
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 해당 날짜의 모든 예약 조회
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("start_time, end_time")
      .eq("instructor_id", parseInt(instructorId))
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString())
      .in("status", ["confirmed", "pending"]);

    if (error) throw error;

    // 🆕 패키지별 working_hours 조회 (있으면)
    let packageWorkingHours = null;
    if (packageId) {
      const { data: pkg, error: pkgError } = await supabase
        .from("packages")
        .select("working_hours")
        .eq("id", packageId)
        .single();

      if (!pkgError && pkg) {
        packageWorkingHours = pkg.working_hours;
        console.log('[getAvailableTimeSlots] Package working_hours:', packageWorkingHours);
      }
    }

    // 코칭 정보 조회하여 기본 근무 시간 가져오기
    const { data: coaching, error: coachingError } = await supabase
      .from("coachings")
      .select("duration, working_hours, title")
      .eq("id", coachingId)
      .single();

    if (coachingError) {
      console.error('[getAvailableTimeSlots] Failed to get coaching:', coachingError);
      throw coachingError;
    }

    console.log('[getAvailableTimeSlots] Coaching info:', {
      id: coachingId,
      title: coaching?.title,
      duration: coaching?.duration,
      working_hours: coaching?.working_hours
    });

    const duration = coaching?.duration || 60;

    // 🆕 계층적 우선순위: Package > Coaching > Default
    const workingHours = packageWorkingHours || coaching?.working_hours;

    if (packageWorkingHours) {
      console.log('[getAvailableTimeSlots] ✅ Using PACKAGE working hours (override)');
    } else if (coaching?.working_hours) {
      console.log('[getAvailableTimeSlots] ✅ Using COACHING working hours (default)');
    } else {
      console.log('[getAvailableTimeSlots] ⚠️ No working hours found, using system default');
    }

    // 해당 날짜의 요일 확인 (0=일요일, 1=월요일, ...)
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // 기본 근무 시간 (오전 9시 ~ 오후 6시, 레거시 포맷 지원)
    const defaultDayWorkingHours = {
      enabled: dayName !== 'sunday', // 일요일은 기본적으로 비활성화
      blocks: [{ start: '09:00', end: '18:00' }]
    };

    // 해당 요일의 근무 시간 가져오기
    let dayWorkingHours = defaultDayWorkingHours;
    if (workingHours && typeof workingHours === 'object' && dayName in workingHours) {
      const rawDayHours = workingHours[dayName];

      // 🆕 레거시 포맷({ start, end }) vs 새 포맷({ blocks: [...] }) 자동 감지
      if (rawDayHours.blocks) {
        // 새 포맷: 여러 시간대 블록
        dayWorkingHours = rawDayHours;
      } else if (rawDayHours.start && rawDayHours.end) {
        // 레거시 포맷: 단일 시간대를 blocks 배열로 변환
        dayWorkingHours = {
          enabled: rawDayHours.enabled,
          blocks: [{ start: rawDayHours.start, end: rawDayHours.end }]
        };
      }

      console.log(`[getAvailableTimeSlots] Found specific working hours for ${dayName}:`, dayWorkingHours);
    } else {
      console.log(`[getAvailableTimeSlots] Using default working hours for ${dayName}:`, defaultDayWorkingHours);
    }

    // 해당 요일에 근무 시간이 없거나 비활성화되어 있으면 빈 배열 반환
    if (!dayWorkingHours.enabled || !dayWorkingHours.blocks || dayWorkingHours.blocks.length === 0) {
      console.log(`[getAvailableTimeSlots] ⚠️ ${dayName} is disabled or has no blocks, returning empty slots`);
      return [];
    }

    console.log(`[getAvailableTimeSlots] Working hours for ${dayName}:`, dayWorkingHours);

    const allSlots: { time: string; available: boolean; reason?: string }[] = [];
    const now = new Date();

    // 🆕 각 시간대 블록에서 30분 단위 슬롯 생성
    dayWorkingHours.blocks.forEach(block => {
      const [startHour, startMin] = block.start.split(':').map(Number);
      const [endHour, endMin] = block.end.split(':').map(Number);

      const blockStartMinutes = startHour * 60 + startMin;
      const blockEndMinutes = endHour * 60 + endMin;

      // 30분 단위로 슬롯 생성
      for (let minutes = blockStartMinutes; minutes < blockEndMinutes; minutes += 30) {
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        const slotTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

        // 슬롯의 정확한 시작 시간 계산
        const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, min, 0, 0);
        const slotEndDate = new Date(slotDate.getTime() + duration * 60 * 1000);

        // 이미 예약된 시간과 겹치는지 확인
        const isBooked = reservations?.some(reservation => {
          const resStart = new Date(reservation.start_time);
          const resEnd = new Date(reservation.end_time);

          // 시간대가 겹치는지 확인
          return (
            (slotDate >= resStart && slotDate < resEnd) ||
            (slotEndDate > resStart && slotEndDate <= resEnd) ||
            (slotDate <= resStart && slotEndDate >= resEnd)
          );
        });

        // 과거 시간은 예약 불가 (슬롯 시작 시간이 현재보다 이전이면)
        const isPast = slotDate <= now;

        // 이유 설정
        let reason: string | undefined;
        if (isPast) {
          reason = 'past';
        } else if (isBooked) {
          reason = 'booked';
        }

        allSlots.push({
          time: slotTime,
          available: !isBooked && !isPast,
          reason
        });
      }
    });

    return allSlots;
  } catch (error) {
    console.error('Failed to get available time slots:', error);
    throw error;
  }
}

/**
 * Remove a student from an instructor (delete instructor-student relationship and related data)
 */
export async function removeStudentFromInstructor(studentId: string, instructorId: string) {
  try {
    console.log('[removeStudentFromInstructor] Starting deletion...');
    console.log('[removeStudentFromInstructor] Student ID:', studentId);
    console.log('[removeStudentFromInstructor] Instructor ID:', instructorId);

    // 1. Delete student's reservations with this instructor
    console.log('[removeStudentFromInstructor] Step 1: Deleting reservations...');
    const { data: deletedReservations, error: reservationsError } = await supabase
      .from('reservations')
      .delete()
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)
      .select();

    if (reservationsError) {
      console.error('[removeStudentFromInstructor] Failed to delete reservations:', reservationsError);
      throw new Error(`예약 삭제 실패: ${reservationsError.message}`);
    }
    console.log('[removeStudentFromInstructor] Deleted reservations:', deletedReservations?.length || 0);

    // 2. Delete student's packages from this instructor
    console.log('[removeStudentFromInstructor] Step 2: Deleting packages...');
    const { data: deletedPackages, error: packagesError } = await supabase
      .from('packages')
      .delete()
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)
      .select();

    if (packagesError) {
      console.error('[removeStudentFromInstructor] Failed to delete packages:', packagesError);
      throw new Error(`수강권 삭제 실패: ${packagesError.message}`);
    }
    console.log('[removeStudentFromInstructor] Deleted packages:', deletedPackages?.length || 0);

    // 3. Delete instructor-student relationship
    console.log('[removeStudentFromInstructor] Step 3: Deleting relationship...');
    const { data: deletedRelation, error: relationError } = await supabase
      .from('instructor_students')
      .delete()
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)
      .select();

    if (relationError) {
      console.error('[removeStudentFromInstructor] Failed to delete relationship:', relationError);
      throw new Error(`학생 관계 삭제 실패: ${relationError.message}`);
    }
    console.log('[removeStudentFromInstructor] Deleted relationship:', deletedRelation?.length || 0);

    console.log('[removeStudentFromInstructor] ✅ Successfully removed student from instructor');
    return { success: true };
  } catch (error: any) {
    console.error('[removeStudentFromInstructor] ❌ Failed to remove student:', error);
    throw error;
  }
}

/**
 * ============================================
 * Notion Settings Management
 * ============================================
 * 강사별 Notion Integration Token 암호화 저장/조회
 */

export interface NotionSettings {
  integrationToken: string;
  databaseId: string;
  isActive: boolean;
}

/**
 * Notion 설정 저장 (암호화)
 *
 * @param userId - 강사 ID
 * @param settings - Notion Integration Token & Database ID
 */
export async function saveNotionSettings(
  userId: number,
  settings: {
    integrationToken: string;
    databaseId: string;
  }
): Promise<void> {
  const { error } = await supabase.rpc("save_notion_settings", {
    p_user_id: userId,
    p_integration_token: settings.integrationToken,
    p_database_id: settings.databaseId,
  });

  if (error) throw error;
}

/**
 * Notion 설정 조회 (복호화)
 */
export async function getNotionSettings(userId: number): Promise<NotionSettings | null> {
  const { data, error } = await supabase.rpc("get_notion_settings", {
    p_user_id: userId,
  });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const settings = data[0];
  return {
    integrationToken: settings.integration_token,
    databaseId: settings.database_id,
    isActive: settings.is_active !== false,
  };
}

