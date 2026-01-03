import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// 환경변수 헬퍼 함수
function getEnv(key: string): string {
  return process.env[key] || process.env[`VITE_${key}`] || '';
}

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`Missing Supabase config: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 사용자 역할 선택 API (온보딩 시)
 * POST /api/users/select-role
 * Body: { userId: string, userType: 'instructor' | 'student' }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'userId and userType are required' });
    }

    if (userType !== 'instructor' && userType !== 'student') {
      return res.status(400).json({ error: 'userType must be "instructor" or "student"' });
    }

    console.log('[SelectRole] Setting role for user:', { userId, userType });

    // 1. 기존 역할 모두 삭제
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[SelectRole] Failed to delete existing roles:', deleteError);
      // Continue anyway - might be no existing roles
    }

    // 2. 새 역할 추가
    const rolesToAdd = userType === 'instructor'
      ? [{ user_id: userId, role: 'instructor' }, { user_id: userId, role: 'student' }]
      : [{ user_id: userId, role: 'student' }];

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert(rolesToAdd);

    if (insertError) {
      console.error('[SelectRole] Failed to add roles:', insertError);
      return res.status(500).json({
        error: 'Failed to add roles',
        details: insertError.message
      });
    }

    console.log('[SelectRole] Roles added successfully');

    // 3. 사용자 정보 반환
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[SelectRole] Failed to get user:', userError);
      return res.status(500).json({ error: 'Failed to get user data' });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('[SelectRole] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
