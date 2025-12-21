#!/usr/bin/env python3
"""
Dhamma.kr 웹사이트 크롤러 - 모든 글을 PDF로 저장
"""

import requests
from bs4 import BeautifulSoup
from fpdf import FPDF
import urllib3
import os
from datetime import datetime
import re

# SSL 경고 무시
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class DhammaPDF(FPDF):
    """한글 지원 PDF 클래스"""

    def __init__(self):
        super().__init__()
        # 한글 폰트 설정 (시스템 폰트 사용)
        # Mac: /System/Library/Fonts/AppleSDGothicNeo.ttc
        # Windows: C:/Windows/Fonts/malgun.ttf
        try:
            self.add_font('NanumGothic', '', '/System/Library/Fonts/AppleSDGothicNeo.ttc', uni=True)
            self.font_available = True
        except:
            print("⚠️  한글 폰트를 찾을 수 없습니다. 기본 폰트를 사용합니다.")
            self.font_available = False

    def header(self):
        if self.font_available:
            self.set_font('NanumGothic', '', 12)
        self.cell(0, 10, 'Dhamma.kr', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        if self.font_available:
            self.set_font('NanumGothic', '', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def get_all_post_links(base_url):
    """모든 글의 링크 수집"""
    print("📡 글 목록 수집 중...")

    post_links = []
    page = 1
    max_pages = 3368  # 실제 사이트에 3,368 페이지 존재

    while page <= max_pages:
        url = f"{base_url}?paged={page}" if page > 1 else base_url
        print(f"   페이지 {page}/{max_pages} 확인 중...")

        try:
            response = requests.get(url, verify=False, timeout=10)
            if response.status_code != 200:
                print(f"   ⚠️  페이지 {page} 접근 실패 (status: {response.status_code})")
                break

            soup = BeautifulSoup(response.content, 'html.parser')

            # dhamma.kr 전용: <div class="post"> 안의 <a class="title"> 찾기
            posts = soup.find_all('div', class_='post')

            if not posts:
                print(f"   ⚠️  페이지 {page}에서 글을 찾을 수 없습니다.")
                break

            found_count = 0
            for post in posts:
                title_link = post.find('a', class_='title')
                if title_link and title_link.get('href'):
                    href = title_link['href']
                    if href not in post_links:
                        post_links.append(href)
                        found_count += 1

            print(f"   ✅ {found_count}개 글 발견 (누적: {len(post_links)}개)")

            page += 1

            # 서버 부하 방지 (페이지 수집 간 딜레이)
            import time
            time.sleep(0.5)

        except Exception as e:
            print(f"   ⚠️  페이지 {page} 오류: {e}")
            # 에러가 발생해도 다음 페이지 시도
            page += 1
            continue

    print(f"\n✅ 총 {len(post_links)}개의 글을 찾았습니다.")
    return post_links

def scrape_post_content(url):
    """개별 글 내용 크롤링"""
    try:
        response = requests.get(url, verify=False, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')

        # 제목 찾기 (dhamma.kr은 단순히 <h2> 사용)
        title = soup.find('h2')
        title_text = title.get_text(strip=True) if title else "제목 없음"

        # 내용 찾기 (post div 안의 모든 p 태그)
        post_div = soup.find('div', class_='post')
        if post_div:
            paragraphs = post_div.find_all('p')
            # 첫번째와 마지막 p 태그는 제외 (제목과 관련 글 링크)
            content_paragraphs = paragraphs[1:-1] if len(paragraphs) > 2 else paragraphs
            content_text = '\n\n'.join([p.get_text(strip=True) for p in content_paragraphs if p.get_text(strip=True)])
        else:
            content_text = ""

        # 날짜 찾기
        date_span = soup.find('span', class_='date')
        date_text = date_span.get_text(strip=True) if date_span else ""

        return {
            'title': title_text,
            'content': content_text,
            'date': date_text,
            'url': url
        }

    except Exception as e:
        print(f"⚠️  크롤링 오류 ({url}): {e}")
        return None

def create_pdf(post_data, output_dir):
    """글을 PDF로 저장"""
    if not post_data:
        return False

    try:
        pdf = DhammaPDF()
        pdf.add_page()

        if pdf.font_available:
            pdf.set_font('NanumGothic', '', 16)

        # 제목
        pdf.multi_cell(0, 10, post_data['title'])
        pdf.ln(5)

        # 날짜
        if post_data['date']:
            if pdf.font_available:
                pdf.set_font('NanumGothic', '', 10)
            pdf.cell(0, 10, post_data['date'], 0, 1)
            pdf.ln(5)

        # 내용
        if pdf.font_available:
            pdf.set_font('NanumGothic', '', 12)

        # 긴 텍스트를 여러 줄로 나누기
        for paragraph in post_data['content'].split('\n'):
            if paragraph.strip():
                pdf.multi_cell(0, 8, paragraph)
                pdf.ln(2)

        # 파일명 생성 (특수문자 제거)
        safe_title = re.sub(r'[^\w\s-]', '', post_data['title'])[:50]
        filename = f"{safe_title}.pdf"
        filepath = os.path.join(output_dir, filename)

        pdf.output(filepath)
        return True

    except Exception as e:
        print(f"⚠️  PDF 생성 오류: {e}")
        return False

def main():
    base_url = "http://www.dhamma.kr/wp/"
    output_dir = "/Users/jinseulpark/Desktop/github/jsks_app/scraper/pdfs"

    # 출력 디렉토리 생성
    os.makedirs(output_dir, exist_ok=True)

    print("🚀 Dhamma.kr 크롤링 시작\n")

    # 1. 모든 글 링크 수집
    post_links = get_all_post_links(base_url)

    if not post_links:
        print("❌ 글을 찾을 수 없습니다.")
        return

    # 2. 각 글 크롤링 및 PDF 생성
    print(f"\n📄 PDF 생성 시작...\n")

    success_count = 0
    for i, link in enumerate(post_links, 1):
        print(f"[{i}/{len(post_links)}] {link}")

        post_data = scrape_post_content(link)
        if post_data and create_pdf(post_data, output_dir):
            success_count += 1
            print(f"   ✅ PDF 저장 완료: {post_data['title'][:30]}...")
        else:
            print(f"   ❌ 실패")

        # 서버 부하 방지
        import time
        time.sleep(1)

    print(f"\n✨ 완료! {success_count}/{len(post_links)}개의 PDF 생성됨")
    print(f"📁 저장 위치: {output_dir}")

if __name__ == "__main__":
    main()
