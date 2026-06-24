/* ---------- Global Variables ---------- */
// naturalH is each source image's actual pixel height — the art is already
// drawn to consistent in-universe scale (a Natus is genuinely drawn ~15x
// taller than an Esprit), which is how the desktop race-strip conveys size
// differences just by laying images out at their natural size. The mobile
// swipe-card mode (see bottom of file) reuses these same numbers to keep
// that comparison visible one race at a time.
const races = {
  normal: [
    { display: "Nymphe",         file: "nymphe_scaled.webp",        desc: "nymphe",        naturalH: 286 },
    { display: "Tokscyth",       file: "gnome_scaled.webp",         desc: "gnome",          naturalH: 536 },
    { display: "Oniyx",          file: "oniyx_scaled.webp",         desc: "oniyx",          naturalH: 736 },
    { display: "Olforgeur",      file: "nain_scaled.webp",          desc: "nain",           naturalH: 936 },
    { display: "Etherien",       file: "humain_scaled.webp",        desc: "humain",         naturalH: 1036 },
    { display: "Anthropomorphe", file: "antropomorphe_scaled.webp", desc: "antropomorphe",  naturalH: 1286 },
    { display: "Pixarch",        file: "elfe_scaled.webp",          desc: "elfe",           naturalH: 1286 },
    { display: "Alphilan",       file: "alphilan_scaled.webp",      desc: "alphilan",       naturalH: 1286 },
    { display: "Natus",          file: "natus_scaled.webp",         desc: "natus",          naturalH: 1536 },
  ],
  watcher: [
    { display: "Calamité", file: "calamite_scaled.webp", desc:"calamite",  naturalH: 800 },
    { display: "Arsh",     file: "arsh_scaled.webp",     desc:"arsh",      naturalH: 599 },
    { display: "Dhöggeïr",   file: "dragon_scaled.webp",   desc:"dragon",  naturalH: 400 },
    { display: "Divinité", file: "divinite_scaled.webp", desc:"divinite", naturalH: 300 },
    { display: "Abyssal",  file: "abyssal_scaled.webp",  desc:"abyssal",   naturalH: 267 },
    { display: "Eternel",  file: "eternel_scaled.webp",  desc:"eternel",   naturalH: 133 },
    { display: "Esprit",   file: "esprit_scaled.webp",   desc:"esprit",    naturalH: 100 }
  ]
};

const raceDisplayNames = {
  normal: "Eveilles",
  watcher: "Veilleurs"
};

let resizeTimeout = null;
let currentRace = "normal";

/* ---------- Race Buttons ---------- */
function createRaceButtons() {
  const container = document.querySelector(".race-buttons");
  if (!container) return;
  container.innerHTML = "";

  Object.keys(races).forEach(raceKey => {
    const btn = document.createElement("div");
    btn.className = "button";

    // use mapped display name if exists, otherwise fallback to capitalized key
    btn.textContent = raceDisplayNames[raceKey] || (raceKey.charAt(0).toUpperCase() + raceKey.slice(1));

    const btnLine = document.createElement("div");
    btnLine.className = "button-line";
    btn.appendChild(btnLine);

    if (raceKey === currentRace) btn.classList.add("active");

    btn.addEventListener("click", () => {
      switchRace(raceKey);
    });

    container.appendChild(btn);
  });
}

function switchRace(raceKey) {
  currentRace = raceKey;

  // update button active state
  document.querySelectorAll(".race-buttons .button").forEach(b => b.classList.remove("active"));
  document.querySelector(`.race-buttons .button:nth-child(${Object.keys(races).indexOf(raceKey)+1})`)?.classList.add("active");

  // update race strip
  layoutRaceStrip();

  // ---------- Show only selected description ----------
  document.querySelectorAll(".race-description").forEach(desc => {
    if (desc.classList.contains(raceKey)) {
      desc.style.display = "flex"; // show selected
    } else {
      desc.style.display = "none"; // hide others
    }
  });
}

/* ---------- Race Strip Layout ---------- */
function layoutRaceStrip() {
  const wrapper = document.querySelector(".race-wrapper");
  const strip = wrapper?.querySelector(".race-strip");
  const line = wrapper?.querySelector(".race-line");
  if (!wrapper || !strip || !line) return;

  strip.innerHTML = "";
  line.innerHTML = "";
  wrapper.style.position = wrapper.style.position || "relative";

  const raceData = races[currentRace];
  const items = createRaceItems(raceData, strip);

  const highlight = createHighlight(line);
  waitForImages(items).then(() => {
    const layoutData = computeLayout(items, strip, line);
    applyLayout(items, strip, wrapper, line, layoutData);
    createHoverZones(items, strip, wrapper, line, highlight, layoutData);
  });
}

/* ---------- Create Race Items ---------- */
function createRaceItems(raceData, strip) {
  const items = [];
  raceData.forEach(r => {
    const item = document.createElement("div");
    item.className = "race-item";
    item.style.position = "absolute";
    item.style.textAlign = "center";
    item.style.pointerEvents = "auto";
    item.style.display = "flex";
    item.style.flexDirection = "column";
    item.style.alignItems = "center";

    const img = document.createElement("img");
    img.className = "race-img";
    img.src = `img/race/${r.file}`;
    img.alt = r.display;

    const nameEl = document.createElement("div");
    nameEl.className = "race-name";
    nameEl.textContent = r.display;
    nameEl.style.fontFamily = "CronosPro, Arial, Helvetica, sans-serif";
    nameEl.style.textAlign = "center";
    nameEl.style.marginTop = "6px";
    nameEl.style.color = "rgba(255,255,255,0.6)";

    item.appendChild(img);
    item.appendChild(nameEl);
    strip.appendChild(item);

    items.push({ item, img, nameEl });
  });
  return items;
}

/* ---------- Create Highlight ---------- */
function createHighlight(line) {
  const highlight = document.createElement("div");
  highlight.className = "race-highlight";
  highlight.style.transition = "all 0.28s cubic-bezier(.2,.9,.2,1)";
  highlight.style.opacity = "0";
  line.appendChild(highlight);
  return highlight;
}

/* ---------- Wait for Images Loaded ---------- */
function waitForImages(items) {
  return Promise.all(items.map(o => o.img.complete ? Promise.resolve() : new Promise(res => { o.img.onload = res; })));
}

/* ---------- Compute Layout ---------- */
function computeLayout(items, strip, line) {
  const natW = items.map(o => o.img.naturalWidth);
  const natH = items.map(o => o.img.naturalHeight);
  const txtW = items.map(o => o.nameEl.getBoundingClientRect().width + 20);
  const effW = items.map((_, i) => Math.max(natW[i], txtW[i]));

  let totalW = effW[0] || 0;
  for (let i = 1; i < effW.length; i++) {
    totalW += effW[i]; // no overlap
  }

  const viewportWidth = window.innerWidth * 0.9;
  const scale = Math.min(1, viewportWidth / Math.max(1, totalW));

  let positions = [];
  let currentLeft = 0;
  let maxItemVisualHeight = 0;

  items.forEach((o, i) => {
    const imgW = natW[i] * scale;
    const imgH = natH[i] * scale;
    const totalWItem = Math.max(imgW, txtW[i]);

    o.img.style.width = `${imgW}px`;
    o.img.style.height = "auto";
    o.img.style.display = "block";
    o.img.style.margin = "0 auto";
    o.img.style.filter = "grayscale(100%) brightness(20%) contrast(120%) saturate(100%)";

    o.item.style.left = `${currentLeft}px`;
    o.item.style.bottom = "0";
    o.img.style.zIndex = `${items.length - i}`;

    const itemHeight = imgH + o.nameEl.offsetHeight + 10;
    if (itemHeight > maxItemVisualHeight) maxItemVisualHeight = itemHeight;

    positions.push(currentLeft);
    if (i < items.length - 1) currentLeft += totalWItem;
  });

  return { positions, scale, maxItemVisualHeight };
}

/* ---------- Apply Layout ---------- */
function applyLayout(items, strip, wrapper, line, layoutData) {
  const { positions, maxItemVisualHeight } = layoutData;

  strip.style.height = `${Math.ceil(maxItemVisualHeight)}px`;
  wrapper.style.height = `${Math.ceil(maxItemVisualHeight + line.offsetHeight)}px`;

  const totalVisualWidth = positions.at(-1) + items.at(-1).img.offsetWidth;
  strip.style.width = `${totalVisualWidth}px`;
  strip.style.position = "relative";
  strip.style.margin = "0 auto";
  strip.style.overflow = "visible";

  line.style.width = `${totalVisualWidth}px`;
  line.style.height = line.style.height || "4px";
}

/* ---------- Create Hover Zones ---------- */
function createHoverZones(items, strip, wrapper, line, highlight, layoutData) {
  const { positions, maxItemVisualHeight } = layoutData;
  const wrapperRect = wrapper.getBoundingClientRect();
  const stripRect = strip.getBoundingClientRect();
  const lineRect = line.getBoundingClientRect();

  const hoverTop = 0; 
  const hoverHeight = maxItemVisualHeight + lineRect.height;

  items.forEach((o, i) => {
    const groupWidth = Math.max(o.img.offsetWidth, o.nameEl.offsetWidth);
    const leftRel = (stripRect.left - wrapperRect.left) + positions[i];

    const hoverZone = document.createElement("div");
    hoverZone.className = "race-hover-zone";
    hoverZone.style.position = "absolute";
    hoverZone.style.left = `${leftRel}px`;
    hoverZone.style.top = `${hoverTop}px`;
    hoverZone.style.width = `${groupWidth}px`;
    hoverZone.style.height = `${hoverHeight}px`;
    hoverZone.style.background = "transparent";
    hoverZone.style.cursor = "pointer";
    hoverZone.style.zIndex = "50";
    wrapper.appendChild(hoverZone);

    // ---------- Hover Effects ----------
    const activate = () => {
      const highlightWidth = Math.max(o.img.offsetWidth, o.nameEl.offsetWidth);
      const highlightLeftInsideLine = positions[i] + (o.img.offsetWidth / 2) - (highlightWidth / 2);
      highlight.style.width = `${highlightWidth}px`;
      highlight.style.left = `${highlightLeftInsideLine}px`;
      highlight.style.opacity = "1";

      o.img.style.filter = "grayscale(0%) brightness(100%) contrast(100%) saturate(100%)";
      o.nameEl.style.color = "#00ffff";
      o.img.style.zIndex = "999";
    };

    const deactivate = () => {
      highlight.style.opacity = "0";
      o.img.style.filter = "grayscale(100%) brightness(20%) contrast(120%) saturate(100%)";
      o.nameEl.style.color = "rgba(255,255,255,0.6)";
      o.img.style.zIndex = `${items.length - i}`;
    };
    
    // ---------- Click to Scroll to Description ----------
    const handleClick = () => {
      const raceId = races[currentRace][i].desc;
      const targetRow = document.getElementById(raceId);

      if (targetRow) {
        targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
        targetRow.classList.add("highlight");
        setTimeout(() => targetRow.classList.remove("highlight"), 1500);
      }
    };
    
    // ---------- Register event ----------
    [o.img, o.nameEl, hoverZone].forEach(el => {
      el.addEventListener("click", handleClick);
      el.addEventListener("mouseenter", activate);
      el.addEventListener("mouseleave", deactivate);
    });
  });
}

/* ---------- Event Listeners ---------- */
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(layoutRaceStrip, 150);
});

window.addEventListener("load", () => {
  createRaceButtons();
  layoutRaceStrip();
});

/* ---------- Mobile: app-like viewer (tabs + depth carousel + card) ----------
   The desktop strip (hover to preview, click to scroll to it) doesn't work
   on touch and is hidden on mobile, which left 9 Éveillés / 7 Veilleurs
   with no way to find a specific one besides scrolling past all of them,
   and no way to compare sizes since only one was ever on screen. Below:
   always-visible tabs (Présentation / Éveillés / Veilleurs), a 5-slot
   depth carousel (prev/current/next visible, two hidden buffers either
   side) whose position/scale/opacity js/race.js interpolates continuously
   as the user drags — so dragging forward visibly grows the next race
   from a small back-peek into the large current position while current
   shrinks back into the prev peek, rather than just sliding on/off
   screen — and a description card with the body text scrolling
   internally. Content is read from the existing desktop markup (hidden,
   not removed, on mobile) rather than duplicated. */
(() => {
  const app = document.getElementById("race-mobile-app");
  if (!app) return;

  const tabs = Array.from(document.querySelectorAll(".race-mobile-tab"));
  const track = document.getElementById("race-track");
  const nameEl = document.getElementById("race-mobile-name");
  const phraseEl = document.getElementById("race-mobile-phrase");
  const descEl = document.getElementById("race-mobile-desc");
  const progressBar = document.getElementById("race-progress-bar");
  const hint = document.getElementById("race-hint");
  const introHTML = document.querySelector(".race-intro-text")?.innerHTML || "";

  // peeks[rel] = the slot showing the race at raceIndex+rel. -2/2 are
  // hidden buffers just past the visible -1/1 peeks, ready to grow into
  // view as soon as a drag starts toward them.
  const peeks = {};
  document.querySelectorAll(".race-peek").forEach((el) => {
    peeks[Number(el.dataset.rel)] = { el, img: el.querySelector(".race-slide") };
  });

  const allNaturalH = Object.values(races).flat().map(r => r.naturalH);
  const globalMin = Math.min(...allNaturalH);
  const globalMax = Math.max(...allNaturalH);
  const ACTIVE_MIN_VH = 12, ACTIVE_MAX_VH = 30;

  // The whole sequence swiped through is one continuous line: the intro,
  // then every Éveillé, then every Veilleur — swiping past the last race
  // of one tab moves into the next tab rather than stopping there.
  const TAB_ORDER = ["intro", "normal", "watcher"];

  // Real pixel height the race is drawn at, scaled into the carousel's vh
  // range — so a Natus still visibly dwarfs an Esprit even at peek size,
  // the same numbers the desktop strip uses for the same comparison.
  function heightFor(naturalH) {
    const vh = ACTIVE_MIN_VH + ((naturalH - globalMin) / (globalMax - globalMin)) * (ACTIVE_MAX_VH - ACTIVE_MIN_VH);
    return `${vh}vh`;
  }

  // Resting look at each relative position — keyed by distance from
  // center, interpolated between for the fractional positions a live drag
  // passes through. 0: full size, front and center. 1: the visible peek.
  // 2: fully transparent, parked just past the peek as a buffer.
  const STOPS = {
    0: { x: 0, scale: 1, opacity: 1 },
    1: { x: 36, scale: 0.6, opacity: 0.5 },
    2: { x: 58, scale: 0.35, opacity: 0 },
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  function styleAt(idx) {
    const clamped = Math.max(-2, Math.min(2, idx));
    const sign = clamped < 0 ? -1 : 1;
    const a = Math.abs(clamped);
    const lo = Math.floor(a), hi = Math.min(2, Math.ceil(a));
    const t = hi === lo ? 0 : (a - lo) / (hi - lo);
    const loS = STOPS[lo], hiS = STOPS[hi];
    return {
      x: sign * lerp(loS.x, hiS.x, t),
      scale: lerp(loS.scale, hiS.scale, t),
      opacity: lerp(loS.opacity, hiS.opacity, t),
    };
  }

  // f is "how far advanced toward the next race" — 0 at rest, ±1 at a
  // full committed step. Applied to every slot at once: at f=1, what was
  // at rel 1 (the next peek) now renders with styleAt(0) (full size,
  // centered), what was at rel 0 now renders with styleAt(-1) (shrunk
  // back to the prev peek), and so on down the line.
  function applyForF(f, withTransition) {
    [-2, -1, 0, 1, 2].forEach((rel) => {
      const el = peeks[rel]?.el;
      if (!el) return;
      el.style.transition = withTransition ? "transform 0.2s ease, opacity 0.2s ease" : "none";
      const s = styleAt(rel - f);
      el.style.transform = `translateX(${s.x}vw) scale(${s.scale})`;
      el.style.opacity = s.opacity;
    });
  }

  let activeTab = "intro";
  let raceIndex = 0;

  function setSlot(imgEl, data) {
    if (!data) {
      imgEl.removeAttribute("src");
      imgEl.style.visibility = "hidden";
      return;
    }
    imgEl.style.visibility = "visible";
    imgEl.src = `img/race/${data.file}`;
    imgEl.alt = data.display;
    imgEl.style.height = heightFor(data.naturalH);
  }

  function renderRaceTab() {
    const list = races[activeTab];
    if (!list) return;
    raceIndex = Math.max(0, Math.min(raceIndex, list.length - 1));
    const data = list[raceIndex];

    track.style.display = "block";
    [-2, -1, 0, 1, 2].forEach((rel) => setSlot(peeks[rel].img, list[raceIndex + rel]));
    applyForF(0, false);

    const row = document.getElementById(data.desc);
    nameEl.textContent = data.display;
    phraseEl.textContent = row?.querySelector(".race-phrase")?.textContent || "";
    descEl.innerHTML = row?.querySelector(".race-description-text")?.innerHTML || "";
    descEl.scrollTop = 0;

    progressBar.style.width = `${((raceIndex + 1) / list.length) * 100}%`;
  }

  function renderIntroTab() {
    track.style.display = "none";
    nameEl.textContent = "Races du Monde";
    phraseEl.textContent = "";
    descEl.innerHTML = introHTML;
    descEl.scrollTop = 0;
    progressBar.style.width = "0%";
  }

  function render() {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === activeTab));
    resetCardDrag();
    if (activeTab === "intro") renderIntroTab();
    else renderRaceTab();
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      activeTab = tab.dataset.tab;
      raceIndex = 0;
      if (activeTab !== "intro") switchRace(activeTab);
      render();
    });
  });

  // One step in the continuous intro→Éveillés→Veilleurs sequence. Crossing
  // a tab boundary lands on the first race of the next one (or last, going
  // backwards) rather than just stopping at the edge of the current tab.
  // Returns false at either end of the whole sequence so the touch
  // handler below knows to spring back instead of relabeling slots with
  // content that never actually changed.
  function stepPage(direction) {
    if (activeTab !== "intro") {
      const list = races[activeTab];
      const newIndex = raceIndex + direction;
      if (newIndex >= 0 && newIndex < list.length) {
        raceIndex = newIndex;
        renderRaceTab();
        return true;
      }
    }
    const tabPos = TAB_ORDER.indexOf(activeTab);
    const newTabPos = tabPos + direction;
    if (newTabPos < 0 || newTabPos >= TAB_ORDER.length) return false; // already at either end
    activeTab = TAB_ORDER[newTabPos];
    if (activeTab !== "intro") {
      switchRace(activeTab);
      raceIndex = direction > 0 ? 0 : races[activeTab].length - 1;
    }
    render();
    return true;
  }

  // The intro tab has no carousel at all (it's hidden there) — the card
  // itself stands in for "the image" there instead, with a plain
  // translateX+fade drag/snap rather than the depth carousel's
  // per-slot interpolation.
  const card = document.getElementById("race-mobile-card");
  function applyCardDrag(dx, withTransition) {
    if (!card) return;
    card.style.transition = withTransition ? "transform 0.2s ease, opacity 0.2s ease" : "none";
    card.style.transform = dx === 0 && !withTransition ? "" : `translateX(${dx}px)`;
    card.style.opacity = dx === 0 && !withTransition ? "" : String(Math.max(0.3, 1 - Math.abs(dx) / viewWidth));
  }
  // Always cleared on every render — otherwise a leftover drag transform/
  // opacity from the intro card would still be sitting on it the next
  // time it's reused to show a race's name/phrase/description.
  function resetCardDrag() {
    if (!card) return;
    card.style.transition = "none";
    card.style.transform = "";
    card.style.opacity = "";
  }

  // Swipe anywhere on the page — including inside the description's own
  // vertical scroll — drives the carousel's depth transition continuously
  // on a race tab (see applyForF above, not just a binary on/off-screen
  // swap), or drags the card itself on the intro tab. The dx/dy ratio
  // check is what keeps a normal vertical scroll of the text from being
  // read as a page-swipe.
  let startX = 0, startY = 0, tracking = false, decided = null, viewWidth = 0;

  app.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
    decided = null;
  }, { passive: true });

  app.addEventListener("touchmove", (e) => {
    if (!tracking || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (decided === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      decided = Math.abs(dx) > Math.abs(dy) * 1.5 ? "h" : "v";
      if (decided === "h") viewWidth = app.clientWidth || window.innerWidth;
    }
    if (decided !== "h") return;
    if (track.style.display === "none") applyCardDrag(dx, false);
    else applyForF(Math.max(-1, Math.min(1, -dx / viewWidth)), false);
  }, { passive: true });

  app.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    if (decided !== "h") { decided = null; return; }
    decided = null;

    const onIntro = track.style.display === "none";
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const committed = Math.abs(dx) > Math.max(40, viewWidth * 0.18);

    if (!committed) {
      if (onIntro) applyCardDrag(0, true);
      else applyForF(0, true);
      return;
    }

    const direction = dx < 0 ? 1 : -1;
    if (onIntro) applyCardDrag(direction > 0 ? -viewWidth : viewWidth, true);
    else applyForF(direction, true); // finish the rest of the way to a full step
    setTimeout(() => {
      const advanced = stepPage(direction);
      if (!advanced) {
        if (onIntro) applyCardDrag(0, true);
        else applyForF(0, true);
        return;
      }
      hint?.classList.add("done");
      // render() (via stepPage) already relabeled every slot's content
      // for the new raceIndex/tab and reset both the carousel's f and the
      // card's drag transform — there's nothing left to animate here.
    }, 200);
  }, { passive: true });

  render();
})();
