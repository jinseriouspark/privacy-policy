import { supabase } from './supabase/client';

// Notion OAuth Configuration
const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID || '';
const NOTION_REDIRECT_URI = `${window.location.origin}/notion-callback`;

// ⚠️ Client Secret은 서버에서만 사용 (api/notion-oauth.ts)

/**
 * Step 1: Redirect user to Notion OAuth page
 */
export function initiateNotionOAuth(instructorId: string) {
  // Store instructor ID in session storage to retrieve after callback
  sessionStorage.setItem('notion_oauth_instructor_id', instructorId);

  const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
  authUrl.searchParams.append('client_id', NOTION_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('owner', 'user');
  authUrl.searchParams.append('redirect_uri', NOTION_REDIRECT_URI);

  // Redirect to Notion OAuth page
  window.location.href = authUrl.toString();
}

/**
 * Step 2: Exchange authorization code for access token
 * ⚠️ 보안: 서버리스 함수 사용 (Client Secret 노출 방지)
 */
export async function handleNotionCallback(code: string) {
  try {
    const instructorId = sessionStorage.getItem('notion_oauth_instructor_id');
    if (!instructorId) {
      throw new Error('Instructor ID not found in session');
    }

    // 서버리스 함수로 토큰 교환 (Client Secret 보호)
    const response = await fetch('/api/notion-oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        userId: instructorId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to exchange authorization code');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Token exchange failed');
    }

    // 토큰은 이미 서버에서 저장되었음
    // Supabase에서 access_token을 가져와서 데이터베이스 생성
    const { data: settings } = await supabase
      .from('settings')
      .select('notion_access_token')
      .eq('instructor_id', instructorId)
      .single();

    if (!settings?.notion_access_token) {
      throw new Error('Failed to retrieve Notion access token');
    }

    const accessToken = settings.notion_access_token;

    // Create Base and Advanced databases automatically
    let baseDatabaseId = '';
    let advancedDatabaseId = '';

    try {
      // Create Base database (상담 기록)
      const baseDb = await createNotionBaseDatabase(accessToken);
      baseDatabaseId = baseDb.id;

      // Create Advanced database (수업 노트 with AI)
      const advancedDb = await createNotionLessonDatabase(accessToken);
      advancedDatabaseId = advancedDb.id;
    } catch (dbError) {
      console.error('Failed to create Notion databases:', dbError);
      // Continue even if database creation fails
    }

    // Save the Advanced database ID as the primary one
    if (advancedDatabaseId) {
      const { saveNotionDatabaseId } = await import('./supabase/database');
      await saveNotionDatabaseId(instructorId, advancedDatabaseId);
    }

    // Clear session storage
    sessionStorage.removeItem('notion_oauth_instructor_id');

    return {
      success: true,
      workspace_name: data.workspace_name,
      baseDatabaseId,
      advancedDatabaseId,
    };
  } catch (error: any) {
    console.error('Notion OAuth callback error:', error);
    throw error;
  }
}

/**
 * Get list of databases accessible to the integration
 */
export async function getNotionDatabases(accessToken: string) {
  try {
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch Notion databases');
    }

    const data = await response.json();

    return data.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || 'Untitled',
      icon: db.icon,
      created_time: db.created_time,
      last_edited_time: db.last_edited_time,
    }));
  } catch (error: any) {
    console.error('Get Notion databases error:', error);
    throw error;
  }
}

/**
 * Create a new Base database for consultation records
 */
export async function createNotionBaseDatabase(accessToken: string, parentPageId?: string) {
  try {
    const response = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: parentPageId
          ? { type: 'page_id', page_id: parentPageId }
          : { type: 'workspace', workspace: true },
        title: [
          {
            type: 'text',
            text: { content: '상담 기록 - Base (예약매니아)' },
          },
        ],
        icon: {
          type: 'emoji',
          emoji: '💬',
        },
        properties: {
          '제목': { title: {} },
          '학생 이름': {
            rich_text: {}
          },
          '날짜': {
            date: {}
          },
          '내용': {
            rich_text: {}
          },
          '태그': {
            multi_select: {
              options: [
                { name: '상담', color: 'blue' },
                { name: '피드백', color: 'green' },
                { name: '수업 계획', color: 'purple' },
                { name: '목표 설정', color: 'pink' },
                { name: '진도 체크', color: 'orange' },
                { name: '부상/통증', color: 'red' },
              ],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Base database');
    }

    const data = await response.json();

    return {
      id: data.id,
      url: data.url,
    };
  } catch (error: any) {
    console.error('Create Base database error:', error);
    throw error;
  }
}

/**
 * Create a new Advanced database for lesson notes (with AI analysis)
 */
export async function createNotionLessonDatabase(accessToken: string, parentPageId?: string) {
  try {
    const response = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: parentPageId
          ? { type: 'page_id', page_id: parentPageId }
          : { type: 'workspace', workspace: true },
        title: [
          {
            type: 'text',
            text: { content: '수업 노트 - Advanced (예약매니아)' },
          },
        ],
        icon: {
          type: 'emoji',
          emoji: '📝',
        },
        properties: {
          '제목': { title: {} },
          '학생 이름': {
            rich_text: {}
          },
          '날짜': {
            date: {}
          },
          '코치 업종': {
            select: {
              options: [
                { name: '필라테스', color: 'purple' },
                { name: '요가', color: 'pink' },
                { name: '피트니스', color: 'orange' },
                { name: '음악', color: 'blue' },
                { name: '언어', color: 'green' },
                { name: '미술', color: 'yellow' },
                { name: '댄스', color: 'red' },
                { name: '기타', color: 'gray' },
              ],
            },
          },
          '수업 내용': {
            rich_text: {}
          },
          '학생 상태/목표': {
            rich_text: {}
          },
          '주요 피드백': {
            rich_text: {}
          },
          '숙제': {
            rich_text: {}
          },
          '다음 계획': {
            rich_text: {}
          },
          '출석 상태': {
            select: {
              options: [
                { name: '출석', color: 'green' },
                { name: '결석', color: 'red' },
                { name: '지각', color: 'yellow' },
              ],
            },
          },
          '녹화 링크': {
            url: {}
          },
          '녹화 텍스트': {
            rich_text: {}
          },
          'AI 분석': {
            rich_text: {}
          },
          '진전도': {
            select: {
              options: [
                { name: '매우 우수', color: 'green' },
                { name: '우수', color: 'blue' },
                { name: '보통', color: 'yellow' },
                { name: '개선 필요', color: 'orange' },
                { name: '많은 개선 필요', color: 'red' },
              ],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Advanced database');
    }

    const data = await response.json();

    return {
      id: data.id,
      url: data.url,
    };
  } catch (error: any) {
    console.error('Create Advanced database error:', error);
    throw error;
  }
}

/**
 * Create a consultation memo page in Base Notion database
 */
export async function createConsultationPage(params: {
  accessToken: string;
  databaseId: string;
  studentName: string;
  date: string;
  content: string;
  tags: string[];
}) {
  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: {
          database_id: params.databaseId,
        },
        icon: {
          type: 'emoji',
          emoji: '💬',
        },
        properties: {
          '제목': {
            title: [
              {
                text: {
                  content: `${params.studentName} - ${params.date}`,
                },
              },
            ],
          },
          '학생 이름': {
            rich_text: [
              {
                text: { content: params.studentName },
              },
            ],
          },
          '날짜': {
            date: {
              start: params.date,
            },
          },
          '내용': {
            rich_text: [
              {
                text: { content: params.content },
              },
            ],
          },
          '태그': {
            multi_select: params.tags.map(tag => ({ name: tag })),
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create consultation page');
    }

    const data = await response.json();

    return {
      id: data.id,
      url: data.url,
    };
  } catch (error: any) {
    console.error('Create consultation page error:', error);
    throw error;
  }
}

/**
 * Generate industry-specific AI analysis prompt
 */
export function getIndustryPrompt(industry: string, lessonContent: string, studentName: string): string {
  const basePrompt = `다음은 ${studentName} 학생의 수업 내용입니다.\n\n수업 내용:\n${lessonContent}\n\n`;

  const industryPrompts: Record<string, string> = {
    '필라테스': basePrompt + `
필라테스 강사 관점에서 다음 항목을 분석해주세요:
1. **자세 및 동작 분석**: 학생의 주요 자세, 정렬, 근육 활성화 패턴
2. **호흡 패턴**: 호흡과 움직임의 조화도
3. **코어 안정성**: 코어 근육 참여도 및 안정성
4. **신체 인식**: 학생의 신체 자각 능력 수준
5. **개선 필요 부위**: 집중 훈련이 필요한 근육군이나 동작
6. **진전도 평가**: 이전 대비 발전 사항
7. **맞춤 운동 제안**: 다음 세션을 위한 구체적 운동 및 큐잉
8. **부상 위험도**: 잠재적 부상 위험 요인 및 예방법`,

    '요가': basePrompt + `
요가 강사 관점에서 다음 항목을 분석해주세요:
1. **아사나 수행도**: 주요 자세(아사나) 수행 능력
2. **유연성 및 균형**: 현재 유연성과 균형 능력 평가
3. **프라나야마**: 호흡 조절 능력
4. **마음챙김**: 수업 중 집중력과 마음챙김 상태
5. **신체 제한사항**: 현재 신체적 제약이나 주의사항
6. **에너지 수준**: 수업 전후 에너지 변화
7. **추천 시퀀스**: 다음 수업을 위한 맞춤 시퀀스
8. **정신적 성장**: 요가 철학 이해도 및 성장`,

    '피트니스': basePrompt + `
피트니스 트레이너 관점에서 다음 항목을 분석해주세요:
1. **운동 수행 능력**: 각 운동의 정확한 폼과 수행도
2. **체력 수준**: 근력, 지구력, 심폐 능력 평가
3. **진척도**: 중량, 반복 횟수, 세트 수 등의 발전
4. **회복력**: 세트 간 회복 속도 및 피로도
5. **목표 달성도**: 설정한 피트니스 목표 대비 진행 상황
6. **영양 및 생활습관**: 운동 외 요인 평가 (필요 시)
7. **다음 단계**: 점진적 과부하 원칙에 따른 다음 운동 계획
8. **부상 예방**: 과훈련 징후 및 예방 조치`,

    '음악': basePrompt + `
음악 강사 관점에서 다음 항목을 분석해주세요:
1. **연주/노래 기술**: 기본 테크닉 및 숙련도
2. **리듬감**: 박자 정확도 및 리듬 이해도
3. **음정**: 음정 정확도 (해당 시)
4. **음악성**: 표현력, 다이내믹, 프레이징
5. **연습 태도**: 집중력, 자발성, 연습 효율성
6. **이론 이해**: 음악 이론 습득 수준
7. **레퍼토리 진도**: 현재 곡 완성도 및 다음 곡 제안
8. **연습 과제**: 다음 레슨까지의 구체적 연습 방법`,

    '언어': basePrompt + `
언어 강사 관점에서 다음 항목을 분석해주세요:
1. **발음 및 억양**: 정확한 발음과 자연스러운 억양
2. **어휘력**: 사용 어휘 수준 및 다양성
3. **문법**: 문법 정확도 및 복잡한 구조 사용 능력
4. **유창성**: 말하기/쓰기 속도 및 자연스러움
5. **듣기 이해도**: 청취력 및 이해 능력
6. **학습 전략**: 효과적인 학습 방법 사용 여부
7. **자신감**: 언어 사용 시 자신감 수준
8. **맞춤 학습 계획**: 약점 보완 및 강점 강화 방안`,

    '미술': basePrompt + `
미술 강사 관점에서 다음 항목을 분석해주세요:
1. **기술적 완성도**: 선, 형태, 명암, 색채 등 기본 기술
2. **구도 및 공간감**: 화면 구성 능력
3. **창의성**: 독창적 표현 및 아이디어
4. **재료 활용**: 도구 및 재료 사용 숙련도
5. **관찰력**: 대상 관찰 및 표현 능력
6. **예술적 성장**: 개인 스타일 발전 및 예술적 이해
7. **집중력**: 작업 몰입도 및 인내심
8. **다음 프로젝트**: 기술 향상을 위한 다음 과제 제안`,

    '댄스': basePrompt + `
댄스 강사 관점에서 다음 항목을 분석해주세요:
1. **동작 정확도**: 안무 및 동작 정확성
2. **리듬 및 음악성**: 음악과의 조화, 타이밍
3. **신체 컨트롤**: 신체 조절 능력 및 균형
4. **표현력**: 감정 표현 및 무대 매너
5. **유연성 및 체력**: 신체적 능력 수준
6. **안무 암기**: 루틴 기억 및 실행 능력
7. **개선 부분**: 집중 연습이 필요한 동작
8. **다음 단계**: 다음 안무 또는 기술 향상 계획`,

    '기타': basePrompt + `
전문 코치 관점에서 다음 항목을 분석해주세요:
1. **주요 학습 내용**: 오늘 다룬 핵심 내용
2. **이해도**: 학생의 개념 이해 수준
3. **실습 능력**: 실제 적용 능력
4. **참여도**: 수업 참여 태도 및 질문 수준
5. **강점**: 학생의 주요 강점
6. **개선점**: 보완이 필요한 영역
7. **진전도**: 이전 대비 발전 사항
8. **다음 계획**: 다음 수업 목표 및 준비사항`
  };

  return industryPrompts[industry] || industryPrompts['기타'];
}

/**
 * Create a lesson note page in Advanced Notion database
 */
export async function createLessonNotePage(params: {
  accessToken: string;
  databaseId: string;
  studentName: string;
  date: string;
  lessonContent: string;
  studentGoal?: string;
  feedback?: string;
  homework?: string;
  nextPlan?: string;
  attendanceStatus: 'attended' | 'absent' | 'late';
  recordingUrl?: string;
  transcriptionText?: string;
  aiAnalysis?: string;
  coachIndustry?: string;
  progressLevel?: string;
}) {
  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: {
          database_id: params.databaseId,
        },
        icon: {
          type: 'emoji',
          emoji: params.attendanceStatus === 'attended' ? '✅' :
                 params.attendanceStatus === 'late' ? '⏰' : '❌',
        },
        properties: {
          '제목': {
            title: [
              {
                text: {
                  content: `${params.studentName} - ${params.date}`,
                },
              },
            ],
          },
          '학생 이름': {
            rich_text: [
              {
                text: { content: params.studentName },
              },
            ],
          },
          '날짜': {
            date: {
              start: params.date,
            },
          },
          '코치 업종': params.coachIndustry ? {
            select: {
              name: params.coachIndustry,
            },
          } : { select: { name: '기타' } },
          '수업 내용': {
            rich_text: [
              {
                text: { content: params.lessonContent },
              },
            ],
          },
          '학생 상태/목표': params.studentGoal ? {
            rich_text: [
              {
                text: { content: params.studentGoal },
              },
            ],
          } : { rich_text: [] },
          '주요 피드백': params.feedback ? {
            rich_text: [
              {
                text: { content: params.feedback },
              },
            ],
          } : { rich_text: [] },
          '숙제': params.homework ? {
            rich_text: [
              {
                text: { content: params.homework },
              },
            ],
          } : { rich_text: [] },
          '다음 계획': params.nextPlan ? {
            rich_text: [
              {
                text: { content: params.nextPlan },
              },
            ],
          } : { rich_text: [] },
          '출석 상태': {
            select: {
              name: params.attendanceStatus === 'attended' ? '출석' :
                    params.attendanceStatus === 'late' ? '지각' : '결석',
            },
          },
          '녹화 링크': params.recordingUrl ? {
            url: params.recordingUrl,
          } : {},
          '녹화 텍스트': params.transcriptionText ? {
            rich_text: [
              {
                text: { content: params.transcriptionText.substring(0, 2000) }, // Notion limit
              },
            ],
          } : { rich_text: [] },
          'AI 분석': params.aiAnalysis ? {
            rich_text: [
              {
                text: { content: params.aiAnalysis },
              },
            ],
          } : { rich_text: [] },
          '진전도': params.progressLevel ? {
            select: {
              name: params.progressLevel,
            },
          } : {},
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Notion page');
    }

    const data = await response.json();

    return {
      id: data.id,
      url: data.url,
    };
  } catch (error: any) {
    console.error('Create Notion page error:', error);
    throw error;
  }
}

/**
 * Disconnect Notion integration
 */
export async function disconnectNotionIntegration(instructorId: string) {
  try {
    const { deleteNotionAccessToken } = await import('./supabase/database');
    await deleteNotionAccessToken(instructorId);
  } catch (error: any) {
    console.error('Disconnect Notion error:', error);
    throw error;
  }
}
