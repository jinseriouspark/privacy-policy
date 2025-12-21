#!/bin/bash

# Dhamma.kr 크롤러 실행 스크립트

echo "🚀 Dhamma.kr 크롤러 시작"
echo ""

# 라이브러리 경로 설정
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"

# Python 스크립트 실행
python3 full_scraper.py
