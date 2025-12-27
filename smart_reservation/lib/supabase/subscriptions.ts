import { supabase } from './client';
import type { SubscriptionPlan, UserSubscription, PlanLimitCheck, PlanId, BillingCycle } from '../../types';

/**
 * 모든 구독 플랜 조회
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('monthly_price', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * 특정 플랜 정보 조회
 */
export async function getSubscriptionPlan(planId: PlanId): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * 사용자의 현재 활성 구독 조회
 */
export async function getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * 사용자의 현재 플랜 정보 (구독 + 플랜 상세)
 */
export async function getUserCurrentPlan(userId: string): Promise<{
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
}> {
  const subscription = await getUserActiveSubscription(userId);

  if (!subscription) {
    return { subscription: null, plan: null };
  }

  const plan = await getSubscriptionPlan(subscription.plan_id);

  return { subscription, plan };
}

/**
 * 플랜 제한 확인
 */
export async function checkPlanLimit(
  userId: string,
  limitType: 'max_students' | 'max_reservations_per_month' | 'max_coachings' | 'max_instructors'
): Promise<PlanLimitCheck> {
  const { data, error } = await supabase
    .rpc('check_plan_limit', {
      p_user_id: userId,
      p_limit_type: limitType
    });

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      allowed: false,
      current_count: 0,
      max_limit: 0,
      message: '플랜 정보를 찾을 수 없습니다.'
    };
  }

  return data[0];
}

/**
 * 플랜 업그레이드/다운그레이드
 */
export async function updateSubscriptionPlan(
  userId: string,
  newPlanId: PlanId,
  billingCycle: BillingCycle = 'monthly'
): Promise<UserSubscription> {
  // 기존 활성 구독 취소
  const existingSubscription = await getUserActiveSubscription(userId);

  if (existingSubscription) {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', existingSubscription.id);
  }

  // 새 구독 생성
  const periodEnd = new Date();
  if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: newPlanId,
      billing_cycle: billingCycle,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 구독 취소 (기간 종료 시 취소)
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const subscription = await getUserActiveSubscription(userId);

  if (!subscription) {
    throw new Error('활성 구독이 없습니다.');
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      cancel_at_period_end: true,
    })
    .eq('id', subscription.id);

  if (error) throw error;
}

/**
 * 구독 즉시 취소
 */
export async function cancelSubscriptionImmediately(userId: string): Promise<void> {
  const subscription = await getUserActiveSubscription(userId);

  if (!subscription) {
    throw new Error('활성 구독이 없습니다.');
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  if (error) throw error;
}

/**
 * 구독 재개 (cancel_at_period_end 취소)
 */
export async function resumeSubscription(userId: string): Promise<void> {
  const subscription = await getUserActiveSubscription(userId);

  if (!subscription) {
    throw new Error('활성 구독이 없습니다.');
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      cancel_at_period_end: false,
    })
    .eq('id', subscription.id);

  if (error) throw error;
}

/**
 * 플랜 기능 확인
 */
export async function hasFeature(userId: string, featureName: string): Promise<boolean> {
  const { plan } = await getUserCurrentPlan(userId);

  if (!plan) return false;

  return plan.features[featureName] === true;
}

/**
 * 사용 가능 여부 확인 (제한 + 기능)
 */
export async function canUseFeature(
  userId: string,
  feature: 'private_reservations' | 'group_classes' | 'membership_management' |
           'attendance_check' | 'statistics' | 'email_notifications' |
           'calendar_sync' | 'ad_free' | 'multi_instructor' |
           'advanced_reporting' | 'sms_notifications'
): Promise<boolean> {
  return await hasFeature(userId, feature);
}
