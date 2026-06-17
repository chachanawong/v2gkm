const SPREADSHEET_ID = "1OPmj4G0DdUzHnt-ORBN6ZQRegBfhEhERqUhud7u1SZk";
const SHEET_NAME = "registrations";
const DRIVE_FOLDER_ID = "11ZIExJhCw7uqIHG8KtPp54zzh6E52X3e";
const SET_FILE_SHARING_ON_UPLOAD = false;
const LINE_CHANNEL_ACCESS_TOKEN = "vQNnLFY/GTF4go+CrIt8yjJ1jf/YfQv8yvyoj26048WO7korw6UVYAnShiT/9gsvYgYeusivrpVawKG+WtYeozELRLu8VTaIv4rs1w27tUNeB4L+6XIL1yxm4nPdEbfGdZ7Y6zwTTX/lmRSZseyo0AdB04t89/1O/w1cDnyilFU=";
const LINE_GROUP_ID = "Cac9f153aa76c0d171a925fc5f48dccf3";
const ONLINE_LINE_GROUP_JOIN_URL = "";
const REPORT_TIMEZONE = "Asia/Bangkok";
const HEADERS = [
  "id",
  "createdAt",
  "date",
  "time",
  "timestampLabel",
  "peopleCount",
  "amount",
  "notes",
  "imageUrl",
  "imageName"
];
const BO_MEMBERS_SHEET_NAME = "bo_members";
const REGISTER_SHEET_NAME = "register";
const USER_PINS_SHEET_NAME = "user_pins";
const BO_PAYMENTS_SHEET_NAME = "bo_payments";
const BO_CHECKINS_SHEET_NAME = "bo_checkins";
const ACCOUNT_TRAN_SHEET_NAME = "account_tran";
const ACCOUNT_TRAN_HEADERS = [
  "id",
  "createdAt",
  "date",
  "itemName",
  "category",
  "account",
  "amount",
  "kind",
  "signedAmount",
  "notes",
  "attachmentImageUrl",
  "attachmentImageName",
  "attachmentPdfUrl",
  "attachmentPdfName"
];
const BO_MEMBER_HEADERS = [
  "id",
  "createdAt",
  "date",
  "time",
  "name",
  "nickname",
  "upline",
  "phone",
  "memberType",
  "loginpin",
  "memberpin",
  "status"
];
const REGISTER_HEADERS = [
  "phone",
  "loginpin"
];
const USER_PINS_HEADERS = [
  "phone",
  "loginPin"
];
const APP_SHEET_DEFS = {
  bo_members: {
    headers: BO_MEMBER_HEADERS,
    key: "phone"
  },
  users: {
    headers: ["id", "name", "phone", "membership", "uplinePlatinum", "active", "loginPin"],
    key: "id"
  },
  admins: {
    headers: ["id", "name", "email", "role", "password", "active"],
    key: "id"
  },
  knowledge: {
    headers: ["id", "title", "youtubeUrl", "youtubeId", "thumbnail", "categories", "uploadDate", "viewCount", "status", "visibility", "publishTime", "publishUntil", "createdAt", "updatedAt"],
    key: "id"
  },
  profiles: {
    headers: ["id", "pin", "name", "bio", "position", "visibility", "images", "status", "publishTime", "publishUntil", "createdAt", "updatedAt", "categories"],
    key: "id"
  },
  news: {
    headers: ["id", "title", "body", "eventDate", "eventTime", "eventChannel", "images", "status", "visibility", "publishTime", "publishUntil", "createdAt", "updatedAt", "categories", "pinned"],
    key: "id"
  },
  categories: {
    headers: ["id", "name", "active"],
    key: "id"
  },
  events: {
    headers: ["id", "title", "description", "eventType", "startDate", "endDate", "location", "capacity", "images", "visibility", "status", "pinned", "createdAt", "updatedAt"],
    key: "id"
  },
  event_registrations: {
    headers: ["id", "eventId", "userId", "userName", "userPhone", "status", "createdAt"],
    key: "id"
  },
  learning_paths: {
    headers: ["id", "title", "description", "thumbnail", "visibility", "status", "order", "createdAt", "updatedAt"],
    key: "id"
  },
  lessons: {
    headers: ["id", "pathId", "title", "description", "youtubeUrl", "youtubeId", "thumbnail", "order", "quiz", "passingScore", "status", "createdAt", "updatedAt"],
    key: "id"
  },
  user_progress: {
    headers: ["id", "userId", "lessonId", "pathId", "completed", "quizScore", "completedAt"],
    key: "id"
  },
  audit_logs: {
    headers: ["id", "actor", "role", "action", "resource", "at"],
    key: "id"
  },
  preview_tokens: {
    headers: ["token", "resourceType", "resourceId", "expiresAt", "data"],
    key: "token"
  },
  user_pins: {
    headers: USER_PINS_HEADERS,
    key: "phone"
  },
  register: {
    headers: REGISTER_HEADERS,
    key: "phone"
  }
};
const BO_PAYMENT_HEADERS = [
  "id",
  "createdAt",
  "date",
  "time",
  "name",
  "upline",
  "phone",
  "memberType",
  "amount",
  "notes",
  "status",
  "slipUrl",
  "slipName",
  "ocrText"
];
const BO_CHECKIN_HEADERS = [
  "id",
  "createdAt",
  "date",
  "time",
  "memberId",
  "name",
  "upline",
  "phone",
  "memberType"
];
const RESPONSE_CACHE_PREFIX = "v2g-response";
const RESPONSE_CACHE_TTL_SECONDS = 45;

let _cachedSpreadsheet = null;

function getSpreadsheet_() {
  if (!_cachedSpreadsheet) {
    _cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return _cachedSpreadsheet;
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "listRecords";
  const params = (e && e.parameter) || {};

  if (params.sheet) {
    return createJsonOutput(readGenericSheetRecords_(String(params.sheet)));
  }

  if (params.sheets) {
    const result = {};
    String(params.sheets)
      .split(",")
      .map(function(sheetName) {
        return String(sheetName || "").trim();
      })
      .filter(Boolean)
      .forEach(function(sheetName) {
        result[sheetName] = readGenericSheetRecords_(sheetName);
      });
    return createJsonOutput(result);
  }

  if (action === "recordsData") {
    return createJsonOutput(getRecordsData_(params));
  }

  if (action === "businessData") {
    return createJsonOutput(getBusinessData_(params));
  }

  if (action === "overallData") {
    return createJsonOutput(getOverallData_(params));
  }

  if (action === "lineConfig") {
    return createJsonOutput(getLineConfig_());
  }

  if (action === "accountingData") {
    return createJsonOutput(getAccountingData_(params));
  }

  return createJsonOutput(getRecordsData_(params));
}

function readGenericSheetRecords_(sheetName) {
  const spreadsheet = getSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    return [];
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0].map(function(header) {
    return String(header || "").trim();
  });

  return values.slice(1).map(function(row) {
    const record = {};
    headers.forEach(function(header, index) {
      if (!header) {
        return;
      }
      record[header] = normalizeSheetRecordValue_(header, row[index]);
    });
    return record;
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || (e.parameter && e.parameter.action) || "saveRecord";

    if (isLineWebhookPayload_(payload)) {
      return handleLineWebhook_(payload);
    }
    let result;

    if (action === "upsert") {
      result = handleUpsertSheet_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "delete") {
      result = handleDeleteSheet_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "scanAmount") {
      result = handleScanAmount_(payload);
      return result;
    }

    if (action === "updateRecord") {
      result = handleUpdateRecord_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "deleteRecord") {
      result = handleDeleteRecord_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "addBoMember") {
      result = handleAddBoMember_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "saveBoPayment") {
      result = handleSaveBoPayment_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "checkinBoMember") {
      result = handleCheckinBoMember_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "deactivateBoMember") {
      result = handleDeactivateBoMember_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "scanBoPayments") {
      result = handleScanBoPayments_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "updateBoPayment") {
      result = handleUpdateBoPayment_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "deleteBoPayment") {
      result = handleDeleteBoPayment_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "scanRecords") {
      result = handleScanRecords_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "sendLineAttendanceReport") {
      result = handleSendLineAttendanceReport_(payload);
      return result;
    }

    if (action === "saveOnlineLineGroupLink") {
      result = handleSaveOnlineLineGroupLink_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "saveAccountingTransaction") {
      result = handleSaveAccountingTransaction_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "updateAccountingTransaction") {
      result = handleUpdateAccountingTransaction_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    if (action === "deleteAccountingTransaction") {
      result = handleDeleteAccountingTransaction_(payload);
      bumpDataVersionIfNeeded_(action);
      return result;
    }

    result = handleSaveRecord_(payload);
    bumpDataVersionIfNeeded_(action);
    return result;
  } catch (error) {
    return createJsonOutput({
      success: false,
      error: error.message || String(error)
    });
  }
}

function handleSaveRecord_(payload) {
  const sheet = getOrCreateSheet_();

  if (!payload.imageDataUrl) {
    throw new Error("Missing imageDataUrl. Please capture or upload an image before saving.");
  }

  const amount = Number(payload.amount || 0);
  const peopleCount = Number(payload.peopleCount || 1);
  const imageUrl = saveImageToDrive_(payload.imageDataUrl, payload.imageName);

  sheet.appendRow([
    payload.id,
    payload.createdAt,
    payload.date,
    payload.time,
    payload.timestampLabel,
    peopleCount,
    amount,
    payload.notes || "",
    imageUrl,
    payload.imageName
  ]);

  return createJsonOutput({
    success: true,
    amount: amount,
    amountDetected: false,
    candidates: [],
    imageUrl: imageUrl
  });
}

function handleUpdateRecord_(payload) {
  const sheet = getOrCreateSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    throw new Error("No records to update.");
  }

  const headers = values[0];
  const idColumn = headers.indexOf("id");
  const peopleCountColumn = headers.indexOf("peopleCount");
  const amountColumn = headers.indexOf("amount");
  const notesColumn = headers.indexOf("notes");

  if (idColumn === -1 || peopleCountColumn === -1 || amountColumn === -1 || notesColumn === -1) {
    throw new Error("Missing required headers for update.");
  }

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn]) === String(payload.id)) {
      const amount = Number(payload.amount || 0);
      const requestedPeopleCount = Number(payload.peopleCount);
      const peopleCount = isFinite(requestedPeopleCount)
        ? requestedPeopleCount
        : calculatePeopleCountFromAmount_(amount);
      sheet.getRange(index + 1, peopleCountColumn + 1).setValue(peopleCount);
      sheet.getRange(index + 1, amountColumn + 1).setValue(amount);
      sheet.getRange(index + 1, notesColumn + 1).setValue(payload.notes || "");
      return createJsonOutput({
        success: true,
        id: payload.id,
        peopleCount: peopleCount,
        amount: amount,
        notes: payload.notes || ""
      });
    }
  }

  throw new Error(`Record not found: ${payload.id}`);
}

function handleDeleteRecord_(payload) {
  const sheet = getOrCreateSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    throw new Error("No records to delete.");
  }

  const headers = values[0];
  const idColumn = headers.indexOf("id");
  const imageUrlColumn = headers.indexOf("imageUrl");

  if (idColumn === -1) {
    throw new Error("Missing required id header for delete.");
  }

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn]) === String(payload.id)) {
      const imageUrl = imageUrlColumn === -1 ? "" : values[index][imageUrlColumn];
      const imageDeleted = tryTrashDriveFile_(imageUrl);

      sheet.deleteRow(index + 1);

      return createJsonOutput({
        success: true,
        id: payload.id,
        imageDeleted: imageDeleted
      });
    }
  }

  throw new Error(`Record not found: ${payload.id}`);
}

function handleAddBoMember_(payload) {
  const createdAt = payload.createdAt || new Date().toISOString();
  const memberType = normalizeMemberType_(payload.memberType);
  const phone = normalizePhone_(payload.phone);

  if (!payload.name || !phone) {
    throw new Error("Missing Business Owner name or phone.");
  }

  appendBoMember_({
    id: payload.id || `BO-${Date.now()}`,
    createdAt,
    name: payload.name,
    nickname: payload.nickname || "",
    upline: payload.upline || "",
    phone,
    memberType
  });

  return createJsonOutput({
    success: true,
    memberType: memberType,
    nickname: payload.nickname || "",
    phone: phone
  });
}

function appendBoMember_(payload) {
  const sheet = getOrCreateSheetByName_(BO_MEMBERS_SHEET_NAME, BO_MEMBER_HEADERS);
  const rowNumber = sheet.getLastRow() + 1;
  const phone = normalizePhone_(payload.phone);
  sheet.appendRow([
    payload.id || `BO-${Date.now()}`,
    payload.createdAt,
    formatDate_(payload.createdAt),
    formatTime_(payload.createdAt),
    payload.name,
    payload.nickname || "",
    payload.upline || "",
    phone,
    normalizeMemberType_(payload.memberType),
    payload.loginpin || "",
    "active"
  ]);
  setTextCell_(sheet, rowNumber, "phone", phone);
  setTextCell_(sheet, rowNumber, "loginpin", payload.loginpin || "");
}

function handleUpsertSheet_(payload) {
  const sheetName = String(payload.sheet || "").trim();
  const item = payload.item || {};

  if (!sheetName) {
    throw new Error("Missing sheet for upsert.");
  }

  return createJsonOutput({
    success: true,
    sheet: sheetName,
    item: upsertManagedSheetItem_(sheetName, item)
  });
}

function handleDeleteSheet_(payload) {
  const sheetName = String(payload.sheet || "").trim();
  const id = String(payload.id || "").trim();

  if (!sheetName) {
    throw new Error("Missing sheet for delete.");
  }

  if (!id) {
    throw new Error("Missing id for delete.");
  }

  return createJsonOutput({
    success: deleteManagedSheetItem_(sheetName, id),
    sheet: sheetName,
    id: id
  });
}

function getManagedSheetDef_(sheetName) {
  const def = APP_SHEET_DEFS[sheetName];
  if (!def) {
    throw new Error(`Unsupported sheet: ${sheetName}`);
  }
  return def;
}

function upsertManagedSheetItem_(sheetName, item) {
  if (sheetName === REGISTER_SHEET_NAME) {
    return upsertRegisterPin_(item);
  }

  if (sheetName === USER_PINS_SHEET_NAME) {
    return upsertUserPin_(item);
  }

  const def = getManagedSheetDef_(sheetName);
  const normalizedItem = normalizeManagedSheetItem_(sheetName, item, def.key);
  const sheet = getOrCreateSheetByName_(sheetName, def.headers);
  upsertRowByKey_(sheet, def.headers, def.key, normalizedItem);
  return normalizedItem;
}

function deleteManagedSheetItem_(sheetName, id) {
  const def = getManagedSheetDef_(sheetName);
  const sheet = getOrCreateSheetByName_(sheetName, def.headers);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return false;
  }

  const headers = values[0];
  const keyColumn = headers.indexOf(def.key);

  if (keyColumn === -1) {
    throw new Error(`Missing key header: ${def.key}`);
  }

  const normalizedId = def.key === "phone"
    ? normalizePhone_(id)
    : String(id).trim();

  for (let index = 1; index < values.length; index += 1) {
    const currentValue = def.key === "phone"
      ? normalizePhone_(values[index][keyColumn] || "")
      : String(values[index][keyColumn] || "").trim();

    if (currentValue === normalizedId) {
      sheet.deleteRow(index + 1);
      return true;
    }
  }

  return false;
}

function normalizeManagedSheetItem_(sheetName, item, keyHeader) {
  const normalized = Object.assign({}, item);

  if (keyHeader === "phone") {
    normalized.phone = normalizePhone_(normalized.phone || "");
  }

  if (sheetName === "bo_members") {
    normalized.loginpin = String(normalized.loginpin || "").trim();
    normalized.memberpin = String(normalized.memberpin || normalized.pin || "").trim();
    normalized.name = String(normalized.name || "").trim();
    normalized.upline = String(normalized.upline || "").trim();
    normalized.memberType = normalizeMemberType_(normalized.memberType || "");
    normalized.status = String(normalized.status || "active").trim().toLowerCase();
  }

  if (sheetName === "register") {
    normalized.loginpin = String(normalized.loginpin || "").trim();
  }

  if (sheetName === "user_pins") {
    normalized.loginPin = String(normalized.loginPin || "").trim();
  }

  return normalized;
}

function upsertRegisterPin_(item) {
  const phone = normalizePhone_(item.phone);
  const loginpin = String(item.loginpin || "").trim();

  if (!phone || !loginpin) {
    throw new Error("Missing phone or loginpin for register upsert.");
  }

  const sheet = getOrCreateSheetByName_(REGISTER_SHEET_NAME, REGISTER_HEADERS);
  upsertRowByKey_(sheet, REGISTER_HEADERS, "phone", {
    phone: phone,
    loginpin: loginpin
  });
  setBoMemberLoginPinByPhone_(phone, loginpin);
  return { phone: phone, loginpin: loginpin };
}

function upsertUserPin_(item) {
  const phone = normalizePhone_(item.phone);
  const loginPin = String(item.loginPin || "").trim();

  if (!phone || !loginPin) {
    throw new Error("Missing phone or loginPin for user_pins upsert.");
  }

  const sheet = getOrCreateSheetByName_(USER_PINS_SHEET_NAME, USER_PINS_HEADERS);
  upsertRowByKey_(sheet, USER_PINS_HEADERS, "phone", {
    phone: phone,
    loginPin: loginPin
  });
  setBoMemberLoginPinByPhone_(phone, loginPin);
  return { phone: phone, loginPin: loginPin };
}

function setBoMemberLoginPinByPhone_(phone, loginpin) {
  const normalizedPhone = normalizePhone_(phone);
  if (!normalizedPhone) {
    return false;
  }

  const sheet = getOrCreateSheetByName_(BO_MEMBERS_SHEET_NAME, BO_MEMBER_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return false;
  }

  const headers = values[0];
  const phoneColumn = headers.indexOf("phone");
  const loginPinColumn = headers.indexOf("loginpin");

  if (phoneColumn === -1 || loginPinColumn === -1) {
    return false;
  }

  for (let index = 1; index < values.length; index += 1) {
    if (normalizePhone_(values[index][phoneColumn]) === normalizedPhone) {
      setTextCell_(sheet, index + 1, "loginpin", loginpin);
      return true;
    }
  }

  return false;
}

function handleSaveBoPayment_(payload) {
  const memberType = normalizeMemberType_(payload.memberType);
  const isSlipOptional = memberType === "silver_up";

  if (!payload.slipDataUrl && !isSlipOptional) {
    throw new Error("Missing slipDataUrl.");
  }

  const sheet = getOrCreateSheetByName_(BO_PAYMENTS_SHEET_NAME, BO_PAYMENT_HEADERS);
  const createdAt = payload.createdAt || new Date().toISOString();
  const phone = normalizePhone_(payload.phone);

  if (!payload.name || !phone) {
    throw new Error("Missing Business Owner name or phone.");
  }

  if (memberType === "silver_up" && hasExistingRegisteredPhone_(phone)) {
    throw new Error("เบอร์โทรนี้เคยลงทะเบียนไว้แล้ว");
  }

  const slipUrl = payload.slipDataUrl
    ? saveImageToDrive_(payload.slipDataUrl, payload.slipName)
    : "";
  const memberId = `BO-${Date.now()}`;
  const paymentId = payload.id || `BOPAY-${Date.now()}`;
  let amount = 0;
  let status = slipUrl ? "ocr_no_amount" : "no_slip";
  let ocrText = "";
  let candidates = [];

  appendBoMember_({
    id: memberId,
    createdAt: createdAt,
    name: payload.name || "",
    upline: payload.upline || "",
    phone: phone,
    memberType: memberType
  });

  if (slipUrl) {
    try {
      const ocrResult = readAmountFromDriveUrl_(slipUrl);
      amount = Number(ocrResult.amount || 0);
      status = amount ? "ocr_done" : "ocr_no_amount";
      ocrText = ocrResult.text || "";
      candidates = ocrResult.candidates || [];
    } catch (error) {
      status = "ocr_error";
      ocrText = error.message || String(error);
    }
  }

  sheet.appendRow([
    paymentId,
    createdAt,
    formatDate_(createdAt),
    formatTime_(createdAt),
    payload.name || "",
    payload.upline || "",
    phone,
    memberType,
    amount,
    payload.notes || "",
    status,
    slipUrl,
    payload.slipName || "",
    ocrText
  ]);
  setTextCell_(sheet, sheet.getLastRow(), "phone", phone);

  return createJsonOutput({
    success: true,
    slipUrl: slipUrl,
    amount: amount,
    amountDetected: !!amount,
    status: status,
    candidates: candidates,
    memberId: memberId,
    id: paymentId,
    groupJoinUrl: memberType === "online" ? getOnlineLineGroupJoinUrl_() : ""
  });
}

function hasExistingRegisteredPhone_(phone) {
  const normalizedPhone = normalizePhone_(phone);
  if (!normalizedPhone) {
    return false;
  }

  return readSheetRecords_(BO_MEMBERS_SHEET_NAME, BO_MEMBER_HEADERS).some(function(record) {
    const memberType = normalizeMemberType_(record.memberType || "");
    if (memberType !== "monthly" && memberType !== "silver_up") {
      return false;
    }

    return normalizePhone_(record.phone || "") === normalizedPhone;
  });
}

function handleCheckinBoMember_(payload) {
  const sheet = getOrCreateSheetByName_(BO_CHECKINS_SHEET_NAME, BO_CHECKIN_HEADERS);
  const createdAt = payload.createdAt || new Date().toISOString();
  const checkinDate = formatDate_(createdAt);
  const memberType = normalizeMemberType_(payload.memberType);
  const phone = normalizePhone_(payload.phone);

  if (!payload.memberId || !payload.name || !phone) {
    throw new Error("Missing Business Owner check-in data.");
  }

  if (hasBoCheckinOnDate_(String(payload.memberId), checkinDate)) {
    return createJsonOutput({
      success: true,
      id: "",
      duplicate: true,
      date: checkinDate
    });
  }

  const checkinId = payload.id || `BOCHK-${Date.now()}`;
  sheet.appendRow([
    checkinId,
    createdAt,
    checkinDate,
    formatTime_(createdAt),
    payload.memberId,
    payload.name,
    payload.upline || "",
    phone,
    memberType
  ]);
  setTextCell_(sheet, sheet.getLastRow(), "phone", phone);

  return createJsonOutput({
    success: true,
    id: checkinId,
    duplicate: false
  });
}

function handleSendLineAttendanceReport_(payload) {
  const reportDate = normalizeReportDate_(payload.reportDate);
  const summary = getAttendanceSummaryForDate_(reportDate);
  const message = buildLineAttendanceMessage_(summary);
  sendLinePushMessage_(message);

  return createJsonOutput({
    success: true,
    reportDate: reportDate,
    message: `ส่งรายงาน LINE วันที่ ${formatThaiShortDate_(reportDate)} แล้ว`
  });
}

function handleSaveOnlineLineGroupLink_(payload) {
  const url = String((payload && payload.url) || "").trim();
  if (!url) {
    throw new Error("Missing Line Group URL.");
  }

  PropertiesService.getScriptProperties().setProperty("ONLINE_LINE_GROUP_JOIN_URL", url);

  return createJsonOutput({
    success: true,
    onlineLineGroupJoinUrl: url
  });
}

function handleSaveAccountingTransaction_(payload) {
  const sheet = getOrCreateSheetByName_(ACCOUNT_TRAN_SHEET_NAME, ACCOUNT_TRAN_HEADERS);
  const createdAt = payload.createdAt || new Date().toISOString();
  const date = normalizeSheetDate_(payload.date || createdAt);
  const amount = Math.abs(Number(payload.amount || 0));
  const kind = String(payload.kind || "").trim().toLowerCase() === "expense" ? "expense" : "income";
  const signedAmount = kind === "expense" ? -amount : amount;
  const account = String(payload.account || "").trim().toUpperCase();

  if (!payload.itemName) {
    throw new Error("Missing accounting item name.");
  }

  if (!date) {
    throw new Error("Missing accounting date.");
  }

  if (!account) {
    throw new Error("Missing accounting account.");
  }

  if (!(amount > 0)) {
    throw new Error("Accounting amount must be greater than 0.");
  }

  const attachmentImageUrl = payload.attachmentImageDataUrl
    ? saveImageToDrive_(payload.attachmentImageDataUrl, payload.attachmentImageName || `accounting-image-${Date.now()}.jpg`)
    : String(payload.attachmentImageUrl || "").trim();
  const attachmentPdfUrl = payload.attachmentPdfDataUrl
    ? saveImageToDrive_(payload.attachmentPdfDataUrl, payload.attachmentPdfName || `accounting-file-${Date.now()}.pdf`)
    : String(payload.attachmentPdfUrl || "").trim();

  const transaction = {
    id: payload.id || `ACC-${Date.now()}`,
    createdAt: createdAt,
    date: date,
    itemName: String(payload.itemName || "").trim(),
    category: String(payload.category || "").trim(),
    account: account,
    amount: amount,
    kind: kind,
    signedAmount: signedAmount,
    notes: String(payload.notes || "").trim(),
    attachmentImageUrl: attachmentImageUrl,
    attachmentImageName: String(payload.attachmentImageName || "").trim(),
    attachmentPdfUrl: attachmentPdfUrl,
    attachmentPdfName: String(payload.attachmentPdfName || "").trim()
  };

  sheet.appendRow([
    transaction.id,
    transaction.createdAt,
    transaction.date,
    transaction.itemName,
    transaction.category,
    transaction.account,
    transaction.amount,
    transaction.kind,
    transaction.signedAmount,
    transaction.notes,
    transaction.attachmentImageUrl,
    transaction.attachmentImageName,
    transaction.attachmentPdfUrl,
    transaction.attachmentPdfName
  ]);

  return createJsonOutput({
    success: true,
    transaction: transaction
  });
}

function handleUpdateAccountingTransaction_(payload) {
  const sheet = getOrCreateSheetByName_(ACCOUNT_TRAN_SHEET_NAME, ACCOUNT_TRAN_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    throw new Error("No accounting transactions to update.");
  }

  const headers = values[0];
  const idColumn = headers.indexOf("id");
  if (idColumn === -1) {
    throw new Error("Missing accounting transaction id header.");
  }

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn]) !== String(payload.id)) {
      continue;
    }

    const current = {};
    headers.forEach(function(header, headerIndex) {
      current[header] = values[index][headerIndex];
    });

    const createdAt = payload.createdAt || current.createdAt || new Date().toISOString();
    const date = normalizeSheetDate_(payload.date || current.date || createdAt);
    const amount = Math.abs(Number(payload.amount || current.amount || 0));
    const kind = String(payload.kind || current.kind || "").trim().toLowerCase() === "expense" ? "expense" : "income";
    const signedAmount = kind === "expense" ? -amount : amount;
    const account = String(payload.account || current.account || "").trim().toUpperCase();

    if (!payload.itemName) {
      throw new Error("Missing accounting item name.");
    }

    if (!date) {
      throw new Error("Missing accounting date.");
    }

    if (!account) {
      throw new Error("Missing accounting account.");
    }

    if (!(amount > 0)) {
      throw new Error("Accounting amount must be greater than 0.");
    }

    let attachmentImageUrl = String(payload.attachmentImageUrl || current.attachmentImageUrl || "").trim();
    let attachmentPdfUrl = String(payload.attachmentPdfUrl || current.attachmentPdfUrl || "").trim();

    if (payload.clearAttachmentImage === true && attachmentImageUrl) {
      tryTrashDriveFile_(attachmentImageUrl);
      attachmentImageUrl = "";
    }

    if (payload.clearAttachmentPdf === true && attachmentPdfUrl) {
      tryTrashDriveFile_(attachmentPdfUrl);
      attachmentPdfUrl = "";
    }

    if (payload.attachmentImageDataUrl) {
      if (attachmentImageUrl) {
        tryTrashDriveFile_(attachmentImageUrl);
      }
      attachmentImageUrl = saveImageToDrive_(payload.attachmentImageDataUrl, payload.attachmentImageName || `accounting-image-${Date.now()}.jpg`);
    }

    if (payload.attachmentPdfDataUrl) {
      if (attachmentPdfUrl) {
        tryTrashDriveFile_(attachmentPdfUrl);
      }
      attachmentPdfUrl = saveImageToDrive_(payload.attachmentPdfDataUrl, payload.attachmentPdfName || `accounting-file-${Date.now()}.pdf`);
    }

    const transaction = {
      id: String(payload.id),
      createdAt: createdAt,
      date: date,
      itemName: String(payload.itemName || "").trim(),
      category: String(payload.category || current.category || "").trim(),
      account: account,
      amount: amount,
      kind: kind,
      signedAmount: signedAmount,
      notes: String(payload.notes || "").trim(),
      attachmentImageUrl: attachmentImageUrl,
      attachmentImageName: String(payload.attachmentImageName || current.attachmentImageName || "").trim(),
      attachmentPdfUrl: attachmentPdfUrl,
      attachmentPdfName: String(payload.attachmentPdfName || current.attachmentPdfName || "").trim()
    };

    headers.forEach(function(header, headerIndex) {
      const value = Object.prototype.hasOwnProperty.call(transaction, header) ? transaction[header] : "";
      sheet.getRange(index + 1, headerIndex + 1).setValue(value);
    });

    return createJsonOutput({
      success: true,
      transaction: transaction
    });
  }

  throw new Error(`Accounting transaction not found: ${payload.id}`);
}

function handleDeleteAccountingTransaction_(payload) {
  const sheet = getOrCreateSheetByName_(ACCOUNT_TRAN_SHEET_NAME, ACCOUNT_TRAN_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    throw new Error("No accounting transactions to delete.");
  }

  const headers = values[0];
  const idColumn = headers.indexOf("id");
  const attachmentImageUrlColumn = headers.indexOf("attachmentImageUrl");
  const attachmentPdfUrlColumn = headers.indexOf("attachmentPdfUrl");

  if (idColumn === -1) {
    throw new Error("Missing accounting transaction id header.");
  }

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn]) !== String(payload.id)) {
      continue;
    }

    if (attachmentImageUrlColumn !== -1) {
      tryTrashDriveFile_(values[index][attachmentImageUrlColumn]);
    }

    if (attachmentPdfUrlColumn !== -1) {
      tryTrashDriveFile_(values[index][attachmentPdfUrlColumn]);
    }

    sheet.deleteRow(index + 1);
    return createJsonOutput({
      success: true,
      id: payload.id
    });
  }

  throw new Error(`Accounting transaction not found: ${payload.id}`);
}

function handleLineWebhook_(payload) {
  const events = Array.isArray(payload.events) ? payload.events : [];
  let savedGroupId = "";

  events.forEach(function(event) {
    const source = event && event.source ? event.source : {};
    if (source.type === "group" && source.groupId) {
      savedGroupId = String(source.groupId);
      saveLineSourceToProperties_(source.groupId, event);
    }
  });

  return createJsonOutput({
    success: true,
    webhookReceived: true,
    savedGroupId: savedGroupId
  });
}

function handleDeactivateBoMember_(payload) {
  const sheet = getOrCreateSheetByName_(BO_MEMBERS_SHEET_NAME, BO_MEMBER_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    throw new Error("No members to deactivate.");
  }

  const headers = values[0];
  const idColumn = headers.indexOf("id");
  const statusColumn = headers.indexOf("status");

  if (idColumn === -1 || statusColumn === -1) {
    throw new Error("Missing required headers for member deactivate.");
  }

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn]) === String(payload.id)) {
      sheet.getRange(index + 1, statusColumn + 1).setValue("inactive");
      return createJsonOutput({
        success: true,
        id: payload.id,
        status: "inactive"
      });
    }
  }

  throw new Error(`Member not found: ${payload.id}`);
}

function deactivateMonthlyMembersAtMonthEnd_() {
  const now = new Date();
  const tomorrowText = Utilities.formatDate(new Date(now.getTime() + 24 * 60 * 60 * 1000), REPORT_TIMEZONE, "yyyy-MM-dd");
  if (!tomorrowText.endsWith("-01")) {
    return {
      success: true,
      skipped: true,
      reason: "not-month-end"
    };
  }

  const sheet = getOrCreateSheetByName_(BO_MEMBERS_SHEET_NAME, BO_MEMBER_HEADERS);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return {
      success: true,
      updatedCount: 0
    };
  }

  const headers = values[0];
  const memberTypeColumn = headers.indexOf("memberType");
  const statusColumn = headers.indexOf("status");
  if (memberTypeColumn === -1 || statusColumn === -1) {
    throw new Error("Missing required headers for monthly member deactivation.");
  }

  let updatedCount = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (normalizeMemberType_(values[index][memberTypeColumn]) !== "monthly") {
      continue;
    }
    if (String(values[index][statusColumn] || "").trim().toLowerCase() === "inactive") {
      continue;
    }
    sheet.getRange(index + 1, statusColumn + 1).setValue("inactive");
    updatedCount += 1;
  }

  return {
    success: true,
    updatedCount: updatedCount
  };
}

function runMonthlyMemberDeactivation() {
  return deactivateMonthlyMembersAtMonthEnd_();
}

function handleUpdateBoPayment_(payload) {
  const sheet = getOrCreateSheetByName_(BO_PAYMENTS_SHEET_NAME, BO_PAYMENT_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    throw new Error("No payments to update.");
  }

  const headers = values[0];
  const idColumn = headers.indexOf("id");
  const amountColumn = headers.indexOf("amount");
  const notesColumn = headers.indexOf("notes");

  if (idColumn === -1 || amountColumn === -1 || notesColumn === -1) {
    throw new Error("Missing required headers for BO payment update.");
  }

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn]) === String(payload.id)) {
      sheet.getRange(index + 1, amountColumn + 1).setValue(Number(payload.amount || 0));
      sheet.getRange(index + 1, notesColumn + 1).setValue(payload.notes || "");
      return createJsonOutput({
        success: true,
        id: payload.id,
        amount: Number(payload.amount || 0),
        notes: payload.notes || ""
      });
    }
  }

  throw new Error(`BO payment not found: ${payload.id}`);
}

function handleDeleteBoPayment_(payload) {
  const sheet = getOrCreateSheetByName_(BO_PAYMENTS_SHEET_NAME, BO_PAYMENT_HEADERS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    throw new Error("No payments to delete.");
  }

  const headers = values[0];
  const idColumn = headers.indexOf("id");
  const slipUrlColumn = headers.indexOf("slipUrl");

  if (idColumn === -1) {
    throw new Error("Missing required id header for BO payment delete.");
  }

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn]) === String(payload.id)) {
      const slipUrl = slipUrlColumn === -1 ? "" : values[index][slipUrlColumn];
      const slipDeleted = tryTrashDriveFile_(slipUrl);
      sheet.deleteRow(index + 1);

      return createJsonOutput({
        success: true,
        id: payload.id,
        slipDeleted: slipDeleted
      });
    }
  }

  throw new Error(`BO payment not found: ${payload.id}`);
}

function handleScanBoPayments_(payload) {
  const ids = Array.isArray(payload.ids) ? payload.ids.map(String) : [];
  if (!ids.length) {
    throw new Error("No payment ids selected for OCR.");
  }

  const sheet = getOrCreateSheetByName_(BO_PAYMENTS_SHEET_NAME, BO_PAYMENT_HEADERS);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    throw new Error("No payments to scan.");
  }

  const headers = values[0];
  const idColumn = headers.indexOf("id");
  const amountColumn = headers.indexOf("amount");
  const statusColumn = headers.indexOf("status");
  const slipUrlColumn = headers.indexOf("slipUrl");
  const ocrTextColumn = headers.indexOf("ocrText");
  const selectedIds = new Set(ids);
  const results = [];
  let hasPendingWrites = false;

  if (idColumn === -1 || amountColumn === -1 || statusColumn === -1 || slipUrlColumn === -1) {
    throw new Error("Missing required headers for BO payment OCR.");
  }

  for (let index = 1; index < values.length; index += 1) {
    const id = String(values[index][idColumn]);
    if (!selectedIds.has(id)) {
      continue;
    }

    try {
      const result = readAmountFromDriveUrl_(values[index][slipUrlColumn]);
      const amount = Number(result.amount || 0);

      if (amount) {
        values[index][amountColumn] = amount;
        values[index][statusColumn] = "ocr_done";
      } else {
        values[index][statusColumn] = "ocr_no_amount";
      }

      if (ocrTextColumn !== -1) {
        values[index][ocrTextColumn] = result.text || "";
      }

      hasPendingWrites = true;
      results.push({
        id: id,
        success: true,
        amount: amount || "",
        amountDetected: !!amount,
        candidates: result.candidates
      });
    } catch (error) {
      results.push({
        id: id,
        success: false,
        amount: "",
        amountDetected: false,
        error: error.message || String(error)
      });
    }
  }

  if (hasPendingWrites) {
    const numRows = values.length;
    sheet.getRange(1, amountColumn + 1, numRows, 1).setValues(values.map(function(row) { return [row[amountColumn]]; }));
    sheet.getRange(1, statusColumn + 1, numRows, 1).setValues(values.map(function(row) { return [row[statusColumn]]; }));
    if (ocrTextColumn !== -1) {
      sheet.getRange(1, ocrTextColumn + 1, numRows, 1).setValues(values.map(function(row) { return [row[ocrTextColumn]]; }));
    }
  }

  return createJsonOutput({
    success: true,
    results: results
  });
}

function handleScanRecords_(payload) {
  const ids = Array.isArray(payload.ids) ? payload.ids.map(String) : [];
  if (!ids.length) {
    throw new Error("No record ids selected for OCR.");
  }

  const sheet = getOrCreateSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    throw new Error("No records to scan.");
  }

  const headers = values[0];
  const idColumn = headers.indexOf("id");
  const imageUrlColumn = headers.indexOf("imageUrl");
  const peopleCountColumn = headers.indexOf("peopleCount");
  const amountColumn = headers.indexOf("amount");

  if (idColumn === -1 || imageUrlColumn === -1 || peopleCountColumn === -1 || amountColumn === -1) {
    throw new Error("Missing required headers for batch OCR.");
  }

  const selectedIds = new Set(ids);
  const results = [];
  let hasPendingWrites = false;

  for (let index = 1; index < values.length; index += 1) {
    const id = String(values[index][idColumn]);
    if (!selectedIds.has(id)) {
      continue;
    }

    try {
      const result = readAmountFromDriveUrl_(values[index][imageUrlColumn]);
      if (result.amount) {
        const amount = Number(result.amount);
        const peopleCount = calculatePeopleCountFromAmount_(amount);
        values[index][peopleCountColumn] = peopleCount;
        values[index][amountColumn] = amount;
        hasPendingWrites = true;
      }

      results.push({
        id: id,
        success: true,
        amount: result.amount || "",
        peopleCount: result.amount ? calculatePeopleCountFromAmount_(Number(result.amount)) : "",
        amountDetected: !!result.amount,
        candidates: result.candidates
      });
    } catch (error) {
      results.push({
        id: id,
        success: false,
        amount: "",
        amountDetected: false,
        error: error.message || String(error)
      });
    }
  }

  if (hasPendingWrites) {
    const numRows = values.length;
    sheet.getRange(1, peopleCountColumn + 1, numRows, 1).setValues(values.map(function(row) { return [row[peopleCountColumn]]; }));
    sheet.getRange(1, amountColumn + 1, numRows, 1).setValues(values.map(function(row) { return [row[amountColumn]]; }));
  }

  return createJsonOutput({
    success: true,
    results: results
  });
}

function handleScanAmount_(payload) {
  const result = readAmountFromImage_(payload.imageDataUrl);

  return createJsonOutput({
    success: true,
    text: result.text,
    candidates: result.candidates,
    amount: result.amount
  });
}

function calculatePeopleCountFromAmount_(amount) {
  const value = Number(amount || 0);
  if (!isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.ceil(value / 100);
}

function readAmountFromImage_(imageDataUrl) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("VISION_API_KEY");
  if (!apiKey) {
    throw new Error("Missing VISION_API_KEY in Script Properties");
  }

  const annotation = callVisionApi_(imageDataUrl, apiKey);
  const fullText = annotation.fullTextAnnotation ? annotation.fullTextAnnotation.text || "" : "";
  const candidates = extractAmountCandidates_(fullText);

  return {
    text: fullText,
    candidates: candidates,
    amount: candidates.length ? candidates[0] : ""
  };
}

function readAmountFromDriveUrl_(imageUrl) {
  const fileId = getDriveFileId_(imageUrl);
  if (!fileId) {
    throw new Error("Missing Drive file id for OCR.");
  }

  const apiKey = PropertiesService.getScriptProperties().getProperty("VISION_API_KEY");
  if (!apiKey) {
    throw new Error("Missing VISION_API_KEY in Script Properties");
  }

  const blob = DriveApp.getFileById(fileId).getBlob();
  const annotation = callVisionApiWithContent_(Utilities.base64Encode(blob.getBytes()), apiKey);
  const fullText = annotation.fullTextAnnotation ? annotation.fullTextAnnotation.text || "" : "";
  const candidates = extractAmountCandidates_(fullText);

  return {
    text: fullText,
    candidates: candidates,
    amount: candidates.length ? candidates[0] : ""
  };
}

function getDriveFileId_(url) {
  const text = String(url || "");
  const filePathMatch = text.match(/\/file\/d\/([^/]+)/);
  if (filePathMatch) {
    return filePathMatch[1];
  }

  const idParamMatch = text.match(/[?&]id=([^&]+)/);
  if (idParamMatch) {
    return idParamMatch[1];
  }

  return "";
}

function getRecordsData_(params) {
  const query = buildSheetQueryOptions_(params, {
    fields: getRequestedFields_(params.recordsFields || params.fields),
    sortBy: "createdAt",
    sortDirection: "desc"
  });

  return withCachedResponse_("recordsData", params, function() {
    if (parseBooleanParam_(params.fullRead)) {
      return {
        records: readSheetRecords_(SHEET_NAME, HEADERS)
      };
    }

    return {
      records: readSheetRecordsByQuery_(SHEET_NAME, HEADERS, query)
    };
  });
}

function getBusinessData_(params) {
  const includes = getRequestedSections_(params.include, ["members", "payments", "checkins"]);

  return withCachedResponse_("businessData", params, function() {
    if (parseBooleanParam_(params.fullRead)) {
      const fullResult = {};
      if (includes.indexOf("members") !== -1) {
        fullResult.members = readSheetRecords_(BO_MEMBERS_SHEET_NAME, BO_MEMBER_HEADERS);
      }
      if (includes.indexOf("payments") !== -1) {
        fullResult.payments = readSheetRecords_(BO_PAYMENTS_SHEET_NAME, BO_PAYMENT_HEADERS);
      }
      if (includes.indexOf("checkins") !== -1) {
        fullResult.checkins = readSheetRecords_(BO_CHECKINS_SHEET_NAME, BO_CHECKIN_HEADERS);
      }
      return fullResult;
    }

    const result = {};

    if (includes.indexOf("members") !== -1) {
      result.members = readSheetRecordsByQuery_(BO_MEMBERS_SHEET_NAME, BO_MEMBER_HEADERS, buildSheetQueryOptions_(params, {
        fields: getRequestedFields_(params.membersFields || params.fields),
        idField: "id",
        ignoreDateFilters: true,
        activeOnly: parseBooleanParam_(params.activeOnly),
        excludeMemberType: parseBooleanParam_(params.excludeOnline) ? "online" : "",
        sortBy: "createdAt",
        sortDirection: "desc"
      }));
    }

    if (includes.indexOf("payments") !== -1) {
      result.payments = readSheetRecordsByQuery_(BO_PAYMENTS_SHEET_NAME, BO_PAYMENT_HEADERS, buildSheetQueryOptions_(params, {
        fields: getRequestedFields_(params.paymentsFields || params.fields),
        dateField: "date",
        memberTypeField: "memberType",
        sortBy: "createdAt",
        sortDirection: "desc"
      }));
    }

    if (includes.indexOf("checkins") !== -1) {
      result.checkins = readSheetRecordsByQuery_(BO_CHECKINS_SHEET_NAME, BO_CHECKIN_HEADERS, buildSheetQueryOptions_(params, {
        fields: getRequestedFields_(params.checkinsFields || params.fields),
        idField: "memberId",
        dateField: "date",
        memberTypeField: "memberType",
        date: params.checkinDate || params.date || "",
        sortBy: "createdAt",
        sortDirection: "desc"
      }));
    }

    return result;
  });
}

function getAttendanceSummaryForDate_(reportDate) {
  const records = readSheetRecords_(SHEET_NAME, HEADERS).filter(function(record) {
    return normalizeSheetDate_(record.date || record.createdAt) === reportDate;
  });
  const checkins = readSheetRecords_(BO_CHECKINS_SHEET_NAME, BO_CHECKIN_HEADERS).filter(function(record) {
    return normalizeSheetDate_(record.date || record.createdAt) === reportDate;
  });

  const silverCount = checkins.filter(function(record) {
    return normalizeMemberType_(record.memberType) === "silver_up";
  }).length;
  const monthlyCount = checkins.filter(function(record) {
    return normalizeMemberType_(record.memberType) === "monthly";
  }).length;
  const onlineCount = readSheetRecords_(BO_PAYMENTS_SHEET_NAME, BO_PAYMENT_HEADERS).filter(function(record) {
    return normalizeSheetDate_(record.date || record.createdAt) === reportDate
      && normalizeMemberType_(record.memberType) === "online";
  }).length;
  const regularCount = records.reduce(function(sum, record) {
    return sum + Number(record.peopleCount || 0);
  }, 0);

  return {
    reportDate: reportDate,
    generatedAt: new Date(),
    silverCount: silverCount,
    monthlyCount: monthlyCount,
    regularCount: regularCount,
    offlineCount: silverCount + monthlyCount + regularCount,
    onlineCount: onlineCount
  };
}

function getOverallData_(params) {
  return withCachedResponse_("overallData", params, function() {
    if (parseBooleanParam_(params.fullRead)) {
      return {
        records: readSheetRecords_(SHEET_NAME, HEADERS),
        members: readSheetRecords_(BO_MEMBERS_SHEET_NAME, BO_MEMBER_HEADERS),
        payments: readSheetRecords_(BO_PAYMENTS_SHEET_NAME, BO_PAYMENT_HEADERS),
        checkins: readSheetRecords_(BO_CHECKINS_SHEET_NAME, BO_CHECKIN_HEADERS)
      };
    }

    return {
      records: readSheetRecordsByQuery_(SHEET_NAME, HEADERS, buildSheetQueryOptions_(params, {
        fields: getRequestedFields_(params.recordsFields || params.fields),
        dateField: "date",
        sortBy: "createdAt",
        sortDirection: "desc"
      })),
      members: readSheetRecordsByQuery_(BO_MEMBERS_SHEET_NAME, BO_MEMBER_HEADERS, buildSheetQueryOptions_(params, {
        fields: getRequestedFields_(params.membersFields || params.fields),
        ignoreDateFilters: true,
        activeOnly: true,
        sortBy: "createdAt",
        sortDirection: "desc"
      })),
      payments: readSheetRecordsByQuery_(BO_PAYMENTS_SHEET_NAME, BO_PAYMENT_HEADERS, buildSheetQueryOptions_(params, {
        fields: getRequestedFields_(params.paymentsFields || params.fields),
        dateField: "date",
        memberTypeField: "memberType",
        sortBy: "createdAt",
        sortDirection: "desc"
      })),
      checkins: readSheetRecordsByQuery_(BO_CHECKINS_SHEET_NAME, BO_CHECKIN_HEADERS, buildSheetQueryOptions_(params, {
        fields: getRequestedFields_(params.checkinsFields || params.fields),
        dateField: "date",
        memberTypeField: "memberType",
        sortBy: "createdAt",
        sortDirection: "desc"
      }))
    };
  });
}

function getLineConfig_() {
  const properties = PropertiesService.getScriptProperties();
  return {
    lineGroupId: LINE_GROUP_ID || properties.getProperty("LINE_GROUP_ID") || "",
    onlineLineGroupJoinUrl: getOnlineLineGroupJoinUrl_(),
    latestLineSourceType: properties.getProperty("LINE_SOURCE_TYPE") || "",
    latestLineEventType: properties.getProperty("LINE_EVENT_TYPE") || "",
    latestLineEventAt: properties.getProperty("LINE_EVENT_AT") || ""
  };
}

function getAccountingData_(params) {
  return withCachedResponse_("accountingData", params, function() {
    return {
      transactions: readSheetRecordsByQuery_(ACCOUNT_TRAN_SHEET_NAME, ACCOUNT_TRAN_HEADERS, buildSheetQueryOptions_(params, {
        fields: getRequestedFields_(params.transactionsFields || params.fields),
        dateField: "date",
        sortBy: "date",
        sortDirection: "desc"
      }))
    };
  });
}

function hasBoCheckinOnDate_(memberId, reportDate) {
  const normalizedMemberId = String(memberId || "").trim();
  const normalizedDate = normalizeSheetDate_(reportDate);
  if (!normalizedMemberId || !normalizedDate) {
    return false;
  }

  return readSheetRecords_(BO_CHECKINS_SHEET_NAME, BO_CHECKIN_HEADERS).some(function(record) {
    return String(record.memberId || "").trim() === normalizedMemberId
      && normalizeSheetDate_(record.date || record.createdAt) === normalizedDate;
  });
}

function readSheetRecords_(sheetName, headers) {
  const sheet = getOrCreateSheetByName_(sheetName, headers);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return [];
  }

  const sheetHeaders = values.shift();
  return values.map(function(row) {
    const record = {};
    sheetHeaders.forEach(function(header, index) {
      record[header] = normalizeSheetRecordValue_(header, row[index]);
    });
    return record;
  });
}

function readSheetRecordsByQuery_(sheetName, headers, options) {
  const records = readSheetRecordsSelective_(sheetName, headers, (options && options.fields) || []);
  return projectRecords_(filterRecords_(records, options || {}), options || {});
}

function readSheetRecordsSelective_(sheetName, headers, fields) {
  const selectedFields = Array.isArray(fields) && fields.length ? fields.slice() : headers.slice();
  const sheet = getOrCreateSheetByName_(sheetName, headers);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const sheetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const selectedColumns = selectedFields
    .map(function(field) {
      return {
        field: field,
        index: sheetHeaders.indexOf(field)
      };
    })
    .filter(function(column) {
      return column.index !== -1;
    })
    .sort(function(left, right) {
      return left.index - right.index;
    });

  if (!selectedColumns.length) {
    return [];
  }

  const rowCount = lastRow - 1;
  const records = Array.from({ length: rowCount }, function() {
    return {};
  });
  const spans = buildColumnSpans_(selectedColumns);

  spans.forEach(function(span) {
    const values = sheet.getRange(2, span.startIndex + 1, rowCount, span.width).getValues();
    values.forEach(function(row, rowIndex) {
      span.columns.forEach(function(column, columnOffset) {
        records[rowIndex][column.field] = normalizeSheetRecordValue_(column.field, row[columnOffset]);
      });
    });
  });

  return records;
}

function buildColumnSpans_(columns) {
  if (!columns.length) {
    return [];
  }

  const spans = [];
  let current = {
    startIndex: columns[0].index,
    endIndex: columns[0].index,
    columns: [columns[0]]
  };

  for (let index = 1; index < columns.length; index += 1) {
    const column = columns[index];
    if (column.index === current.endIndex + 1) {
      current.endIndex = column.index;
      current.columns.push(column);
      continue;
    }

    current.width = current.endIndex - current.startIndex + 1;
    spans.push(current);
    current = {
      startIndex: column.index,
      endIndex: column.index,
      columns: [column]
    };
  }

  current.width = current.endIndex - current.startIndex + 1;
  spans.push(current);
  return spans;
}

function normalizeSheetRecordValue_(header, value) {
  if (header === "phone") {
    return String(value || "");
  }

  if (header === "date") {
    return normalizeSheetDate_(value);
  }

  if (header === "time") {
    return normalizeSheetTime_(value);
  }

  return value;
}

function filterRecords_(records, options) {
  const normalizedDate = normalizeSheetDate_(options.date || "");
  const normalizedStartDate = normalizeSheetDate_(options.startDate || "");
  const normalizedEndDate = normalizeSheetDate_(options.endDate || "");
  const normalizedId = String(options.id || "").trim();
  const normalizedStatus = String(options.status || "").trim().toLowerCase();
  const normalizedMemberType = normalizeMemberType_(options.memberType || "");
  const excludedMemberType = normalizeMemberType_(options.excludeMemberType || "");
  const normalizedPhone = String(options.phone || "").trim();
  const dateField = options.dateField || "date";
  const idField = options.idField || "id";
  const memberTypeField = options.memberTypeField || "memberType";
  const sorted = (Array.isArray(records) ? records : []).filter(function(record) {
    const recordDate = normalizeSheetDate_(record[dateField] || record.createdAt || "");
    const recordStatus = String(record.status || "").trim().toLowerCase();
    const recordId = String(record[idField] || "").trim();
    const recordMemberType = normalizeMemberType_(record[memberTypeField] || "");
    const recordPhone = String(record.phone || "").trim();

    if (normalizedDate && recordDate !== normalizedDate) {
      return false;
    }

    if (normalizedStartDate && (!recordDate || recordDate < normalizedStartDate)) {
      return false;
    }

    if (normalizedEndDate && (!recordDate || recordDate > normalizedEndDate)) {
      return false;
    }

    if (normalizedId && recordId !== normalizedId) {
      return false;
    }

    if (options.activeOnly && recordStatus && recordStatus !== "active") {
      return false;
    }

    if (normalizedStatus && recordStatus !== normalizedStatus) {
      return false;
    }

    if (normalizedMemberType && recordMemberType !== normalizedMemberType) {
      return false;
    }

    if (excludedMemberType && recordMemberType === excludedMemberType) {
      return false;
    }

    if (normalizedPhone && recordPhone !== normalizedPhone) {
      return false;
    }

    return true;
  });

  if (options.sortBy) {
    const sortField = options.sortBy;
    const direction = String(options.sortDirection || "asc").toLowerCase() === "desc" ? -1 : 1;
    sorted.sort(function(left, right) {
      const leftValue = normalizeSortValue_(left[sortField], sortField);
      const rightValue = normalizeSortValue_(right[sortField], sortField);
      if (leftValue < rightValue) {
        return -1 * direction;
      }
      if (leftValue > rightValue) {
        return 1 * direction;
      }
      return 0;
    });
  }

  if (options.limit && options.limit > 0) {
    return sorted.slice(0, options.limit);
  }

  return sorted;
}

function projectRecords_(records, options) {
  const fields = Array.isArray(options.fields) ? options.fields.filter(Boolean) : [];
  if (!fields.length) {
    return records;
  }

  return records.map(function(record) {
    return fields.reduce(function(result, field) {
      result[field] = record[field];
      return result;
    }, {});
  });
}

function buildSheetQueryOptions_(params, overrides) {
  const normalizedOverrides = overrides || {};
  const ignoreDateFilters = normalizedOverrides.ignoreDateFilters === true;
  return {
    date: ignoreDateFilters ? "" : (normalizedOverrides.date || params.date || ""),
    startDate: ignoreDateFilters ? "" : (params.startDate || ""),
    endDate: ignoreDateFilters ? "" : (params.endDate || ""),
    id: params.memberId || params.id || "",
    status: params.status || "",
    memberType: params.memberType || "",
    excludeMemberType: normalizedOverrides.excludeMemberType || "",
    activeOnly: normalizedOverrides.activeOnly === true || parseBooleanParam_(params.activeOnly),
    phone: params.phone || "",
    limit: parseNumberParam_(params.limit),
    sortBy: normalizedOverrides.sortBy || params.sortBy || "",
    sortDirection: normalizedOverrides.sortDirection || params.sortDirection || "asc",
    fields: normalizedOverrides.fields || getRequestedFields_(params.fields),
    dateField: normalizedOverrides.dateField || "date",
    idField: normalizedOverrides.idField || "id",
    memberTypeField: normalizedOverrides.memberTypeField || "memberType"
  };
}

function getRequestedSections_(value, defaults) {
  const sections = splitCsvValue_(value);
  return sections.length ? sections : defaults.slice();
}

function getRequestedFields_(value) {
  return splitCsvValue_(value);
}

function splitCsvValue_(value) {
  return String(value || "")
    .split(",")
    .map(function(item) { return String(item || "").trim(); })
    .filter(Boolean);
}

function parseBooleanParam_(value) {
  return String(value || "").toLowerCase() === "true";
}

function parseNumberParam_(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeSortValue_(value, fieldName) {
  if (fieldName === "createdAt" || fieldName === "date") {
    return String(value || "");
  }

  if (typeof value === "number") {
    return value;
  }

  const numericValue = Number(value);
  if (String(value || "").trim() !== "" && Number.isFinite(numericValue)) {
    return numericValue;
  }

  return String(value || "").toLowerCase();
}

function withCachedResponse_(namespace, params, builder) {
  const cache = CacheService.getScriptCache();
  const cacheKey = buildResponseCacheKey_(namespace, params);
  const cached = cache.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const result = builder();
  const serialized = JSON.stringify(result);
  if (serialized.length <= 90000) {
    cache.put(cacheKey, serialized, RESPONSE_CACHE_TTL_SECONDS);
  }
  return result;
}

function buildResponseCacheKey_(namespace, params) {
  const rawKey = `${RESPONSE_CACHE_PREFIX}:${namespace}:${getDataVersion_()}:${JSON.stringify(params || {})}`;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, rawKey);
  return `${RESPONSE_CACHE_PREFIX}:${namespace}:${digest.map(function(byte) {
    const normalized = byte < 0 ? byte + 256 : byte;
    return (`0${normalized.toString(16)}`).slice(-2);
  }).join("")}`;
}

function getDataVersion_() {
  return PropertiesService.getScriptProperties().getProperty("DATA_VERSION") || "0";
}

function bumpDataVersionIfNeeded_(action) {
  if (!shouldInvalidateDataCache_(action)) {
    return;
  }

  const properties = PropertiesService.getScriptProperties();
  const nextVersion = String(Number(properties.getProperty("DATA_VERSION") || "0") + 1);
  properties.setProperty("DATA_VERSION", nextVersion);
}

function shouldInvalidateDataCache_(action) {
  return [
    "saveRecord",
    "updateRecord",
    "deleteRecord",
    "addBoMember",
    "saveBoPayment",
    "checkinBoMember",
    "deactivateBoMember",
    "scanBoPayments",
    "updateBoPayment",
    "deleteBoPayment",
    "scanRecords",
    "saveOnlineLineGroupLink",
    "saveAccountingTransaction",
    "updateAccountingTransaction",
    "deleteAccountingTransaction"
  ].indexOf(String(action || "")) !== -1;
}

function normalizeSheetDate_(value) {
  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return formatDate_(value);
  }

  const text = String(value).trim();
  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const rawYear = Number(slashMatch[3]);
    const year = slashMatch[3].length === 2
      ? (rawYear > 50 ? rawYear + 2500 - 543 : rawYear + 2000)
      : (rawYear > 2400 ? rawYear - 543 : rawYear);

    return [
      year,
      String(Number(slashMatch[2])).padStart(2, "0"),
      String(Number(slashMatch[1])).padStart(2, "0")
    ].join("-");
  }

  const dotMatch = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dotMatch) {
    const rawYear = Number(dotMatch[3]);
    const year = dotMatch[3].length === 2
      ? (rawYear > 50 ? rawYear + 2500 - 543 : rawYear + 2000)
      : (rawYear > 2400 ? rawYear - 543 : rawYear);

    return [
      year,
      String(Number(dotMatch[2])).padStart(2, "0"),
      String(Number(dotMatch[1])).padStart(2, "0")
    ].join("-");
  }

  return text;
}

function normalizeSheetTime_(value) {
  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return formatTime_(value);
  }

  const text = String(value).trim();
  const timeMatch = text.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (timeMatch) {
    return [
      String(timeMatch[1]).padStart(2, "0"),
      String(timeMatch[2]).padStart(2, "0"),
      String(timeMatch[3] || "0").padStart(2, "0")
    ].join(":");
  }

  return text;
}

function getOrCreateSheetByName_(sheetName, headers) {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheetName === BO_MEMBERS_SHEET_NAME) {
    removeLegacyBoMemberFaceColumns_(sheet);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    ensureSheetHeaders_(sheet, headers);
  }

  return sheet;
}

function removeLegacyBoMemberFaceColumns_(sheet) {
  const legacyHeaders = [
    "faceImage1Url",
    "faceImage2Url",
    "faceDescriptor1",
    "faceDescriptor2"
  ];

  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnIndexes = headers
    .map(function(header, index) {
      return legacyHeaders.indexOf(header) !== -1 ? index + 1 : 0;
    })
    .filter(Boolean)
    .sort(function(left, right) {
      return right - left;
    });

  columnIndexes.forEach(function(columnIndex) {
    sheet.deleteColumn(columnIndex);
  });
}

function ensureSheetHeaders_(sheet, headers) {
  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  headers.forEach(function(header, targetIndex) {
    if (currentHeaders.indexOf(header) === -1) {
      const targetColumn = targetIndex + 1;
      if (targetColumn <= sheet.getLastColumn()) {
        sheet.insertColumnBefore(targetColumn);
        currentHeaders.splice(targetIndex, 0, header);
      } else {
        sheet.insertColumnAfter(sheet.getLastColumn());
        currentHeaders.push(header);
      }
      sheet.getRange(1, targetColumn).setValue(header);
    }
  });
}

function setTextCell_(sheet, rowNumber, header, value) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const column = headers.indexOf(header);
  if (column === -1) {
    return;
  }

  const range = sheet.getRange(rowNumber, column + 1);
  range.setNumberFormat("@");
  range.setValue(String(value || ""));
}

function upsertRowByKey_(sheet, headers, keyHeader, item) {
  ensureSheetHeaders_(sheet, headers);
  const values = sheet.getDataRange().getValues();
  const rowHeaders = values[0];
  const keyColumn = rowHeaders.indexOf(keyHeader);

  if (keyColumn === -1) {
    throw new Error(`Missing key header: ${keyHeader}`);
  }

  const normalizedKey = keyHeader === "phone"
    ? normalizePhone_(item[keyHeader] || "")
    : String(item[keyHeader] || "").trim();

  let rowNumber = 0;

  for (let index = 1; index < values.length; index += 1) {
    const currentValue = keyHeader === "phone"
      ? normalizePhone_(values[index][keyColumn] || "")
      : String(values[index][keyColumn] || "").trim();

    if (currentValue === normalizedKey) {
      rowNumber = index + 1;
      break;
    }
  }

  const rowValues = headers.map(function(header) {
    return item[header] == null ? "" : item[header];
  });

  if (!rowNumber) {
    sheet.appendRow(rowValues);
    rowNumber = sheet.getLastRow();
  } else {
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([rowValues]);
  }

  headers.forEach(function(header) {
    if (header === "phone" || header === "loginpin" || header === "loginPin") {
      setTextCell_(sheet, rowNumber, header, item[header] || "");
    }
  });

  return rowNumber;
}

function normalizeMemberType_(memberType) {
  const value = String(memberType || "").trim().toLowerCase();
  if (value === "silver" || value === "silver_up" || value === "silver up") {
    return "silver_up";
  }
  if (value === "online") {
    return "online";
  }

  return "monthly";
}

function getOnlineLineGroupJoinUrl_() {
  return String(ONLINE_LINE_GROUP_JOIN_URL || PropertiesService.getScriptProperties().getProperty("ONLINE_LINE_GROUP_JOIN_URL") || "").trim();
}

function setupMonthlyMemberDeactivationTrigger() {
  const handlerName = "runMonthlyMemberDeactivation";
  const existing = ScriptApp.getProjectTriggers().some(function(trigger) {
    return trigger.getHandlerFunction() === handlerName;
  });

  if (!existing) {
    ScriptApp.newTrigger(handlerName)
      .timeBased()
      .everyDays(1)
      .atHour(23)
      .create();
  }
}

function normalizePhone_(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function isLineWebhookPayload_(payload) {
  return payload && Array.isArray(payload.events);
}

function saveLineSourceToProperties_(groupId, event) {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty("LINE_GROUP_ID", String(groupId || ""));
  properties.setProperty("LINE_SOURCE_TYPE", String((event && event.source && event.source.type) || ""));
  properties.setProperty("LINE_EVENT_TYPE", String((event && event.type) || ""));
  properties.setProperty("LINE_EVENT_AT", new Date().toISOString());
}

function normalizeReportDate_(value) {
  if (!value) {
    return formatDate_(new Date());
  }
  return normalizeSheetDate_(value);
}

function formatDate_(dateLike) {
  const date = new Date(dateLike);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function formatTime_(dateLike) {
  const date = new Date(dateLike);
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0")
  ].join(":");
}

function formatThaiShortDate_(dateLike) {
  const normalized = normalizeReportDate_(dateLike);
  const date = new Date(`${normalized}T00:00:00`);
  return Utilities.formatDate(date, REPORT_TIMEZONE, "d/M/")
    + String(date.getFullYear() + 543);
}

function formatThaiReportTime_(dateLike) {
  return Utilities.formatDate(new Date(dateLike), REPORT_TIMEZONE, "H.mm");
}

function buildLineAttendanceMessage_(summary) {
  return [
    `📍คนเข้า Center ${formatThaiShortDate_(summary.reportDate)} (ณ ${formatThaiReportTime_(summary.generatedAt)} น.)`,
    `▶️ Offline = ${summary.offlineCount} คน`,
    `- Silver Up = ${summary.silverCount} คน`,
    `- ทั่วไป รายเดือน = ${summary.monthlyCount} คน`,
    `- ทั่วไป รายครั้ง = ${summary.regularCount} คน`,
    `▶️ Online = ${summary.onlineCount} คน`
  ].join("\n");
}

function sendLinePushMessage_(messageText) {
  const token = LINE_CHANNEL_ACCESS_TOKEN || PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_ACCESS_TOKEN");
  const groupId = LINE_GROUP_ID || PropertiesService.getScriptProperties().getProperty("LINE_GROUP_ID");

  if (!token) {
    throw new Error("Missing LINE channel access token.");
  }

  if (!groupId) {
    throw new Error("Missing LINE_GROUP_ID. กรุณาใส่ Group ID ของทีมก่อนส่งรายงาน");
  }

  const response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: {
      Authorization: `Bearer ${token}`
    },
    payload: JSON.stringify({
      to: groupId,
      messages: [
        {
          type: "text",
          text: messageText
        }
      ]
    })
  });

  const statusCode = response.getResponseCode();
  const body = response.getContentText();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`LINE push failed: ${body}`);
  }
}

function tryTrashDriveFile_(url) {
  const fileId = getDriveFileId_(url);
  if (!fileId) {
    return false;
  }

  try {
    DriveApp.getFileById(fileId).setTrashed(true);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function getOrCreateSheet_() {
  return getOrCreateSheetByName_(SHEET_NAME, HEADERS);
}

function saveImageToDrive_(dataUrl, fileName) {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const parts = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!parts) {
    throw new Error("Invalid image data URL. Expected base64 image data.");
  }

  const contentType = parts[1];
  const bytes = Utilities.base64Decode(parts[2]);
  const blob = Utilities.newBlob(bytes, contentType, fileName || `capture-${Date.now()}.jpg`);
  const file = folder.createFile(blob);

  if (SET_FILE_SHARING_ON_UPLOAD) {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
}


function callVisionApi_(dataUrl, apiKey) {
  const parts = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!parts) {
    throw new Error("Invalid image data");
  }

  return callVisionApiWithContent_(parts[2], apiKey);
}

function callVisionApiWithContent_(content, apiKey) {
  const response = UrlFetchApp.fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      requests: [
        {
          image: {
            content: content
          },
          features: [
            { type: "TEXT_DETECTION" },
            { type: "DOCUMENT_TEXT_DETECTION" }
          ],
          imageContext: {
            languageHints: ["en", "th"]
          }
        }
      ]
    })
  });

  const statusCode = response.getResponseCode();
  const body = response.getContentText();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`Vision API failed: ${body}`);
  }

  const json = JSON.parse(body);
  if (json.responses && json.responses[0]) {
    return json.responses[0];
  }

  throw new Error("Vision API returned no response");
}

function extractAmountCandidates_(text) {
  var MIN_AMOUNT = 100;
  var MAX_AMOUNT = 2000;
  var MAX_DIGITS = 4;
  var CONTEXT_WINDOW = 80;

  var normalized = normalizeOcrText_(text);
  var scored = new Map();

  var numberRegex = /\d+(?:\.\d{1,2})?/g;
  var match;

  while ((match = numberRegex.exec(normalized)) !== null) {
    var rawValue = match[0];
    var value = Number(rawValue);

    if (!isFinite(value) || value <= 0) continue;

    // Hard validation: range 100–2000
    if (value < MIN_AMOUNT || value > MAX_AMOUNT) continue;

    // Hard validation: integer part must be at most 4 digits
    var integerPart = rawValue.split(".")[0];
    if (integerPart.length > MAX_DIGITS) continue;

    // Extract context window around this match
    var ctxStart = Math.max(0, match.index - CONTEXT_WINDOW);
    var ctxEnd = Math.min(normalized.length, match.index + rawValue.length + CONTEXT_WINDOW);
    var context = normalized.slice(ctxStart, ctxEnd);

    var hasAmountKeyword  = /amount|จำนวนเงิน|จำนวน|ยอด/i.test(context);
    var hasCurrencyKeyword = /฿|บาท|baht/i.test(context);
    var hasRefKeyword     = /reference|ref\b|transaction/i.test(context);
    var hasDotZeroZero    = rawValue.endsWith(".00");
    var rawDigitLen       = integerPart.length;

    var score = 0;

    // +5 near Amount / จำนวนเงิน
    if (hasAmountKeyword) score += 5;

    // +3 near ฿ / บาท / Baht
    if (hasCurrencyKeyword) score += 3;

    // +2 has decimal .00
    if (hasDotZeroZero) score += 2;

    // -5 near Reference / Ref / Transaction
    if (hasRefKeyword) score -= 5;

    // -4 integer part longer than 8 digits
    if (rawDigitLen > 8) score -= 4;

    // -3 no keyword context at all
    if (!hasAmountKeyword && !hasCurrencyKeyword) score -= 3;

    // Keep highest score if the same value appears multiple times
    var existing = scored.get(value);
    if (existing === undefined || score > existing) {
      scored.set(value, score);
    }
  }

  return Array.from(scored.entries())
    .sort(function(a, b) {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0] - a[0];
    })
    .map(function(entry) { return entry[0]; })
    .slice(0, 10);
}

function normalizeOcrText_(text) {
  return String(text || "")
    .replace(/,/g, "")
    .replace(/[Oo๐o]/g, "0")
    .replace(/[Ss]/g, "5")
    .replace(/[Il|]/g, "1")
    .replace(/\s+/g, " ")
    .trim();
}

function createJsonOutput(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
