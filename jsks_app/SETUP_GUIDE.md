# 정수결사 앱 - Google Apps Script 설정 가이드

## 📋 개요
이 앱은 Google Sheets를 데이터베이스로 사용합니다.
모든 수행 기록, 사용자 정보, 일정 등이 Google Sheets에 저장됩니다.

## ⏱️ 예상 소요 시간: 10-15분

---

## 1단계: Google Sheets 생성 (2분)

### 1-1. 새 스프레드시트 만들기
1. https://sheets.google.com 접속
2. **빈 스프레드시트** 클릭
3. 제목을 **"정수결사 DB"**로 변경

### 1-2. 스프레드시트 ID 복사
1. 브라우저 주소창의 URL을 확인하세요
2. URL 형식: `https://docs.google.com/spreadsheets/d/[여기가_ID]/edit`
3. ID 부분만 복사하세요 (예: `1a2b3c4d5e6f7g8h9i0j`)

**예시:**
```
URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

---

## 2단계: Apps Script 프로젝트 생성 (5분)

### 2-1. Apps Script 열기
1. Google Sheets에서 **확장 프로그램 > Apps Script** 클릭
2. 새 프로젝트가 열립니다

### 2-2. 백엔드 코드 붙여넣기
1. 기본 코드 `function myFunction() {...}` 모두 삭제
2. 프로젝트 폴더의 **BACKEND_CODE.gs** 파일 내용 전체 복사
3. Apps Script 에디터에 붙여넣기

### 2-3. 스프레드시트 ID 설정
코드 5번째 줄을 찾아서 수정하세요:

**변경 전:**
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

**변경 후:**
```javascript
const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'; // 1단계에서 복사한 ID
```

### 2-4. 저장하기
1. 프로젝트 이름을 **"정수결사 Backend"**로 변경
2. 💾 **저장** 버튼 클릭 (Ctrl+S / Cmd+S)

---

## 3단계: 웹 앱으로 배포 (5분)

### 3-1. 배포 시작
1. 우측 상단 **배포 > 새 배포** 클릭

### 3-2. 배포 설정
1. **유형 선택** 옆 ⚙️ 아이콘 클릭
2. **웹 앱** 선택

### 3-3. 세부 설정
다음과 같이 설정하세요:

| 항목 | 값 |
|------|-----|
| **설명** | v1 - 초기 배포 |
| **다음 사용자로 실행** | 나 (본인 이메일) |
| **액세스 권한** | **모든 사용자** |

⚠️ **중요**: "액세스 권한"을 반드시 **"모든 사용자"**로 설정해야 합니다!

### 3-4. 배포 실행
1. **배포** 버튼 클릭
2. 권한 승인 팝업이 뜨면:
   - **액세스 권한 검토** 클릭
   - 구글 계정 선택
   - "Google에서 확인하지 않은 앱입니다" 경고 → **고급** 클릭
   - **"정수결사 Backend"(으)로 이동(안전하지 않음)** 클릭
   - **허용** 클릭

### 3-5. 배포 URL 복사
1. 배포 완료 후 **웹 앱 URL** 복사
2. URL 형식: `https://script.google.com/macros/s/AKfycby.../exec`
3. 이 URL을 메모장에 저장하세요!

---

## 4단계: 앱에 연결하기 (3분)

### 배포 URL을 여기에 붙여넣으세요:

```
복사한 URL: ________________________________________
```

URL을 복사했으면 이 가이드를 저장하고, 복사한 URL을 제공해주세요.
그러면 자동으로 앱 코드를 업데이트해드리겠습니다!

---

## ✅ 체크리스트

설정이 완료되면 다음을 확인하세요:

- [ ] Google Sheets 생성 완료
- [ ] 스프레드시트 ID 복사 완료
- [ ] Apps Script 코드 붙여넣기 완료
- [ ] SPREADSHEET_ID 설정 완료
- [ ] 웹 앱으로 배포 완료
- [ ] 웹 앱 URL 복사 완료

---

## 🔧 문제 해결

### "승인되지 않은 앱" 경고가 뜨는 경우
→ 정상입니다. **고급 > 프로젝트로 이동** 클릭하면 됩니다.

### 배포 후 "권한 거부" 에러
→ "다음 사용자로 실행"을 **"나"**로, "액세스 권한"을 **"모든 사용자"**로 설정했는지 확인하세요.

### URL이 작동하지 않는 경우
→ URL 끝이 반드시 `/exec`로 끝나야 합니다. `/dev`로 끝나면 안 됩니다.

---

## 📞 다음 단계

URL을 복사했으면 채팅으로 공유해주세요:
```
내 Apps Script URL: https://script.google.com/macros/s/AKfycby.../exec
```

그러면 자동으로 앱에 연결해드립니다! 🚀
