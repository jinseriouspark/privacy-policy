-- practice_items 테이블 수정
-- 먼저 이 SQL을 실행하여 테이블 구조를 확인하고 수정하세요

-- 1단계: 테이블 구조 확인
-- SELECT column_name, column_default, is_nullable, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'practice_items';

-- 2단계: id 컬럼에 UUID 자동 생성 설정 (만약 없다면)
ALTER TABLE practice_items
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3단계: 이제 practice_items_update.sql 파일을 실행하세요
