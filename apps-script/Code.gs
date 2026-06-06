/**
 * 2K Fest RSVP — Google Apps Script Web App
 * ----------------------------------------------------------------------------
 * Receives RSVP submissions from the static site and appends them as rows to
 * the Google Sheet this script is bound to. No credentials live in the website;
 * this runs on Google's servers under the sheet owner's account.
 *
 * SETUP
 *   1. Open the destination Google Sheet.
 *   2. Extensions → Apps Script. Delete any boilerplate, paste this whole file.
 *   3. Save (disk icon).
 *   4. Deploy → New deployment → gear icon → "Web app".
 *        - Description:    2K Fest RSVP
 *        - Execute as:     Me
 *        - Who has access: Anyone
 *      Click Deploy, authorize when prompted, and copy the "Web app" URL
 *      (it ends in /exec).
 *   5. Paste that URL into CONFIG.FORM_ENDPOINT in js/app.js and push.
 *
 * Re-deploying after edits: Deploy → Manage deployments → edit (pencil) →
 *   Version: New version → Deploy. (Keeps the same /exec URL.)
 */

// The tab (sheet) name to write to. Created automatically if missing.
var SHEET_NAME = 'RSVPs';

// Column order written to the sheet. The first row is a header.
var FIELDS = [
  'submitted_at',
  'name',
  'attending',
  'nights',
  'connection',
  'instruments',
  'set',
  'other_performance',
  'roles',
  'prep',
  'contribute',
  'phone',
  'email',
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // avoid two simultaneous writes clobbering a row
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var sheet = getSheet_();
    var row = FIELDS.map(function (key) {
      var v = data[key];
      if (Array.isArray(v)) return v.join(', ');
      return v == null ? '' : v;
    });
    // Server-side received timestamp in the very first column for sorting.
    sheet.appendRow([new Date()].concat(row));

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you sanity-check the deployment in a browser (GET the /exec URL).
function doGet() {
  return json_({ ok: true, service: '2K Fest RSVP', ready: true });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['received_at'].concat(FIELDS));
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
