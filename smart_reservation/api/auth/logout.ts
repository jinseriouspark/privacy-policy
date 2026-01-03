import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * 로그아웃 (클라이언트에서 토큰 삭제만 하면 됨, 서버에서는 특별한 작업 없음)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // JWT는 stateless이므로 서버에서 특별히 할 일 없음
  // 클라이언트에서 localStorage에서 토큰을 삭제하면 됨

  return res.status(200).json({ success: true });
}
