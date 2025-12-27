# 현재 작업 현황 (2025-12-28)

## 🎉 학생 캘린더 UI 개선 완료! (2025-12-28)

### ✅ **수강권 카드를 캘린더 위에 배치**

**배포 URL**: https://yeyak-mania.co.kr

### 📊 주요 변경 사항

#### **캘린더 레이아웃 개선** ✅
- 📝 `components/mobile/MobileCalendar.tsx` - 수강권 섹션 추가 (Lines 462-507)
- 🎯 요구사항: "캘린더에는 수강권 항목이 위에 보이고 그 다음에 예약 가능 캘린더 일정 보이면 안될까?"
- 🎨 변경:
  - **BEFORE**: 수강권 선택이 예약 확인 모달에만 표시됨
  - **AFTER**: 수강권 카드가 캘린더 그리드 위에 표시됨

**레이아웃 구조**:
```
[헤더 - 일정 캘린더]
  ↓
[내 수강권 - 가로 스크롤 카드]
  ↓
[주간 캘린더 그리드]
  ↓
[예약 가능한 시간 목록]
```

**코드 예시**:
```typescript
// components/mobile/MobileCalendar.tsx
{/* My Packages - Compact Horizontal Scroll */}
{packages.filter(pkg => {
  const expiresAt = new Date(pkg.expires_at);
  const isNotExpired = expiresAt > new Date();
  const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
  return isNotExpired && hasRemainingCredits;
}).length > 0 && (
  <div className="bg-white border-b border-slate-100 px-6 py-4">
    <div className="flex items-center gap-2 mb-3">
      <div className="text-orange-500 text-lg">📦</div>
      <h3 className="text-base font-bold text-slate-900">내 수강권</h3>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide">
      {packages
        .filter(pkg => {
          const expiresAt = new Date(pkg.expires_at);
          const isNotExpired = expiresAt > new Date();
          const hasRemainingCredits = (pkg.remaining_sessions || 0) > 0;
          return isNotExpired && hasRemainingCredits;
        })
        .map(pkg => {
          const expiresAt = new Date(pkg.expires_at);
          const daysLeft = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

          return (
            <div
              key={pkg.id}
              className="flex-shrink-0 w-48 p-5 rounded-2xl bg-white shadow-md"
            >
              <p className="text-sm font-semibold mb-3 truncate text-slate-900">
                {pkg.name || pkg.coaching?.title || '수강권'}
              </p>
              <div className="flex items-baseline gap-1 mb-3">
                <p className="text-4xl font-bold text-slate-900">
                  {pkg.remaining_sessions}
                </p>
                <p className="text-base text-slate-500">
                  / {pkg.total_sessions}회
                </p>
              </div>
              <p className={`text-xs ${isExpiringSoon ? 'text-orange-500 font-medium' : 'text-slate-500'}`}>
                {isExpiringSoon ? `⏰ ${daysLeft}일 남음` : expiresAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          );
        })}
    </div>
  </div>
)}
```

### 🎨 디자인 통일성
- ✅ 홈, 예약, 캘린더 페이지의 수강권 카드 스타일 완전 일치
- ✅ Toss 디자인 시스템: w-48, p-5, rounded-2xl, shadow-md
- ✅ 텍스트 크기 통일: text-4xl (남은 회수), text-base (전체 회수)
- ✅ 만료 임박 경고: 7일 이내 주황색 강조

### 🔧 파일 변경 내역

**수정된 파일 (2개)**:
1. `components/mobile/MobileCalendar.tsx` - 수강권 섹션 추가 (Lines 462-507)
2. `CURRENT_TASK.md` - 작업 로그 업데이트

**주요 Import 추가**:
- `Package` 아이콘 (lucide-react) - 수강권 헤더에 사용 예정 (현재는 이모지 📦 사용)

### 📈 사용자 경험 개선

1. **정보 접근성**:
   - 캘린더에서 예약하기 전에 수강권 상태를 먼저 확인 가능
   - 남은 회수, 만료일을 한눈에 파악

2. **일관된 UX**:
   - 홈/예약/캘린더 모든 페이지에서 동일한 수강권 카드 경험
   - 사용자가 학습 곡선 없이 즉시 이해 가능

3. **시각적 계층**:
   - 수강권 (위) → 캘린더 (중간) → 시간 선택 (아래)
   - 자연스러운 정보 흐름

### 🧪 예상 사용 플로우

```
학생 로그인
  ↓
캘린더 탭 클릭
  ↓
[내 수강권] 섹션에서 남은 회수 확인 (예: 3회 남음)
  ↓
주간 캘린더에서 원하는 날짜 선택
  ↓
예약 가능한 시간 선택
  ↓
확인 모달에서 수강권 최종 선택
  ↓
예약 확정
```

### ✅ 완료된 작업 체크리스트

- [x] 수강권 카드를 캘린더 위에 배치
- [x] 홈/예약/캘린더 스타일 통일
- [x] 만료 임박 경고 로직 적용
- [x] 가로 스크롤 구현 (scrollbar-hide)
- [x] CURRENT_TASK.md 업데이트
- [x] 프로덕션 배포 준비

### 🚀 배포 예정
- Vercel 배포 진행 중...

---

# 현재 작업 현황 (2025-12-28)

## 🎉 학생 관리 & Google 캘린더 자동 연동 완료! (2025-12-28)

### ✅ **프로덕션 배포 완료**

**배포 URL**: https://yeyak-mania-f6pn14p3b-jsps-projects-771dd933.vercel.app

### 📊 주요 변경 사항 (4개)

#### 1. **학생 삭제 기능 구현** ✅
- 📝 `lib/supabase/database.ts` - `removeStudentFromInstructor()` 함수 추가 (Lines 1997-2054)
- 📝 `components/Dashboard.tsx` - 학생 카드에 삭제 버튼 추가 (Lines 660-682)
- 🎯 기능:
  - 강사가 학생을 삭제하면 관련 데이터 모두 삭제 (Cascade)
  - 삭제 대상: 예약 기록 (`reservations`), 수강권 (`packages`), 학생-강사 관계 (`instructor_students`)
  - 삭제 전 확인 다이얼로그 (⚠️ 경고 메시지)
  - 상세한 에러 로깅 및 사용자 피드백
- 🔧 에러 수정:
  - **BEFORE**: `student_packages` 테이블 참조 (존재하지 않음)
  - **AFTER**: `packages` 테이블로 수정
  - 에러 메시지: "public.student_packages 를 못찾는대" → 즉시 수정

**코드 예시**:
```typescript
// lib/supabase/database.ts
export async function removeStudentFromInstructor(studentId: string, instructorId: string) {
  try {
    // 1. 예약 삭제
    await supabase.from('reservations').delete()
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId);

    // 2. 수강권 삭제
    await supabase.from('packages').delete()  // ✅ 수정됨 (student_packages → packages)
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId);

    // 3. 학생 관계 삭제
    await supabase.from('instructor_students').delete()
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId);

    return { success: true };
  } catch (error: any) {
    console.error('[removeStudentFromInstructor] Failed:', error);
    throw error;
  }
}
```

**UI 코드**:
```typescript
// components/Dashboard.tsx - 삭제 버튼
<button
  onClick={() => handleDeleteStudent(u)}
  className="flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
>
  <Trash2 size={14} />
  삭제
</button>
```

#### 2. **학생 등록일자 표시** ✅
- 📝 `components/Dashboard.tsx` - 학생 카드에 등록일 추가 (Lines 599-607)
- 🎯 데이터 소스: `instructor_students.created_at` (학생 초대 생성 날짜)
- 🎯 포맷: "YYYY. M. D" 한글 형식
- 🎨 스타일: 회색 라벨 + 검정 날짜

**코드 예시**:
```typescript
// components/Dashboard.tsx
{u.created_at && (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-500">등록일</span>
    <span className="text-slate-900 font-medium">
      {new Date(u.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })}
    </span>
  </div>
)}
```

#### 3. **Google 캘린더 자동 연동** ✅
- 📝 `lib/supabase/database.ts` - `createReservation()` 함수 수정 (Lines 589-667)
- 🎯 문제: "구글 캘린더 id 에 등록해야 하는데 등록일이 등록 안되고 있네?"
- 🎯 해결: 예약 생성 시 자동으로 Google 캘린더에 이벤트 추가
- 🎨 기능:
  1. 강사의 `google_calendar_id` 조회 (`instructor_settings` 테이블)
  2. 학생 이메일 조회 (`users` 테이블)
  3. `addEventToCalendar()` 호출 - 학생을 참석자로 추가
  4. Google Meet 링크 자동 생성
  5. Meet 링크 & Google Event ID를 예약에 저장
  6. 에러 발생 시에도 예약은 정상 생성 (Graceful degradation)

**사용자 피드백**:
- "이미 토큰도 다 받은 상태잔항"
- "그럼 강사의 캘린더에, 해당 고객 추가(참석자로 추가) 해서 만들고 google meet 링크 축다해두면 끝나는건데 왜 또 어려워? 이미 함수 다 만들었짢나"
- → 기존 함수 활용하여 간단하게 해결

**코드 예시**:
```typescript
// lib/supabase/database.ts - createReservation()
export async function createReservation(data: {...}) {
  // 1. 강사 캘린더 ID 조회
  const { data: settings } = await supabase
    .from('instructor_settings')
    .select('google_calendar_id')
    .eq('instructor_id', data.instructor_id)
    .single();

  // 2. 학생 이메일 조회
  const { data: student } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', data.student_id)
    .single();

  let meetLink = data.meet_link;
  let googleEventId = data.google_event_id;

  // 3. Google 캘린더에 이벤트 추가
  if (settings?.google_calendar_id && student?.email) {
    try {
      const { addEventToCalendar } = await import('../google-calendar');
      const result = await addEventToCalendar({
        calendarId: settings.google_calendar_id,
        title: `${student.name || 'Student'}님과의 수업`,
        start: data.start_time,
        end: data.end_time,
        description: data.notes,
        attendees: [student.email],  // 🎯 학생을 참석자로 추가
        instructorId: parseInt(data.instructor_id)
      });

      meetLink = result.meetLink || meetLink;
      googleEventId = result.id || googleEventId;
    } catch (error) {
      console.error('Failed to add to Google Calendar:', error);
      // 캘린더 연동 실패해도 예약은 계속 진행
    }
  }

  // 4. 예약 생성 (Meet 링크 포함)
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({ ...data, meet_link: meetLink, google_event_id: googleEventId })
    .select()
    .single();

  return reservation;
}
```

#### 4. **예약 목록 디자인 변경** ✅
- 📝 `components/Dashboard.tsx` - 강사 예약 목록 레이아웃 수정 (Lines 374-436)
- 🎯 요구사항: "예약 부분에 강사별 예약 창 디자인만 바꾸자. 지금 한줄이되었으면 좋겠어. 왼쪽에는 '입장' 버튼 오른쪽에는 '삭제' 버튼. 중간에는 수강생 이름과 멤버쉽, 예약 날짜와 시간"
- 🎨 변경:
  - **BEFORE**: 멀티라인 카드 레이아웃 (여러 줄)
  - **AFTER**: 단일라인 수평 레이아웃 (한 줄)

**레이아웃 구조**:
```
[입장 버튼] | 수강생 이름 | 멤버십 배지 | 📅 날짜 | 🕐 시간 | [삭제 버튼]
```

**코드 예시**:
```typescript
// components/Dashboard.tsx
<div className="flex items-center p-4 rounded-xl border gap-4">
  {/* 왼쪽 - 입장 버튼 */}
  <div className="flex-shrink-0">
    {isUpcoming && res.meetLink ? (
      <a
        href={res.meetLink}
        target="_blank"
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg"
      >
        <Video size={16} />
        <span>입장</span>
      </a>
    ) : (
      <div className="w-20 h-10"></div>
    )}
  </div>

  {/* 중간 - 수강생 정보 */}
  <div className="flex-1 flex items-center gap-3 min-w-0">
    <span className="font-bold text-base truncate">
      {res.studentName || res.studentEmail}
    </span>

    {res.packageName && (
      <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium">
        {res.packageName}
      </span>
    )}

    <div className="flex items-center gap-3 text-sm text-slate-600">
      <div className="flex items-center gap-1.5">
        <Calendar size={14} />
        <span>{res.date}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock size={14} />
        <span>{res.time}</span>
      </div>
    </div>
  </div>

  {/* 오른쪽 - 삭제 버튼 */}
  <div className="flex-shrink-0">
    {isUpcoming && (
      <button
        onClick={() => handleCancel(res.reservationId, res.date, res.time)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
      >
        <Trash2 size={16} />
        <span>삭제</span>
      </button>
    )}
  </div>
</div>
```

### 🔧 파일 변경 내역

**수정된 파일 (2개)**:
1. `lib/supabase/database.ts` - 학생 삭제 함수 추가, Google 캘린더 연동 추가
2. `components/Dashboard.tsx` - 삭제 버튼, 등록일 표시, 예약 목록 레이아웃 변경

**주요 함수**:
- `removeStudentFromInstructor(studentId, instructorId)` - 학생 삭제
- `createReservation(data)` - 예약 생성 (Google 캘린더 자동 연동)
- `handleDeleteStudent(student)` - 삭제 확인 다이얼로그

### 🐛 수정된 에러

#### 에러 1: Table Name Mismatch
- **문제**: "public.student_packages 를 못찾는대"
- **원인**: `removeStudentFromInstructor()`에서 존재하지 않는 `student_packages` 테이블 참조
- **해결**: `packages` 테이블로 수정 (Line 2021)
- **영향**: 학생 삭제 시 수강권 삭제 정상 작동

#### 에러 2: Google 캘린더 미연동
- **문제**: "구글 캘린더 id 에 등록해야 하는데 등록일이 등록 안되고 있네?"
- **원인**: `createReservation()`에서 Google 캘린더 함수를 호출하지 않음
- **해결**: `addEventToCalendar()` 호출 추가 (Lines 622-647)
- **영향**: 예약 생성 시 자동으로 Google 캘린더 이벤트 생성, Meet 링크 저장

### 📈 개선 사항

1. **데이터 일관성**:
   - 학생 삭제 시 Cascade 삭제로 데이터 무결성 유지
   - 예약-캘린더 자동 동기화

2. **사용자 경험**:
   - 삭제 전 확인 다이얼로그 → 실수 방지
   - 등록일 표시 → 회원 관리 정보 강화
   - 단일라인 예약 목록 → 가독성 향상

3. **에러 처리**:
   - 상세한 콘솔 로깅
   - 사용자 친화적 에러 메시지
   - Graceful degradation (캘린더 연동 실패해도 예약 생성)

### 🧪 테스트 시나리오

**사용자 테스트 데이터**:
- 수강권: `cal_membership` 생성
- 학생: `jseul45@gmail.com`
- 예약: jseul45@gmail.com이 예약 생성

**예상 결과**:
1. ✅ 예약 생성 시 강사 Google 캘린더에 이벤트 자동 추가
2. ✅ jseul45@gmail.com가 참석자로 등록됨
3. ✅ Google Meet 링크 자동 생성 및 저장
4. ✅ 강사가 "입장" 버튼 클릭 시 Meet 입장 가능
5. ✅ 강사가 학생 삭제 시 예약/수강권/관계 모두 삭제

### 🚀 배포 완료

**배포 정보**:
- ✅ 빌드 성공
- ✅ Vercel 배포 완료
- ✅ URL: https://yeyak-mania-f6pn14p3b-jsps-projects-771dd933.vercel.app
- ✅ Commit: "feat: Redesign reservation list to single-line layout"

### 📝 사용자 요청 로그

1. "회원 삭제는안되나? '학생 초대하기' 를 활용해 등록한 날짜 기반으로 등록일자 삼아주고 싶언데"
   → ✅ 학생 삭제 기능 + 등록일 표시 구현

2. "public.student_packages 를 못찾는대"
   → ✅ 테이블명 수정 (`packages`로 변경)

3. "구글 캘린더 id 에 등록해야 하는데 등록일이 등록 안되고 있네? 원인을 찾아볼래?"
   → ✅ Google 캘린더 자동 연동 추가

4. "그럼 강사의 캘린더에, 해당 고객 추가(참석자로 추가) 해서 만들고 google meet 링크 축다해두면 끝나는건데"
   → ✅ 기존 함수 활용하여 간단하게 구현

5. "오케 예약 부분에 강사별 예약 창 디자인만 바꾸자. 지금 한줄이되었으면 좋겠어. 왼쪽에는 '입장' 버튼 오른쪽에는 '삭제' 버튼. 중간에는 수강생 이름과 멤버쉽, 예약 날짜와 시간"
   → ✅ 단일라인 레이아웃으로 변경

### ✅ 완료된 작업 체크리스트

- [x] 학생 삭제 기능 구현
- [x] 학생 등록일 표시
- [x] Google 캘린더 자동 연동
- [x] Meet 링크 자동 생성
- [x] 예약 목록 디자인 변경 (단일라인)
- [x] 에러 수정 (student_packages → packages)
- [x] 프로덕션 배포

### 🎯 다음 단계

현재 요청된 모든 기능 완료. 추가 작업 대기 중.

---

# 이전 작업 현황 (2025-12-26)

## 🎉 스튜디오 설정 간소화 & 캘린더 최적화 완료! (2025-12-26 오후)

### ✅ **프로덕션 배포 완료**

**배포 URL**: https://yeyak-mania-f53gxmz0j-jsps-projects-771dd933.vercel.app

### 📊 주요 변경 사항 (4개)

#### 1. **스튜디오 설정 로직 간소화** ✅
- 📝 `App.tsx` - 프로필 완성 체크 로직 수정
- 🎯 변경 내용:
  - BEFORE: `is_profile_complete`, `studio_name`, `short_id`, `phone` 모두 체크
  - AFTER: `studio_name`만 체크
- 🎯 결과:
  - Line 250: `!existingUser.studio_name`만으로 /setup 리다이렉트 판단
  - Line 225: `isProfileComplete` 계산 간소화
  - 불필요한 필드 체크 제거로 온보딩 플로우 단순화

#### 2. **slug 컬럼 의존성 제거** ✅
- 📝 `lib/supabase/database.ts` - Line 1666: `getCoachingCalendar()`에서 slug 제거
- 📝 `types.ts` - Line 44: Coaching 인터페이스에서 `slug?` 옵션으로 변경
- 📝 `services/api/coachings.ts` - Line 43: create 함수 파라미터에서 `slug?` 옵션으로 변경
- 🎯 문제: `GET .../coachings?select=id&slug=eq.yytest 406 (Not Acceptable)`
- 🎯 해결: DB 마이그레이션 없이 코드만 수정하여 해결 (slug 컬럼이 DB에 없음)

#### 3. **코칭 캘린더 로딩 최적화** ✅
- 📝 `components/CoachingManagementInline.tsx` - Line 68-77: `loadCoachings()` 최적화
- 🎯 변경 내용:
  - BEFORE: 모든 코칭 로드 시마다 `ensureCalendarInList()` 루프 실행
  - AFTER: 새 코칭 생성 시에만 캘린더 추가
- 🎯 결과:
  - 불필요한 API 호출 제거
  - 코칭 관리 페이지 로딩 속도 개선
  - 캘린더는 예약 시 안전성 체크로만 유지

#### 4. **프로덕션 배포** ✅
- ✅ 빌드 성공: 791.66 kB (gzip: 209.38 kB)
- ✅ Vercel 배포: 25초 소요
- ✅ 배포 위치: Washington, D.C., USA (iad1)
- ⚠️ 경고: 번들 크기 > 500KB (추후 code splitting 필요)

### 🔧 파일 변경 내역

**수정된 파일 (4개)**:
1. `App.tsx` - 스튜디오 설정 로직 간소화
2. `lib/supabase/database.ts` - slug 컬럼 제거
3. `types.ts` - slug 필드 옵셔널 처리
4. `services/api/coachings.ts` - slug 필드 옵셔널 처리
5. `components/CoachingManagementInline.tsx` - 캘린더 로딩 최적화

### 📈 성능 개선
- ✅ 온보딩 플로우 단순화 → 사용자 경험 개선
- ✅ 불필요한 API 호출 제거 → 로딩 속도 향상
- ✅ DB 스키마 불일치 해결 → 406 에러 제거

### 🚀 다음 단계
1. 번들 크기 최적화 (code splitting, lazy loading)
2. 추가 기능 테스트 및 버그 수정

---

## 🎉 회원 관리 예약 링크 전송 기능 완료! (2025-12-26 오전)

### ✅ **예약 링크 복사 & 카카오톡 전송 기능 추가**

#### 구현 내용
**위치**: `components/mobile/MobileStudents.tsx` - 학생별 액션 버튼

**새로운 버튼 3개 추가**:
1. 🎫 **수강권** - 수강권 관리 모달 열기
2. 🔗 **링크** - 예약 링크 클립보드 복사 (복사 완료 시 초록색 피드백)
3. 💬 **카톡** - 비즈니스 카카오톡 자동 전송 (Solapi API)

**사용 시나리오**:
```
강사 → 회원 관리 → 학생 선택
 → 수강권 버튼 클릭 → 수강권 부여
 → 링크 버튼 클릭 → 예약 URL 복사 → 카톡/문자로 전송
 또는
 → 카톡 버튼 클릭 → 자동으로 카카오 알림톡 전송
```

#### 기술 구현
**1. 예약 링크 생성**
- 강사의 첫 번째 활성 코칭 slug 사용
- URL 형식: `https://yeyak-mania.vercel.app/{slug}`
- 클립보드 복사 후 2초간 "복사됨!" 피드백 표시

**2. Solapi API 연동**
- 📝 신규 파일: `services/solapi.ts`
- 카카오 알림톡 우선 전송 → 실패 시 SMS 자동 대체
- 템플릿 기반 메시지 전송
- 버튼 링크 포함 (웹링크 버튼)

**3. 환경 변수 추가**
- 📝 `.env.example` 업데이트
- 필요한 환경 변수:
  ```bash
  VITE_SOLAPI_API_KEY=...
  VITE_SOLAPI_API_SECRET=...
  VITE_SOLAPI_SENDER_PHONE=01012345678
  VITE_SOLAPI_KAKAO_SENDER_KEY=...
  ```

#### UI/UX 개선
- **3개 버튼 레이아웃**: 수강권(주황) / 링크(파랑) / 카톡(노랑)
- **이메일 버튼**: 별도 행으로 이동 (덜 중요한 액션)
- **복사 피드백**: 링크 복사 시 아이콘 변경 + 초록색 배경
- **에러 처리**:
  - 코칭 없음 → 알림
  - 전화번호 없음 → 클립보드 복사로 대체
  - API 실패 → 클립보드 복사로 폴백

#### Solapi 설정 가이드
1. https://console.solapi.com 가입
2. API 키/시크릿 생성
3. 발신번호 등록 (SMS용)
4. 카카오 알림톡 발신프로필 생성
5. 템플릿 등록:
   ```
   안녕하세요 #{이름}님! 예약은 아래 링크에서 가능합니다.
   [예약하기 버튼 - 웹링크]
   ```
6. 템플릿 ID를 `services/solapi.ts`에 입력

#### 파일 변경 사항
- 📝 `components/mobile/MobileStudents.tsx` - UI 버튼 3개로 확장
- 📝 `services/solapi.ts` - 신규 파일 (Solapi API 통합)
- 📝 `.env.example` - Solapi 환경 변수 추가

---

## 🔐 Solapi 설정 보안 강화 완료! (2025-12-26)

### ✅ **강사별 API 키 암호화 저장 시스템 구축**

**문제 인식**:
- 환경 변수로 모든 강사가 동일한 API 키 사용 → 비효율적
- API 키는 민감한 정보 → 평문 저장 위험
- 각 강사가 자신의 Solapi 계정을 사용해야 함

**해결 방식**: **Supabase Vault (pgsodium 암호화)**

#### 보안 아키텍처
1. **암호화 저장소** (`user_solapi_secrets` 테이블)
   - API Key/Secret은 `vault.secrets`에 암호화 저장
   - 발신번호, 카카오 키, 템플릿 ID는 평문 저장 (민감하지 않음)
   - RLS 정책: 본인 데이터만 읽기/쓰기 가능

2. **Database Functions**
   - `save_solapi_settings()` - API 키를 암호화하여 저장
   - `get_solapi_settings()` - API 키를 복호화하여 조회 (본인만)
   - SECURITY DEFINER로 권한 관리

3. **프론트엔드 통합**
   - 📝 `lib/supabase/database.ts`: saveSolapiSettings(), getSolapiSettings()
   - 📝 `services/solapi.ts`: userId 기반으로 API 호출
   - 📝 `components/mobile/SolapiSettingsModal.tsx`: 설정 UI

#### 사용 흐름
```
강사 → 프로필/설정 → Solapi 설정 버튼
  → API 키/시크릿 입력 (암호화 저장)
  → 회원 관리 → 카톡 버튼 클릭
  → 자동으로 강사 본인의 API 키 사용
```

#### 보안 특징
- ✅ **AES-256 암호화**: pgsodium 사용
- ✅ **RLS 정책**: 본인만 조회 가능
- ✅ **프론트엔드에 노출 없음**: DB 함수로만 접근
- ✅ **Vault 스키마**: Supabase 공식 암호화 방식
- ✅ **SECURITY DEFINER**: 권한 분리

#### 파일 생성/수정
- 📝 `supabase/migrations/add_solapi_settings.sql` - Vault 테이블 & 함수
- 📝 `lib/supabase/database.ts` - Solapi 설정 함수 추가
- 📝 `services/solapi.ts` - userId 파라미터 추가
- 📝 `components/mobile/SolapiSettingsModal.tsx` - 신규 UI 컴포넌트
- 📝 `components/mobile/MobileStudents.tsx` - userId 전달

#### Migration 실행 필요
```bash
# Supabase CLI로 migration 적용
npx supabase db push
```

---

## 🎉 모바일 강사/코치 UI/UX 개선 완료! (2025-12-26)

### ✅ **모든 HIGH Priority 작업 100% 완료**

### 📊 완료된 작업 (6개 / HIGH Priority)

#### 1. **실제 통계 데이터 연결** ✅
- 📝 `MobileInstructorHome.tsx`: `getInstructorStats()` API 연동
- 🎯 결과: 하드코딩된 "125만원" 제거, 실시간 매출/수업/출석률 표시
- ⚡ 주간/월간/연간 기간 선택 토글 추가

#### 2. **Skeleton 로딩 추가** ✅
- 📝 `SkeletonHomeLoader` 컴포넌트 활용
- 🎯 결과: 스피너 대신 구조화된 로딩 UI, 레이아웃 점프 방지

#### 3. **학생 수강권 개수 표시** ✅
- 📝 `MobileStudents.tsx`: 각 학생의 활성 수강권 개수 로딩
- 📝 `getAllStudentPackages()` 병렬 호출로 성능 최적화
- 🎯 결과: "-" 플레이스홀더 대신 "3개", "0개" 등 실제 개수 표시

#### 4. **빠른 작업 버튼 수정** ✅
- 📝 `MobileInstructorHome.tsx`: onClick 핸들러 연결
- 📝 `MobileDashboard.tsx`: onTabChange prop 전달
- 🎯 결과: "새 예약" → 예약 탭, "회원 관리" → 회원 탭 이동
- 🎨 보라색 → 주황색 브랜드 컬러 통일

#### 5. **매출 분석 카드 추가** ✅
- 📝 `MobileInstructorHome.tsx`: 새로운 "💰 오늘 매출 분석" 섹션
- 🎯 결과:
  - 수업 유형별 분석 (1:1 레슨 / 그룹)
  - 출석 상태별 분석 (출석 완료 / 대기 중)
  - 출석률 진행바 표시
- 🎨 컬러: 주황색(1:1), 파란색(그룹), 초록색(출석), 회색(대기)

#### 6. **코칭 선택기 추가** ✅
- 📝 `MobileInstructorHome.tsx`: 다중 코칭 강사용 필터
- 📝 `getInstructorCoachings()` API 연동
- 🎯 결과:
  - 코칭이 2개 이상일 때만 표시
  - 드롭다운 선택으로 특정 코칭만 필터링
  - 통계/예약/매출 모두 선택된 코칭 기준으로 표시
  - 클릭 외부 영역 감지로 자동 닫힘

---

## 🎉 긴급 수정 완료 (2025-12-26 11:46)

### ✅ **온보딩 플로우 정상화 완료**

**문제들**:
1. ❌ `getCoachIdFromUrl is not defined` - services/api.ts에서 미정의 함수 호출
2. ❌ `/setup` URL이 예약 페이지로 인식되어 coachings 테이블 406 에러
3. ❌ username 컬럼이 DB에 없는데 타입 정의와 로직에서 참조
4. ❌ 강사 선택 후 계속 /setup으로 리다이렉트되는 무한 루프

**해결**:
1. ✅ `getCoachIdFromUrl()` → `getCurrentCoachId()`로 수정
2. ✅ 시스템 라우트 목록에 setup, dashboard, profile 등 추가
3. ✅ Database 타입에서 username 필드 제거 (lib/supabase/client.ts)
4. ✅ App.tsx에서 username 체크 로직 비활성화

**변경된 파일**:
- `services/api.ts` - getCoachIdFromUrl → getCurrentCoachId, 시스템 라우트 확장
- `lib/supabase/client.ts` - username 필드 제거
- `App.tsx` - username 체크 비활성화

**현재 상태**: ✅ `/onboarding` → "강사/코치" 선택 → `/summary` 정상 작동

---

# 현재 작업 현황 (2025-12-26)

## 🎉 모바일 수강생 UI/UX 개선 완료! (2025-12-26)

### ✅ **모든 HIGH Priority 작업 100% 완료**

### 📊 UX/UI 분석
- ✅ 전문가 에이전트 분석 완료
- ✅ `MOBILE_STUDENT_UX_ANALYSIS.md` 생성 (상세 분석 문서)
- ✅ 우선순위별 작업 항목 정리

### 🎨 디자인 방향
- ✅ **주황색(Orange) 컬러 유지** - 사용자 브랜드 컬러 확정
- ❌ 보라색 변경 제안 기각 (사용자 선호도 반영)

### ✅ 완료된 작업 (6개 / HIGH Priority)

#### 1. **실제 수강권 데이터 연결** ✅
- 📝 `lib/supabase/database.ts`: `getAllStudentPackages()` 함수 추가
- 📝 `MobileStudentHome.tsx`: 실제 Supabase 데이터 연동
- 🎯 결과: 하드코딩 제거, 실시간 수강권 정보, 잔여 회수/만료일 정확 표시

#### 2. **예약하기 기능 구현** ✅
- 📦 `vaul` 라이브러리 설치
- 📝 `components/mobile/BookingBottomSheet.tsx` 신규 생성
- 🎯 결과: 4단계 예약 플로우, 네이티브 Bottom Sheet, 주황색 브랜드 적용

#### 3. **학생용 캘린더 탭 추가** ✅
- 📝 `components/mobile/MobileCalendar.tsx` 신규 생성
- 📝 `MobileBottomNav.tsx`: 캘린더 탭 추가 (4개 탭)
- 🎯 결과: 주간 캘린더 뷰, 예약 개수 배지, 오늘 강조

#### 4. **스와이프로 예약 취소** ✅
- 📦 `react-swipeable` 라이브러리 설치
- 📝 `components/mobile/SwipeableReservationCard.tsx` 신규 생성
- 🎯 결과: 왼쪽 스와이프로 취소, 네이티브 제스처, "← 밀어서 취소" 힌트

#### 5. **수강권 만료 경고** ✅
- 📝 `MobileStudentHome.tsx`: 만료 로직 추가
- 🎯 결과: 7일 이내 주황색 경고, 만료 시 빨간색, 남은 일수 표시

#### 6. **Skeleton 로딩 추가** ✅
- 📝 `components/mobile/SkeletonLoader.tsx` 신규 생성
- 🎯 결과: 스피너 대신 Skeleton, 로딩 경험 개선, 레이아웃 점프 방지

### 📁 생성된 파일 (5개)
1. `BookingBottomSheet.tsx` - 예약 Bottom Sheet
2. `MobileCalendar.tsx` - 학생용 캘린더
3. `SwipeableReservationCard.tsx` - 스와이프 카드
4. `SkeletonLoader.tsx` - Skeleton 로더
5. `MOBILE_STUDENT_UX_ANALYSIS.md` - UX/UI 분석

### 📦 설치 패키지 (2개)
- `vaul` - Bottom Sheet (React 19 호환)
- `react-swipeable` - 스와이프 제스처

### 🔄 수정 파일 (6개)
- `lib/supabase/database.ts`
- `components/mobile/MobileStudentHome.tsx`
- `components/mobile/MobileReservations.tsx`
- `components/mobile/MobileBottomNav.tsx`
- `components/mobile/MobileDashboard.tsx`
- `src/index.css`

---

# 긴급 작업 현황 (2025-12-26) - 발표 1시간 전

## 🚨 긴급 해결 완료 (2025-12-26 01시)

### ✅ **user_type 컬럼 에러 수정 완료**

**문제**: `Could not find the 'user_type' column of 'users' in the schema cache`

**원인**: BIGINT 마이그레이션 후 `user_type` 컬럼이 제거되었으나, 코드에서 여전히 참조

**수정한 파일**:

1. **lib/supabase/database.ts** (5개 함수 수정)
   - ✅ `selectUserType()` - `user_type` 업데이트 제거, `user_roles` 테이블만 사용
   - ✅ `getInstructorByUsername()` - `user_type` 필터 제거, role 검증 추가
   - ✅ `getCoachingByCoachAndSlug()` - `user_type` 필터 제거, role 검증 추가
   - ✅ `getAllStudents()` - `user_type` 쿼리 제거, `user_roles` JOIN으로 변경
   - ✅ `upsertUser()` - 이미 수정됨

2. **lib/supabase/client.ts**
   - ✅ Database 타입에서 `user_type` 필드 제거
   - ✅ `studio_name`, `phone`, `short_id` 필드 추가

**Before → After 예시**:
```typescript
// BEFORE (에러 발생)
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_type', 'student')  // ❌ user_type 컬럼 없음
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// AFTER (수정됨)
export async function getAllStudents() {
  // Get all users with student role
  const { data: studentRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role_name', 'student');

  if (rolesError) throw rolesError;
  if (!studentRoles || studentRoles.length === 0) return [];

  const studentIds = studentRoles.map(r => r.user_id);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', studentIds)  // ✅ user_roles 테이블 사용
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

---

## 🚀 빌드 완료

```bash
✓ built in 1.85s
dist/index.html                   3.83 kB │ gzip:   1.40 kB
dist/assets/index-cMeCg0nu.css   44.51 kB │ gzip:   7.50 kB
dist/assets/index-BRJLkQZZ.js   641.16 kB │ gzip: 166.14 kB
```

**배포 준비 완료** ✅

---

## 🔴 남은 문제: Localhost OAuth 리다이렉트

**문제**: localhost에서 테스트 시 `https://yeyak-mania.co.kr/#`으로 리다이렉트됨

**해결 방법**:

### 1. Supabase Dashboard 설정 (수동 작업 필요)

**경로**: https://supabase.com/dashboard → 프로젝트 선택 → Settings → Authentication → URL Configuration

**추가할 URL**:
- Site URL: `http://localhost:5001` (또는 기존 유지)
- Redirect URLs:
  - `http://localhost:5001` ✅
  - `http://localhost:5001/onboarding` ✅
  - `https://yeyak-mania.co.kr` (기존)
  - `https://yeyak-mania.co.kr/onboarding` (기존)

### 2. 코드 수정 완료 (이미 적용됨)

**lib/supabase/auth.ts**:
```typescript
export async function signInWithGoogle() {
  // Use current origin (supports localhost and production)
  const redirectUrl = `${window.location.origin}/onboarding`;

  console.log('OAuth Redirect URL:', redirectUrl);
  // localhost:5001 → http://localhost:5001/onboarding
  // yeyak-mania.co.kr → https://yeyak-mania.co.kr/onboarding

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,  // 동적 URL
      ...
    }
  });
}
```

**App.tsx** - 해시(#) 자동 제거:
```typescript
useEffect(() => {
  // Remove hash from URL (Supabase auth uses hash fragments)
  if (window.location.hash && window.location.hash.includes('access_token')) {
    setTimeout(() => {
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState({}, '', cleanUrl);
    }, 100);
  }
}, []);
```

---

## 🎯 발표 전 체크리스트

### ✅ 완료된 항목
- [x] `user_type` 컬럼 에러 수정
- [x] 프로덕션 빌드 성공
- [x] OAuth 리다이렉트 코드 수정
- [x] 해시(#) 제거 로직 추가
- [x] 로그인 후 `/onboarding`으로 리다이렉트

### ⏳ 발표 직전 확인사항
- [ ] Supabase Dashboard에 localhost URL 추가 (1분 작업)
- [ ] localhost:5001에서 OAuth 테스트
- [ ] 프로덕션 배포 (vercel.app 또는 yeyak-mania.co.kr)
- [ ] 프로덕션에서 OAuth 테스트

---

## 📊 현재 상태

### Database
- ✅ BIGINT 스키마 (11개 테이블)
- ✅ RLS 정책 활성화
- ✅ `user_roles` 테이블 사용
- ✅ `user_type` 컬럼 완전 제거

### Frontend
- ✅ 모든 컴포넌트 빌드 성공
- ✅ 641KB (gzip: 166KB)
- ✅ 타입 에러 0개
- ✅ 컴파일 에러 0개

### Authentication
- ✅ Google OAuth 설정
- ✅ 동적 리다이렉트 URL
- ✅ 해시(#) 자동 제거
- ⏳ localhost URL 설정 (Dashboard에서 추가 필요)

---

## 🎤 발표 시나리오

### 1. 프로젝트 소개 (2분)
- **예약매니아**: Calendly + StudioMate 올인원 솔루션
- 강사: 코칭 관리, 수강권 판매, 통계
- 학생: 간편 예약, 수강권 확인

### 2. 핵심 기능 시연 (5분)
1. **랜딩 페이지** - 깔끔한 디자인, CTA
2. **Google 로그인** - OAuth 인증
3. **온보딩** - 강사/학생 선택
4. **강사 대시보드** - 통계, 예약 관리
5. **공개 예약 페이지** - `/{코칭명}` URL

### 3. 기술 스택 (1분)
- Frontend: React 19 + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Auth + RLS)
- Styling: Tailwind CSS
- Deployment: Vercel

### 4. 데이터베이스 설계 (2분)
- BIGINT 아키텍처 (UUID 대비 50% 절약)
- 역할 기반 시스템 (`user_roles`)
- 수강권 템플릿 시스템

---

## 🐛 알려진 이슈 & 해결책

### 이슈 1: localhost OAuth 리다이렉트
**해결**: Supabase Dashboard에서 localhost URL 추가 (1분)

### 이슈 2: 번들 크기 경고 (641KB > 500KB)
**상태**: 낮은 우선순위
**해결책**: Code splitting, lazy loading (추후)

---

## 💾 백업 & 배포

### Vercel 배포
```bash
# 현재 디렉토리에서
vercel --prod
```

### 환경 변수 확인
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GA_MEASUREMENT_ID`

---

## 📝 발표 후 TODO

1. **성능 최적화**
   - Code splitting
   - Lazy loading
   - 번들 크기 < 500KB

2. **모바일 고도화**
   - 스와이프 제스처
   - Bottom Sheet
   - 차트 모바일 뷰

3. **구독 시스템 활성화**
   - 결제 연동 (Stripe/Toss Payments)
   - 프로모션 코드 UI

---

**마지막 업데이트**: 2025-12-26 01:00 (발표 1시간 전)
**상태**: 🟢 발표 준비 완료
**다음 작업**: Supabase Dashboard 설정 (1분) → 최종 테스트
