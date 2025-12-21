#!/usr/bin/env python3
"""
Dhamma.kr 웹 스크래퍼 - WeasyPrint로 예쁜 PDF 생성
"""

import requests
from bs4 import BeautifulSoup
from weasyprint import HTML, CSS
import urllib3
import os
import re

# SSL 경고 무시
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 한글 폰트 경로
FONT_PATH = "/Users/jinseulpark/Desktop/github/jsks_app/scraper/fonts/NanumGothic.ttf"

def scrape_post_content(url):
    """개별 글 내용 크롤링"""
    try:
        response = requests.get(url, verify=False, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')

        # 제목 찾기
        title = soup.find('h2')
        title_text = title.get_text(strip=True) if title else "제목 없음"

        # 내용 찾기
        post_div = soup.find('div', class_='post')
        if post_div:
            paragraphs = post_div.find_all('p')
            content_paragraphs = paragraphs[1:-1] if len(paragraphs) > 2 else paragraphs
            # HTML 태그 유지하면서 추출
            content_html = '\n'.join([f'<p>{p.decode_contents()}</p>' for p in content_paragraphs if p.get_text(strip=True)])
        else:
            content_html = ""

        # 날짜 찾기
        date_span = soup.find('span', class_='date')
        date_text = date_span.get_text(strip=True) if date_span else ""

        return {
            'title': title_text,
            'content_html': content_html,
            'date': date_text,
            'url': url
        }

    except Exception as e:
        print(f"⚠️  크롤링 오류: {e}")
        return None

def create_beautiful_pdf(post_data, output_dir):
    """WeasyPrint로 예쁜 PDF 생성"""
    if not post_data:
        return False

    try:
        # HTML 템플릿 생성
        html_content = f"""
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>{post_data['title']}</title>
    <style>
        @font-face {{
            font-family: 'NanumGothic';
            src: url('file://{FONT_PATH}');
        }}

        body {{
            font-family: 'NanumGothic', serif;
            font-size: 12pt;
            line-height: 1.8;
            color: #333;
            margin: 2cm;
            max-width: 800px;
        }}

        h1 {{
            font-size: 24pt;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }}

        .meta {{
            font-size: 10pt;
            color: #7f8c8d;
            margin-bottom: 30px;
            padding: 10px;
            background-color: #ecf0f1;
            border-left: 4px solid #3498db;
        }}

        .content {{
            text-align: justify;
            word-break: keep-all;
        }}

        .content p {{
            margin-bottom: 1em;
            text-indent: 1em;
        }}

        .footer {{
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            font-size: 9pt;
            color: #95a5a6;
            text-align: center;
        }}

        @page {{
            size: A4;
            margin: 2cm;

            @bottom-right {{
                content: counter(page) " / " counter(pages);
                font-family: 'NanumGothic';
                font-size: 9pt;
                color: #7f8c8d;
            }}
        }}
    </style>
</head>
<body>
    <h1>{post_data['title']}</h1>

    <div class="meta">
        <strong>날짜:</strong> {post_data['date']}<br>
        <strong>출처:</strong> <a href="{post_data['url']}">{post_data['url']}</a>
    </div>

    <div class="content">
        {post_data['content_html']}
    </div>

    <div class="footer">
        본 문서는 dhamma.kr에서 수집한 내용입니다.
    </div>
</body>
</html>
"""

        # 파일명 생성
        safe_title = re.sub(r'[^\w\s-]', '', post_data['title'])[:50]
        filename = f"{safe_title}.pdf"
        filepath = os.path.join(output_dir, filename)

        # PDF 생성
        HTML(string=html_content).write_pdf(filepath)

        print(f"✅ PDF 저장 완료: {filepath}")
        return True

    except Exception as e:
        print(f"⚠️  PDF 생성 오류: {e}")
        import traceback
        traceback.print_exc()
        return False

# 테스트 실행
if __name__ == "__main__":
    output_dir = "/Users/jinseulpark/Desktop/github/jsks_app/scraper/pdfs"
    os.makedirs(output_dir, exist_ok=True)

    # 테스트 URL
    test_url = "http://www.dhamma.kr/wp/?p=17762"

    print("🧪 테스트 시작: WeasyPrint로 예쁜 PDF 생성\n")
    print(f"URL: {test_url}\n")

    post_data = scrape_post_content(test_url)

    if post_data:
        print(f"제목: {post_data['title']}")
        print(f"날짜: {post_data['date']}")
        print(f"내용 길이: {len(post_data['content_html'])} 자\n")

        create_beautiful_pdf(post_data, output_dir)
        print("\n✨ 테스트 완료!")
    else:
        print("❌ 크롤링 실패")
