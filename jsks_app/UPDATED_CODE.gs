/**
 * 정수결사 Backend (비디오 관리 기능 추가 버전)
 * 기존 코드 + draft/published 상태 + 다양한 미디어 타입 지원
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
  ensureSheet(doc, 'Schedules', ['id', 'type', 'title', 'date', 'time', 'meta', 'createdAt', 'attachmentUrl', 'ownerEmail', 'location', 'maxParticipants', 'participants']);
  ensureSheet(doc, 'PracticeLogs', ['id', 'email', 'date', 'progress', 'checkedIds', 'timestamp']);

  // 🆕 Videos 시트 - 새 필드 추가
  const videoSheet = ensureSheet(doc, 'Videos', [
    'id',
    'title',
    'author',
    'duration',
    'youtubeId',
    'thumbnailUrl',
    'mediaType',      // youtube, drive-video, drive-audio, drive-pdf, text
    'driveUrl',       // Google Drive URL
    'textContent',    // 텍스트 법문
    'status',         // draft, published
    'createdAt'
  ]);

  if (videoSheet.getLastRow() <= 1) {
    videoSheet.appendRow([
      'demo_1',
      '금강경 독송',
      '정수스님',
      '15:20',
      'sNmP8xkXliY',
      'https://img.youtube.com/vi/sNmP8xkXliY/maxresdefault.jpg',
      'youtube',
      '',
      '',
      'published',
      new Date()
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
        case 'UPDATE_VIDEO': result = updateVideo(doc, data.id, data.updates); break; // 🆕
        case 'DELETE_VIDEO': result = deleteVideo(doc, data.id); break;
        case 'GET_SETTINGS': result = getSettings(doc); break;
        case 'UPDATE_SETTINGS': result = updateSettings(doc, data.settings); break;
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
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------------
// 핵심: 로그인 시 기존 정보(trackingIds) 불러오기
// ------------------------------------------------------------------
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
  sheet.appendRow([
    item.id,
    item.type,
    item.title,
    item.date,
    item.time,
    item.meta || '',
    new Date(),
    item.attachmentUrl || '',
    item.ownerEmail || '',
    item.location || '',
    item.maxParticipants || 0,
    ''
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
  const s = doc.getSheetByName('Schedules');
  const d = s.getDataRange().getValues();
  const h = d[0];
  const idxId = h.indexOf('id');
  const idxParts = h.indexOf('participants');
  const idxMax = h.indexOf('maxParticipants');
  for (let i = 1; i < d.length; i++) {
    if (String(d[i][idxId]) === String(sid)) {
      let parts = d[i][idxParts] ? d[i][idxParts].toString().split(',').filter(Boolean) : [];
      const max = Number(d[i][idxMax]) || 0;
      if (join) {
        if (max > 0 && parts.length >= max) return { status: 'error', message: 'FULL' };
        if (!parts.includes(uem)) parts.push(uem);
      } else {
        parts = parts.filter(p => p !== uem);
      }
      s.getRange(i + 1, idxParts + 1).setValue(parts.join(','));
      return { message: 'ok', participants: parts };
    }
  }
  return { status: 'error', message: 'Not found' };
}

// ============================================================
// 🆕 비디오 관리 함수 (업데이트 버전)
// ============================================================

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

  // 중복 체크
  for (let i = 1; i < d.length; i++) {
    if (String(d[i][0]) === String(video.id)) return { message: 'skip' };
  }

  // 새 비디오 추가
  s.appendRow([
    video.id,
    video.title,
    video.author,
    video.duration,
    video.youtubeId || '',
    video.thumbnailUrl,
    video.mediaType || 'youtube',      // 🆕
    video.driveUrl || '',               // 🆕
    video.textContent || '',            // 🆕
    video.status || 'draft',            // 🆕 기본값: draft
    new Date()
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
      // status 업데이트
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

// ============================================================
// 설정 관리
// ============================================================

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
