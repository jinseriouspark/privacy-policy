#!/usr/bin/env python3
"""
Dhamma.kr 스크래퍼 간단 테스트 (텍스트 파일로 저장)
"""

import requests
from bs4 import BeautifulSoup
import urllib3
import os
import re

# SSL 경고 무시
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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

def save_as_text(post_data, output_dir):
    """글을 텍스트 파일로 저장"""
    if not post_data:
        return False

    try:
        # 파일명 생성
        safe_title = re.sub(r'[^\w\s-]', '', post_data['title'])[:50]
        filename = f"{safe_title}.txt"
        filepath = os.path.join(output_dir, filename)

        # 텍스트 파일 작성
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"제목: {post_data['title']}\n")
            f.write(f"날짜: {post_data['date']}\n")
            f.write(f"URL: {post_data['url']}\n")
            f.write("\n" + "="*80 + "\n\n")
            f.write(post_data['content'])

        print(f"✅ 텍스트 저장 완료: {filepath}")
        return True

    except Exception as e:
        print(f"⚠️  파일 저장 오류: {e}")
        return False

# 테스트 실행
if __name__ == "__main__":
    output_dir = "/Users/jinseulpark/Desktop/github/jsks_app/scraper/texts"
    os.makedirs(output_dir, exist_ok=True)

    # 테스트 URL
    test_url = "http://www.dhamma.kr/wp/?p=17762"

    print("🧪 테스트 시작: 1개 글 크롤링 및 텍스트 저장\n")
    print(f"URL: {test_url}\n")

    post_data = scrape_post_content(test_url)

    if post_data:
        print(f"제목: {post_data['title']}")
        print(f"날짜: {post_data['date']}")
        print(f"내용 길이: {len(post_data['content'])} 자")
        print(f"\n내용 미리보기:\n{post_data['content'][:300]}...\n")

        save_as_text(post_data, output_dir)
        print("\n✨ 테스트 완료!")
    else:
        print("❌ 크롤링 실패")
