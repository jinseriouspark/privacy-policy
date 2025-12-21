-- 기존 데이터 삭제 (필요시)
-- DELETE FROM practice_items;

-- 필수 수행 항목
INSERT INTO practice_items (id, category, question, "order") VALUES
('required-1', '필수', '경전읽기', 1),
('required-2', '필수', '염불', 2)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  "order" = EXCLUDED."order";

-- 선택 수행 항목
INSERT INTO practice_items (id, category, question, "order") VALUES
('optional-1', '선택', '108배', 3),
('optional-2', '선택', '사경', 4)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  "order" = EXCLUDED."order";

-- 정견·공관
INSERT INTO practice_items (id, category, question, "order") VALUES
('1', '정견·공관', '나/사물에 대한 집착을 자각했는가?', 10),
('2', '정견·공관', '모든것이 인연따라 이루어 짐을 떠올렸는가?', 11),
('3', '정견·공관', '공을 허무가 아닌 관계로 체험했는가?', 12)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  "order" = EXCLUDED."order";

-- 보리심
INSERT INTO practice_items (id, category, question, "order") VALUES
('4', '보리심', '하루 시작 하기 전 발원을 했는가?', 20),
('5', '보리심', '힘들 때도 발원을 상기했는가?', 21),
('6', '보리심', '성과를 내 것이라 집착하지 않았는가?', 22)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  "order" = EXCLUDED."order";

-- 육바라밀
INSERT INTO practice_items (id, category, question, "order") VALUES
('7', '보시', '재물·말·지혜의 보시를 실천했는가?', 30),
('8', '지계', '타인에게 해를 끼치지 않았는가?', 31),
('9', '인욕', '분노 대신 알아차림을 유지했는가?', 32),
('10', '정진', '수행·학습·봉사를 게을리하지 않았는가?', 33),
('11', '선정', '좌선·호흡관을 실천했는가?', 34),
('12', '반야', '바라밀을 공관과 연결했는가?', 35)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  "order" = EXCLUDED."order";

-- 방편·자비
INSERT INTO practice_items (id, category, question, "order") VALUES
('13', '방편·자비', '상대의 상황에 맞춰 말했는가?', 40),
('14', '방편·자비', '옳고 그름보다 이익을 우선했는가?', 41),
('15', '방편·자비', '행위 후 집착이 남지 않았는가?', 42)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  "order" = EXCLUDED."order";

-- 두 진리
INSERT INTO practice_items (id, category, question, "order") VALUES
('16', '두 진리', '세속제에서 도덕·규범을 지켰는가?', 50),
('17', '두 진리', '승의제에서 무자성을 기억했는가?', 51),
('18', '두 진리', '두 진리를 균형 있게 적용했는가?', 52)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  "order" = EXCLUDED."order";

-- 무주열반
INSERT INTO practice_items (id, category, question, "order") VALUES
('19', '무주열반', '열반에 집착하지 않았는가?', 60),
('20', '무주열반', '득실에 매이지 않았는가?', 61),
('21', '무주열반', '머물 곳 없음의 태도를 적용했는가?', 62)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  "order" = EXCLUDED."order";

-- 자기 성찰
INSERT INTO practice_items (id, category, question, "order") VALUES
('22', '자기 성찰', '집착 패턴을 기록했는가?', 70),
('23', '자기 성찰', '마음비움과 자비가 서로를 보완했는가?', 71)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  "order" = EXCLUDED."order";
