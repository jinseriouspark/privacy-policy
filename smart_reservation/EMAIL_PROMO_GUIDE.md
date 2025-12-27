# 이메일 프로모션 코드 자동 발송 가이드

## 🎯 개요

마스터마인드 멤버 등 특정 사용자에게 **개인별 고유 프로모션 코드**를 이메일로 자동 발송하는 시스템입니다.

**특징**:
- ✅ 개인별 랜덤 코드 생성 (예: `MASTERMIND-A8F2D9C1`)
- ✅ 1인 1회만 사용 가능
- ✅ 자동 이메일 발송
- ✅ 유출 방지

---

## 📧 이메일 발송 시스템

### 사용하는 서비스
- **Resend** (https://resend.com)
- 무료: 100통/일
- 유료: $20/월 (50,000통)

---

## 🚀 설정 방법

### 1. Resend API Key 발급

1. https://resend.com 가입
2. Dashboard → API Keys → Create API Key
3. API Key 복사

### 2. 환경 변수 설정

`.env` 파일에 추가:
```env
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. 발송 도메인 설정 (선택)

**Option A: Resend 제공 도메인 사용**
- `onboarding@resend.dev` (바로 사용 가능)

**Option B: 커스텀 도메인 사용**
- Resend Dashboard → Domains → Add Domain
- `yeyak-mania.co.kr` 추가
- DNS 설정 (TXT, MX 레코드)
- `onboarding@yeyak-mania.co.kr` 사용 가능

---

## 📝 마스터마인드 코드 발송

### 방법 1: 스크립트 실행 (권장)

1. `scripts/send-mastermind-codes.ts` 파일 열기
2. `mastermindMembers` 배열에 이메일 추가:

```typescript
const mastermindMembers = [
  { email: 'hong@example.com', name: '홍길동' },
  { email: 'kim@example.com', name: '김철수' },
  { email: 'lee@example.com', name: '이영희' },
];
```

3. 스크립트 실행:
```bash
npx tsx scripts/send-mastermind-codes.ts
```

**출력 예시**:
```
🚀 마스터마인드 프로모션 코드 발송 시작...

📧 홍길동 (hong@example.com)
   코드: MASTERMIND-A8F2D9C1
   ✅ 이메일 발송 성공

📧 김철수 (kim@example.com)
   코드: MASTERMIND-B3E7K9L2
   ✅ 이메일 발송 성공

✨ 완료!
```

### 방법 2: Supabase Dashboard에서 수동 생성

```sql
-- 1. 프로모션 코드 생성
INSERT INTO promo_codes (code, description, discount_type, discount_value, plan_id, max_uses)
VALUES
  ('MASTERMIND-A8F2D9C1', '마스터마인드 - 홍길동', 'fixed_amount', 9000, 'standard', 1);

-- 2. 이메일 화이트리스트 추가
INSERT INTO promo_email_whitelist (email, promo_code_id, note)
SELECT
  'hong@example.com',
  (SELECT id FROM promo_codes WHERE code = 'MASTERMIND-A8F2D9C1'),
  '마스터마인드 멤버';

-- 3. 이메일 발송은 수동 (TypeScript 함수 호출 필요)
```

---

## 📨 발송되는 이메일 내용

**제목**: 🎁 마스터마인드 전용 특별 할인 코드

**본문**:
```
안녕하세요, 홍길동님! 👋

마스터마인드 멤버님을 위한 특별 할인 코드를 보내드립니다.

┌─────────────────────────┐
│  MASTERMIND-A8F2D9C1    │
└─────────────────────────┘

💰 할인 혜택
Standard 플랜 ₩19,000/월 → ₩10,000/월 (47% 할인!)

📦 Standard 플랜 혜택
• 최대 5개 코칭 클래스
• 클래스당 100명 학생 (총 500명!)
• 그룹 수업, 출석 체크, 통계 등 모든 기능
• 우선 고객 지원

[지금 바로 시작하기 →]

* 이 코드는 홍길동님 전용입니다.
* 1회만 사용 가능합니다.
```

---

## 🔐 보안 기능

### 1. 개인별 고유 코드
- 랜덤 8자리 생성
- 추측 불가능
- 예: `MASTERMIND-A8F2D9C1`

### 2. 사용 제한
- 1인 1회만 사용 가능 (`max_uses: 1`)
- 중복 사용 시 거부

### 3. 이메일 검증
- `promo_email_whitelist`에 등록된 이메일만 자동 적용
- 로그인 시 자동으로 쿠폰 코드 표시

---

## 🎁 사용자 경험 플로우

### 마스터마인드 멤버

1. **이메일 수신**
   ```
   "🎁 마스터마인드 전용 특별 할인 코드"
   코드: MASTERMIND-A8F2D9C1
   ```

2. **사이트 방문**
   - https://yeyak-mania.co.kr 접속

3. **자동 감지** (구현 필요)
   - 로그인 시 이메일 확인
   - 화이트리스트에 있으면 자동으로 쿠폰 표시
   ```
   "🎉 특별 할인 코드가 있습니다!
    MASTERMIND-A8F2D9C1 코드가 자동 적용됩니다."
   ```

4. **구독 시 자동 할인**
   - ₩19,000 → ₩10,000
   - 결제 페이지에서 자동 적용

---

## 🛠️ 프론트엔드 통합 (TODO)

### 로그인 시 쿠폰 체크

```typescript
// App.tsx 또는 Login.tsx
const checkPromoCode = async (email: string, userId: string) => {
  const { data } = await supabase
    .rpc('auto_apply_promo_on_login', {
      p_user_email: email,
      p_user_id: userId
    });

  if (data) {
    // 쿠폰 코드가 있으면 모달 표시
    alert(`🎉 특별 할인 코드: ${data}\n구독 시 자동 적용됩니다!`);
  }
};
```

### 구독 페이지에서 할인 표시

```typescript
// Subscription.tsx
const applyPromoCode = async (code: string) => {
  const { data } = await supabase
    .rpc('validate_promo_code', {
      p_code: code,
      p_user_id: userId
    });

  if (data.is_valid) {
    setDiscount(data.discount_amount);
    setFinalPrice(data.final_price);
  }
};
```

---

## 📊 관리자 쿼리

### 발송된 코드 확인
```sql
SELECT
  pc.code,
  pc.description,
  pw.email,
  pw.note,
  pcu.used_at
FROM promo_codes pc
JOIN promo_email_whitelist pw ON pc.id = pw.promo_code_id
LEFT JOIN promo_code_usage pcu ON pc.id = pcu.promo_code_id
WHERE pc.code LIKE 'MASTERMIND%'
ORDER BY pc.created_at DESC;
```

### 사용 통계
```sql
SELECT
  COUNT(*) as total_codes,
  COUNT(DISTINCT pcu.user_id) as used_count,
  COUNT(*) - COUNT(DISTINCT pcu.user_id) as unused_count
FROM promo_codes pc
LEFT JOIN promo_code_usage pcu ON pc.id = pcu.promo_code_id
WHERE pc.code LIKE 'MASTERMIND%';
```

---

## ✅ 체크리스트

### 설정
- [ ] Resend 가입 및 API Key 발급
- [ ] .env에 `VITE_RESEND_API_KEY` 추가
- [ ] (선택) 커스텀 도메인 설정

### 발송
- [ ] `scripts/send-mastermind-codes.ts`에 멤버 이메일 추가
- [ ] Migration 024, 025, 026, 027 실행
- [ ] 스크립트 실행 (`npx tsx scripts/send-mastermind-codes.ts`)
- [ ] 이메일 수신 확인

### 통합 (프론트엔드)
- [ ] 로그인 시 쿠폰 자동 감지 구현
- [ ] 구독 페이지에서 쿠폰 적용 구현
- [ ] 결제 시 할인 금액 적용

---

## 🐛 문제 해결

### 이메일이 발송되지 않을 때

1. **API Key 확인**
   ```bash
   echo $VITE_RESEND_API_KEY
   ```

2. **Resend Dashboard 확인**
   - Logs 탭에서 발송 상태 확인

3. **스팸 폴더 확인**
   - 받은편지함 스팸 폴더 확인

### 프로모션 코드가 적용되지 않을 때

```sql
-- 코드 존재 확인
SELECT * FROM promo_codes WHERE code = 'MASTERMIND-A8F2D9C1';

-- 이미 사용했는지 확인
SELECT * FROM promo_code_usage WHERE promo_code_id = 'PROMO_CODE_ID_HERE';

-- 유효 기간 확인
SELECT code, valid_until FROM promo_codes WHERE code = 'MASTERMIND-A8F2D9C1';
```

---

**작성일**: 2025-12-25
**작성자**: Claude Code
