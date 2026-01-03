/**
 * Google Meet API v2 통합
 *
 * Meet 코드를 사용하여 녹화 파일과 예약을 확실하게 매칭합니다.
 * API 문서: https://developers.google.com/workspace/meet/api/guides/overview
 */

export interface ConferenceRecord {
  name: string; // conferenceRecords/{conferenceRecord}
  startTime: string;
  endTime: string;
  expireTime: string;
  space: {
    name: string;
    meetingUri: string;
    meetingCode: string; // "abc-defg-hij"
  };
}

export interface Recording {
  name: string; // conferenceRecords/{conferenceRecord}/recordings/{recording}
  startTime: string;
  endTime: string;
  driveDestination: {
    file: string; // Drive file ID
    exportUri: string;
  };
  state: 'RECORDING_STATE_UNSPECIFIED' | 'STARTED' | 'ENDED' | 'FILE_GENERATED';
}

export interface Transcript {
  name: string; // conferenceRecords/{conferenceRecord}/transcripts/{transcript}
  startTime: string;
  endTime: string;
  state: 'STATE_UNSPECIFIED' | 'STARTED' | 'ENDED' | 'FILE_GENERATED';
  docsDestination: {
    document: string; // Google Docs file ID
    exportUri: string;
  };
}

export interface Participant {
  name: string;
  earliestStartTime: string;
  latestEndTime: string;
  signedinUser?: {
    user: string;
    displayName: string;
  };
  anonymousUser?: {
    displayName: string;
  };
  phoneUser?: {
    displayName: string;
  };
}

/**
 * Meet 코드로 Conference Record 검색
 */
export async function getConferenceByMeetCode(
  accessToken: string,
  meetCode: string
): Promise<ConferenceRecord | null> {
  try {
    const filter = `space.meeting_code = "${meetCode}"`;
    const response = await fetch(
      `https://meet.googleapis.com/v2/conferenceRecords?filter=${encodeURIComponent(filter)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get conference record');
    }

    const data = await response.json();
    return data.conferenceRecords?.[0] || null;
  } catch (error) {
    console.error('Get conference by meet code error:', error);
    throw error;
  }
}

/**
 * Conference의 모든 녹화 파일 가져오기
 */
export async function getConferenceRecordings(
  accessToken: string,
  conferenceRecordName: string
): Promise<Recording[]> {
  try {
    const response = await fetch(
      `https://meet.googleapis.com/v2/${conferenceRecordName}/recordings`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get recordings');
    }

    const data = await response.json();
    return data.recordings || [];
  } catch (error) {
    console.error('Get conference recordings error:', error);
    throw error;
  }
}

/**
 * Conference의 모든 전사 파일 가져오기
 */
export async function getConferenceTranscripts(
  accessToken: string,
  conferenceRecordName: string
): Promise<Transcript[]> {
  try {
    const response = await fetch(
      `https://meet.googleapis.com/v2/${conferenceRecordName}/transcripts`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get transcripts');
    }

    const data = await response.json();
    return data.transcripts || [];
  } catch (error) {
    console.error('Get conference transcripts error:', error);
    throw error;
  }
}

/**
 * Conference의 참가자 목록 가져오기
 */
export async function getConferenceParticipants(
  accessToken: string,
  conferenceRecordName: string
): Promise<Participant[]> {
  try {
    const response = await fetch(
      `https://meet.googleapis.com/v2/${conferenceRecordName}/participants`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get participants');
    }

    const data = await response.json();
    return data.participants || [];
  } catch (error) {
    console.error('Get conference participants error:', error);
    throw error;
  }
}

/**
 * Meet URL에서 코드 추출
 */
export function extractMeetCode(meetUrl: string): string | null {
  // https://meet.google.com/abc-defg-hij 형식
  const match = meetUrl.match(/meet\.google\.com\/([a-z\-]+)/i);
  return match ? match[1] : null;
}

/**
 * 예약의 Meet 링크로부터 녹화 및 전사 파일 가져오기
 */
export async function getRecordingsByReservation(
  accessToken: string,
  meetUrl: string
): Promise<{
  conference: ConferenceRecord | null;
  recordings: Recording[];
  transcripts: Transcript[];
  participants: Participant[];
}> {
  try {
    // 1. Meet 코드 추출
    const meetCode = extractMeetCode(meetUrl);
    if (!meetCode) {
      throw new Error('Invalid Meet URL');
    }

    // 2. Conference Record 조회
    const conference = await getConferenceByMeetCode(accessToken, meetCode);
    if (!conference) {
      return {
        conference: null,
        recordings: [],
        transcripts: [],
        participants: [],
      };
    }

    // 3. 녹화, 전사, 참가자 정보 병렬 조회
    const [recordings, transcripts, participants] = await Promise.all([
      getConferenceRecordings(accessToken, conference.name),
      getConferenceTranscripts(accessToken, conference.name),
      getConferenceParticipants(accessToken, conference.name),
    ]);

    return {
      conference,
      recordings,
      transcripts,
      participants,
    };
  } catch (error) {
    console.error('Get recordings by reservation error:', error);
    throw error;
  }
}

/**
 * 특정 기간 동안의 모든 Conference Records 조회
 */
export async function listConferenceRecords(
  accessToken: string,
  startTime?: Date,
  endTime?: Date
): Promise<ConferenceRecord[]> {
  try {
    let filter = '';
    if (startTime && endTime) {
      filter = `start_time >= "${startTime.toISOString()}" AND end_time <= "${endTime.toISOString()}"`;
    } else if (startTime) {
      filter = `start_time >= "${startTime.toISOString()}"`;
    }

    const url = filter
      ? `https://meet.googleapis.com/v2/conferenceRecords?filter=${encodeURIComponent(filter)}`
      : `https://meet.googleapis.com/v2/conferenceRecords`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to list conference records');
    }

    const data = await response.json();
    return data.conferenceRecords || [];
  } catch (error) {
    console.error('List conference records error:', error);
    throw error;
  }
}

/**
 * Google Docs 전사 파일 내용 가져오기
 */
export async function getTranscriptContent(
  accessToken: string,
  documentId: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get transcript content');
    }

    const data = await response.json();

    // Google Docs의 텍스트 추출
    let text = '';
    if (data.body && data.body.content) {
      for (const element of data.body.content) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun) {
              text += textElement.textRun.content;
            }
          }
        }
      }
    }

    return text;
  } catch (error) {
    console.error('Get transcript content error:', error);
    throw error;
  }
}

/**
 * 필요한 OAuth Scopes
 */
export const MEET_API_SCOPES = [
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
];
