-- App Settings 초기 데이터
INSERT INTO app_settings (key, value) VALUES
('homeGreeting', '평안하신가요'),
('dharmaTitle', '오늘의 법문'),
('dharmaDesc', '지혜의 말씀을 듣고 마음을 밝히세요.'),
('loginTitle', '정수결사'),
('loginSubtitle', '마음을 닦는 수행의 길'),
('loadingMessage', '1초의 휴식...'),
('calendarTitle', '이번 주 수행 현황'),
('scheduleTitle', '오늘의 일정'),
('practiceCardTitle', '오늘의 수행 점검'),
('practiceCardSub', '내가 선택한 질문으로 마음 보기'),
('onboardingTitle', '어떤 수행을 하시겠어요?'),
('onboardingSubtitle', '매일 점검하고 싶은 항목을 선택해주세요'),
('practiceTitle', '오늘의 수행 점검'),
('practiceButtonComplete', '완료하기'),
('practiceButtonLater', '나중에 하기')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
