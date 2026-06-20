# WhatsApp group → CSV exporter

A one-off helper to pull every member of a WhatsApp group (name + phone number)
into a CSV, so you can text out 2K Fest invites and match against the invitee
list.

## Run it

```bash
cd tools/whatsapp-export
npm install
npm start
```

1. A **QR code** appears in your terminal. On your phone: **WhatsApp → Settings
   → Linked Devices → Link a Device**, and scan it.
2. The script prints a **numbered list of your groups**. Type the number of the
   2K group and press Enter.
3. It writes **`whatsapp-members.csv`** here with columns: `name, phone, role`.
   - `name` is the contact name saved in *your* phone if you have them saved,
     otherwise their WhatsApp display name, otherwise blank.
   - `phone` is in `+<countrycode><number>` form (e.g. `+15103685413`).

Your login is cached (`.wwebjs_auth/`) so re-runs don't need another scan.

## Notes & cautions

- **Unofficial / ToS:** `whatsapp-web.js` is not sanctioned by WhatsApp and using
  it technically violates their Terms of Service. For a single read-only export
  of your own group the risk is low, but it's your call. This script only
  **reads** the member list — it never sends messages.
- **Privacy:** `whatsapp-members.csv` contains real phone numbers. It's
  git-ignored on purpose — don't commit or share it.
- Requires Node 18+ and will download a headless Chromium via Puppeteer on first
  `npm install`.
