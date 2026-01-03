/**
 * Google Meet VTT (WebVTT) 파일 파서
 *
 * Google Meet 녹화 시 자동 생성되는 .vtt 자막 파일을 파싱하여
 * 순수 텍스트로 변환합니다.
 */

export interface VTTCue {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

export interface ParsedVTT {
  cues: VTTCue[];
  fullText: string;
  duration: string;
}

/**
 * VTT 파일 내용을 파싱
 */
export function parseVTT(vttContent: string): ParsedVTT {
  const lines = vttContent.split('\n');
  const cues: VTTCue[] = [];
  let currentCue: Partial<VTTCue> = {};
  let index = 0;

  // Skip header (WEBVTT)
  let i = 0;
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  for (; i < lines.length; i++) {
    const line = lines[i].trim();

    // Empty line indicates end of cue
    if (!line) {
      if (currentCue.text) {
        cues.push({
          index: index++,
          startTime: currentCue.startTime || '',
          endTime: currentCue.endTime || '',
          text: currentCue.text,
        });
        currentCue = {};
      }
      continue;
    }

    // Timestamp line (00:00:01.234 --> 00:00:05.678)
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(s => s.trim());
      currentCue.startTime = start;
      currentCue.endTime = end;
      continue;
    }

    // Skip numeric index lines
    if (/^\d+$/.test(line)) {
      continue;
    }

    // Text line
    if (!currentCue.text) {
      currentCue.text = line;
    } else {
      currentCue.text += ' ' + line;
    }
  }

  // Add last cue if exists
  if (currentCue.text) {
    cues.push({
      index: index++,
      startTime: currentCue.startTime || '',
      endTime: currentCue.endTime || '',
      text: currentCue.text,
    });
  }

  // Extract full text
  const fullText = cues.map(cue => cue.text).join(' ');

  // Calculate duration
  const duration = cues.length > 0
    ? cues[cues.length - 1].endTime
    : '00:00:00';

  return {
    cues,
    fullText,
    duration,
  };
}

/**
 * Google Drive 파일 ID로부터 VTT 다운로드 및 파싱
 */
export async function fetchAndParseVTT(
  accessToken: string,
  fileId: string
): Promise<ParsedVTT> {
  try {
    // Google Drive API로 파일 다운로드
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download VTT file from Google Drive');
    }

    const vttContent = await response.text();
    return parseVTT(vttContent);
  } catch (error) {
    console.error('VTT fetch and parse error:', error);
    throw error;
  }
}

/**
 * Google Drive 폴더에서 .vtt 파일 검색
 */
export async function findVTTFiles(
  accessToken: string,
  folderId?: string
): Promise<Array<{ id: string; name: string; createdTime: string }>> {
  try {
    const query = folderId
      ? `'${folderId}' in parents and mimeType='text/vtt'`
      : `mimeType='text/vtt'`;

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name,createdTime)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search VTT files');
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('VTT search error:', error);
    throw error;
  }
}

/**
 * 전사 텍스트를 요약 (긴 텍스트 처리용)
 */
export function summarizeTranscription(
  fullText: string,
  maxLength: number = 2000
): string {
  if (fullText.length <= maxLength) {
    return fullText;
  }

  // 앞부분과 뒷부분을 포함한 요약
  const halfLength = Math.floor(maxLength / 2);
  const start = fullText.substring(0, halfLength);
  const end = fullText.substring(fullText.length - halfLength);

  return `${start}\n\n...(중략)...\n\n${end}`;
}

/**
 * VTT 타임스탬프를 초 단위로 변환
 */
export function vttTimeToSeconds(timeString: string): number {
  const parts = timeString.split(':');
  if (parts.length !== 3) return 0;

  const [hours, minutes, seconds] = parts;
  const [secs, millisecs] = seconds.split('.');

  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(secs) +
    (millisecs ? parseInt(millisecs) / 1000 : 0)
  );
}

/**
 * 초를 VTT 타임스탬프로 변환
 */
export function secondsToVTTTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}
