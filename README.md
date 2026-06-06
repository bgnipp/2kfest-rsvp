# 2K Fest July RSVP

An RSVP & signup form for **[2K Fest](https://2kfest.com)** — the second 2K musicians'
retreat / mini-festival / epic party, **July 17–20, 2026** in Murphys, CA.

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

## Wiring up submissions

By default the form runs in **demo mode**: submissions are saved to
`localStorage` and shown on the confirmation screen (no backend needed).

To collect real RSVPs, set `FORM_ENDPOINT` in `js/app.js`:

```js
const CONFIG = {
  FORM_ENDPOINT: "https://formspree.io/f/XXXXXXXX", // or a Google Apps Script Web App URL
  ...
};
```

The form sends a JSON `POST` with all answers. Any endpoint that accepts JSON works
([Formspree](https://formspree.io), a Google Apps Script `doPost`, a serverless
function, etc.).

## Deploy

Works as-is on **GitHub Pages**, Netlify, Vercel, or any static host.
For GitHub Pages: Settings → Pages → deploy from the `main` branch root.
