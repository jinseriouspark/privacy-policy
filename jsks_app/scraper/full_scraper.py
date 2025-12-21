#!/usr/bin/env python3
"""
Dhamma.kr 전체 크롤러 - 모든 글을 예쁜 PDF로 저장
"""

import requests
from bs4 import BeautifulSoup
from weasyprint import HTML
import urllib3
import os
import re
import time

# SSL 경고 무시
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 한글 폰트 경로
FONT_PATH = "/Users/jinseulpark/Desktop/github/jsks_app/scraper/fonts/NanumGothic.ttf"

def get_all_post_links(base_url, max_pages=10):
    """모든 글의 링크 수집"""
    print("📡 글 목록 수집 중...")

    post_links = []
    page = 1

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

            # 서버 부하 방지
            time.sleep(0.5)

        except Exception as e:
            print(f"   ⚠️  페이지 {page} 오류: {e}")
            page += 1
            continue

    print(f"\n✅ 총 {len(post_links)}개의 글을 찾았습니다.")
    return post_links

def scrape_post_content(url):
    """개별 글 내용 크롤링"""
    try:
        response = requests.get(url, verify=False, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')

        # 제목
        title = soup.find('h2')
        title_text = title.get_text(strip=True) if title else "제목 없음"

        # 내용
        post_div = soup.find('div', class_='post')
        if post_div:
            paragraphs = post_div.find_all('p')
            content_paragraphs = paragraphs[1:-1] if len(paragraphs) > 2 else paragraphs
            content_html = '\n'.join([f'<p>{p.decode_contents()}</p>' for p in content_paragraphs if p.get_text(strip=True)])
        else:
            content_html = ""

        # 날짜
        date_span = soup.find('span', class_='date')
        date_text = date_span.get_text(strip=True) if date_span else ""

        return {
            'title': title_text,
            'content_html': content_html,
            'date': date_text,
            'url': url
        }

    except Exception as e:
        print(f"⚠️  크롤링 오류 ({url}): {e}")
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
        <strong>출처:</strong> {post_data['url']}
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

        return True

    except Exception as e:
        print(f"⚠️  PDF 생성 오류: {e}")
        return False

def main():
    base_url = "http://www.dhamma.kr/wp/"
    output_dir = "/Users/jinseulpark/Desktop/github/jsks_app/scraper/pdfs"

    # 출력 디렉토리 생성
    os.makedirs(output_dir, exist_ok=True)

    print("🚀 Dhamma.kr 크롤링 시작\\n")
    print("옵션을 선택하세요:")
    print("1. 테스트 (최근 10개 페이지)")
    print("2. 전체 크롤링 (3,368 페이지, 약 6시간 소요)")

    choice = input("\n선택 (1 or 2): ").strip()

    if choice == '1':
        max_pages = 10
        print(f"\n📌 테스트 모드: 최근 {max_pages}개 페이지 크롤링")
    elif choice == '2':
        max_pages = 3368
        print(f"\n📌 전체 모드: {max_pages}개 페이지 크롤링 (예상 시간: 6시간)")
        confirm = input("계속하시겠습니까? (y/n): ").strip().lower()
        if confirm != 'y':
            print("취소되었습니다.")
            return
    else:
        print("잘못된 선택입니다.")
        return

    # 1. 모든 글 링크 수집
    post_links = get_all_post_links(base_url, max_pages)

    if not post_links:
        print("❌ 글을 찾을 수 없습니다.")
        return

    # 2. 각 글 크롤링 및 PDF 생성
    print(f"\n📄 PDF 생성 시작...\\n")

    success_count = 0
    fail_count = 0

    for i, link in enumerate(post_links, 1):
        print(f"[{i}/{len(post_links)}] {link}")

        post_data = scrape_post_content(link)
        if post_data and create_beautiful_pdf(post_data, output_dir):
            success_count += 1
            print(f"   ✅ PDF 저장 완료: {post_data['title'][:30]}...")
        else:
            fail_count += 1
            print(f"   ❌ 실패")

        # 서버 부하 방지
        time.sleep(1)

        # 10개마다 진행 상황 저장
        if i % 10 == 0:
            print(f"\n📊 진행 상황: {success_count} 성공, {fail_count} 실패\n")

    print(f"\n✨ 완료! {success_count}/{len(post_links)}개의 PDF 생성됨")
    print(f"📁 저장 위치: {output_dir}")

if __name__ == "__main__":
    main()
