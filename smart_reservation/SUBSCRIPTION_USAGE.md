# Subscription System 사용 가이드

## 개요

구독 시스템을 통해 사용자별로 플랜(Free, Standard, Teams, Enterprise)을 관리하고, 기능 제한을 적용할 수 있습니다.

---

## 데이터베이스 구조

### 1. subscription_plans (구독 플랜)
```typescript
{
  id: 'free' | 'standard' | 'teams' | 'enterprise',
  name: 'free',
  display_name: '무료',
  monthly_price: 0,
  yearly_price: 0,
  features: {
    private_reservations: true,
    group_classes: false,
    // ...
  },
  limits: {
    max_students: 10,
    max_reservations_per_month: 10,
    max_coachings: 1,
    max_instructors: 1
  }
}
```

### 2. user_subscriptions (사용자 구독)
```typescript
{
  user_id: 'uuid',
  plan_id: 'free',
  billing_cycle: 'monthly',
  status: 'active',
  current_period_start: '2025-12-24',
  current_period_end: '2026-01-24'
}
```

---

## 사용 방법

### 1. 플랜 정보 조회

```typescript
import { getSubscriptionPlans, getUserCurrentPlan } from './lib/supabase/subscriptions';

// 모든 플랜 목록
const plans = await getSubscriptionPlans();

// 사용자의 현재 플랜
const { subscription, plan } = await getUserCurrentPlan(userId);

console.log(`현재 플랜: ${plan?.display_name}`);
console.log(`구독 종료일: ${subscription?.current_period_end}`);
```

### 2. 플랜 제한 확인

새 학생 추가 전:
```typescript
import { checkPlanLimit } from './lib/supabase/subscriptions';

const limitCheck = await checkPlanLimit(userId, 'max_students');

if (!limitCheck.allowed) {
  alert(`플랜 제한에 도달했습니다. (${limitCheck.current_count}/${limitCheck.max_limit})`);
  // 업그레이드 유도 UI 표시
  return;
}

// 학생 추가 로직 진행
```

### 3. 기능 사용 가능 여부 확인

그룹 수업 기능 접근 시:
```typescript
import { canUseFeature } from './lib/supabase/subscriptions';

const canUseGroupClasses = await canUseFeature(userId, 'group_classes');

if (!canUseGroupClasses) {
  alert('그룹 수업 기능은 Standard 플랜 이상에서 사용 가능합니다.');
  // 업그레이드 유도 UI 표시
  return;
}

// 그룹 수업 기능 접근 허용
```

### 4. 플랜 업그레이드

```typescript
import { updateSubscriptionPlan } from './lib/supabase/subscriptions';

// Standard 플랜으로 업그레이드 (연간 결제)
const newSubscription = await updateSubscriptionPlan(
  userId,
  'standard',
  'yearly'
);

console.log('업그레이드 완료:', newSubscription);
```

### 5. 구독 취소

```typescript
import { cancelSubscription, resumeSubscription } from './lib/supabase/subscriptions';

// 기간 종료 시 취소 (현재 기간은 계속 사용)
await cancelSubscription(userId);

// 취소 철회
await resumeSubscription(userId);
```

---

## 컴포넌트 통합 예시

### 학생 추가 시 제한 확인

```typescript
// components/StudentManagement.tsx
const handleAddStudent = async () => {
  // 1. 플랜 제한 확인
  const limitCheck = await checkPlanLimit(currentUser.id, 'max_students');

  if (!limitCheck.allowed) {
    setShowUpgradeModal(true);
    return;
  }

  // 2. 학생 추가 로직
  await addStudent(...);
};
```

### 코칭 생성 시 제한 확인

```typescript
// components/CoachingManagement.tsx
const handleCreateCoaching = async () => {
  const limitCheck = await checkPlanLimit(currentUser.id, 'max_coachings');

  if (!limitCheck.allowed) {
    alert(`코칭은 최대 ${limitCheck.max_limit}개까지 생성 가능합니다. (${limitCheck.message})`);
    setShowUpgradeModal(true);
    return;
  }

  // 코칭 생성 로직
};
```

### 그룹 수업 접근 시 기능 확인

```typescript
// components/GroupClassSchedule.tsx
useEffect(() => {
  const checkAccess = async () => {
    const hasAccess = await canUseFeature(currentUser.id, 'group_classes');

    if (!hasAccess) {
      setShowUpgradeMessage(true);
    }
  };

  checkAccess();
}, [currentUser.id]);
```

---

## 플랜별 제한

### Free 플랜
- 학생: 10명
- 월간 예약: 10회
- 코칭: 1개
- 강사: 1명
- 기능: 1:1 예약, 이메일 알림, 캘린더 동기화만

### Standard 플랜 (월 5,000원 / 연 50,000원)
- 학생: 100명
- 월간 예약: 무제한
- 코칭: 5개
- 강사: 1명
- 기능: 그룹 수업, 수강권 관리, 출석 체크, 통계, 광고 제거

### Teams 플랜 (월 8,000원 / 연 80,000원)
- 학생: 500명
- 월간 예약: 무제한
- 코칭: 무제한
- 강사: 5명
- 기능: Standard + 멀티 강사, 고급 리포팅, SMS 알림

### Enterprise 플랜 (문의)
- 모든 항목: 무제한
- 기능: Teams + 전용 지원, API, 커스텀 도메인, SSO

---

## Migration 실행

Supabase Studio에서 실행:

```sql
-- /supabase/migrations/023_add_subscription_system.sql 파일 내용 복사 후 실행
```

실행 후 확인:
```sql
-- 플랜 확인
SELECT * FROM subscription_plans;

-- 사용자 구독 확인
SELECT * FROM user_subscriptions;

-- 특정 사용자의 플랜 제한 확인
SELECT * FROM check_plan_limit('user-uuid-here', 'max_students');
```

---

## 주의사항

1. **신규 사용자 자동 플랜 할당**
   - 회원가입 시 자동으로 Free 플랜 할당됨
   - `trigger_assign_free_plan` 트리거가 처리

2. **플랜 변경 시 기존 데이터**
   - 다운그레이드 시 기존 데이터는 유지되지만 새로 추가 불가
   - 예: Standard → Free로 변경 시 기존 100명 학생은 유지, 새 학생 추가는 10명 제한

3. **제한 확인 타이밍**
   - 데이터 생성 **전**에 반드시 제한 확인 필요
   - 프론트엔드와 백엔드 양쪽에서 검증 권장

4. **무제한 제한**
   - `limits`에서 `null` 값은 무제한을 의미
   - `max_students: null` = 무제한 학생

---

## 다음 단계

1. **결제 시스템 통합** (선택)
   - Toss Payments, KG Inicis 등 PG사 연동
   - `updateSubscriptionPlan()` 호출 전에 결제 검증

2. **사용량 추적 자동화**
   - `subscription_usage` 테이블 자동 업데이트
   - 매일 배치 작업으로 사용량 집계

3. **만료 처리 자동화**
   - `current_period_end` 지난 구독 자동 만료
   - 매일 배치 작업으로 상태 업데이트

4. **이메일 알림**
   - 플랜 만료 7일 전 알림
   - 플랜 제한 도달 시 알림
   - 업그레이드 추천

---

완료! 🎉

이제 플랜별 기능 제한이 DB 레벨에서 적용됩니다.
