/* ---------- Global Variables ---------- */
const races = {
  normal: [
    { display: "Nymphe", file: "nymphe_scaled.webp" },
    { display: "Tokscyth", file: "gnome_scaled.webp" },
    { display: "Oniyx", file: "oniyx_scaled.webp" },
    { display: "Olforgeur", file: "nain_scaled.webp" },
    { display: "Etherien", file: "humain_scaled.webp" },
    { display: "Anthropomorphe", file: "antropomorphe_scaled.webp" },
    { display: "Pixarch", file: "elfe_scaled.webp" },
    { display: "Alphilan", file: "alphilan_scaled.webp" },
    { display: "Natus", file: "natus_scaled.webp" },
    { display: "Arsh", file: "arsh_scaled.webp" }
  ],
  watcher: [
    { display: "Calamité", file: "calamite_scaled.webp" },
    { display: "Abyssal", file: "abyssal_scaled.webp" },
    { display: "Divinité", file: "divinite_scaled.webp" },
    { display: "Dragon", file: "dragon_scaled.webp" },
    { display: "Éternel", file: "eternel_scaled.webp" },
    { display: "Esprit", file: "esprit_scaled.webp" }
  ]
};

const raceDisplayNames = {
  normal: "Éveillés",
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

    [o.img, o.nameEl, hoverZone].forEach(el => {
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
