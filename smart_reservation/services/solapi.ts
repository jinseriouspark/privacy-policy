/**
 * Solapi (구 Coolsms) API Integration
 *
 * 비즈니스 카카오톡 알림톡/친구톡 및 SMS 전송 기능
 *
 * 각 강사가 자신의 Solapi API 키를 DB에 암호화 저장하고 사용
 * Supabase Vault를 통해 안전하게 관리
 */

import { getSolapiSettings, SolapiSettings } from '../lib/supabase/database';

interface SendKakaoParams {
  to: string; // 수신자 전화번호 (01012345678)
  templateId: string; // 카카오 템플릿 ID
  variables?: Record<string, string>; // 템플릿 변수
  buttons?: Array<{
    type: 'WL' | 'AL' | 'BK' | 'MD';
    name: string;
    url?: string;
  }>;
}

interface SendSmsParams {
  to: string;
  message: string;
}

class SolapiService {
  private baseUrl = 'https://api.solapi.com';

  /**
   * Get user's Solapi settings from encrypted storage
   */
  private async getUserSettings(userId: number): Promise<SolapiSettings | null> {
    try {
      return await getSolapiSettings(userId);
    } catch (error) {
      console.error('Failed to get Solapi settings:', error);
      return null;
    }
  }

  private getAuthHeaders(apiKey: string): HeadersInit {
    // Solapi uses HMAC-SHA256 for authentication
    // This is a simplified version - production should use proper HMAC signing
    return {
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${new Date().toISOString()}, salt=${Math.random()}, signature=...`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 카카오톡 알림톡 전송
   */
  async sendKakaoAlimtalk(
    userId: number,
    params: SendKakaoParams
  ): Promise<{ success: boolean; error?: string }> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.isActive) {
      return {
        success: false,
        error: 'Solapi 설정이 없습니다. 프로필에서 API 키를 등록해주세요.',
      };
    }

    if (!settings.kakaoSenderKey) {
      return {
        success: false,
        error: '카카오 발신프로필이 설정되지 않았습니다.',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages/v4/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(settings.apiKey),
        body: JSON.stringify({
          message: {
            to: params.to,
            from: settings.senderPhone,
            kakaoOptions: {
              pfId: settings.kakaoSenderKey,
              templateId: params.templateId,
              variables: params.variables,
              buttons: params.buttons,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Solapi API error: ${response.status}`);
      }

      const result = await response.json();
      return { success: true };
    } catch (error) {
      console.error('Kakao send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * SMS 전송 (카카오 전송 실패 시 대체 수단)
   */
  async sendSms(
    userId: number,
    params: SendSmsParams
  ): Promise<{ success: boolean; error?: string }> {
    const settings = await this.getUserSettings(userId);

    if (!settings || !settings.isActive) {
      return {
        success: false,
        error: 'Solapi 설정이 없습니다. 프로필에서 API 키를 등록해주세요.',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages/v4/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(settings.apiKey),
        body: JSON.stringify({
          message: {
            to: params.to,
            from: settings.senderPhone,
            text: params.message,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Solapi API error: ${response.status}`);
      }

      const result = await response.json();
      return { success: true };
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 예약 링크 카카오톡 전송
   * 템플릿 예시: "안녕하세요 #{이름}님! 예약은 아래 링크에서 가능합니다."
   */
  async sendBookingLinkKakao(
    userId: number,
    params: {
      studentName: string;
      studentPhone: string;
      bookingUrl: string;
      coachingName: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const settings = await this.getUserSettings(userId);
    const templateId = settings?.templateId || 'booking_link_v1';

    return this.sendKakaoAlimtalk(userId, {
      to: params.studentPhone,
      templateId: templateId,
      variables: {
        이름: params.studentName,
        코칭명: params.coachingName,
      },
      buttons: [
        {
          type: 'WL',
          name: '예약하기',
          url: params.bookingUrl,
        },
      ],
    });
  }
}

// Singleton instance
export const solapiService = new SolapiService();

// Helper function for React components
export async function sendBookingLinkToStudent(
  userId: number,
  params: {
    studentName: string;
    studentPhone: string;
    bookingUrl: string;
    coachingName: string;
  }
): Promise<{ success: boolean; error?: string }> {
  // Try Kakao first, fallback to SMS if failed
  const kakaoResult = await solapiService.sendBookingLinkKakao(userId, params);

  if (kakaoResult.success) {
    return { success: true };
  }

  // Fallback to SMS
  const smsMessage = `안녕하세요 ${params.studentName}님! ${params.coachingName} 예약은 아래 링크에서 가능합니다.\n\n${params.bookingUrl}`;

  return solapiService.sendSms(userId, {
    to: params.studentPhone,
    message: smsMessage,
  });
}
