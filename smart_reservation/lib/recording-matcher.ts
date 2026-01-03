/**
 * Google Meet 녹화 파일과 예약 정보 매칭 시스템
 *
 * 녹화 파일을 올바른 예약/학생과 자동으로 연결합니다.
 *
 * 매칭 방법:
 * 1. **100% 확실**: Meet 코드 매칭 (reservations.meet_link)
 * 2. **높은 확률**: 시간 + 학생 이름
 * 3. **낮은 확률**: 시간대만 일치
 */

import { MeetingRecording } from './google-drive';
import { getRecordingsByReservation, extractMeetCode } from './google-meet-api';

export interface Reservation {
  id: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: string;
  meetUrl?: string;
}

export interface MatchedRecording extends MeetingRecording {
  reservation?: Reservation;
  matchScore: number; // 0-100
  matchReason: string;
}

/**
 * 녹화 파일과 예약 매칭
 */
export function matchRecordingToReservation(
  recording: MeetingRecording,
  reservations: Reservation[]
): MatchedRecording {
  let bestMatch: Reservation | undefined;
  let maxScore = 0;
  let matchReason = '';

  for (const reservation of reservations) {
    const score = calculateMatchScore(recording, reservation);

    if (score > maxScore) {
      maxScore = score;
      bestMatch = reservation;
      matchReason = getMatchReason(recording, reservation, score);
    }
  }

  return {
    ...recording,
    reservation: bestMatch,
    matchScore: maxScore,
    matchReason,
  };
}

/**
 * 녹화 파일과 예약의 매칭 점수 계산 (0-100)
 */
function calculateMatchScore(
  recording: MeetingRecording,
  reservation: Reservation
): number {
  let score = 0;

  // 0. Meet 코드 완벽 매칭 (최대 100점) - 가장 확실!
  if (reservation.meetUrl) {
    const reservationMeetCode = extractMeetCode(reservation.meetUrl);
    const fileName = recording.videoFile.name.toLowerCase();

    if (reservationMeetCode && fileName.includes(reservationMeetCode)) {
      return 100; // 완벽한 매칭!
    }
  }

  // 1. 날짜 매칭 (최대 50점)
  const recordingDate = new Date(recording.meetingDate);
  const reservationDate = new Date(`${reservation.date}T${reservation.startTime}`);

  const timeDiffMs = Math.abs(recordingDate.getTime() - reservationDate.getTime());
  const timeDiffMinutes = timeDiffMs / (1000 * 60);

  if (timeDiffMinutes <= 5) {
    score += 50; // 정확히 일치 (±5분)
  } else if (timeDiffMinutes <= 15) {
    score += 40; // 거의 일치 (±15분)
  } else if (timeDiffMinutes <= 30) {
    score += 30; // 비슷한 시간 (±30분)
  } else if (timeDiffMinutes <= 60) {
    score += 20; // 같은 시간대 (±1시간)
  } else if (isSameDay(recordingDate, reservationDate)) {
    score += 10; // 같은 날
  }

  // 2. 파일명에서 학생 이름 찾기 (최대 30점)
  const fileName = recording.videoFile.name.toLowerCase();
  const studentName = reservation.studentName.toLowerCase();

  if (fileName.includes(studentName)) {
    score += 30; // 이름 정확 포함
  } else {
    // 이름의 일부분이라도 포함되어 있는지 확인
    const nameParts = studentName.split(' ');
    const matchingParts = nameParts.filter(part => fileName.includes(part));
    score += (matchingParts.length / nameParts.length) * 20;
  }

  // 3. Meet URL 부분 매칭 (최대 20점)
  if (reservation.meetUrl) {
    const meetCode = extractMeetCode(reservation.meetUrl);
    if (meetCode) {
      // Meet 코드의 일부분이라도 포함되어 있는지
      const codeParts = meetCode.split('-');
      const matchingParts = codeParts.filter(part => fileName.includes(part));
      score += (matchingParts.length / codeParts.length) * 20;
    }
  }

  return Math.min(score, 100);
}

/**
 * 매칭 이유 설명 생성
 */
function getMatchReason(
  recording: MeetingRecording,
  reservation: Reservation,
  score: number
): string {
  if (score >= 80) {
    return `높은 확률로 매칭 (${reservation.studentName}, ${reservation.date} ${reservation.startTime})`;
  } else if (score >= 60) {
    return `매칭 가능 (${reservation.studentName}, ${reservation.date} ${reservation.startTime})`;
  } else if (score >= 40) {
    return `낮은 확률로 매칭 (시간대 비슷함)`;
  } else {
    return `매칭 불확실 (수동 확인 필요)`;
  }
}

/**
 * 두 날짜가 같은 날인지 확인
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Google Meet URL에서 고유 ID 추출
 */
function extractMeetId(meetUrl: string): string | null {
  // https://meet.google.com/abc-defg-hij 형식
  const match = meetUrl.match(/meet\.google\.com\/([a-z\-]+)/i);
  return match ? match[1] : null;
}

/**
 * 여러 녹화 파일을 예약 목록과 일괄 매칭
 */
export function matchAllRecordings(
  recordings: MeetingRecording[],
  reservations: Reservation[]
): MatchedRecording[] {
  const matched: MatchedRecording[] = [];
  const usedReservations = new Set<string>();

  // 먼저 점수가 높은 순으로 정렬
  const sortedRecordings = [...recordings].sort((a, b) => {
    const scoreA = Math.max(...reservations.map(r => calculateMatchScore(a, r)));
    const scoreB = Math.max(...reservations.map(r => calculateMatchScore(b, r)));
    return scoreB - scoreA;
  });

  for (const recording of sortedRecordings) {
    // 아직 사용되지 않은 예약 중에서 매칭
    const availableReservations = reservations.filter(
      r => !usedReservations.has(r.id)
    );

    const matchedRecording = matchRecordingToReservation(
      recording,
      availableReservations
    );

    // 높은 확률로 매칭된 경우만 예약을 "사용됨"으로 표시
    if (matchedRecording.reservation && matchedRecording.matchScore >= 60) {
      usedReservations.add(matchedRecording.reservation.id);
    }

    matched.push(matchedRecording);
  }

  return matched;
}

/**
 * 녹화 파일 이름 정규화 (Google Meet 기본 포맷)
 */
export function normalizeRecordingName(fileName: string): {
  baseName: string;
  date?: string;
  time?: string;
} {
  // "Meet Recording - 2024-12-31 14:30.mp4" 형식 파싱
  const dateTimeMatch = fileName.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);

  if (dateTimeMatch) {
    return {
      baseName: fileName.replace(dateTimeMatch[0], '').trim(),
      date: dateTimeMatch[1],
      time: dateTimeMatch[2],
    };
  }

  return {
    baseName: fileName.replace(/\.(mp4|webm|mov)$/i, ''),
  };
}

/**
 * 예약 정보를 기반으로 예상 녹화 파일명 생성
 */
export function generateExpectedFileName(reservation: Reservation): string {
  return `Meet Recording - ${reservation.date} ${reservation.startTime}`;
}

/**
 * Meet API를 사용한 확실한 매칭 (100% 정확)
 *
 * reservations 테이블의 meet_link를 사용하여
 * Google Meet API로 직접 녹화 파일을 조회합니다.
 */
export async function matchUsingMeetAPI(
  accessToken: string,
  reservation: Reservation
): Promise<{
  success: boolean;
  recordingDriveId?: string;
  recordingUrl?: string;
  transcriptDriveId?: string;
  transcriptText?: string;
  participants?: string[];
  error?: string;
}> {
  try {
    if (!reservation.meetUrl) {
      return {
        success: false,
        error: 'No Meet URL in reservation',
      };
    }

    // Meet API로 녹화 파일 조회
    const result = await getRecordingsByReservation(
      accessToken,
      reservation.meetUrl
    );

    if (!result.conference) {
      return {
        success: false,
        error: 'Conference not found (maybe not recorded)',
      };
    }

    if (result.recordings.length === 0) {
      return {
        success: false,
        error: 'No recordings found for this meeting',
      };
    }

    // 가장 최근 녹화 선택
    const latestRecording = result.recordings[result.recordings.length - 1];

    // Drive 파일 ID 추출
    const recordingDriveId = latestRecording.driveDestination?.file || '';
    const recordingUrl = latestRecording.driveDestination?.exportUri || '';

    // 전사 파일 정보
    let transcriptDriveId = '';
    let transcriptText = '';

    if (result.transcripts.length > 0) {
      const latestTranscript = result.transcripts[result.transcripts.length - 1];
      transcriptDriveId = latestTranscript.docsDestination?.document || '';

      // Google Docs API로 전사 텍스트 가져오기
      if (transcriptDriveId) {
        const { getTranscriptContent } = await import('./google-meet-api');
        try {
          transcriptText = await getTranscriptContent(accessToken, transcriptDriveId);
        } catch (err) {
          console.warn('Failed to get transcript content:', err);
        }
      }
    }

    // 참가자 목록
    const participants = result.participants.map(p =>
      p.signedinUser?.displayName ||
      p.anonymousUser?.displayName ||
      p.phoneUser?.displayName ||
      'Unknown'
    );

    return {
      success: true,
      recordingDriveId,
      recordingUrl,
      transcriptDriveId,
      transcriptText,
      participants,
    };
  } catch (error: any) {
    console.error('Match using Meet API error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 자동 매칭 신뢰도 평가
 */
export function evaluateMatchConfidence(matched: MatchedRecording): {
  confidence: 'high' | 'medium' | 'low';
  shouldAutoProcess: boolean;
  message: string;
} {
  if (matched.matchScore >= 80) {
    return {
      confidence: 'high',
      shouldAutoProcess: true,
      message: '자동 처리 가능',
    };
  } else if (matched.matchScore >= 60) {
    return {
      confidence: 'medium',
      shouldAutoProcess: false,
      message: '강사 확인 권장',
    };
  } else {
    return {
      confidence: 'low',
      shouldAutoProcess: false,
      message: '수동 매칭 필요',
    };
  }
}
