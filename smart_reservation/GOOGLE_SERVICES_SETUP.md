# Google 웹 서비스 등록 가이드

웹사이트를 Google에 등록하여 검색 노출, 분석, 광고 등을 활용하는 방법입니다.

---

## 1. Google Search Console (검색 노출)

### 1.1 Search Console이란?
- Google 검색 결과에 사이트가 표시되도록 등록
- 검색 성능 모니터링 (조회수, 클릭수, 순위)
- 사이트맵 제출로 페이지 색인 요청
- SEO 문제 진단 및 해결

### 1.2 Search Console 등록

#### Step 1: Search Console 접속
1. [Google Search Console](https://search.google.com/search-console) 접속
2. "시작하기" 클릭

#### Step 2: 속성 유형 선택
**URL 접두어 방식 선택** (권장):
- 입력 예: `https://your-domain.com`
- 모든 하위 URL 포함

#### Step 3: 소유권 확인
아래 방법 중 하나 선택:

##### 방법 1: HTML 파일 업로드 (추천)
1. 제공된 HTML 파일 다운로드 (예: `google123abc.html`)
2. 프로젝트의 `public/` 폴더에 파일 복사
3. 배포 후 확인 클릭

```bash
# public 폴더에 파일 추가
cp ~/Downloads/google123abc.html /Users/jinseulpark/Desktop/github/smart_reservation/public/

# 배포
npm run build
vercel --prod
```

##### 방법 2: HTML 태그 추가
1. 제공된 메타 태그 복사
2. `index.html`의 `<head>` 섹션에 추가

```html
<!-- index.html -->
<head>
  <meta name="google-site-verification" content="your-verification-code" />
  ...
</head>
```

##### 방법 3: DNS 레코드 (도메인 소유자)
1. 제공된 TXT 레코드 복사
2. 도메인 DNS 설정에 추가

#### Step 4: 사이트맵 제출
색인 속도를 높이기 위해 사이트맵 제출:

1. 사이트맵 파일 생성 (`public/sitemap.xml`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://your-domain.com/login</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- 주요 페이지들 추가 -->
</urlset>
```

2. Search Console에서 사이트맵 제출:
   - 왼쪽 메뉴 > "Sitemaps"
   - `sitemap.xml` 입력 후 제출

#### Step 5: robots.txt 생성
검색 엔진 크롤링 규칙 설정 (`public/robots.txt`):

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /onboarding
Disallow: /summary
Disallow: /all-reservation
Disallow: /student
Disallow: /membership
Disallow: /setting

Sitemap: https://your-domain.com/sitemap.xml
```

---

## 2. Google My Business (로컬 비즈니스)

### 2.1 비즈니스 프로필 만들기
실제 오프라인 사업장이 있는 경우:

1. [Google My Business](https://www.google.com/business/) 접속
2. "지금 관리" 클릭
3. 비즈니스 정보 입력:
   - 비즈니스 이름: "예약매니아" 또는 실제 상호명
   - 카테고리: "소프트웨어 회사" 또는 "예약 서비스"
   - 위치: 사업장 주소 (없으면 "서비스 지역 비즈니스" 선택)
   - 연락처: 전화번호, 웹사이트 URL
4. 우편물 확인 코드로 인증 (2주 소요)

### 2.2 비즈니스 프로필 최적화
- 프로필 사진, 커버 사진 업로드
- 영업 시간 설정
- 서비스 설명 작성
- 고객 리뷰 응답

---

## 3. Google Ads (광고)

### 3.1 Google Ads 계정 생성
1. [Google Ads](https://ads.google.com/) 접속
2. "지금 시작하기" 클릭
3. 계정 설정 완료

### 3.2 전환 추적 설정
Google Analytics와 연동하여 광고 효과 측정:

1. Google Ads > **"도구 및 설정" > "측정" > "전환"**
2. "새 전환 액션" 클릭
3. "웹사이트" 선택
4. Google Analytics 4 연결

---

## 4. Google Tag Manager (GTM) - 고급

여러 Google 서비스를 한 번에 관리:

### 4.1 GTM 설정
1. [Google Tag Manager](https://tagmanager.google.com/) 접속
2. 계정 및 컨테이너 만들기
3. 제공된 GTM 코드 복사

### 4.2 프로젝트에 GTM 추가
`index.html`에 코드 추가:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');</script>
<!-- End Google Tag Manager -->

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

### 4.3 GTM에서 GA4 태그 추가
1. GTM 대시보드 > "태그" > "새로 만들기"
2. 태그 유형: "Google 애널리틱스: GA4 구성"
3. 측정 ID 입력: `G-XXXXXXXXXX`
4. 트리거: "All Pages"
5. 저장 및 게시

---

## 5. 프로젝트 파일에 메타 태그 추가

SEO 최적화를 위한 메타 태그:

### 5.1 index.html 수정

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- SEO 메타 태그 -->
  <title>예약매니아 - 스마트 예약 관리 시스템</title>
  <meta name="description" content="강사와 수강생을 위한 스마트한 예약 관리 시스템. Google 캘린더 연동, 자동 알림, 수강권 관리까지 한 번에!" />
  <meta name="keywords" content="예약 관리, 수업 예약, 강사 관리, 수강권 관리, Google 캘린더" />
  <meta name="author" content="예약매니아" />

  <!-- Open Graph (SNS 공유) -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="예약매니아 - 스마트 예약 관리 시스템" />
  <meta property="og:description" content="강사와 수강생을 위한 스마트한 예약 관리 시스템" />
  <meta property="og:image" content="https://your-domain.com/og-image.jpg" />
  <meta property="og:url" content="https://your-domain.com" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="예약매니아 - 스마트 예약 관리 시스템" />
  <meta name="twitter:description" content="강사와 수강생을 위한 스마트한 예약 관리 시스템" />
  <meta name="twitter:image" content="https://your-domain.com/og-image.jpg" />

  <!-- Canonical URL -->
  <link rel="canonical" href="https://your-domain.com" />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/index.tsx"></script>
</body>
</html>
```

---

## 6. 체크리스트

### 필수 설정
- [ ] Google Analytics 4 설정 완료
- [ ] Search Console 등록 및 소유권 인증
- [ ] sitemap.xml 생성 및 제출
- [ ] robots.txt 생성
- [ ] index.html에 SEO 메타 태그 추가
- [ ] Open Graph 이미지 준비 (1200x630px 권장)

### 선택 설정
- [ ] Google My Business 등록 (오프라인 사업장이 있는 경우)
- [ ] Google Tag Manager 설정 (여러 태그 관리 필요 시)
- [ ] Google Ads 계정 생성 (광고 계획이 있는 경우)

---

## 7. 배포 후 확인사항

### 7.1 Google Search Console
- [ ] URL 검사 도구로 메인 페이지 색인 확인
- [ ] 사이트맵 제출 상태 확인
- [ ] 크롤링 오류 없는지 확인

### 7.2 Google Analytics
- [ ] 실시간 보고서에서 데이터 수집 확인
- [ ] 페이지뷰 기록 확인
- [ ] 이벤트 추적 확인

### 7.3 SEO 테스트
다음 도구로 SEO 점수 확인:
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- Mobile-Friendly Test: `https://search.google.com/test/mobile-friendly`

---

## 8. 자주 묻는 질문

### Q: 검색 결과에 나타나기까지 얼마나 걸리나요?
**A**: 보통 1-4주 정도 소요됩니다. Search Console에서 색인 요청을 하면 빨라질 수 있습니다.

### Q: 사이트맵은 언제 업데이트해야 하나요?
**A**: 새 페이지를 추가할 때마다 업데이트하고 재제출하세요.

### Q: robots.txt에서 차단한 페이지도 Analytics에 기록되나요?
**A**: 네, robots.txt는 검색 엔진 크롤러만 차단하고 Analytics는 정상 작동합니다.

---

완료! 🎉

이제 Google에 웹사이트가 등록되고, 검색 노출 및 분석이 가능합니다.
