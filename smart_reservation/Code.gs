
/**
 * Smart Coaching SaaS Platform - Backend
 * 
 * [시스템 구성 안내]
 * 1. 이 스크립트는 '마스터 스프레드시트'에 배포됩니다.
 * 2. 마스터 시트는 오직 'Directory' 시트 하나만 관리합니다 (강사 목록 및 DB 매핑).
 * 3. 강사별 데이터는 별도의 스프레드시트 파일로 완전 분리되어 자동 생성됩니다.
 */

// --- Configuration ---
const SHEET_DIRECTORY = 'Directory'; 
const SHEET_USERS = 'Users';
const SHEET_RESERVATIONS = 'Reservations';
const SHEET_SETTINGS = 'Settings';
const TIMEZONE = "Asia/Seoul"; 

// ★ 수강생 DB가 저장될 구글 드라이브 폴더 ID
const DB_FOLDER_ID = '1OpBmMhJ5JkWyxEKCxB-tgsjjjhHtbLgj'; 

// --- 1. Master Sheet Setup ---

function setupMaster() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();

  // [Self-Organization] 마스터 시트 자체를 지정된 DB 폴더로 이동
  try {
    const file = DriveApp.getFileById(doc.getId());
    const folder = DriveApp.getFolderById(DB_FOLDER_ID);
    file.moveTo(folder);
  } catch (e) {
    console.warn("Master Sheet 폴더 이동 실패 (권한 확인 필요): " + e.toString());
  }

  let dirSheet = doc.getSheetByName(SHEET_DIRECTORY);

  if (!dirSheet) {
    dirSheet = doc.insertSheet(SHEET_DIRECTORY);
    dirSheet.appendRow([
      'InstructorID',
      'Name',
      'SpreadsheetID',
      'CalendarID',
      'AccessToken',      // 캘린더 API용 Access Token
      'TokenExpiry',      // Token 만료 시간
      'CreatedAt'
    ]);
    dirSheet.setFrozenRows(1);
    dirSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f4f6');
    dirSheet.setColumnWidth(1, 200);
    dirSheet.setColumnWidth(3, 300);
    dirSheet.setColumnWidth(5, 400); // AccessToken 컬럼 넓게
  } else {
    // 기존 시트에 컬럼 추가 (마이그레이션)
    const headers = dirSheet.getRange(1, 1, 1, dirSheet.getLastColumn()).getValues()[0];
    if (!headers.includes('AccessToken')) {
      const lastCol = dirSheet.getLastColumn();
      dirSheet.getRange(1, lastCol + 1).setValue('AccessToken');
      dirSheet.getRange(1, lastCol + 2).setValue('TokenExpiry');
      dirSheet.setColumnWidth(lastCol + 1, 400);
    }
  }

  const sheet1 = doc.getSheetByName('Sheet1');
  if (sheet1 && sheet1.getLastRow() === 0) {
    doc.deleteSheet(sheet1);
  }
}

// --- Helper: Robust Calendar Access ---

function getSystemOwnerEmail() {
  // 1. 스크립트를 실행하는 주체(Admin)의 이메일 시도
  try {
    const email = Session.getEffectiveUser().getEmail();
    if (email) return email;
  } catch (e) {
    console.warn("Session.getEffectiveUser error: " + e);
  }

  // 2. 캘린더 ID로 시도
  try {
    return CalendarApp.getDefaultCalendar().getId();
  } catch (e) {
    console.warn("CalendarApp error: " + e);
  }

  // 3. 최후의 수단: 하드코딩된 개발자 이메일 반환 (빈 값 방지)
  return "flowgineer@gmail.com";
}

/**
 * 강사의 Access Token 조회 및 검증
 * @param {string} instructorId - 강사 이메일
 * @returns {string} Access Token (만료 시 에러)
 */
function getInstructorAccessToken(instructorId) {
  const masterDoc = SpreadsheetApp.getActiveSpreadsheet();
  const dirSheet = masterDoc.getSheetByName(SHEET_DIRECTORY);
  const dirData = dirSheet.getDataRange().getValues();

  for (let i = 1; i < dirData.length; i++) {
    if (dirData[i][0] === instructorId) {
      const accessToken = dirData[i][4]; // AccessToken 컬럼
      const tokenExpiry = dirData[i][5]; // TokenExpiry 컬럼

      if (!accessToken) {
        throw new Error('캘린더 권한이 없습니다. 다시 로그인해주세요.');
      }

      // Token 만료 체크
      if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
        throw new Error('캘린더 권한이 만료되었습니다. 다시 로그인해주세요.');
      }

      return accessToken;
    }
  }

  throw new Error('강사 정보를 찾을 수 없습니다.');
}

/**
 * Google Calendar API 호출 헬퍼 함수
 * @param {string} instructorId - 강사 이메일
 * @param {string} endpoint - API 엔드포인트 (예: '/calendars', '/events')
 * @param {object} options - UrlFetchApp 옵션
 */
function callCalendarAPI(instructorId, endpoint, options = {}) {
  const accessToken = getInstructorAccessToken(instructorId);
  const baseUrl = 'https://www.googleapis.com/calendar/v3';

  const defaultOptions = {
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const finalOptions = Object.assign({}, defaultOptions, options);

  try {
    const response = UrlFetchApp.fetch(baseUrl + endpoint, finalOptions);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 401) {
      throw new Error('캘린더 권한이 만료되었습니다. 다시 로그인해주세요.');
    }

    if (responseCode >= 400) {
      Logger.error(`Calendar API Error ${responseCode}: ${responseText}`);
      throw new Error(`캘린더 API 오류: ${responseText}`);
    }

    return JSON.parse(responseText);

  } catch (e) {
    Logger.error('Calendar API Call Failed: ' + e.toString());
    throw e;
  }
}

/**
 * 이메일 발송 헬퍼 함수
 */
function sendEmailNotification(to, subject, htmlBody) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      noReply: true
    });
  } catch (e) {
    console.warn(`[Email Failed] To: ${to}, Error: ${e.toString()}`);
  }
}

/**
 * 캘린더 충돌 체크 (에러 무시 모드)
 */
/**
 * 강사의 모든 캘린더(개인 + 모든 코칭 캘린더)에서 충돌 체크
 * OAuth 2.0 방식 사용
 */
function checkAllCalendarsConflict(instructorId, db, startTime, endTime) {
  try {
    // 1. 모든 코칭 캘린더 ID 수집
    const coachingSheet = db.getSheetByName('Coachings');
    const calendarIds = [];

    if (coachingSheet) {
      const coachingData = coachingSheet.getDataRange().getValues();
      for (let i = 1; i < coachingData.length; i++) {
        const calendarId = coachingData[i][2]; // GoogleCalendarID
        if (calendarId && coachingData[i][4] === 'active') {
          calendarIds.push(calendarId);
        }
      }
    }

    // 2. 강사의 primary 캘린더도 추가 (개인 일정 체크)
    calendarIds.push('primary');

    // 3. 각 캘린더에서 충돌 체크 (OAuth 2.0 사용)
    for (const calendarId of calendarIds) {
      try {
        const events = callCalendarAPI(
          instructorId,
          `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${startTime.toISOString()}&timeMax=${endTime.toISOString()}&singleEvents=true&maxResults=1`,
          { method: 'get' }
        );

        if (events.items && events.items.length > 0) {
          console.log(`[Conflict] Found event in calendar ${calendarId}: ${events.items[0].summary}`);
          return true; // 충돌 발견
        }
      } catch (e) {
        console.warn(`[Conflict Check] Failed for ${calendarId}: ${e.toString()}`);
        // 권한 문제 등으로 실패해도 계속 진행 (다른 캘린더 체크)
      }
    }

    return false; // 충돌 없음
  } catch (e) {
    console.error(`[Conflict Check] Error: ${e.toString()}`);
    return false; // 에러 시 안전하게 false 반환
  }
}

// 레거시 함수 유지 (기존 코드 호환성)
function checkCalendarConflict(calendarId, startTime, endTime) {
  if (typeof Calendar !== 'undefined') {
    try {
      const events = Calendar.Events.list(calendarId, {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        maxResults: 1
      });
      return events.items && events.items.length > 0;
    } catch (e) {
      console.warn(`[Conflict Check] Skipped for ${calendarId} due to error (likely permission): ${e.toString()}`);
    }
  }

  const cal = getSafeCalendar(calendarId);
  if (cal) {
    return cal.getEvents(startTime, endTime).length > 0;
  }
  return false;
}

function getSafeCalendar(calendarId) {
  if (!calendarId) return null;
  let cal = null;
  try { cal = CalendarApp.getCalendarById(calendarId); } catch (e) {}
  
  if (!cal) {
     try { 
       CalendarApp.subscribeToCalendar(calendarId); 
       cal = CalendarApp.getCalendarById(calendarId);
     } catch (e) {
       console.warn(`Subscribe attempt failed for ${calendarId}: ${e.toString()}`);
     }
  }
  return cal;
}


// --- 2. SaaS Core Logic (DB Routing) ---

function getInstructorSpreadsheet(instructorId, instructorName = 'New Coach') {
  if (!instructorId) throw new Error("시스템 오류: 강사 ID(Email)가 전달되지 않았습니다.");

  // [Optimization] 1. Try Cache First
  // 마스터 시트를 매번 여는 것은 느리므로, CacheService를 통해 ID 매핑을 저장합니다.
  const cache = CacheService.getScriptCache();
  const cacheKey = `SHEET_ID_${instructorId}`;
  const cachedSheetId = cache.get(cacheKey);

  if (cachedSheetId) {
    try {
      return SpreadsheetApp.openById(cachedSheetId);
    } catch (e) {
      // 파일이 삭제되었거나 권한 문제가 생겼으면 캐시 날리고 다시 조회
      cache.remove(cacheKey);
      console.warn(`Cached sheet ID invalid: ${cachedSheetId}`);
    }
  }

  // [Fallback] 2. Open Master Sheet & Lookup
  const masterDoc = SpreadsheetApp.getActiveSpreadsheet();
  let dirSheet = masterDoc.getSheetByName(SHEET_DIRECTORY);
  
  if (!dirSheet) {
    setupMaster(); 
    dirSheet = masterDoc.getSheetByName(SHEET_DIRECTORY);
  }

  const data = dirSheet.getDataRange().getValues();
  let targetSpreadsheetId = null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === instructorId) {
      targetSpreadsheetId = data[i][2]; 
      break;
    }
  }

  if (!targetSpreadsheetId) {
    // ... (새 시트 생성 로직 동일) ...
    const fileName = `[CoachDB] ${instructorName} (${instructorId})`;
    const newDoc = SpreadsheetApp.create(fileName);
    targetSpreadsheetId = newDoc.getId();
    
    try {
      const file = DriveApp.getFileById(targetSpreadsheetId);
      const folder = DriveApp.getFolderById(DB_FOLDER_ID);
      file.moveTo(folder); 
      newDoc.addEditor(instructorId); 
      
      MailApp.sendEmail({
        to: instructorId,
        subject: `[스마트 코칭] ${instructorName}님의 데이터베이스가 생성되었습니다.`,
        body: `안녕하세요, 코치님.\n\nDB 링크: ${newDoc.getUrl()}`
      });
      
    } catch (e) {
      console.warn(`Failed to setup drive permissions: ${e.toString()}`);
    }

    dirSheet.appendRow([instructorId, instructorName, targetSpreadsheetId, instructorId, new Date()]);
    setupInstructorSheet(newDoc, instructorId);
  }

  // [Optimization] Store result in cache for 6 hours
  if (targetSpreadsheetId) {
    cache.put(cacheKey, targetSpreadsheetId, 21600);
  }

  return SpreadsheetApp.openById(targetSpreadsheetId);
}

function setupInstructorSheet(doc, instructorId) {
  let setSheet = doc.getSheetByName(SHEET_SETTINGS);
  if (!setSheet) {
    setSheet = doc.insertSheet(SHEET_SETTINGS);
    setSheet.appendRow(['DayIndex', 'DayName', 'StartTime', 'EndTime', 'IsWorking']);
    const defaults = [
      [0, 'Sunday', "'10:00", "'19:00", false],
      [1, 'Monday', "'10:00", "'19:00", true],
      [2, 'Tuesday', "'10:00", "'19:00", true],
      [3, 'Wednesday', "'10:00", "'19:00", true],
      [4, 'Thursday', "'10:00", "'19:00", true],
      [5, 'Friday', "'10:00", "'19:00", true],
      [6, 'Saturday', "'10:00", "'19:00", false]
    ];
    setSheet.getRange(2, 1, defaults.length, 5).setValues(defaults);
    setSheet.getRange("C2:D8").setNumberFormat("@");
  }

  let userSheet = doc.getSheetByName(SHEET_USERS);
  if (!userSheet) {
    userSheet = doc.insertSheet(SHEET_USERS);
    userSheet.appendRow(['Email', 'Name', 'TotalSessions', 'RemainingSessions', 'Avatar', 'CreatedAt']);
  }

  let resSheet = doc.getSheetByName(SHEET_RESERVATIONS);
  if (!resSheet) {
    resSheet = doc.insertSheet(SHEET_RESERVATIONS);
    resSheet.appendRow(['ReservationID', 'CoachingID', 'PackageID', 'Email', 'Date', 'Time', 'Status', 'CreatedAt', 'CalendarEventID', 'MeetLink']);
  } else {
    // 기존 시트에 CoachingID, PackageID 열 추가 (마이그레이션)
    const headers = resSheet.getRange(1, 1, 1, resSheet.getLastColumn()).getValues()[0];
    if (!headers.includes('CoachingID')) {
      resSheet.insertColumnBefore(2);
      resSheet.getRange(1, 2).setValue('CoachingID');
    }
    if (!headers.includes('PackageID')) {
      const coachingIdx = resSheet.getRange(1, 1, 1, resSheet.getLastColumn()).getValues()[0].indexOf('CoachingID');
      resSheet.insertColumnAfter(coachingIdx + 1);
      resSheet.getRange(1, coachingIdx + 2).setValue('PackageID');
    }
  }
}

// --- 3. API Entry Point ---

/**
 * CORS 헤더가 포함된 응답 생성
 */
function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  return output;
}

/**
 * OPTIONS 요청 처리 (CORS preflight)
 */
function doGet(e) {
  return createCorsResponse({ status: 'ok', message: 'API is running' });
}

function doPost(e) {
  // [Optimization] Reduce Lock Timeout to fail fast if congested, though 30s is safe.
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    // 회원가입/삭제/로그인은 instructorId 불필요
    if (action === 'signup') {
      const result = handleSignup(params);
      return createCorsResponse({ status: 'success', data: result });
    }

    if (action === 'deleteAccount') {
      const result = handleDeleteAccount(params);
      return createCorsResponse({ status: 'success', data: result });
    }

    if (action === 'login') {
      const result = handleLogin(null, params);
      return createCorsResponse({ status: 'success', data: result });
    }

    // 기존 액션들은 instructorId 필요
    const instructorId = params.instructorId;
    const instructorName = params.instructorName || (instructorId ? instructorId.split('@')[0] : 'Coach');

    if (!instructorId) throw new Error("Coach ID(Email) is missing.");

    let result = {};
    const db = getInstructorSpreadsheet(instructorId, instructorName);

    if (action === 'getRemainingSessions') result = handleGetRemainingSessions(db, params); // Optimized
    else if (action === 'getCoachDashboard') result = handleGetCoachDashboard(db, params, instructorId);
    else if (action === 'getCoachUsers') result = handleGetCoachUsers(db);
    else if (action === 'updateUserCredits') result = handleUpdateUserCredits(db, params);
    else if (action === 'updateSettings') result = handleUpdateSettings(db, params);
    else if (action === 'updateCoachSettings') result = handleUpdateCoachSettings(params, instructorId);
    else if (action === 'makeReservation') result = handleMakeReservation(db, params, instructorId);
    else if (action === 'getAvailability') result = handleGetAvailability(db, params, instructorId);
    else if (action === 'cancelReservation') result = handleCancelReservation(db, params, instructorId);
    else if (action === 'checkCalendarConnection') result = handleCheckCalendarConnection(instructorId);
    else if (action === 'createCoaching') result = handleCreateCoaching(params, instructorId);  // 새로 추가
    else if (action === 'getCoachings') result = handleGetCoachings(db);  // 새로 추가
    else throw new Error(`Unknown action: ${action}`);

    return createCorsResponse({ status: 'success', data: result });

  } catch (e) {
    return createCorsResponse({ status: 'error', message: e.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- 4. Handlers ---

// [Optimization] Consolidated logic for handleGetRemainingSessions to minimize reads
function handleGetRemainingSessions(db, params) {
  const { email } = params;
  
  const userSheet = db.getSheetByName(SHEET_USERS);
  const resSheet = db.getSheetByName(SHEET_RESERVATIONS);
  
  // 1. Read Users
  const userData = userSheet.getDataRange().getValues();
  let userRowIndex = -1;
  let totalSessions = 0;
  let currentRemaining = 0;

  for (let i = 1; i < userData.length; i++) {
    if (userData[i][0] === email) {
      userRowIndex = i + 1;
      totalSessions = Number(userData[i][2]);
      currentRemaining = Number(userData[i][3]);
      break;
    }
  }

  if (userRowIndex === -1) throw new Error('이 강사의 회원 목록에 존재하지 않습니다.');

  // 2. Read Reservations (Only once)
  const resData = resSheet.getDataRange().getValues();
  
  let usedCount = 0;
  const myReservations = [];

  // Start from row 1 (skip header)
  for (let i = 1; i < resData.length; i++) {
    const row = resData[i];
    // Count usage
    if (row[1] === email && row[4] === '확정됨') {
      usedCount++;
    }
    // Collect list
    if (row[1] === email) {
      let dateStr = row[2] instanceof Date ? Utilities.formatDate(row[2], TIMEZONE, "yyyy-MM-dd") : row[2];
      let timeStr = row[3] instanceof Date ? Utilities.formatDate(row[3], TIMEZONE, "HH:mm") : row[3];
      myReservations.push({ 
        reservationId: row[0], 
        date: dateStr, 
        time: timeStr, 
        status: row[4], 
        meetLink: row[7] || null, 
        instructorName: 'Coach' 
      });
    }
  }

  // 3. Calc & Write if needed
  const realRemaining = totalSessions - usedCount;
  
  // [Optimization] Write only if value changed to save time
  if (realRemaining !== currentRemaining) {
     userSheet.getRange(userRowIndex, 4).setValue(realRemaining);
  }

  // 4. Sort (Memory op, fast)
  myReservations.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

  return { remaining: realRemaining, reservations: myReservations };
}

// Other handlers remain mostly same, just ensuring getInstructorSpreadsheet is optimized
function handleUpdateCoachSettings(params, instructorId) {
    const { calendarId } = params;
    const masterDoc = SpreadsheetApp.getActiveSpreadsheet();
    const dirSheet = masterDoc.getSheetByName(SHEET_DIRECTORY);
    const data = dirSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === instructorId) {
            if (calendarId) {
                dirSheet.getRange(i + 1, 4).setValue(calendarId);
            }
            return { success: true, calendarId };
        }
    }
    throw new Error("Coach not found in directory");
}

function handleCheckCalendarConnection(instructorId) {
  const adminEmail = getSystemOwnerEmail();
  const masterDoc = SpreadsheetApp.getActiveSpreadsheet();
  const dirSheet = masterDoc.getSheetByName(SHEET_DIRECTORY);
  const data = dirSheet.getDataRange().getValues();
  let calendarId = instructorId;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === instructorId) { calendarId = data[i][3] || instructorId; break; }
  }

  let isConnected = false;
  let debugMessage = "";
  
  // Debug Info: running user
  try {
     const runningAs = Session.getEffectiveUser().getEmail();
     debugMessage += `[System: ${runningAs}] `;
  } catch(e) { debugMessage += "[System: Unknown] "; }

  try {
     const cal = CalendarApp.getCalendarById(calendarId);
     if (cal) {
         isConnected = true;
     } else {
         CalendarApp.subscribeToCalendar(calendarId);
         if (CalendarApp.getCalendarById(calendarId)) {
             isConnected = true;
         } else {
             debugMessage += "Subscribe call succeeded but getById still returned null (Sync delay?); ";
         }
     }
  } catch (e) {
     debugMessage += `Standard API Error: ${e.toString()}. `;
  }

  if (!isConnected && typeof Calendar !== 'undefined') {
      try {
          Calendar.Events.list(calendarId, { maxResults: 1 });
          isConnected = true;
          debugMessage = "Connected via Advanced API (Standard failed).";
      } catch(e) {
          debugMessage += `Advanced API Error: ${e.toString()}. `;
      }
  }
  
  return { isConnected, adminEmail, instructorId, calendarId, debugMessage };
}

function handleGetCoachUsers(db) {
  const userSheet = db.getSheetByName(SHEET_USERS);
  const data = userSheet.getDataRange().getValues();
  data.shift(); 
  return data.map(row => ({
    email: row[0], name: row[1], total: row[2], remaining: row[3], picture: row[4], createdAt: row[5]
  }));
}

function handleUpdateUserCredits(db, params) {
  const { userEmail, newTotal } = params;
  const userSheet = db.getSheetByName(SHEET_USERS);
  const data = userSheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userEmail) { rowIndex = i + 1; break; }
  }
  if (rowIndex === -1) throw new Error("사용자를 찾을 수 없습니다.");
  userSheet.getRange(rowIndex, 3).setValue(newTotal);
  const newBalance = syncUserBalance(db, userEmail);
  return { success: true, user: { email: userEmail, total: newTotal, remaining: newBalance.remaining } };
}

function handleUpdateSettings(db, params) {
  const { workingHours } = params;
  const setSheet = db.getSheetByName(SHEET_SETTINGS);
  const newValues = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let i = 0; i < 7; i++) {
    const setting = workingHours[i];
    newValues.push([i, dayNames[i], "'" + setting.start, "'" + setting.end, setting.isWorking]);
  }
  setSheet.getRange(2, 1, 7, 5).setValues(newValues);
  return { success: true };
}

function handleLogin(db, params) {
  const { email, name, picture } = params;
  const sheet = db.getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  let userRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email) { userRowIndex = i + 1; break; }
  }
  if (userRowIndex === -1) {
    const newUser = [email, name || 'Student', 5, 5, picture || '', new Date()];
    sheet.appendRow(newUser);
    return { email: newUser[0], name: newUser[1], remaining: newUser[3], picture: newUser[4] };
  } else {
    // For Login, we still use syncUserBalance, or we can optimize if login is slow
    const synced = syncUserBalance(db, email);
    const row = data[userRowIndex - 1];
    return { email: row[0], name: row[1], remaining: synced ? synced.remaining : row[3], picture: row[4] };
  }
}

function syncUserBalance(db, email) {
  const userSheet = db.getSheetByName(SHEET_USERS);
  const resSheet = db.getSheetByName(SHEET_RESERVATIONS);
  const userData = userSheet.getDataRange().getValues();
  let userRowIndex = -1;
  let totalSessions = 0;
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][0] === email) {
      userRowIndex = i + 1;
      totalSessions = Number(userData[i][2]);
      break;
    }
  }
  if (userRowIndex === -1) return null;
  const resData = resSheet.getDataRange().getValues();
  let usedCount = 0;
  for (let i = 1; i < resData.length; i++) {
    if (resData[i][1] === email && resData[i][4] === '확정됨') usedCount++;
  }
  const remaining = totalSessions - usedCount;
  
  // [Optimization] Conditional Write
  const currentVal = userData[userRowIndex-1][3];
  if (currentVal != remaining) {
      userSheet.getRange(userRowIndex, 4).setValue(remaining);
  }
  return { row: userRowIndex, total: totalSessions, remaining: remaining };
}

function handleGetCoachDashboard(db, params, instructorId) {
  const userSheet = db.getSheetByName(SHEET_USERS);
  const userData = userSheet.getDataRange().getValues();
  const userMap = {}; 
  for (let i = 1; i < userData.length; i++) { userMap[userData[i][0]] = userData[i][1]; }
  const resSheet = db.getSheetByName(SHEET_RESERVATIONS);
  const resData = resSheet.getDataRange().getValues();
  resData.shift(); 
  const allReservations = resData
    .map(row => {
      let dateStr = row[2] instanceof Date ? Utilities.formatDate(row[2], TIMEZONE, "yyyy-MM-dd") : row[2];
      let timeStr = row[3] instanceof Date ? Utilities.formatDate(row[3], TIMEZONE, "HH:mm") : row[3];
      return {
        reservationId: row[0], studentEmail: row[1], studentName: userMap[row[1]] || row[1].split('@')[0], 
        date: dateStr, time: timeStr, status: row[4], meetLink: row[7] || null,
      };
    })
    .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
  return { isCoach: true, reservations: allReservations, totalStudents: userData.length - 1, remaining: 999 };
}

function handleGetAvailability(db, params, instructorId) {
  const { startDate, endDate } = params;
  const masterDoc = SpreadsheetApp.getActiveSpreadsheet();
  // ... (Availability logic follows same pattern, simplified for brevity but works same) ...
  // Re-implementing logic with cache if needed, but for now we trust getInstructorSpreadsheet
  // Note: Availability uses calendarId from directory.
  
  // Need to get calendarId efficiently. 
  // We can't cache the entire directory easily, but lookup is fast enough if DB open is cached.
  const dirSheet = masterDoc.getSheetByName(SHEET_DIRECTORY);
  const dirData = dirSheet.getDataRange().getValues();
  let calendarId = instructorId;
  for(let i=1; i<dirData.length; i++) {
    if(dirData[i][0] === instructorId) { calendarId = dirData[i][3] || instructorId; break; }
  }

  const setSheet = db.getSheetByName(SHEET_SETTINGS);
  const setData = setSheet.getDataRange().getValues();
  setData.shift();
  const workingHours = {};
  setData.forEach(row => {
    let startStr = String(row[2]).replace(/'/g, '');
    if (row[2] instanceof Date) startStr = Utilities.formatDate(row[2], TIMEZONE, "HH:mm");
    let endStr = String(row[3]).replace(/'/g, '');
    if (row[3] instanceof Date) endStr = Utilities.formatDate(row[3], TIMEZONE, "HH:mm");
    workingHours[row[0]] = { start: startStr.substring(0, 5), end: endStr.substring(0, 5), isWorking: row[4] === true || String(row[4]).toLowerCase() === 'true' };
  });

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59);

  const resSheet = db.getSheetByName(SHEET_RESERVATIONS);
  const resData = resSheet.getDataRange().getValues();
  resData.shift();

  const systemBusy = resData
    .filter(row => row[4] !== '취소됨')
    .map(row => {
      let d = row[2] instanceof Date ? Utilities.formatDate(row[2], TIMEZONE, "yyyy-MM-dd") : row[2];
      let t = row[3] instanceof Date ? Utilities.formatDate(row[3], TIMEZONE, "HH:mm") : row[3];
      const startDt = new Date(`${d}T${t}:00`);
      return { start: startDt.toISOString(), end: new Date(startDt.getTime() + 60*60*1000).toISOString(), source: 'system' };
    });

  // 모든 캘린더(개인 + 모든 코칭 캘린더)에서 busy 시간 수집
  let calendarBusy = [];
  try {
    // 1. 모든 코칭 캘린더 수집
    const calendarIds = ['primary']; // 개인 캘린더 포함
    const coachingSheet = db.getSheetByName('Coachings');
    if (coachingSheet) {
      const coachingData = coachingSheet.getDataRange().getValues();
      for (let i = 1; i < coachingData.length; i++) {
        const calId = coachingData[i][2];
        if (calId && coachingData[i][4] === 'active') {
          calendarIds.push(calId);
        }
      }
    }

    // 2. 각 캘린더에서 이벤트 조회 (OAuth 2.0)
    for (const calId of calendarIds) {
      try {
        const events = callCalendarAPI(
          instructorId,
          `/calendars/${encodeURIComponent(calId)}/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true`,
          { method: 'get' }
        );

        if (events.items) {
          const busyFromCal = events.items.map(evt => ({
            start: evt.start.dateTime || evt.start.date,
            end: evt.end.dateTime || evt.end.date,
            source: 'calendar'
          }));
          calendarBusy = calendarBusy.concat(busyFromCal);
        }
      } catch (e) {
        console.warn(`[Availability] Failed to fetch from ${calId}: ${e.toString()}`);
      }
    }
  } catch(e) { console.warn("Cal error (Availability)", e); }

  return { workingHours: workingHours, busyRanges: [...systemBusy, ...calendarBusy] };
}

function handleMakeReservation(db, params, instructorId) {
    const { email, date, time, coachingId } = params;

    if (!coachingId) throw new Error('코칭 ID가 필요합니다.');

    // 1. 코칭 정보 조회 (코칭별 캘린더 ID 가져오기)
    const coachingSheet = db.getSheetByName('Coachings');
    if (!coachingSheet) throw new Error('코칭 정보를 찾을 수 없습니다.');

    const coachingData = coachingSheet.getDataRange().getValues();
    let coachingCalendarId = null;
    let coachingName = '';

    for (let i = 1; i < coachingData.length; i++) {
      if (coachingData[i][0] === coachingId) {
        coachingCalendarId = coachingData[i][2]; // GoogleCalendarID
        coachingName = coachingData[i][1]; // CoachingName
        break;
      }
    }

    if (!coachingCalendarId) throw new Error('해당 코칭의 캘린더를 찾을 수 없습니다.'); 

  // 2. 수강권 확인 (강사가 아닌 경우)
  const resSheet = db.getSheetByName(SHEET_RESERVATIONS);
  if (email !== instructorId) {
      const balance = syncUserBalance(db, email);
      if (!balance || balance.remaining <= 0) throw new Error('수강권이 부족합니다.');
  }

  // 3. 중복 예약 확인
  const resData = resSheet.getDataRange().getValues();
  const isTaken = resData.some((row, i) => {
    if (i === 0) return false;
    let rDate = row[2] instanceof Date ? Utilities.formatDate(row[2], TIMEZONE, "yyyy-MM-dd") : row[2];
    let rTime = row[3] instanceof Date ? Utilities.formatDate(row[3], TIMEZONE, "HH:mm") : row[3];
    return rDate === date && rTime === time && row[4] !== '취소됨' && row[1] === coachingId;
  });
  if (isTaken) throw new Error('이미 예약된 시간입니다.');

  const reservationId = Utilities.getUuid();
  let meetLink = "";
  let eventId = "";

  // 4. 구글 캘린더에 이벤트 생성 (OAuth 2.0 방식)
  try {
     const startTime = new Date(`${date}T${time}:00`);
     const endTime = new Date(startTime.getTime() + 3600000);

     // 4-1. 모든 캘린더에서 충돌 체크
     if (checkAllCalendarsConflict(instructorId, db, startTime, endTime)) {
       throw new Error('해당 시간에 다른 일정이 있어 예약할 수 없습니다.');
     }

     // 4-2. 캘린더 이벤트 생성 (강사가 주최자로 설정)
     const eventPayload = {
      summary: `[${coachingName}] ${email}`,
      description: `예약 ID: ${reservationId}\n수강생: ${email}\n강사: ${instructorId}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: TIMEZONE
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: TIMEZONE
      },
      attendees: [
        { email: instructorId, organizer: true, responseStatus: 'accepted' },
        { email: email }
      ],
      conferenceData: {
        createRequest: {
          requestId: Utilities.getUuid(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    // Calendar API 호출 (강사의 access token 사용)
    const event = callCalendarAPI(
      instructorId,
      `/calendars/${encodeURIComponent(coachingCalendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: 'post',
        payload: JSON.stringify(eventPayload)
      }
    );

    meetLink = event.hangoutLink || '';
    eventId = event.id || '';
  } catch(e) {
    throw new Error('캘린더 이벤트 생성 실패: ' + e.toString());
  }

  // 5. 예약 저장 (새 열 구조: ReservationID, CoachingID, PackageID, Email, Date, Time, Status, CreatedAt, CalendarEventID, MeetLink)
  const packageId = params.packageId || '';  // 향후 수강권 기능 구현 시 사용
  resSheet.appendRow([reservationId, coachingId, packageId, email, date, time, '확정됨', new Date(), eventId, meetLink]);
  
  // 6. 이메일 알림 전송
  const formattedDate = `${date} ${time}`;
  const coachName = instructorId.split('@')[0];

  // 수강생에게 전송
  const studentSubject = `[예약 확정] ${coachingName} - ${coachName} 코치님`;
  const studentBody = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2563eb;">예약이 확정되었습니다 🎉</h2>
      <p>안녕하세요,</p>
      <p><strong>${coachName}</strong> 코치님의 <strong>${coachingName}</strong> 예약이 정상적으로 접수되었습니다.</p>
      <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;">📚 <strong>코칭:</strong> ${coachingName}</p>
        <p style="margin: 5px 0;">📅 <strong>일시:</strong> ${formattedDate}</p>
        ${meetLink ? `<p style="margin: 5px 0;">🎥 <strong>화상 회의:</strong> <a href="${meetLink}" style="color: #2563eb; text-decoration: none;">입장 링크</a></p>` : '<p style="margin: 5px 0; color: #666;">* 화상 회의 링크는 캘린더 일정을 확인해주세요.</p>'}
      </div>
      <p style="font-size: 12px; color: #666;">💡 변경이나 취소는 대시보드에서 1시간 전까지 가능합니다.</p>
    </div>
  `;
  sendEmailNotification(email, studentSubject, studentBody);

  // 강사에게 전송
  if (email !== instructorId) {
    const coachSubject = `[새 예약] ${coachingName} - ${email}님`;
    const coachBody = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #16a34a;">새로운 예약이 있습니다 ✨</h2>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;">📚 <strong>코칭:</strong> ${coachingName}</p>
          <p style="margin: 5px 0;">👤 <strong>수강생:</strong> ${email}</p>
          <p style="margin: 5px 0;">📅 <strong>일시:</strong> ${formattedDate}</p>
          ${meetLink ? `<p style="margin: 5px 0;">🎥 <strong>링크:</strong> <a href="${meetLink}" style="color: #16a34a; text-decoration: none;">입장하기</a></p>` : ''}
        </div>
      </div>
    `;
    sendEmailNotification(instructorId, coachSubject, coachBody);
  }

  let remaining = 999;
  if (email !== instructorId) {
      const newBalance = syncUserBalance(db, email);
      remaining = newBalance.remaining;
  }
  return { remaining: remaining, reservationId: reservationId, status: '확정됨', meetLink: meetLink };
}

function handleCancelReservation(db, params, instructorId) {
    const { email, reservationId } = params;
    const masterDoc = SpreadsheetApp.getActiveSpreadsheet();
    const dirSheet = masterDoc.getSheetByName(SHEET_DIRECTORY);
    const dirData = dirSheet.getDataRange().getValues();
    let calendarId = instructorId;
    for(let i=1; i<dirData.length; i++) {
        if(dirData[i][0] === instructorId) { calendarId = dirData[i][3] || instructorId; break; }
    }
    calendarId = calendarId.trim();

  const resSheet = db.getSheetByName(SHEET_RESERVATIONS);
  const data = resSheet.getDataRange().getValues();
  let rowIndex = -1;
  let eventId = null;
  let studentEmail = email;
  
  // Notification Data
  let notifDate = "";
  let notifTime = "";
  
  for(let i=1; i<data.length; i++) {
    const rowId = data[i][0];
    const rowEmail = data[i][1];
    if (rowId === reservationId) {
        if (email === instructorId) studentEmail = rowEmail;
        else if (email !== rowEmail) throw new Error('본인의 예약만 취소할 수 있습니다.');
        
        rowIndex = i + 1;
        eventId = data[i][6];
        
        notifDate = data[i][2] instanceof Date ? Utilities.formatDate(data[i][2], TIMEZONE, "yyyy-MM-dd") : data[i][2];
        notifTime = data[i][3] instanceof Date ? Utilities.formatDate(data[i][3], TIMEZONE, "HH:mm") : data[i][3];

        if (data[i][4] === '취소됨') throw new Error('이미 취소된 예약입니다.');
        break;
    }
  }

  if (rowIndex === -1) throw new Error('예약 내역을 찾을 수 없습니다.');
  resSheet.getRange(rowIndex, 5).setValue('취소됨');

  if (eventId) {
    try {
      if (typeof Calendar !== 'undefined') {
          try {
             Calendar.Events.remove(calendarId, eventId, { sendUpdates: 'all' });
          } catch(e) {
             Calendar.Events.remove('primary', eventId, { sendUpdates: 'all' });
          }
      } else {
        try {
            const cal = getSafeCalendar(calendarId);
            const event = cal.getEventById(eventId);
            if (event) event.deleteEvent();
        } catch(e) {}
      }
    } catch(e) { console.warn("Cal delete failed", e); }
  }
  
  // --- Send Cancellation Emails ---
  const formattedDate = `${notifDate} ${notifTime}`;
  const coachName = instructorId.split('@')[0];
  const cancelledBy = (email === instructorId) ? "코치" : "수강생";

  // 1. To Student
  const studentSubject = `[예약 취소] ${formattedDate} 세션이 취소되었습니다`;
  const studentBody = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #dc2626;">예약이 취소되었습니다.</h2>
      <p><strong>${cancelledBy}</strong>의 요청으로 다음 예약이 취소되었습니다.</p>
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
        <p style="margin: 5px 0;">📅 <strong>일시:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0;">👤 <strong>코치:</strong> ${coachName}</p>
      </div>
      <p style="font-size: 12px; color: #666;">* 수강권은 자동으로 반환되었습니다.</p>
    </div>
  `;
  sendEmailNotification(studentEmail, studentSubject, studentBody);

  if (email !== instructorId) {
      const coachSubject = `[예약 취소] ${studentEmail}님 - ${formattedDate}`;
      const coachBody = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #dc2626;">수강생이 예약을 취소했습니다.</h2>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
            <p style="margin: 5px 0;">👤 <strong>수강생:</strong> ${studentEmail}</p>
            <p style="margin: 5px 0;">📅 <strong>일시:</strong> ${formattedDate}</p>
          </div>
        </div>
      `;
      sendEmailNotification(instructorId, coachSubject, coachBody);
  }

  const newBalance = syncUserBalance(db, studentEmail);
  return { remaining: newBalance ? newBalance.remaining : 0 };
}

// --- 새 기능: 강사 회원가입/삭제 ---

/**
 * 강사 회원가입 (Master Directory에 등록)
 */
function handleSignup(params) {
  const { email, name, picture, userType, username, bio, studioName, phone, accessToken } = params;

  if (!email || !name) throw new Error('이메일과 이름은 필수입니다.');
  if (userType === 'instructor' && !username) throw new Error('강사는 username이 필수입니다.');

  const masterDoc = SpreadsheetApp.getActiveSpreadsheet();
  const dirSheet = masterDoc.getSheetByName(SHEET_DIRECTORY);

  if (!dirSheet) throw new Error('Directory 시트가 없습니다. setupMaster()를 먼저 실행하세요.');

  // 중복 체크
  const dirData = dirSheet.getDataRange().getValues();
  for (let i = 1; i < dirData.length; i++) {
    if (dirData[i][0] === email) {
      throw new Error('이미 등록된 이메일입니다.');
    }
  }

  // 강사인 경우: 전용 스프레드시트 생성
  let spreadsheetId = '';
  if (userType === 'instructor') {
    const instructorName = name || email.split('@')[0];
    const newDoc = getInstructorSpreadsheet(email, instructorName);
    spreadsheetId = newDoc.getId();
  }

  // Access Token 만료 시간 계산 (1시간 후)
  const tokenExpiry = accessToken ? new Date(Date.now() + 3600000) : null;

  // Directory에 등록
  const timestamp = new Date();
  dirSheet.appendRow([
    email,                    // InstructorID
    name,                     // Name
    spreadsheetId,            // SpreadsheetID
    email,                    // CalendarID (기본값: 본인 이메일)
    accessToken || '',        // AccessToken (캘린더 API용)
    tokenExpiry,              // TokenExpiry
    timestamp                 // CreatedAt
  ]);

  // 사용자 정보 반환
  return {
    email: email,
    name: name,
    picture: picture || '',
    userType: userType,
    username: username || '',
    bio: bio || '',
    studioName: studioName || '',
    phone: phone || '',
    remaining: userType === 'instructor' ? 999 : 0,
    isProfileComplete: userType === 'instructor' ? false : true
  };
}

/**
 * 강사 계정 삭제 (Master Directory에서 제거 + 스프레드시트 삭제)
 */
function handleDeleteAccount(params) {
  const { email } = params;

  if (!email) throw new Error('이메일은 필수입니다.');

  const masterDoc = SpreadsheetApp.getActiveSpreadsheet();
  const dirSheet = masterDoc.getSheetByName(SHEET_DIRECTORY);

  if (!dirSheet) throw new Error('Directory 시트가 없습니다.');

  const dirData = dirSheet.getDataRange().getValues();
  let rowIndex = -1;
  let spreadsheetId = '';

  // 해당 강사 찾기
  for (let i = 1; i < dirData.length; i++) {
    if (dirData[i][0] === email) {
      rowIndex = i + 1;
      spreadsheetId = dirData[i][2];
      break;
    }
  }

  if (rowIndex === -1) throw new Error('등록되지 않은 계정입니다.');

  // Directory에서 삭제
  dirSheet.deleteRow(rowIndex);

  // 강사 전용 스프레드시트 삭제 (휴지통으로 이동)
  if (spreadsheetId) {
    try {
      const file = DriveApp.getFileById(spreadsheetId);
      file.setTrashed(true);
    } catch (e) {
      console.warn(`스프레드시트 삭제 실패 (${spreadsheetId}): ${e.toString()}`);
    }
  }

  return { message: '계정이 성공적으로 삭제되었습니다.' };
}

// --- 코칭 관리 (캘린더 자동 생성) ---

/**
 * 코칭 생성 + 구글 캘린더 자동 생성
 */
function handleCreateCoaching(params, instructorId) {
  const { coachingName } = params;

  if (!coachingName) throw new Error('코칭 이름은 필수입니다.');

  // 1. 강사 전용 DB 가져오기
  const db = getInstructorSpreadsheet(instructorId, instructorId.split('@')[0]);

  // 2. Coachings 시트 생성 (없으면)
  let coachingSheet = db.getSheetByName('Coachings');
  if (!coachingSheet) {
    coachingSheet = db.insertSheet('Coachings');
    coachingSheet.appendRow([
      'CoachingID',
      'CoachingName',
      'GoogleCalendarID',
      'InstructorID',
      'Status',
      'CreatedAt'
    ]);
    coachingSheet.setFrozenRows(1);
    coachingSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f3f4f6');
  }

  // 3. 구글 캘린더 생성 (강사의 Access Token 사용)
  const calendarPayload = {
    summary: coachingName,
    description: `${instructorId}님의 ${coachingName} 예약 전용 캘린더`,
    timeZone: 'Asia/Seoul'
  };

  let newCalendar;
  try {
    newCalendar = callCalendarAPI(
      instructorId,
      '/calendars',
      {
        method: 'post',
        payload: JSON.stringify(calendarPayload)
      }
    );
  } catch (e) {
    throw new Error('캘린더 생성 실패: ' + e.toString());
  }

  const calendarId = newCalendar.id;
  Logger.log(`[Success] Created Calendar: ${calendarId}`);

  // 4. Coachings 시트에 저장
  const coachingId = Utilities.getUuid();
  coachingSheet.appendRow([
    coachingId,
    coachingName,
    calendarId,
    instructorId,
    'active',
    new Date()
  ]);

  // 5. 예약 링크 생성
  const bookingUrl = `${ScriptApp.getService().getUrl()}?coach=${instructorId}&coaching=${coachingId}`;

  return {
    coachingId: coachingId,
    coachingName: coachingName,
    calendarId: calendarId,
    bookingUrl: bookingUrl
  };
}

/**
 * 코칭 목록 조회
 */
function handleGetCoachings(db) {
  const coachingSheet = db.getSheetByName('Coachings');
  if (!coachingSheet) return [];

  const data = coachingSheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const coachings = [];
  for (let i = 1; i < data.length; i++) {
    coachings.push({
      id: data[i][0],
      name: data[i][1],
      calendarId: data[i][2],
      instructorId: data[i][3],
      status: data[i][4],
      createdAt: data[i][5]
    });
  }

  return coachings;
}
