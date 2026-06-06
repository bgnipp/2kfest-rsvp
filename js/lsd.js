// ================================================================
//  :)  — "lsd=true" easter egg, ported from 2kfest.com
//  Add ?lsd=true to the URL (or tap the ☋ in the top bar) to melt.
// ================================================================
(function () {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let lsdActive =
    new URLSearchParams(window.location.search).get("lsd") === "true";
  let meltInterval = null;
  let hue = 0;
  let waveTick = 0;

  const WAVE_UP = 30;
  const WAVE_PEAK = 8;
  const WAVE_DOWN = 25;
  const WAVE_SOBER = 15;
  const WAVE_TOTAL = WAVE_UP + WAVE_PEAK + WAVE_DOWN + WAVE_SOBER;

  // Selectors mapped onto this form's DOM
  const SEL_SECTIONS = ".hero, .card, .success, .site-foot";
  const SEL_TEXT = "h1, h2, h3, h4, p, span, li, a, legend, label";
  const SEL_IMG = ".bg-layer, img";
  const SEL_BLOBS =
    ".card, .choice, .chip, .role, .role-card, .btn-primary, .btn-ghost, .hero-note";
  const SEL_GLOW =
    ".hero-title, .step-title, h2, h3, .btn-primary, .hero-kicker";
  const SEL_SPACING = ".hero-title, .step-title, h2, h3";
  const SEL_VANISH =
    "p, li, .choice, .role, .role-card, .chip, .hero-note";

  const lucyBtn = document.getElementById("lucy-btn");

  function getIntensity() {
    const pos = waveTick % WAVE_TOTAL;
    if (pos < WAVE_UP) return pos / WAVE_UP;
    if (pos < WAVE_UP + WAVE_PEAK) return 1;
    if (pos < WAVE_UP + WAVE_PEAK + WAVE_DOWN)
      return 1 - (pos - WAVE_UP - WAVE_PEAK) / WAVE_DOWN;
    return 0;
  }

  function inTopbar(el) {
    return el.closest(".topbar") || el.closest(".lsd-trail");
  }

  function resetStyles() {
    document.querySelectorAll(SEL_SECTIONS).forEach((s) => {
      s.style.transform = "";
      s.style.transition = "";
    });
    document.querySelectorAll(SEL_TEXT).forEach((el) => {
      el.style.transform = "";
      el.style.transition = "";
      el.style.textShadow = "";
      el.style.letterSpacing = "";
      el.style.wordSpacing = "";
      el.style.opacity = "";
    });
    document.querySelectorAll(SEL_IMG).forEach((el) => {
      el.style.transform = "";
      el.style.transition = "";
    });
    document.querySelectorAll(SEL_BLOBS).forEach((el) => {
      el.style.borderRadius = "";
    });
    document.body.style.transform = "";
    document.body.style.filter = "";
    document.body.style.transformOrigin = "";
    document.querySelectorAll(".lsd-trail").forEach((d) => d.remove());
  }

  function melt() {
    if (!lsdActive) return;
    waveTick++;
    const intensity = getIntensity();
    const t = intensity * 20;
    const now = Date.now();

    document.querySelectorAll(SEL_SECTIONS).forEach((s, i) => {
      const droop = Math.sin(now / 1500 + i * 1.7) * (t * 2);
      const skew = Math.sin(now / 2000 + i * 2.3) * (t * 0.3);
      const stretch = 1 + Math.sin(now / 1800 + i) * (t * 0.008);
      s.style.transform =
        intensity > 0.02
          ? `translateY(${droop}px) skewX(${skew}deg) scaleY(${stretch})`
          : "";
      s.style.transition = "transform 2s cubic-bezier(0.4, 0, 0.2, 1)";
    });

    document.querySelectorAll(SEL_TEXT).forEach((el, i) => {
      if (inTopbar(el)) return;
      if (intensity > 0.02) {
        const sag = Math.sin(now / 1200 + i * 0.5) * (t * 0.8) + t * 0.3;
        const warp = Math.sin(now / 1500 + i) * (t * 0.4);
        el.style.transform = `translateY(${sag}px) skewY(${warp}deg) scaleY(${
          1 + t * 0.003
        })`;
      } else {
        el.style.transform = "";
      }
      el.style.transition = "transform 2s ease";
    });

    document.querySelectorAll(SEL_IMG).forEach((el, i) => {
      if (intensity > 0.02) {
        const wobX = Math.sin(now / 1000 + i * 1.3) * (t * 1.2);
        const wobY = Math.cos(now / 1200 + i * 0.9) * (t * 0.8);
        el.style.transform = `skew(${wobX}deg, ${wobY}deg) scaleX(${
          1 + Math.sin(now / 800 + i * 0.9) * (t * 0.015)
        })`;
      } else {
        el.style.transform = "";
      }
      el.style.transition = "transform 2s ease";
    });

    document.querySelectorAll(SEL_BLOBS).forEach((el, i) => {
      if (intensity > 0.05) {
        const a = 8 + Math.sin(now / 800 + i) * (t * 3);
        const b = 8 + Math.cos(now / 1000 + i * 1.5) * (t * 3);
        const c = 8 + Math.sin(now / 1200 + i * 0.7) * (t * 3);
        const d = 8 + Math.cos(now / 700 + i * 2) * (t * 3);
        el.style.borderRadius = `${a}px ${b}px ${c}px ${d}px`;
      } else {
        el.style.borderRadius = "";
      }
    });

    const gravity = t * 0.4;
    document.body.style.transform =
      intensity > 0.02
        ? `rotate(${
            Math.sin(now / 2000) * t * 0.15
          }deg) perspective(600px) rotateX(${gravity * 0.8}deg)`
        : "";
    document.body.style.transformOrigin = "50% 0%";

    hue += intensity * 5;
    document.body.style.filter =
      intensity > 0.02
        ? `hue-rotate(${hue % 360}deg) saturate(${1 + t * 0.15}) contrast(${
            1 + t * 0.02
          })`
        : "";

    document.querySelectorAll(SEL_GLOW).forEach((el, i) => {
      if (intensity > 0.1) {
        const spread = t * 1.5;
        const dx = Math.sin(now / 800 + i) * spread;
        const dy = Math.cos(now / 1000 + i) * spread;
        el.style.textShadow = `${dx}px ${dy}px ${spread * 1.5}px currentColor, ${
          -dx * 1.5
        }px ${-dy * 1.5}px ${spread}px rgba(232,67,147,0.6), 0 0 ${
          spread * 3
        }px rgba(46,196,182,0.3)`;
      } else {
        el.style.textShadow = "";
      }
    });

    document.querySelectorAll(SEL_SPACING).forEach((el, i) => {
      if (intensity > 0.1) {
        const spacing = Math.sin(now / 1000 + i) * (t * 0.4);
        el.style.letterSpacing = `${spacing}px`;
        el.style.wordSpacing = `${spacing * 2}px`;
      } else {
        el.style.letterSpacing = "";
        el.style.wordSpacing = "";
      }
    });
  }

  function onTrailMove(e) {
    if (!lsdActive) return;
    const dot = document.createElement("div");
    dot.className = "lsd-trail";
    dot.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:9999;background:hsl(${
      Date.now() % 360
    },80%,60%);opacity:0.5;transition:all 2s ease-out;`;
    document.body.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.opacity = "0";
      dot.style.transform = `translateY(${-30 + Math.random() * 60}px) translateX(${
        -30 + Math.random() * 60
      }px) scale(0)`;
    });
    setTimeout(() => dot.remove(), 2100);
  }

  function onVanishHover(e) {
    if (!lsdActive) return;
    const el = e.target.closest(SEL_VANISH);
    if (!el || el.dataset.vanished) return;
    if (Math.random() > 0.12) return;
    el.dataset.vanished = "1";
    el.style.transition = "opacity 2s ease-out";
    el.style.opacity = "0";
    setTimeout(() => {
      el.style.transition = "opacity 3s ease-in";
      el.style.opacity = "1";
      delete el.dataset.vanished;
    }, 4000 + Math.random() * 6000);
  }

  function startLSD() {
    lsdActive = true;
    waveTick = 0;
    hue = 0;
    if (lucyBtn) {
      lucyBtn.classList.add("active");
      lucyBtn.setAttribute("aria-pressed", "true");
    }
    if (reduceMotion) return; // honor reduced motion: button lights up, no melting
    meltInterval = setInterval(melt, 1000);
    document.addEventListener("mousemove", onTrailMove);
    document.addEventListener("mouseover", onVanishHover);
  }

  function stopLSD() {
    lsdActive = false;
    clearInterval(meltInterval);
    document.removeEventListener("mousemove", onTrailMove);
    document.removeEventListener("mouseover", onVanishHover);
    if (lucyBtn) {
      lucyBtn.classList.remove("active");
      lucyBtn.setAttribute("aria-pressed", "false");
    }
    resetStyles();
  }

  if (lucyBtn) {
    lucyBtn.addEventListener("click", () =>
      lsdActive ? stopLSD() : startLSD()
    );
  }

  if (lsdActive) {
    lsdActive = false; // let startLSD flip it on cleanly
    startLSD();
  }
})();
