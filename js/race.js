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

/* ---------- Mobile: app-like viewer (tabs + size-comparison carousel + card) ----------
   The desktop strip (hover to preview, click to scroll to it) doesn't work
   on touch and is hidden on mobile, which left 9 Éveillés / 7 Veilleurs
   with no way to find a specific one besides scrolling past all of them,
   and no way to compare sizes since only one was ever on screen. Below:
   always-visible tabs (Présentation / Éveillés / Veilleurs), a
   prev/active/next carousel row so relative race size stays visible (each
   image at a height scaled from its real pixel size, the same numbers the
   desktop strip uses), and a description card with the body text
   scrolling internally. Content is read from the existing desktop markup
   (hidden, not removed, on mobile) rather than duplicated. */
(() => {
  const app = document.getElementById("race-mobile-app");
  if (!app) return;

  const tabs = Array.from(document.querySelectorAll(".race-mobile-tab"));
  const carouselRow = document.getElementById("race-carousel-row");
  const slotPrev = document.querySelector(".race-carousel-slot.prev img");
  const slotActive = document.querySelector(".race-carousel-slot.active img");
  const slotNext = document.querySelector(".race-carousel-slot.next img");
  const nameEl = document.getElementById("race-mobile-name");
  const phraseEl = document.getElementById("race-mobile-phrase");
  const descEl = document.getElementById("race-mobile-desc");
  const progressBar = document.getElementById("race-progress-bar");
  const hint = document.getElementById("race-hint");
  const introHTML = document.querySelector(".race-intro-text")?.innerHTML || "";

  const allNaturalH = Object.values(races).flat().map(r => r.naturalH);
  const globalMin = Math.min(...allNaturalH);
  const globalMax = Math.max(...allNaturalH);
  const ACTIVE_MIN_VH = 12, ACTIVE_MAX_VH = 30;
  const SIDE_SCALE = 0.65; // neighbors are visibly secondary, not equal-weight

  // The whole sequence swiped through is one continuous line: the intro,
  // then every Éveillé, then every Veilleur — swiping past the last race
  // of one tab moves into the next tab rather than stopping there.
  const TAB_ORDER = ["intro", "normal", "watcher"];

  function heightFor(naturalH, scale = 1) {
    const vh = ACTIVE_MIN_VH + ((naturalH - globalMin) / (globalMax - globalMin)) * (ACTIVE_MAX_VH - ACTIVE_MIN_VH);
    return `${vh * scale}vh`;
  }

  let activeTab = "intro";
  let raceIndex = 0;

  function setSlot(imgEl, data, scale) {
    if (!data) {
      imgEl.removeAttribute("src");
      imgEl.style.visibility = "hidden";
      return;
    }
    imgEl.style.visibility = "visible";
    imgEl.src = `img/race/${data.file}`;
    imgEl.alt = data.display;
    imgEl.style.height = heightFor(data.naturalH, scale);
  }

  function renderRaceTab() {
    const list = races[activeTab];
    if (!list) return;
    raceIndex = Math.max(0, Math.min(raceIndex, list.length - 1));
    const data = list[raceIndex];

    carouselRow.style.display = "flex";
    setSlot(slotPrev, list[raceIndex - 1], SIDE_SCALE);
    setSlot(slotActive, data, 1);
    setSlot(slotNext, list[raceIndex + 1], SIDE_SCALE);

    const row = document.getElementById(data.desc);
    nameEl.textContent = data.display;
    phraseEl.textContent = row?.querySelector(".race-phrase")?.textContent || "";
    descEl.innerHTML = row?.querySelector(".race-description-text")?.innerHTML || "";
    descEl.scrollTop = 0;

    progressBar.style.width = `${((raceIndex + 1) / list.length) * 100}%`;
  }

  function renderIntroTab() {
    carouselRow.style.display = "none";
    nameEl.textContent = "Races du Monde";
    phraseEl.textContent = "";
    descEl.innerHTML = introHTML;
    descEl.scrollTop = 0;
    progressBar.style.width = "0%";
  }

  function render() {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === activeTab));
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
  function stepPage(direction) {
    if (activeTab !== "intro") {
      const list = races[activeTab];
      const newIndex = raceIndex + direction;
      if (newIndex >= 0 && newIndex < list.length) {
        slideCarousel(direction, () => {
          raceIndex = newIndex;
          renderRaceTab();
        });
        return;
      }
    }
    const tabPos = TAB_ORDER.indexOf(activeTab);
    const newTabPos = tabPos + direction;
    if (newTabPos < 0 || newTabPos >= TAB_ORDER.length) return; // already at either end
    activeTab = TAB_ORDER[newTabPos];
    if (activeTab !== "intro") {
      switchRace(activeTab);
      raceIndex = direction > 0 ? 0 : races[activeTab].length - 1;
    }
    render();
  }

  // Slides the carousel row out and back in around the content swap, so a
  // swipe reads as the next race sliding into place rather than an instant
  // jump-cut — only used for in-tab steps, since the carousel itself is
  // hidden going into/out of the intro tab anyway.
  let slideTimer = null;
  function slideCarousel(direction, applyChange) {
    if (carouselRow.style.display === "none") {
      applyChange();
      return;
    }
    if (slideTimer) clearTimeout(slideTimer);
    const shift = (carouselRow.offsetWidth || 240) / 3;
    carouselRow.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    carouselRow.style.transform = `translateX(${direction > 0 ? -shift : shift}px)`;
    carouselRow.style.opacity = "0.4";
    slideTimer = setTimeout(() => {
      applyChange();
      carouselRow.style.transition = "none";
      carouselRow.style.transform = "translateX(0)";
      carouselRow.style.opacity = "1";
      requestAnimationFrame(() => { carouselRow.style.transition = ""; });
    }, 200);
  }

  // Tapping a peeking neighbor jumps straight to it.
  document.querySelector(".race-carousel-slot.prev")?.addEventListener("click", () => stepPage(-1));
  document.querySelector(".race-carousel-slot.next")?.addEventListener("click", () => stepPage(1));

  // Swipe anywhere on the page — including inside the description's own
  // vertical scroll — moves through the sequence. The dx/dy ratio check
  // is what keeps a normal vertical scroll of the text from being read as
  // a page-swipe.
  let startX = 0, startY = 0, tracking = false;
  app.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  app.addEventListener("touchend", e => {
    if (!tracking) return;
    tracking = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      stepPage(dx < 0 ? 1 : -1);
      hint?.classList.add("done");
    }
  }, { passive: true });

  render();
})();
