# 2K Fest July RSVP

An RSVP & signup form for **[2K Fest](https://2kfest.com)** — the fourth 2K musicians'
retreat / mini-festival / epic party (the summer edition), **July 17–20, 2026** in Murphys, CA.

It replicates the original Google Form, restyled to match the 2kfest.com look
(dark + gold, Bebas Neue / Rye / DM Sans, festival photos) with some UX upgrades:

- A friendly **4-step flow** with a progress bar instead of one long scroll.
- **Conditional questions** (e.g. "how many nights" only appears if you're coming).
- **Collapsible role cards** — each volunteer role expands to show what it actually
  involves (responsibilities, timing, prep work, and who's already leading it),
  pulled from the planning sheet.
- Instrument **multi-select chips** with an inline "Other" field.

## Structure

```
index.html        # markup for hero + 4-step form + success screen
css/styles.css    # 2kfest-inspired theme
js/data.js        # instruments + volunteer roles (from the planning sheet)
js/app.js         # steps, validation, conditional fields, submission
assets/           # photos pulled from 2kfest.com
```

## Run locally

It's a static site — just serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Collecting RSVPs (Google Sheet, no credentials in the repo)

📊 **Submissions sheet:** [2kfest-rsvp (Google Sheet)](https://docs.google.com/spreadsheets/d/10zdsrbqW_HDsNRY1iWonDB74V4p5CC1eo8ZQHe_gfAo/edit?usp=sharing) — RSVPs land on the **`RSVPs`** tab.

RSVPs are saved to a **Google Sheet** via a **Google Apps Script Web App**. The
script runs on Google's servers under the sheet owner's account, so the website
never holds any secret — exactly the "public endpoint owned by another account"
approach. The script lives in [`apps-script/Code.gs`](apps-script/Code.gs).

**One-time setup (the sheet owner does this):**

1. Create/open the destination Google Sheet.
2. **Extensions → Apps Script**. Delete the boilerplate, paste the contents of
   `apps-script/Code.gs`, and Save.
3. **Deploy → New deployment → Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Authorize when prompted, then copy the **Web app URL** (ends in `/exec`).
5. Paste that URL into `FORM_ENDPOINT` in `js/app.js` and push:

```js
const CONFIG = {
  FORM_ENDPOINT: "https://script.google.com/macros/s/XXXXXXXX/exec",
  ...
};
```

That's it — new RSVPs append as rows on a tab called `RSVPs` (headers are
created automatically). You can sanity-check the deployment by opening the
`/exec` URL in a browser; it returns `{"ok":true,...}`.

**Notes**
- The site POSTs as `text/plain` on purpose so the browser skips the CORS
  preflight that Apps Script Web Apps don't answer; the script parses the JSON
  body itself.
- After editing `Code.gs`, re-deploy via **Deploy → Manage deployments → edit →
  New version** to keep the same `/exec` URL.
- Until `FORM_ENDPOINT` is set, the form runs in **demo mode** (saved to the
  visitor's `localStorage` and shown on the confirmation screen). A local backup
  copy is always kept on-device even when a real endpoint is configured.

## Deploy

Works as-is on **GitHub Pages**, Netlify, Vercel, or any static host.
For GitHub Pages: Settings → Pages → deploy from the `main` branch root.
