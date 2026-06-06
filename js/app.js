/* 2K Fest RSVP — form behavior */
(function () {
  "use strict";

  // ----------------------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------------------
  // RSVPs are saved to a Google Sheet via a Google Apps Script Web App.
  // To turn it on:
  //   1. Open the destination Google Sheet → Extensions → Apps Script.
  //   2. Paste the contents of apps-script/Code.gs (in this repo) and Save.
  //   3. Deploy → New deployment → type "Web app" →
  //        Execute as: Me   |   Who has access: Anyone
  //   4. Copy the Web app URL (…/exec) and paste it below.
  // See README.md ("Collecting RSVPs") for the full walkthrough.
  //
  // Leave FORM_ENDPOINT blank to run in "demo" mode (no network call;
  // submissions are saved to this browser's localStorage and shown on screen).
  const CONFIG = {
    FORM_ENDPOINT: "https://script.google.com/macros/s/AKfycbzKqbBUC3xqgGszJiPzbeVj1HvTQxLPdatQCyJXCjNIRiYbvXo7e_Wd1-Su0I0ChVJ7/exec",
    EVENT_DATES: "July 17–20, 2026",
  };

  const { INSTRUMENTS, ROLES } = window.FORM_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const form = $("#rsvp-form");
  const hero = $(".hero");
  const success = $("#success");
  const steps = $$(".step", form);
  const progressFill = $("#progress-fill");
  const progressItems = $$("#progress-steps li");

  let current = 0;

  // ----------------------------------------------------------------------
  // Per-view backgrounds (photos from 2kfest.com) with a soft crossfade
  // ----------------------------------------------------------------------
  const BG = {
    hero: "assets/poster.png",
    steps: [
      "assets/bg/reel_3.jpeg", // RSVP — aerial of the stage + pool at sunset
      "assets/bg/reel_8.jpeg", // Music — sax players on stage
      "assets/bg/reel_4.jpeg", // Participate — hot tub party
      "assets/bg/reel_5.jpeg", // Contact — chill sunset by the pool
    ],
    success: "assets/bg/reel_9.jpeg", // celebratory: musician mid-song
  };
  const bgLayer = $("#bg-layer");
  let currentBg = BG.hero;

  // Preload so swaps don't flash the empty scrim.
  Object.values(BG).flat().forEach((src) => { new Image().src = src; });

  function setBg(src) {
    if (!bgLayer || src === currentBg) return;
    currentBg = src;
    bgLayer.style.opacity = "0";
    setTimeout(() => {
      bgLayer.style.backgroundImage = `url("${src}")`;
      bgLayer.style.opacity = "1";
    }, 280);
  }

  // ----------------------------------------------------------------------
  // RENDER: instruments
  // ----------------------------------------------------------------------
  function renderInstruments() {
    const grid = $("#instrument-grid");
    grid.innerHTML = INSTRUMENTS.map(
      (i) => `
      <label class="chip">
        <input type="checkbox" name="instruments" value="${i.label}" data-key="${i.value}" />
        <span><span aria-hidden="true">${i.emoji}</span>${i.label}</span>
      </label>`
    ).join("");

    const otherInput = $("#instrument-other");
    grid.addEventListener("change", (e) => {
      if (e.target.dataset.key === "other") {
        otherInput.hidden = !e.target.checked;
        if (e.target.checked) otherInput.focus();
      }
      clearError("instruments");
    });
  }

  // ----------------------------------------------------------------------
  // RENDER: roles (collapsible)
  // ----------------------------------------------------------------------
  function renderRoles() {
    const list = $("#roles-list");
    list.innerHTML = ROLES.map((r) => {
      const lead = r.lead
        ? `<span class="role-lead">Led by ${r.lead}</span>`
        : "";
      const train = r.requiresTraining
        ? `<span class="role-train">Training req.</span>`
        : "";
      const resp = r.responsibilities.map((x) => `<li>${x}</li>`).join("");
      return `
        <div class="role" data-role="${r.id}">
          <div class="role-head">
            <label class="role-check">
              <input type="checkbox" name="roles" value="${r.title}" />
            </label>
            <div class="role-main" role="button" tabindex="0" aria-expanded="false">
              <div class="role-title">
                <span class="role-emoji" aria-hidden="true">${r.emoji}</span>
                ${r.title} ${lead} ${train}
              </div>
              <div class="role-short">${r.short}</div>
            </div>
            <button class="role-toggle" type="button" aria-label="Show details">⌄</button>
          </div>
          <div class="role-details">
            <div class="role-details-inner">
              <div class="role-meta"><span><b>When:</b> ${r.time}</span></div>
              <h4>Responsibilities</h4>
              <ul>${resp}</ul>
              <p class="role-prework"><b>Prep:</b> ${r.prework}</p>
            </div>
          </div>
        </div>`;
    }).join("");

    list.addEventListener("change", (e) => {
      if (e.target.name === "roles") {
        e.target.closest(".role").classList.toggle("checked", e.target.checked);
        updatePrepVisibility();
      }
    });

    // Expand/collapse: toggle button or clicking the main body
    list.addEventListener("click", (e) => {
      const toggle = e.target.closest(".role-toggle");
      const main = e.target.closest(".role-main");
      if (toggle || main) {
        const role = e.target.closest(".role");
        const open = role.classList.toggle("open");
        const m = $(".role-main", role);
        if (m) m.setAttribute("aria-expanded", String(open));
      }
    });
    list.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("role-main")) {
        e.preventDefault();
        e.target.click();
      }
    });
  }

  function updatePrepVisibility() {
    const anyChecked = $$('input[name="roles"]').some((c) => c.checked);
    const prep = $("[data-show-if-any-role]");
    prep.style.display = anyChecked ? "" : "none";
  }

  // ----------------------------------------------------------------------
  // Conditional fields (data-show-if="field=val1,val2")
  // ----------------------------------------------------------------------
  function applyConditionals() {
    $$("[data-show-if]").forEach((el) => {
      const [field, valsRaw] = el.dataset.showIf.split("=");
      const vals = valsRaw.split(",");
      const checked = $(`input[name="${field}"]:checked`);
      const show = checked && vals.includes(checked.value);
      el.style.display = show ? "" : "none";
    });
  }

  form.addEventListener("change", (e) => {
    if (e.target.matches('input[type="radio"]')) {
      applyConditionals();
      clearError(e.target.name);
    }
  });

  // ----------------------------------------------------------------------
  // Validation
  // ----------------------------------------------------------------------
  function showError(name, msg) {
    const el = $(`[data-error="${name}"]`);
    if (el) { el.textContent = msg; el.classList.add("show"); }
    const field = el ? el.closest(".field") : null;
    if (field) field.classList.add("invalid");
  }
  function clearError(name) {
    const el = $(`[data-error="${name}"]`);
    if (el) { el.textContent = ""; el.classList.remove("show"); }
    const field = el ? el.closest(".field") : null;
    if (field) field.classList.remove("invalid");
  }

  // Pragmatic email check: one @, a dot in the domain, no spaces.
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  // Clear a field's error as soon as the user starts correcting it.
  form.addEventListener("input", (e) => {
    if (e.target.name) clearError(e.target.name);
  });

  function validateStep(idx) {
    let ok = true;

    if (idx === 0) {
      if (!$('input[name="attending"]:checked')) { showError("attending", "Please let us know."); ok = false; }
      const attending = $('input[name="attending"]:checked');
      const needsNights = attending && ["Yes", "Probably yes"].includes(attending.value);
      if (needsNights && !$('input[name="nights"]:checked')) { showError("nights", "Pick your nights."); ok = false; }
      const conn = $("#connection");
      if (!conn.value.trim()) { showError("connection", "This one's required."); ok = false; }
    }

    if (idx === 1) {
      const anyInst = $$('input[name="instruments"]').some((c) => c.checked);
      if (!anyInst) { showError("instruments", "Pick at least one (the 'cool' option counts!)."); ok = false; }
    }

    if (idx === 3) {
      const name = $("#name").value.trim();
      const phone = $("#phone").value.trim();
      const email = $("#email").value.trim();

      if (!name) { showError("name", "We need your name."); ok = false; }
      else if (name.length < 2) { showError("name", "That name looks too short."); ok = false; }

      const digits = phone.replace(/\D/g, "");
      if (!phone) { showError("phone", "We need a phone # for WhatsApp."); ok = false; }
      else if (!/^\+?[\d\s().-]{7,}$/.test(phone) || digits.length < 10 || digits.length > 15) {
        showError("phone", "Enter a valid phone number (at least 10 digits)."); ok = false;
      }

      if (!email) { showError("email", "Email required."); ok = false; }
      else if (!isValidEmail(email)) { showError("email", "Hmm, that email doesn't look right."); ok = false; }
    }
    return ok;
  }

  // ----------------------------------------------------------------------
  // Step navigation
  // ----------------------------------------------------------------------
  function goTo(idx) {
    steps.forEach((s, i) => (s.hidden = i !== idx));
    current = idx;
    setBg(BG.steps[idx] || BG.steps[0]);
    const pct = ((idx + 1) / steps.length) * 100;
    progressFill.style.width = pct + "%";
    progressItems.forEach((li, i) => {
      li.classList.toggle("active", i === idx);
      li.classList.toggle("done", i < idx);
    });
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (action === "next") {
      if (validateStep(current)) goTo(Math.min(current + 1, steps.length - 1));
    } else if (action === "prev") {
      goTo(Math.max(current - 1, 0));
    }
  });

  // Allow clicking progress steps to jump back to completed steps
  progressItems.forEach((li) => {
    li.addEventListener("click", () => {
      const target = Number(li.dataset.step);
      if (target < current) goTo(target);
    });
    li.style.cursor = "pointer";
  });

  $('[data-action="start"]').addEventListener("click", () => {
    hero.hidden = true;
    form.hidden = false;
    goTo(0);
  });

  // ----------------------------------------------------------------------
  // Collect + submit
  // ----------------------------------------------------------------------
  function collect() {
    const get = (name) => {
      const first = $(`[name="${name}"]`);
      // Radio/checkbox groups: only report a value when one is actually selected.
      if (first && (first.type === "radio" || first.type === "checkbox")) {
        const checked = $(`[name="${name}"]:checked`);
        return checked ? checked.value.trim() : "";
      }
      return first ? first.value.trim() : "";
    };
    const instruments = $$('input[name="instruments"]:checked').map((c) => c.value);
    const otherInst = $("#instrument-other").value.trim();
    if (otherInst) instruments.push(`Other: ${otherInst}`);
    const roles = $$('input[name="roles"]:checked').map((c) => c.value);

    return {
      attending: get("attending"),
      nights: get("nights"),
      connection: $("#connection").value.trim(),
      instruments,
      set: $("#set").value.trim(),
      other_performance: $("#other-performance").value.trim(),
      roles,
      prep: get("prep"),
      contribute: $("#contribute").value.trim(),
      name: $("#name").value.trim(),
      phone: $("#phone").value.trim(),
      email: $("#email").value.trim(),
      submitted_at: new Date().toISOString(),
    };
  }

  // Keep a local copy on the device as a backup (cheap insurance in case the
  // network call ever fails — RSVPs still aren't lost from this browser).
  function backupLocally(data) {
    try {
      const all = JSON.parse(localStorage.getItem("2kfest_rsvps") || "[]");
      all.push(data);
      localStorage.setItem("2kfest_rsvps", JSON.stringify(all));
    } catch (_) {
      /* localStorage unavailable (private mode, etc.) — ignore */
    }
  }

  async function submitData(data) {
    backupLocally(data);

    if (!CONFIG.FORM_ENDPOINT) return { demo: true };

    // NOTE: we POST as text/plain (not application/json) on purpose. That keeps
    // it a "simple request" so the browser skips the CORS preflight (OPTIONS),
    // which Google Apps Script Web Apps don't answer. The script JSON.parses the
    // raw body itself (see apps-script/Code.gs).
    const res = await fetch(CONFIG.FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`Submit failed (${res.status})`);
    return res.json().catch(() => ({}));
  }

  function renderSummary(data) {
    const rows = [];
    const add = (label, val) => { if (val && val.length) rows.push(`<div class="row"><b>${label}</b><span>${Array.isArray(val) ? val.join(", ") : val}</span></div>`); };
    add("Name", data.name);
    add("Attending", data.attending);
    add("Nights", data.nights);
    add("Instruments", data.instruments);
    add("Playing a set", data.set);
    add("Roles", data.roles);
    add("Prep weekend", data.prep);
    $("#success-summary").innerHTML = rows.join("");

    const yes = data.attending === "Yes" || data.attending === "Probably yes";
    $("#success-sub").textContent = yes
      ? "Thanks for RSVPing! We'll send the WhatsApp invite and details soon."
      : "Thanks for letting us know — we'll miss you, but maybe next time! 💛";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    const btn = $("#submit-btn");
    const data = collect();
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      await submitData(data);
      renderSummary(data);
      form.hidden = true;
      success.hidden = false;
      setBg(BG.success);
      success.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Send my RSVP 🎉";
      alert("Hmm, something went wrong sending your RSVP. Please try again, or text Bryan at 510-368-5413.");
      console.error(err);
    }
  });

  // ----------------------------------------------------------------------
  // Init
  // ----------------------------------------------------------------------
  renderInstruments();
  renderRoles();
  applyConditionals();
  updatePrepVisibility();
})();
