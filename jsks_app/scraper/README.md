# Dhamma.kr 웹 스크래퍼

http://www.dhamma.kr/wp/ 웹사이트의 모든 글을 **예쁜 PDF**로 저장하는 스크래퍼입니다.

## 📊 웹사이트 정보

- **총 페이지**: 3,368 페이지
- **예상 글 개수**: 약 20,000개
- **주제**: 불교 경전 (잡아함경 등)

## 🚀 빠른 시작

### 1. 패키지 설치

```bash
cd /Users/jinseulpark/Desktop/github/jsks_app/scraper
pip3 install weasyprint
brew install pango
```

### 2. 폰트 다운로드 (완료✅)

```bash
# NanumGothic 폰트는 이미 fonts/ 폴더에 다운로드되어 있습니다
ls fonts/NanumGothic.ttf
```

### 3. 테스트 실행 (1개 글)

```bash
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
python3 pdf_maker.py
```

결과: `pdfs/` 폴더에 1개 예쁜 PDF 파일 생성 ✅

### 4. 전체 크롤링 실행

⚠️ **소요 시간**: 약 6시간 (전체) 또는 1분 (테스트 10페이지)
⚠️ **저장 공간**: 약 500MB-1GB 예상

```bash
./run.sh
```

또는

```bash
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
python3 full_scraper.py
```

**선택 옵션**:
- 옵션 1: 테스트 (최근 10개 페이지, 약 60개 글)
- 옵션 2: 전체 크롤링 (3,368 페이지, 약 20,000개 글)

## 📂 파일 구조

```
scraper/
├── README.md                  # 이 파일
├── current_task.md           # 작업 진행 상황
├── requirements.txt          # Python 패키지 목록
├── test_simple.py           # 테스트 스크립트 (1개 글)
├── dhamma_scraper.py        # 전체 크롤링 스크립트
├── texts/                   # 저장된 텍스트 파일
└── pdfs/                    # PDF 폴더 (사용 안함)
```

## ✅ 테스트 완료

- **URL**: http://www.dhamma.kr/wp/?p=17762
- **제목**: 잡아함 133. 생사유전경
- **내용**: 1,678자
- **상태**: ✅ 성공

## 📝 저장 형식

각 텍스트 파일 구조:

```
제목: 잡아함 133. 생사유전경
날짜: 5월 19th, 2025
URL: http://www.dhamma.kr/wp/?p=17762

================================================================================

이와 같이 내가 들었다...
(본문 내용)
```

## ⏱️ 예상 소요 시간

| 작업 | 예상 시간 |
|------|-----------|
| 글 목록 수집 (3,368 페이지) | 약 28분 |
| 본문 크롤링 (20,000개) | 약 5.5시간 |
| **총합** | **약 6시간** |

## 🔧 기술 스택

- Python 3
- requests (HTTP 요청)
- BeautifulSoup4 (HTML 파싱)
- urllib3 (SSL 처리)

## 📌 참고사항

1. **텍스트 vs PDF**: 한글 PDF 생성이 복잡하여 텍스트 파일로 저장
2. **서버 부하**: 페이지당 0.5-1초 딜레이 설정
3. **SSL 인증서**: `verify=False`로 자체 서명 인증서 우회
4. **에러 처리**: 개별 글 크롤링 실패 시 계속 진행

## ❓ 다음 단계 선택

어떻게 진행하시겠습니까?

### 옵션 A: 소규모 테스트
- 최근 10개 페이지만 크롤링
- 소요 시간: 약 1분

### 옵션 B: 전체 크롤링
- 3,368 페이지 전체
- 소요 시간: 약 6시간

### 옵션 C: 나중에 실행
- 스크립트는 준비 완료
- 원하실 때 언제든지 실행 가능
