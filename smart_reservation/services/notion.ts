/**
 * Notion API Integration
 *
 * 강사가 각 학생과의 상담 메모를 Notion Database에 저장
 * Internal Integration 방식 사용 (수동 설정 필요)
 */

import { getNotionSettings, NotionSettings } from '../lib/supabase/database';

interface CreateMemoParams {
  studentName: string;
  studentId: string;
  content: string;
  tags?: string[];
  date?: string; // ISO 8601 format
}

interface NotionPage {
  id: string;
  url: string;
  properties: any;
}

class NotionService {
  private baseUrl = 'https://api.notion.com/v1';

  /**
   * Get user's Notion settings from encrypted storage
   */
  private async getUserSettings(userId: number): Promise<NotionSettings | null> {
    try {
      return await getNotionSettings(userId);
    } catch (error) {
      console.error('Failed to get Notion settings:', error);
      return null;
    }
  }

  /**
   * Notion API 요청 헤더
   */
  private getHeaders(token: string): HeadersInit {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28', // Notion API version
    };
  }

  /**
   * Database 연동 테스트
   */
  async testConnection(userId: number): Promise<{ success: boolean; error?: string }> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.isActive) {
      return {
        success: false,
        error: 'Notion 설정이 없습니다. Integration Token과 Database ID를 입력해주세요.',
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/databases/${settings.databaseId}`,
        {
          method: 'GET',
          headers: this.getHeaders(settings.integrationToken),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const database = await response.json();
      console.log('[Notion] Connection test successful:', database.title);

      return { success: true };
    } catch (error) {
      console.error('[Notion] Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 상담 메모를 Notion Database에 페이지로 생성
   */
  async createConsultationMemo(
    userId: number,
    params: CreateMemoParams
  ): Promise<{ success: boolean; pageId?: string; pageUrl?: string; error?: string }> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.isActive) {
      return {
        success: false,
        error: 'Notion 설정이 없습니다. 프로필에서 Integration을 연동해주세요.',
      };
    }

    try {
      // Notion Database 구조:
      // - 학생명 (Title)
      // - 날짜 (Date)
      // - 내용 (Rich Text)
      // - 태그 (Multi-select)
      // - 학생 ID (Text) - 내부 참조용

      const properties: any = {
        // Title property (학생명)
        '학생명': {
          title: [
            {
              text: {
                content: params.studentName,
              },
            },
          ],
        },
        // Date property
        '날짜': {
          date: {
            start: params.date || new Date().toISOString().split('T')[0],
          },
        },
        // Text property (학생 ID)
        '학생 ID': {
          rich_text: [
            {
              text: {
                content: params.studentId,
              },
            },
          ],
        },
      };

      // Tags (optional)
      if (params.tags && params.tags.length > 0) {
        properties['태그'] = {
          multi_select: params.tags.map(tag => ({ name: tag })),
        };
      }

      // Create page
      const response = await fetch(`${this.baseUrl}/pages`, {
        method: 'POST',
        headers: this.getHeaders(settings.integrationToken),
        body: JSON.stringify({
          parent: {
            database_id: settings.databaseId,
          },
          properties,
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: params.content,
                    },
                  },
                ],
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Notion] Create page error:', error);
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const page: NotionPage = await response.json();
      console.log('[Notion] Page created:', page.id);

      return {
        success: true,
        pageId: page.id,
        pageUrl: page.url,
      };
    } catch (error) {
      console.error('[Notion] Failed to create memo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 특정 학생의 모든 메모 조회
   */
  async getStudentMemos(
    userId: number,
    studentId: string
  ): Promise<{ success: boolean; memos?: any[]; error?: string }> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.isActive) {
      return {
        success: false,
        error: 'Notion 설정이 없습니다.',
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/databases/${settings.databaseId}/query`,
        {
          method: 'POST',
          headers: this.getHeaders(settings.integrationToken),
          body: JSON.stringify({
            filter: {
              property: '학생 ID',
              rich_text: {
                equals: studentId,
              },
            },
            sorts: [
              {
                property: '날짜',
                direction: 'descending',
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        memos: result.results,
      };
    } catch (error) {
      console.error('[Notion] Failed to get memos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance
export const notionService = new NotionService();

// Helper functions for React components
export async function createStudentMemo(
  userId: number,
  params: CreateMemoParams
): Promise<{ success: boolean; pageUrl?: string; error?: string }> {
  return notionService.createConsultationMemo(userId, params);
}

export async function testNotionConnection(
  userId: number
): Promise<{ success: boolean; error?: string }> {
  return notionService.testConnection(userId);
}

export async function getStudentMemoHistory(
  userId: number,
  studentId: string
): Promise<{ success: boolean; memos?: any[]; error?: string }> {
  return notionService.getStudentMemos(userId, studentId);
}
