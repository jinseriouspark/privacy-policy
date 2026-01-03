/**
 * Google Drive API 통합
 *
 * Google Meet 녹화 파일 및 자동 전사(.vtt) 파일 처리
 */

import { parseVTT, findVTTFiles, fetchAndParseVTT } from './vtt-parser';
import { getIndustryPrompt } from './notion-oauth';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  webViewLink?: string;
  parents?: string[];
}

export interface MeetingRecording {
  videoFile: DriveFile;
  transcriptFile?: DriveFile;
  transcriptText?: string;
  meetingDate: string;
}

/**
 * Google Drive OAuth 스코프
 */
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

/**
 * 특정 폴더의 녹화 파일 검색
 */
export async function findMeetRecordings(
  accessToken: string,
  folderId?: string,
  since?: Date
): Promise<MeetingRecording[]> {
  try {
    // 녹화 파일 검색 (mp4, webm 등)
    let query = `mimeType contains 'video/'`;
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }
    if (since) {
      query += ` and createdTime >= '${since.toISOString()}'`;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name,mimeType,createdTime,webViewLink,parents)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search recording files');
    }

    const data = await response.json();
    const videoFiles: DriveFile[] = data.files || [];

    // 각 녹화 파일에 대응하는 .vtt 파일 찾기
    const recordings: MeetingRecording[] = [];

    for (const videoFile of videoFiles) {
      const recording: MeetingRecording = {
        videoFile,
        meetingDate: videoFile.createdTime,
      };

      // 같은 폴더에서 .vtt 파일 찾기
      if (videoFile.parents && videoFile.parents.length > 0) {
        const vttFiles = await findVTTFiles(accessToken, videoFile.parents[0]);

        // 이름이 비슷한 .vtt 파일 찾기
        const videoBaseName = videoFile.name.replace(/\.(mp4|webm|mov)$/i, '');
        const matchingVTT = vttFiles.find(vtt =>
          vtt.name.includes(videoBaseName) || videoBaseName.includes(vtt.name.replace('.vtt', ''))
        );

        if (matchingVTT) {
          recording.transcriptFile = {
            id: matchingVTT.id,
            name: matchingVTT.name,
            mimeType: 'text/vtt',
            createdTime: matchingVTT.createdTime,
          };
        }
      }

      recordings.push(recording);
    }

    return recordings;
  } catch (error) {
    console.error('Find meeting recordings error:', error);
    throw error;
  }
}

/**
 * 녹화 파일의 전사 텍스트 추출
 */
export async function extractTranscriptText(
  accessToken: string,
  recording: MeetingRecording
): Promise<string> {
  if (!recording.transcriptFile) {
    throw new Error('No transcript file found for this recording');
  }

  try {
    const parsed = await fetchAndParseVTT(accessToken, recording.transcriptFile.id);
    return parsed.fullText;
  } catch (error) {
    console.error('Extract transcript error:', error);
    throw error;
  }
}

/**
 * 녹화 파일로부터 AI 분석 생성
 */
export async function analyzeRecordingWithAI(params: {
  accessToken: string;
  recording: MeetingRecording;
  studentName: string;
  coachIndustry: string;
  geminiApiKey: string;
}): Promise<string> {
  try {
    // 1. 전사 텍스트 추출
    const transcriptText = await extractTranscriptText(
      params.accessToken,
      params.recording
    );

    // 2. 업종별 프롬프트 생성
    const prompt = getIndustryPrompt(
      params.coachIndustry,
      `[녹화 전사]\n${transcriptText}`,
      params.studentName
    );

    // 3. Gemini API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${params.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API call failed');
    }

    const data = await response.json();
    const analysis = data.candidates[0]?.content?.parts[0]?.text || '';

    return analysis;
  } catch (error) {
    console.error('Recording AI analysis error:', error);
    throw error;
  }
}

/**
 * Google Drive 파일 공유 링크 생성
 */
export async function getShareableLink(
  accessToken: string,
  fileId: string
): Promise<string> {
  try {
    // 파일 메타데이터 가져오기
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink,webContentLink`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get file metadata');
    }

    const data = await response.json();
    return data.webViewLink || data.webContentLink || '';
  } catch (error) {
    console.error('Get shareable link error:', error);
    throw error;
  }
}

/**
 * Google Drive Watch (파일 변경 감지) 설정
 */
export async function watchDriveFolder(
  accessToken: string,
  folderId: string,
  webhookUrl: string
): Promise<{ channelId: string; expiration: number }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}/watch`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `drive-watch-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
          expiration: Date.now() + 86400000, // 24시간
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to set up Drive watch');
    }

    const data = await response.json();
    return {
      channelId: data.id,
      expiration: parseInt(data.expiration),
    };
  } catch (error) {
    console.error('Watch drive folder error:', error);
    throw error;
  }
}

/**
 * Google Drive Watch 중지
 */
export async function stopWatchingDrive(
  accessToken: string,
  channelId: string,
  resourceId: string
): Promise<void> {
  try {
    await fetch('https://www.googleapis.com/drive/v3/channels/stop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        resourceId: resourceId,
      }),
    });
  } catch (error) {
    console.error('Stop watching drive error:', error);
    throw error;
  }
}
