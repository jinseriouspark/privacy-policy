/**
 * Email Service using Resend
 * 프로모션 코드 등 이메일 자동 발송
 */

import { Resend } from 'resend';

// Resend API Key (환경 변수에서 가져오기)
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

/**
 * 개인별 고유 프로모션 코드 생성
 */
export function generateUniquePromoCode(prefix: string = 'PROMO'): string {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${randomPart}`;
}

/**
 * 마스터마인드 멤버에게 할인 코드 이메일 발송
 */
export async function sendMastermindPromoEmail(
  recipientEmail: string,
  recipientName: string,
  promoCode: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: '예약매니아 <onboarding@yeyak-mania.co.kr>',
      to: recipientEmail,
      subject: '🎁 마스터마인드 전용 특별 할인 코드',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #334155; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #FF6B35; }
            .content { background: #F8FAFC; border-radius: 12px; padding: 30px; margin: 20px 0; }
            .promo-code { background: #FF6B35; color: white; font-size: 24px; font-weight: bold; padding: 20px; border-radius: 8px; text-align: center; letter-spacing: 2px; margin: 20px 0; }
            .benefit { background: white; border-left: 4px solid #FF6B35; padding: 15px; margin: 15px 0; }
            .cta-button { display: inline-block; background: #FF6B35; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #94A3B8; font-size: 14px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">예약매니아</div>
              <p style="color: #64748B;">AI 시대를 준비하는 강사들의 스마트 예약 시스템</p>
            </div>

            <div class="content">
              <h2 style="color: #1E293B; margin-top: 0;">안녕하세요, ${recipientName}님! 👋</h2>

              <p>마스터마인드 멤버님을 위한 <strong>특별 할인 코드</strong>를 보내드립니다.</p>

              <div class="promo-code">
                ${promoCode}
              </div>

              <div class="benefit">
                <strong style="color: #FF6B35;">💰 할인 혜택</strong><br>
                Standard 플랜 ₩19,000/월 → <strong>₩10,000/월</strong> (47% 할인!)
              </div>

              <div class="benefit">
                <strong style="color: #FF6B35;">📦 Standard 플랜 혜택</strong><br>
                • 최대 5개 코칭 클래스<br>
                • 클래스당 100명 학생 (총 500명!)<br>
                • 그룹 수업, 출석 체크, 통계 등 모든 기능<br>
                • 우선 고객 지원
              </div>

              <p style="margin-top: 30px;">
                <a href="https://yeyak-mania.co.kr" class="cta-button">
                  지금 바로 시작하기 →
                </a>
              </p>

              <p style="color: #64748B; font-size: 14px; margin-top: 20px;">
                * 이 코드는 ${recipientName}님 전용입니다.<br>
                * 1회만 사용 가능합니다.
              </p>
            </div>

            <div class="footer">
              <p>문의사항이 있으시면 언제든 답장해주세요!</p>
              <p>© 2025 예약매니아. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

/**
 * 환영 이메일 발송 (신규 가입자)
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  recipientName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: '예약매니아 <onboarding@yeyak-mania.co.kr>',
      to: recipientEmail,
      subject: `환영합니다, ${recipientName}님! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #334155; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #FF6B35; }
            .content { background: #F8FAFC; border-radius: 12px; padding: 30px; }
            .cta-button { display: inline-block; background: #FF6B35; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #94A3B8; font-size: 14px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">예약매니아</div>
            </div>

            <div class="content">
              <h2 style="color: #1E293B; margin-top: 0;">환영합니다, ${recipientName}님! 🎉</h2>

              <p>예약매니아 가입을 축하합니다!</p>

              <p>
                <strong>Free 플랜</strong>으로 시작하셔서<br>
                • 1개 코칭 클래스<br>
                • 최대 10명 학생<br>
                • 모든 기능 무료 사용
              </p>

              <p>더 많은 학생과 클래스가 필요하시면 언제든 업그레이드하세요!</p>

              <p style="margin-top: 30px;">
                <a href="https://yeyak-mania.co.kr" class="cta-button">
                  대시보드로 이동 →
                </a>
              </p>
            </div>

            <div class="footer">
              <p>© 2025 예약매니아. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

/**
 * 구독 업그레이드 감사 이메일
 */
export async function sendUpgradeThankYouEmail(
  recipientEmail: string,
  recipientName: string,
  planName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: '예약매니아 <onboarding@yeyak-mania.co.kr>',
      to: recipientEmail,
      subject: `${planName} 플랜 업그레이드 감사합니다! 🚀`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #334155; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .content { background: #F8FAFC; border-radius: 12px; padding: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h2>${recipientName}님, 감사합니다! 🙏</h2>

              <p><strong>${planName} 플랜</strong>으로 업그레이드해주셔서 감사합니다.</p>

              <p>이제 더 많은 학생들과 함께 성장하세요!</p>

              <p>언제든 도움이 필요하시면 연락주세요.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Failed to send upgrade email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
