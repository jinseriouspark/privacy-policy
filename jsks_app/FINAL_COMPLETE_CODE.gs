/**
 * 정수결사 Backend - 최종 완성판
 * 원본 MASTER_CHECKLIST 데이터 포함
 */
const ADMIN_EMAILS = ['monk@jeongsu.org', 'test@gmail.com'];

function getDocOrThrow() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  if (!doc) throw new Error("CRITICAL: 스크립트 연결 확인 필요");
  return doc;
}

function setupDatabase() {
  const doc = getDocOrThrow();
  ensureSheet(doc, 'Users', ['email', 'name', 'role', 'photoUrl', 'joinDate', 'trackingIds', 'notificationSettings', 'dharmaName']);
  ensureSheet(doc, 'Schedules', ['id', 'type', 'title', 'date', 'time', 'meta', 'createdAt', 'attachmentUrl', 'ownerEmail', 'location', 'maxParticipants', 'participants', 'endDate', 'endTime', 'invitedEmails']);
  ensureSheet(doc, 'PracticeLogs', ['id', 'email', 'date', 'progress', 'checkedIds', 'timestamp']);

  // 🆕 이벤트 참석 신청 기록 (RSVP tracking with timestamps)
  ensureSheet(doc, 'EventRSVP', ['id', 'scheduleId', 'userEmail', 'userName', 'status', 'rsvpTimestamp']);

  // 🆕 수행 항목 마스터 데이터 (필수 2개 + 선택 23개 = 총 25개)
  const practiceSheet = ensureSheet(doc, 'PracticeItems', ['id', 'category', 'question', 'order']);
  if (practiceSheet.getLastRow() <= 1) {
    // 필수 항목
    practiceSheet.appendRow(['1', '필수', '경전읽기', 1]);
    practiceSheet.appendRow(['2', '필수', '염불/참선', 2]);
    // 정견·공관
    practiceSheet.appendRow(['3', '정견·공관', '나/사물에 대한 집착을 자각했는가?', 3]);
    practiceSheet.appendRow(['4', '정견·공관', '모든것이 인연따라 이루어 짐을 떠올렸는가?', 4]);
    practiceSheet.appendRow(['5', '정견·공관', '공을 허무가 아닌 관계로 체험했는가?', 5]);
    // 보리심
    practiceSheet.appendRow(['6', '보리심', '하루 시작 하기 전 발원을 했는가?', 6]);
    practiceSheet.appendRow(['7', '보리심', '힘들 때도 발원을 상기했는가?', 7]);
    practiceSheet.appendRow(['8', '보리심', '성과를 내 것이라 집착하지 않았는가?', 8]);
    // 육바라밀
    practiceSheet.appendRow(['9', '보시', '재물·말·지혜의 보시를 실천했는가?', 9]);
    practiceSheet.appendRow(['10', '지계', '타인에게 해를 끼치지 않았는가?', 10]);
    practiceSheet.appendRow(['11', '인욕', '분노 대신 알아차림을 유지했는가?', 11]);
    practiceSheet.appendRow(['12', '정진', '수행·학습·봉사를 게을리하지 않았는가?', 12]);
    practiceSheet.appendRow(['13', '선정', '좌선·호흡관을 실천했는가?', 13]);
    practiceSheet.appendRow(['14', '반야', '바라밀을 공관과 연결했는가?', 14]);
    // 방편·자비
    practiceSheet.appendRow(['15', '방편·자비', '상대의 상황에 맞춰 말했는가?', 15]);
    practiceSheet.appendRow(['16', '방편·자비', '옳고 그름보다 이익을 우선했는가?', 16]);
    practiceSheet.appendRow(['17', '방편·자비', '행위 후 집착이 남지 않았는가?', 17]);
    // 두 진리
    practiceSheet.appendRow(['18', '두 진리', '세속제에서 도덕·규범을 지켰는가?', 18]);
    practiceSheet.appendRow(['19', '두 진리', '승의제에서 무자성을 기억했는가?', 19]);
    practiceSheet.appendRow(['20', '두 진리', '두 진리를 균형 있게 적용했는가?', 20]);
    // 무주열반
    practiceSheet.appendRow(['21', '무주열반', '열반에 집착하지 않았는가?', 21]);
    practiceSheet.appendRow(['22', '무주열반', '득실에 매이지 않았는가?', 22]);
    practiceSheet.appendRow(['23', '무주열반', '머물 곳 없음의 태도를 적용했는가?', 23]);
    // 자기 성찰
    practiceSheet.appendRow(['24', '자기 성찰', '집착 패턴을 기록했는가?', 24]);
    practiceSheet.appendRow(['25', '자기 성찰', '마음비움과 자비가 서로를 보완했는가?', 25]);
  }

  // Videos 시트
  const videoSheet = ensureSheet(doc, 'Videos', [
    'id', 'title', 'author', 'duration', 'youtubeId', 'thumbnailUrl',
    'mediaType', 'driveUrl', 'textContent', 'status', 'createdAt'
  ]);

  if (videoSheet.getLastRow() <= 1) {
    videoSheet.appendRow([
      'demo_1', '금강경 독송', '정수스님', '15:20', 'sNmP8xkXliY',
      'https://img.youtube.com/vi/sNmP8xkXliY/maxresdefault.jpg',
      'youtube', '', '', 'published', new Date()
    ]);
  }

  const settingsSheet = ensureSheet(doc, 'AppSettings', ['key', 'value']);
  return 'DB 설정 완료';
}

function ensureSheet(doc, sheetName, headers) {
  let sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
    sheet.appendRow(headers);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    headers.forEach((h) => {
      if (!currentHeaders.includes(h)) sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
    });
  }
  return sheet;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      const doc = getDocOrThrow();
      if (!e.postData || !e.postData.contents) return createJSON({ status: 'error', message: 'No Data' });

      const data = JSON.parse(e.postData.contents);
      const action = data.action;
      let result = {};

      switch (action) {
        case 'LOGIN': result = handleLogin(doc, data.user); break;
        case 'UPDATE_PROFILE': result = updateUserProfile(doc, data.email, data.updates); break;
        case 'UPDATE_GOALS': result = updateUserGoals(doc, data.email, data.trackingIds); break;
        case 'UPDATE_NOTIFICATIONS': result = updateNotificationSettings(doc, data.email, data.settings); break;
        case 'GET_PRACTICE_LOGS': result = getPracticeLogs(doc, data.email); break;
        case 'SAVE_PRACTICE': result = savePractice(doc, data.log); break;
        case 'GET_SCHEDULES': result = getSchedules(doc); break;
        case 'ADD_SCHEDULE': result = addSchedule(doc, data.schedule); break;
        case 'UPDATE_SCHEDULE': result = updateSchedule(doc, data.schedule); break;
        case 'DELETE_SCHEDULE': result = deleteSchedule(doc, data.id); break;
        case 'RSVP_EVENT': result = rsvpEvent(doc, data.scheduleId, data.userEmail, data.isJoining); break;
        case 'GET_VIDEOS': result = getVideos(doc); break;
        case 'ADD_VIDEO': result = addVideo(doc, data.video); break;
        case 'UPDATE_VIDEO': result = updateVideo(doc, data.id, data.updates); break;
        case 'DELETE_VIDEO': result = deleteVideo(doc, data.id); break;
        case 'GET_SETTINGS': result = getSettings(doc); break;
        case 'UPDATE_SETTINGS': result = updateSettings(doc, data.settings); break;
        case 'GET_PRACTICE_ITEMS': result = getPracticeItems(doc); break;
        case 'ADD_PRACTICE_ITEM': result = addPracticeItem(doc, data.item); break;
        case 'UPDATE_PRACTICE_ITEM': result = updatePracticeItem(doc, data.id, data.updates); break;
        case 'DELETE_PRACTICE_ITEM': result = deletePracticeItem(doc, data.id); break;
        case 'GET_USERS': result = getUsers(doc); break;
        default: result = { status: 'error', message: 'Unknown action' };
      }
      return createJSON({ status: 'success', ...result });
    } catch (e) {
      return createJSON({ status: 'error', message: e.toString() });
    } finally {
      lock.releaseLock();
    }
  }
}

function createJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Handle preflight requests (OPTIONS)
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

function doGet(e) {
  // GET 요청 처리 (CORS 우회)
  const lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      const doc = getDocOrThrow();
      const params = e.parameter;
      const action = params.action;

      if (!action) {
        return createJSON({ status: 'error', message: 'No action specified' });
      }

      // data 파라미터를 파싱
      let data = {};
      if (params.data) {
        try {
          data = JSON.parse(params.data);
        } catch (err) {
          return createJSON({ status: 'error', message: 'Invalid JSON in data parameter' });
        }
      }

      let result = {};

      switch (action) {
        case 'LOGIN': result = handleLogin(doc, data.user); break;
        case 'UPDATE_PROFILE': result = updateUserProfile(doc, data.email, data.updates); break;
        case 'UPDATE_GOALS': result = updateUserGoals(doc, data.email, data.trackingIds); break;
        case 'UPDATE_NOTIFICATIONS': result = updateNotificationSettings(doc, data.email, data.settings); break;
        case 'GET_PRACTICE_LOGS': result = getPracticeLogs(doc, data.email); break;
        case 'SAVE_PRACTICE': result = savePractice(doc, data.log); break;
        case 'GET_SCHEDULES': result = getSchedules(doc); break;
        case 'ADD_SCHEDULE': result = addSchedule(doc, data.schedule); break;
        case 'UPDATE_SCHEDULE': result = updateSchedule(doc, data.schedule); break;
        case 'DELETE_SCHEDULE': result = deleteSchedule(doc, data.id); break;
        case 'RSVP_EVENT': result = rsvpEvent(doc, data.scheduleId, data.userEmail, data.isJoining); break;
        case 'GET_VIDEOS': result = getVideos(doc); break;
        case 'ADD_VIDEO': result = addVideo(doc, data.video); break;
        case 'UPDATE_VIDEO': result = updateVideo(doc, data.id, data.updates); break;
        case 'DELETE_VIDEO': result = deleteVideo(doc, data.id); break;
        case 'GET_SETTINGS': result = getSettings(doc); break;
        case 'UPDATE_SETTINGS': result = updateSettings(doc, data.settings); break;
        case 'GET_PRACTICE_ITEMS': result = getPracticeItems(doc); break;
        case 'ADD_PRACTICE_ITEM': result = addPracticeItem(doc, data.item); break;
        case 'UPDATE_PRACTICE_ITEM': result = updatePracticeItem(doc, data.id, data.updates); break;
        case 'DELETE_PRACTICE_ITEM': result = deletePracticeItem(doc, data.id); break;
        case 'GET_USERS': result = getUsers(doc); break;
        default: result = { status: 'error', message: 'Unknown action' };
      }
      return createJSON({ status: 'success', ...result });
    } catch (e) {
      return createJSON({ status: 'error', message: e.toString() });
    } finally {
      lock.releaseLock();
    }
  }
  return createJSON({ status: 'error', message: 'Could not obtain lock' });
}

function handleLogin(doc, u) {
  const sheet = doc.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idxEmail = headers.indexOf('email');
  const idxRole = headers.indexOf('role');
  const idxTracking = headers.indexOf('trackingIds');
  const idxNoti = headers.indexOf('notificationSettings');
  const idxDharma = headers.indexOf('dharmaName');

  let userRow = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idxEmail] === u.email) {
      userRow = data[i];
      break;
    }
  }

  const role = ADMIN_EMAILS.includes(u.email) ? 'monk' : 'believer';

  if (userRow) {
    const tIds = (idxTracking > -1 && userRow[idxTracking])
      ? userRow[idxTracking].toString().split(',').filter(Boolean)
      : [];

    const noti = (idxNoti > -1 && userRow[idxNoti] && userRow[idxNoti].length > 2)
      ? JSON.parse(userRow[idxNoti])
      : null;

    const dName = (idxDharma > -1 && userRow[idxDharma]) ? userRow[idxDharma] : '';

    return {
      user: {
        ...u,
        role: (idxRole > -1 ? userRow[idxRole] : role),
        trackingIds: tIds,
        notificationSettings: noti,
        dharmaName: dName
      }
    };
  } else {
    const row = [u.email, u.name, role, u.photoUrl, new Date(), '', '', ''];
    sheet.appendRow(row);
    return { user: { ...u, role, trackingIds: [], dharmaName: '' } };
  }
}

function updateUserProfile(doc, e, u) {
  const s = doc.getSheetByName('Users');
  const d = s.getDataRange().getValues();
  const h = d[0];
  const idx = h.indexOf('dharmaName');
  for (let i = 1; i < d.length; i++) {
    if (d[i][0] === e) {
      if (u.dharmaName !== undefined) s.getRange(i + 1, idx + 1).setValue(u.dharmaName);
      return { message: 'ok' };
    }
  }
  return { message: 'no' };
}

function updateUserGoals(doc, e, t) {
  const s = doc.getSheetByName('Users');
  const d = s.getDataRange().getValues();
  for (let i = 1; i < d.length; i++) {
    if (d[i][0] === e) {
      s.getRange(i + 1, 6).setValue(t.join(','));
      return { message: 'ok' };
    }
  }
  return { message: 'no' };
}

function updateNotificationSettings(doc, e, v) {
  const s = doc.getSheetByName('Users');
  const d = s.getDataRange().getValues();
  for (let i = 1; i < d.length; i++) {
    if (d[i][0] === e) {
      s.getRange(i + 1, 7).setValue(JSON.stringify(v));
      return { message: 'ok' };
    }
  }
  return { message: 'no' };
}

function getPracticeLogs(doc, e) {
  const s = doc.getSheetByName('PracticeLogs');
  if (!s) return { logs: [] };
  const d = s.getDataRange().getValues();
  const l = [];
  for (let i = 1; i < d.length; i++) {
    let rDate = d[i][2];
    if (rDate instanceof Date) rDate = Utilities.formatDate(rDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (d[i][1] === e) {
      l.push({
        id: d[i][0],
        date: rDate,
        progress: d[i][3],
        checkedIds: d[i][4] ? d[i][4].toString().split(',') : []
      });
    }
  }
  return { logs: l };
}

function savePractice(doc, log) {
  const sheet = doc.getSheetByName('PracticeLogs');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    let rDate = data[i][2];
    if (rDate instanceof Date) rDate = Utilities.formatDate(rDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (data[i][1] === log.email && rDate === log.date) {
      sheet.getRange(i + 1, 4).setValue(log.progress);
      sheet.getRange(i + 1, 5).setValue(log.checkedIds.join(','));
      sheet.getRange(i + 1, 6).setValue(new Date());
      return { message: 'updated' };
    }
  }
  sheet.appendRow([log.id, log.email, log.date, log.progress, log.checkedIds.join(','), new Date()]);
  return { message: 'ok' };
}

function getSchedules(doc) {
  const s = doc.getSheetByName('Schedules');
  if (!s) return { schedules: [] };
  const d = s.getDataRange().getValues();
  const h = d[0];
  const l = [];
  for (let i = 1; i < d.length; i++) {
    const r = d[i];
    const o = {};
    h.forEach((x, k) => {
      o[x] = r[k];
      if (x === 'participants' && o[x]) o[x] = o[x].toString().split(',').filter(Boolean);
      else if (x === 'participants') o[x] = [];
      else if (x === 'invitedEmails' && o[x]) o[x] = o[x].toString().split(',').filter(Boolean);
      else if (x === 'invitedEmails') o[x] = [];
    });
    l.push(o);
  }
  return { schedules: l };
}

function addSchedule(doc, item) {
  const sheet = doc.getSheetByName('Schedules');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(item.id)) return { message: 'skip' };
  }

  const invitedEmails = item.invitedEmails ? (Array.isArray(item.invitedEmails) ? item.invitedEmails.join(',') : item.invitedEmails) : '';

  sheet.appendRow([
    item.id, item.type, item.title, item.date, item.time, item.meta || '',
    new Date(), item.attachmentUrl || '', item.ownerEmail || '',
    item.location || '', item.maxParticipants || 0, '', item.endDate || item.date, item.endTime || item.time,
    invitedEmails
  ]);
  return { message: 'ok' };
}

function updateSchedule(doc, schedule) {
  const sheet = doc.getSheetByName('Schedules');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf('id');
  const map = {};
  headers.forEach((h, i) => map[h] = i);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxId]) === String(schedule.id)) {
      const set = (k, v) => {
        if (map[k] !== undefined && v !== undefined) sheet.getRange(i + 1, map[k] + 1).setValue(v);
      };
      set('title', schedule.title);
      set('date', schedule.date);
      set('time', schedule.time);
      set('endDate', schedule.endDate);
      set('endTime', schedule.endTime);
      set('location', schedule.location);
      set('maxParticipants', schedule.maxParticipants);
      set('attachmentUrl', schedule.attachmentUrl);
      return { message: 'ok' };
    }
  }
  return { status: 'error', message: 'Schedule not found' };
}

function deleteSchedule(doc, id) {
  const sheet = doc.getSheetByName('Schedules');
  const data = sheet.getDataRange().getValues();
  const idColIndex = data[0].indexOf('id');
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idColIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { message: 'ok' };
    }
  }
  return { status: 'error', message: 'Not found' };
}

function rsvpEvent(doc, sid, uem, join) {
  // 1. EventRSVP 시트에서 현재 참석자 확인
  let rsvpSheet = doc.getSheetByName('EventRSVP');
  if (!rsvpSheet) {
    // 시트가 없으면 생성
    ensureSheet(doc, 'EventRSVP', ['id', 'scheduleId', 'userEmail', 'userName', 'status', 'rsvpTimestamp']);
    rsvpSheet = doc.getSheetByName('EventRSVP');
  }
  const rsvpData = rsvpSheet.getDataRange().getValues();

  // 현재 참석 중인 사람 찾기
  const activeRSVPs = [];
  let existingRowIndex = -1;
  for (let i = 1; i < rsvpData.length; i++) {
    const [id, schedId, email, name, status, timestamp] = rsvpData[i];
    if (String(schedId) === String(sid)) {
      if (status === 'registered') {
        activeRSVPs.push(email);
      }
      if (email === uem) {
        existingRowIndex = i;
      }
    }
  }

  // 2. Schedules에서 maxParticipants 확인
  const s = doc.getSheetByName('Schedules');
  const d = s.getDataRange().getValues();
  const h = d[0];
  const idxId = h.indexOf('id');
  const idxParts = h.indexOf('participants');
  const idxMax = h.indexOf('maxParticipants');

  let scheduleRowIndex = -1;
  let maxParticipants = 0;

  for (let i = 1; i < d.length; i++) {
    if (String(d[i][idxId]) === String(sid)) {
      scheduleRowIndex = i;
      maxParticipants = Number(d[i][idxMax]) || 0;
      break;
    }
  }

  if (scheduleRowIndex === -1) {
    return { status: 'error', message: 'Schedule not found' };
  }

  // 3. 참석 신청/취소 처리
  if (join) {
    // 정원 확인 (maxParticipants가 0이면 무제한)
    if (maxParticipants > 0 && activeRSVPs.length >= maxParticipants) {
      return { status: 'error', message: 'FULL' };
    }

    // 기존 RSVP 업데이트 또는 신규 추가
    if (existingRowIndex > -1) {
      rsvpSheet.getRange(existingRowIndex + 1, 5).setValue('registered');
      rsvpSheet.getRange(existingRowIndex + 1, 6).setValue(new Date());
    } else {
      // 사용자 이름 가져오기
      const userSheet = doc.getSheetByName('Users');
      const userData = userSheet.getDataRange().getValues();
      let userName = uem;
      for (let i = 1; i < userData.length; i++) {
        if (userData[i][0] === uem) {
          userName = userData[i][1] || uem;
          break;
        }
      }

      const rsvpId = 'rsvp_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
      rsvpSheet.appendRow([rsvpId, sid, uem, userName, 'registered', new Date()]);
    }

    if (!activeRSVPs.includes(uem)) {
      activeRSVPs.push(uem);
    }
  } else {
    // 취소
    if (existingRowIndex > -1) {
      rsvpSheet.getRange(existingRowIndex + 1, 5).setValue('cancelled');
      rsvpSheet.getRange(existingRowIndex + 1, 6).setValue(new Date());
    }
    const idx = activeRSVPs.indexOf(uem);
    if (idx > -1) activeRSVPs.splice(idx, 1);
  }

  // 4. Schedules의 participants 필드도 업데이트 (빠른 조회용)
  s.getRange(scheduleRowIndex + 1, idxParts + 1).setValue(activeRSVPs.join(','));

  return { message: 'ok', participants: activeRSVPs };
}

function getVideos(doc) {
  const s = doc.getSheetByName('Videos');
  if (!s) return { videos: [] };
  const d = s.getDataRange().getValues();
  const h = d[0];
  const l = [];
  for (let i = 1; i < d.length; i++) {
    const r = d[i];
    const o = {};
    h.forEach((x, k) => o[x] = r[k]);
    l.push(o);
  }
  return { videos: l.reverse() };
}

function addVideo(doc, video) {
  const s = doc.getSheetByName('Videos');
  const d = s.getDataRange().getValues();
  for (let i = 1; i < d.length; i++) {
    if (String(d[i][0]) === String(video.id)) return { message: 'skip' };
  }
  s.appendRow([
    video.id, video.title, video.author, video.duration,
    video.youtubeId || '', video.thumbnailUrl,
    video.mediaType || 'youtube', video.driveUrl || '',
    video.textContent || '', video.status || 'draft', new Date()
  ]);
  return { message: 'ok' };
}

function updateVideo(doc, id, updates) {
  const sheet = doc.getSheetByName('Videos');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf('id');
  const idxStatus = headers.indexOf('status');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxId]) === String(id)) {
      if (updates.status !== undefined && idxStatus > -1) {
        sheet.getRange(i + 1, idxStatus + 1).setValue(updates.status);
      }
      return { message: 'ok' };
    }
  }
  return { status: 'error', message: 'Video not found' };
}

function deleteVideo(doc, id) {
  const s = doc.getSheetByName('Videos');
  const d = s.getDataRange().getValues();
  for (let i = d.length - 1; i >= 1; i--) {
    if (String(d[i][0]) === String(id)) {
      s.deleteRow(i + 1);
      return { message: 'ok' };
    }
  }
  return { message: 'no' };
}

function getSettings(doc) {
  const s = doc.getSheetByName('AppSettings');
  if (!s) return { settings: {} };
  const d = s.getDataRange().getValues();
  const o = {};
  for (let i = 1; i < d.length; i++) {
    o[d[i][0]] = d[i][1];
  }
  return { settings: o };
}

function updateSettings(doc, n) {
  const s = doc.getSheetByName('AppSettings');
  s.clearContents();
  s.appendRow(['key', 'value']);
  Object.keys(n).forEach(k => s.appendRow([k, n[k]]));
  return { message: 'ok' };
}

// ============================================================
// 🆕 수행 항목 관리 (Practice Items)
// ============================================================

function getPracticeItems(doc) {
  const s = doc.getSheetByName('PracticeItems');
  if (!s) return { items: [] };
  const d = s.getDataRange().getValues();
  const l = [];
  for (let i = 1; i < d.length; i++) {
    l.push({
      id: String(d[i][0]),
      category: d[i][1],
      question: d[i][2],
      order: d[i][3] || i
    });
  }
  l.sort((a, b) => a.order - b.order);
  return { items: l };
}

function addPracticeItem(doc, item) {
  const s = doc.getSheetByName('PracticeItems');
  const d = s.getDataRange().getValues();
  for (let i = 1; i < d.length; i++) {
    if (String(d[i][0]) === String(item.id)) return { message: 'skip' };
  }
  s.appendRow([
    item.id,
    item.category || '',
    item.question,
    item.order || d.length
  ]);
  return { message: 'ok' };
}

function updatePracticeItem(doc, id, updates) {
  const sheet = doc.getSheetByName('PracticeItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const map = {};
  headers.forEach((h, i) => map[h] = i);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const set = (k, v) => {
        if (map[k] !== undefined && v !== undefined) {
          sheet.getRange(i + 1, map[k] + 1).setValue(v);
        }
      };
      set('category', updates.category);
      set('question', updates.question);
      set('order', updates.order);
      return { message: 'ok' };
    }
  }
  return { status: 'error', message: 'Item not found' };
}

function deletePracticeItem(doc, id) {
  const s = doc.getSheetByName('PracticeItems');
  const d = s.getDataRange().getValues();
  for (let i = d.length - 1; i >= 1; i--) {
    if (String(d[i][0]) === String(id)) {
      s.deleteRow(i + 1);
      return { message: 'ok' };
    }
  }
  return { message: 'no' };
}

// ============================================================
// 🆕 사용자 목록 가져오기 (초대 기능용)
// ============================================================

function getUsers(doc) {
  const s = doc.getSheetByName('Users');
  if (!s) return { users: [] };
  const d = s.getDataRange().getValues();
  const h = d[0];
  const users = [];

  for (let i = 1; i < d.length; i++) {
    const user = {};
    h.forEach((col, idx) => {
      user[col] = d[i][idx];
    });

    // 기본 정보만 반환 (보안상 민감한 정보 제외)
    users.push({
      email: user.email || '',
      name: user.name || '',
      dharmaName: user.dharmaName || '',
      photoUrl: user.photoUrl || ''
    });
  }

  return { users };
}
