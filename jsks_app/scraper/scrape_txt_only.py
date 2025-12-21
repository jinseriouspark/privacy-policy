#!/usr/bin/env python3
"""
Dhamma.kr 텍스트 전용 크롤러 - 모든 글을 TXT로 빠르게 저장
"""

import requests
from bs4 import BeautifulSoup
import urllib3
import os
import re
import time

# SSL 경고 무시
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def get_all_post_links(base_url, max_pages=3368):
    """모든 글의 링크 수집"""
    print("📡 글 목록 수집 중...")

    post_links = []
    page = 1

    while page <= max_pages:
        url = f"{base_url}?paged={page}" if page > 1 else base_url
        print(f"   페이지 {page}/{max_pages} 확인 중...", end='\r')

        try:
            response = requests.get(url, verify=False, timeout=10)
            if response.status_code != 200:
                print(f"\n   ⚠️  페이지 {page} 접근 실패")
                break

            soup = BeautifulSoup(response.content, 'html.parser')
            posts = soup.find_all('div', class_='post')

            if not posts:
                print(f"\n   ⚠️  페이지 {page}에서 글을 찾을 수 없습니다.")
                break

            for post in posts:
                title_link = post.find('a', class_='title')
                if title_link and title_link.get('href'):
                    href = title_link['href']
                    if href not in post_links:
                        post_links.append(href)

            page += 1
            time.sleep(0.3)  # PDF보다 빠르게

        except Exception as e:
            print(f"\n   ⚠️  페이지 {page} 오류: {e}")
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
            content_text = '\n\n'.join([p.get_text(strip=True) for p in content_paragraphs if p.get_text(strip=True)])
        else:
            content_text = ""

        # 날짜
        date_span = soup.find('span', class_='date')
        date_text = date_span.get_text(strip=True) if date_span else ""

        return {
            'title': title_text,
            'content': content_text,
            'date': date_text,
            'url': url
        }

    except Exception as e:
        return None

def save_as_text(post_data, output_dir):
    """텍스트 파일로 저장"""
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

        return True

    except Exception as e:
        return False

def main():
    base_url = "http://www.dhamma.kr/wp/"
    output_dir = "/Users/jinseulpark/Desktop/github/jsks_app/scraper/texts"

    os.makedirs(output_dir, exist_ok=True)

    print("🚀 Dhamma.kr 텍스트 전용 크롤링 시작\n")
    print("📌 3,368 페이지 전체 크롤링 (예상 시간: 1-2시간)\n")

    # 1. 모든 글 링크 수집
    post_links = get_all_post_links(base_url)

    if not post_links:
        print("❌ 글을 찾을 수 없습니다.")
        return

    # 2. 각 글 크롤링 및 TXT 생성
    print(f"\n📄 텍스트 파일 생성 시작...\n")

    success_count = 0
    fail_count = 0

    for i, link in enumerate(post_links, 1):
        post_data = scrape_post_content(link)
        if post_data and save_as_text(post_data, output_dir):
            success_count += 1
            print(f"[{i}/{len(post_links)}] ✅ {post_data['title'][:40]}...", end='\r')
        else:
            fail_count += 1

        # 빠른 크롤링
        time.sleep(0.5)

        # 100개마다 진행 상황 출력
        if i % 100 == 0:
            print(f"\n📊 진행 상황: {success_count} 성공, {fail_count} 실패")

    print(f"\n\n✨ 완료! {success_count}/{len(post_links)}개의 텍스트 파일 생성됨")
    print(f"📁 저장 위치: {output_dir}")

if __name__ == "__main__":
    main()
