#!/bin/bash

echo "🚀 정수결사 QA 자동화 시작..."
echo ""

cd /Users/jinseulpark/Desktop/github/jsks_app/qa-screenshots

# 이전 스크린샷 삭제
rm -f *.png

echo "📸 스크린샷 캡쳐 중..."
node capture.mjs

echo ""
echo "✅ QA 완료!"
echo "📁 결과: qa-screenshots/ 폴더 확인"
echo "📄 문서: qa-screenshots/QA_REPORT.md"
