# 2K Fest — iMessage invite blast

Texts the pending invitees (`invitees-pending.tsv`) a personalized RSVP invite
from your Mac via **Messages.app** (iMessage by default). Runs locally — no
accounts or credentials are stored in this repo.

## Prereqs

- A Mac signed into iMessage as you (bgnipp@gmail.com / +15103685413).
- Node.js installed.
- First send will trigger a macOS **Automation permission** prompt to control
  Messages — approve it (System Settings → Privacy & Security → Automation →
  Terminal/Node → Messages).
- For **SMS** to non-iMessage numbers, enable Text Message Forwarding on your
  iPhone (Settings → Messages → Text Message Forwarding → your Mac).

## Files

- `invitees-pending.tsv` — name + phone (E.164) of people who haven't RSVP'd.
  Blank phone = no number on file (script lists these so you can text manually).
- `send.applescript` — sends a single message through Messages.app.
- `send-blast.js` — the driver. Personalizes, rate-limits, logs, and resumes.
- `sent-log.tsv` — created on first send; who's already been texted (so re-runs
  don't double-text). Delete it to reset. Git-ignored.

## Use

Always dry-run first (sends nothing, prints everything):

```bash
cd tools/imessage-blast
node send-blast.js
```

Send a single test to yourself:

```bash
node send-blast.js --send --only +15103685413
```

If that lands, send for real:

```bash
node send-blast.js --send
```

Other flags: `--sms` (use SMS instead of iMessage), `--limit N` (only the first
N), `--only +1...` (single recipient).

## Editing the message

Open `send-blast.js` and edit the `MESSAGE` constant. `{first}` becomes the
first name, `{name}` the full name. Adjust `MIN_DELAY_MS` / `MAX_DELAY_MS` to
change the pause between texts (defaults 12–25s to avoid looking like spam).
