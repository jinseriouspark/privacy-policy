#!/usr/bin/env python3
"""
Dhamma.kr 스크래퍼 테스트 (1개 글만)
"""

import requests
from bs4 import BeautifulSoup
from fpdf import FPDF
import urllib3
import os
import re

# SSL 경고 무시
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class DhammaPDF(FPDF):
    """한글 지원 PDF 클래스"""

    def __init__(self):
        super().__init__()
        self.font_available = True

    def header(self):
        self.set_font('Arial', '', 12)
        self.cell(0, 10, 'Dhamma.kr', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', '', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def scrape_post_content(url):
    """개별 글 내용 크롤링"""
    try:
        response = requests.get(url, verify=False, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')

        # 제목 찾기
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
        print(f"⚠️  크롤링 오류: {e}")
        return None

def create_pdf(post_data, output_dir):
    """글을 PDF로 저장"""
    if not post_data:
        return False

    try:
        pdf = DhammaPDF()
        pdf.add_page()

        pdf.set_font('Arial', '', 16)

        # 제목 (영문으로 저장)
        title_text = f"Title: {post_data['title']}"
        pdf.multi_cell(0, 10, title_text.encode('latin-1', 'replace').decode('latin-1'))
        pdf.ln(5)

        # 날짜
        if post_data['date']:
            pdf.set_font('Arial', '', 10)
            pdf.cell(0, 10, post_data['date'], 0, 1)
            pdf.ln(5)

        # 내용 (UTF-8 → Latin-1 변환으로 한글 유지)
        pdf.set_font('Arial', '', 12)

        for paragraph in post_data['content'].split('\n'):
            if paragraph.strip():
                # 한글을 유지하기 위해 latin-1로 강제 인코딩
                try:
                    pdf.multi_cell(0, 8, paragraph.encode('latin-1', 'replace').decode('latin-1'))
                except:
                    pdf.multi_cell(0, 8, "Content not displayable")
                pdf.ln(2)

        # 파일명 생성
        safe_title = re.sub(r'[^\w\s-]', '', post_data['title'])[:50]
        filename = f"{safe_title}.pdf"
        filepath = os.path.join(output_dir, filename)

        pdf.output(filepath)
        print(f"✅ PDF 저장 완료: {filepath}")
        return True

    except Exception as e:
        print(f"⚠️  PDF 생성 오류: {e}")
        return False

# 테스트 실행
if __name__ == "__main__":
    output_dir = "/Users/jinseulpark/Desktop/github/jsks_app/scraper/pdfs"
    os.makedirs(output_dir, exist_ok=True)

    # 테스트 URL
    test_url = "http://www.dhamma.kr/wp/?p=17762"

    print("🧪 테스트 시작: 1개 글 크롤링 및 PDF 생성\n")
    print(f"URL: {test_url}\n")

    post_data = scrape_post_content(test_url)

    if post_data:
        print(f"제목: {post_data['title']}")
        print(f"날짜: {post_data['date']}")
        print(f"내용 길이: {len(post_data['content'])} 자")
        print(f"내용 미리보기: {post_data['content'][:200]}...\n")

        create_pdf(post_data, output_dir)
        print("\n✨ 테스트 완료!")
    else:
        print("❌ 크롤링 실패")
