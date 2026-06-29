#!/usr/bin/env node
/**
 * 2K Fest — iMessage invite blast (macOS)
 * ----------------------------------------------------------------------------
 * Reads invitees-pending.tsv and texts each person a personalized invite via
 * Messages.app (iMessage by default). Designed to run from Bryan's Mac, which is
 * signed into iMessage as bgnipp@gmail.com / +15103685413.
 *
 * SAFETY: this is DRY-RUN by default. It prints exactly what it WOULD send and
 * sends nothing. Add --send to actually fire the messages.
 *
 *   node send-blast.js                 # dry run (prints everything, sends nothing)
 *   node send-blast.js --send          # actually send via iMessage
 *   node send-blast.js --send --sms    # send via SMS instead (needs Text Forwarding)
 *   node send-blast.js --limit 5       # only process the first 5 with a phone
 *   node send-blast.js --send --only +15103685413   # send to one number (good test)
 *
 * It writes sent-log.tsv and SKIPS anyone already in that log, so re-running
 * after an interruption won't double-text people. Delete sent-log.tsv to reset.
 *
 * Tune MESSAGE, MIN_DELAY_MS, MAX_DELAY_MS below.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

// ---------------------------------------------------------------------------
// CONFIG — edit these
// ---------------------------------------------------------------------------

// {first} = first word of the name. {name} = full name.
// NOTE: the RSVP link is sent as a SEPARATE follow-up message (see LINK below).
// iMessage only renders a rich link preview when the URL is its own message and
// includes the https:// scheme — embedding it mid-sentence shows plain text.
const MESSAGE =
  "Hey {first}! Summer 2K Fest is July 17–20 🎶🪩 You're invited! " +
  "Please RSVP here to secure your spot and help us plan " +
  "(limited space, invite-only — please DM me before inviting anyone else):";

// Sent on its own, right after MESSAGE, so iMessage builds the poster preview.
const LINK = "https://2kfest.com/rsvp";

// Small pause between the text and the link so they arrive as two bubbles.
const LINK_DELAY_MS = 2000;

// Randomized pause between messages so it doesn't look like a spam burst.
const MIN_DELAY_MS = 12000; // 12s
const MAX_DELAY_MS = 25000; // 25s

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const SEND = args.includes("--send");
const USE_SMS = args.includes("--sms");
const SERVICE = USE_SMS ? "SMS" : "iMessage";

function argVal(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}
const LIMIT = argVal("--limit") ? Number(argVal("--limit")) : Infinity;
const ONLY = argVal("--only"); // restrict to a single phone (testing)

const DIR = __dirname;
const IN_FILE = path.join(DIR, "invitees-pending.tsv");
const LOG_FILE = path.join(DIR, "sent-log.tsv");
const APPLESCRIPT = path.join(DIR, "send.applescript");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadInvitees() {
  const lines = fs.readFileSync(IN_FILE, "utf8").split(/\r?\n/);
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const [name, phone] = line.split("\t");
    if (i === 0 && /^name$/i.test((name || "").trim())) continue; // header
    rows.push({ name: (name || "").trim(), phone: (phone || "").trim() });
  }
  return rows;
}

function loadAlreadySent() {
  if (!fs.existsSync(LOG_FILE)) return new Set();
  const sent = new Set();
  for (const line of fs.readFileSync(LOG_FILE, "utf8").split(/\r?\n/)) {
    const phone = line.split("\t")[1];
    if (phone && phone.trim()) sent.add(phone.trim());
  }
  return sent;
}

function logSent(name, phone) {
  const stamp = new Date().toISOString();
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "sent_at\tphone\tname\n", "utf8");
  }
  fs.appendFileSync(LOG_FILE, `${stamp}\t${phone}\t${name}\n`, "utf8");
}

function personalize(template, name) {
  const first = (name || "").split(/\s+/)[0] || "there";
  return template.replace(/\{first\}/g, first).replace(/\{name\}/g, name);
}

function sendOne(phone, message) {
  execFileSync("osascript", [APPLESCRIPT, phone, message, SERVICE], {
    stdio: "pipe",
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.floor(min + Math.random() * (max - min));

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async function main() {
  const all = loadInvitees();
  const sentAlready = loadAlreadySent();

  let withPhone = all.filter((r) => r.phone);
  const noPhone = all.filter((r) => !r.phone);
  if (ONLY) withPhone = withPhone.filter((r) => r.phone === ONLY);

  console.log("============================================================");
  console.log(`2K Fest iMessage blast — ${SEND ? "LIVE SEND" : "DRY RUN"} via ${SERVICE}`);
  console.log("============================================================");
  console.log(`Total invitees in file:   ${all.length}`);
  console.log(`Have a phone number:      ${all.filter((r) => r.phone).length}`);
  console.log(`Missing a number (skip):  ${noPhone.length}`);
  if (sentAlready.size) console.log(`Already texted (skip):    ${sentAlready.size}`);
  console.log("");
  console.log("Message template (sent as TWO bubbles for the link preview):");
  console.log("  1) " + MESSAGE);
  console.log("  2) " + LINK);
  console.log("");

  if (noPhone.length) {
    console.log("⚠️  No number on file (text these manually / find their #):");
    noPhone.forEach((r) => console.log("   • " + r.name));
    console.log("");
  }

  let count = 0;
  for (const r of withPhone) {
    if (count >= LIMIT) break;
    if (sentAlready.has(r.phone)) {
      console.log(`↷ skip (already texted): ${r.name} ${r.phone}`);
      continue;
    }
    const msg = personalize(MESSAGE, r.name);
    count++;

    if (!SEND) {
      console.log(`[DRY] → ${r.name} <${r.phone}>`);
      console.log(`        msg:  ${msg}`);
      console.log(`        link: ${LINK}`);
      continue;
    }

    try {
      sendOne(r.phone, msg);
      await sleep(LINK_DELAY_MS);
      sendOne(r.phone, LINK);
      logSent(r.name, r.phone);
      console.log(`✓ sent → ${r.name} <${r.phone}>`);
    } catch (err) {
      console.error(`✗ FAILED → ${r.name} <${r.phone}>: ${String(err.message || err).split("\n")[0]}`);
    }

    const wait = rand(MIN_DELAY_MS, MAX_DELAY_MS);
    if (count < withPhone.length) {
      console.log(`   …waiting ${(wait / 1000).toFixed(0)}s`);
      await sleep(wait);
    }
  }

  console.log("");
  console.log("------------------------------------------------------------");
  if (!SEND) {
    console.log(`DRY RUN complete. Would have texted ${count} people.`);
    console.log("Re-run with --send to actually send. Test first with:");
    console.log("   node send-blast.js --send --only +15103685413");
  } else {
    console.log(`Done. Texted ${count} people this run. Log: sent-log.tsv`);
  }
})();
