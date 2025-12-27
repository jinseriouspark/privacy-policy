/**
 * 마스터마인드 멤버에게 개인별 프로모션 코드 발송 스크립트
 *
 * 사용법:
 * 1. .env에 VITE_RESEND_API_KEY 설정
 * 2. 아래 mastermindMembers 배열에 이메일 추가
 * 3. npx tsx scripts/send-mastermind-codes.ts 실행
 */

import { supabase } from '../lib/supabase/client';
import { generateUniquePromoCode, sendMastermindPromoEmail } from '../lib/email/resend';

// 마스터마인드 멤버 목록
const mastermindMembers = [
  { email: 'member1@example.com', name: '홍길동' },
  { email: 'member2@example.com', name: '김철수' },
  { email: 'member3@example.com', name: '이영희' },
  // 여기에 더 추가...
];

async function sendMastermindPromoCodes() {
  console.log('🚀 마스터마인드 프로모션 코드 발송 시작...\n');

  for (const member of mastermindMembers) {
    try {
      // 1. 개인별 고유 코드 생성
      const promoCode = generateUniquePromoCode('MASTERMIND');
      console.log(`📧 ${member.name} (${member.email})`);
      console.log(`   코드: ${promoCode}`);

      // 2. Supabase에 프로모션 코드 등록
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .insert({
          code: promoCode,
          description: `마스터마인드 전용 (${member.name})`,
          discount_type: 'fixed_amount',
          discount_value: 9000, // ₩19,000 → ₩10,000
          plan_id: 'standard',
          max_uses: 1, // 1회만 사용 가능
          valid_until: '2025-12-31 23:59:59+09'
        })
        .select()
        .single();

      if (promoError) {
        console.error(`   ❌ DB 저장 실패:`, promoError.message);
        continue;
      }

      // 3. 이메일 화이트리스트에 추가
      const { error: whitelistError } = await supabase
        .from('promo_email_whitelist')
        .insert({
          email: member.email,
          promo_code_id: promoData.id,
          note: `마스터마인드 멤버 - ${member.name}`
        });

      if (whitelistError && whitelistError.code !== '23505') { // 23505 = unique violation (이미 있음)
        console.error(`   ⚠️ 화이트리스트 추가 실패:`, whitelistError.message);
      }

      // 4. 이메일 발송
      const emailResult = await sendMastermindPromoEmail(
        member.email,
        member.name,
        promoCode
      );

      if (emailResult.success) {
        console.log(`   ✅ 이메일 발송 성공\n`);
      } else {
        console.error(`   ❌ 이메일 발송 실패:`, emailResult.error, '\n');
      }

      // API 레이트 리밋 방지 (1초 대기)
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`   ❌ 처리 중 오류:`, error, '\n');
    }
  }

  console.log('✨ 완료!');
}

// 스크립트 실행
sendMastermindPromoCodes().catch(console.error);
