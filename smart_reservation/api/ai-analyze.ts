import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Gemini AI 분석 API 엔드포인트 (보안)
 * - API 키를 서버에서만 사용
 * - 클라이언트에서 직접 Gemini API 호출 방지
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, type } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Gemini API 키는 환경변수에서만 접근 (클라이언트에 노출 안 됨)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('[AI Analyze] GEMINI_API_KEY not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Gemini API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Analyze] Gemini API error:', errorText);
      return res.status(response.status).json({
        error: 'Gemini API error',
        details: errorText,
      });
    }

    const data = await response.json();

    // 응답 파싱
    const analysisText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '분석 결과를 생성할 수 없습니다.';

    return res.status(200).json({
      success: true,
      analysis: analysisText,
      type: type || 'general',
    });
  } catch (error: any) {
    console.error('[AI Analyze] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
