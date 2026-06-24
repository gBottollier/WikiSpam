document.addEventListener("DOMContentLoaded", () => {
  const regions = document.querySelectorAll(".region");
  const emblems = Array.from(document.querySelectorAll(".emblem"));
  const emblemCarousel = document.querySelector(".emblem-carousel");

  let activeRegion = "hadeir"; // default region (first in CSV order)

  // ===== Show only the active region =====
function showRegion(regionName) {
  // --- Show region carousel ---
  regions.forEach(region => {
    if (region.dataset.region === regionName) {
      region.classList.add('active');
    } else {
      region.classList.remove('active');
    }
  });

  // --- Region name label (mobile-only badge: an icon, reused from the
  // desktop emblem so there's a single source of truth for the artwork,
  // plus the name in words since the icon alone doesn't say where a
  // character is from) ---
  const regionLabel = document.getElementById('region-label');
  if (regionLabel) {
    const emblemImgSrc = document.querySelector(`.emblem[data-region="${regionName}"] img`)?.src;
    const name = regionName.replace(/-/g, ' ');
    regionLabel.innerHTML = emblemImgSrc
      ? `<img src="${emblemImgSrc}" alt="">${name}`
      : name;
  }

  // --- Update background (lazy-load on first activation) ---
  const regionBackgrounds = document.querySelectorAll('.region-bg');
  regionBackgrounds.forEach(bg => {
    if (bg.dataset.region === regionName) {
      if (!bg.style.backgroundImage && bg.dataset.bg) {
        bg.style.backgroundImage = `url('${bg.dataset.bg}')`;
      }
      bg.classList.add('active');
    } else {
      bg.classList.remove('active');
    }
  });
}


  // ===== Set active character and center it =====
function setActiveCharacter(characterEl) {
  const region = characterEl.closest(".region");
  if (!region) return;

  const wrapper = region.querySelector(".character-carousel-wrapper");
  if (!wrapper) return;

  const carousel = region.querySelector(".character-carousel");
  if (!carousel) return;

  const chars = Array.from(carousel.children);
  const index = chars.indexOf(characterEl);
  if (index === -1) return;

  // Remove old classes
  chars.forEach(c => c.classList.remove("active", "prev", "next"));

  // Set active and neighbors
  characterEl.classList.add("active");
  if (chars[index - 1]) chars[index - 1].classList.add("prev");
  if (chars[index + 1]) chars[index + 1].classList.add("next");

  // Scroll calculation
  const charWidth = characterEl.offsetWidth;
  const gap = parseFloat(getComputedStyle(carousel).gap);
  const wrapperWidth = wrapper.clientWidth;
  let scrollLeft = index * (charWidth + gap) - wrapperWidth / 2 + charWidth / 2;

  const maxScroll = carousel.scrollWidth - wrapperWidth;
  scrollLeft = Math.max(0, Math.min(scrollLeft, maxScroll));

  wrapper.scrollTo({ left: scrollLeft, behavior: "smooth" });

  // ===== Update central character display image (crossfade) =====
  const charDisplay = document.getElementById("char-display");
  const charImg = characterEl.querySelector("img");
  if (charDisplay) {
    if (charImg) {
      charDisplay.classList.remove("visible");
      const newSrc = charImg.src;
      const img = new Image();
      img.src = newSrc;
      img.decode().then(() => {
        charDisplay.src = newSrc;
        charDisplay.classList.add("visible");
      }).catch(() => {
        charDisplay.src = newSrc;
        charDisplay.classList.add("visible");
      });
    } else {
      charDisplay.classList.remove("visible");
      charDisplay.src = "";
    }
  }

  // ===== Update external info-container =====
  const infoContainer = document.querySelector(".info-container");
  const charInfo = characterEl.querySelector(".character-info");
  if (infoContainer && charInfo) {
    infoContainer.innerHTML = charInfo.innerHTML;
  }

  // Mobile filmstrip: keep the prev/next preview slides in sync with
  // whichever character just became active (harmless no-op on desktop,
  // where those two slides stay hidden).
  updateCharTrackNeighbors();
}

// ===== Mobile splash-art filmstrip (prev/current/next, dragged as one
// unit — see the swipe block below) =====
function getCharImgSrc(characterEl) {
  return characterEl?.querySelector("img")?.src || "";
}

// Mirrors stepCharacter's own next/prev + region-wrap lookup, but purely
// read-only — used to fill the neighbor slides ahead of any actual swipe.
function peekCharacter(direction) {
  const activeRegionEl = document.querySelector(".region.active");
  if (!activeRegionEl) return null;
  const carousel = activeRegionEl.querySelector(".character-carousel");
  const chars = Array.from(carousel.children);
  const activeChar = carousel.querySelector(".character.active");
  if (!activeChar) return null;
  const index = chars.indexOf(activeChar);
  const regionsList = Array.from(document.querySelectorAll(".region"));
  const currentRegionIndex = regionsList.indexOf(activeRegionEl);

  if (direction > 0) {
    if (index < chars.length - 1) return chars[index + 1];
    const nextRegion = regionsList[(currentRegionIndex + 1) % regionsList.length];
    return nextRegion.querySelector(".character");
  }
  if (index > 0) return chars[index - 1];
  const prevRegion = regionsList[(currentRegionIndex - 1 + regionsList.length) % regionsList.length];
  return prevRegion.querySelector(".character:last-child");
}

function updateCharTrackNeighbors() {
  const prevImg = document.getElementById("char-display-prev");
  const nextImg = document.getElementById("char-display-next");
  if (prevImg) prevImg.src = getCharImgSrc(peekCharacter(-1));
  if (nextImg) nextImg.src = getCharImgSrc(peekCharacter(1));
}


// ===== Center active character (helper) =====
function centerActiveCharacter(characterEl) {
  const wrapper = characterEl.closest('.character-carousel-wrapper');
  const carousel = characterEl.closest('.character-carousel');
  const chars = Array.from(carousel.children);
  const index = chars.indexOf(characterEl);

  const charWidth = characterEl.offsetWidth;
  const gap = parseFloat(getComputedStyle(carousel).gap);

  // Total offset from start of carousel
  let scrollLeft = index * (charWidth + gap) - wrapper.clientWidth / 2 + charWidth / 2;

  // Clamp scroll so first/last items don't leave empty space
  scrollLeft = Math.max(0, Math.min(scrollLeft, carousel.scrollWidth - wrapper.clientWidth));

  wrapper.scrollTo({ left: scrollLeft, behavior: 'smooth' });
}

  // ===== Activate first character of a region =====
  function activateFirstCharacter(regionName) {
    const region = document.querySelector(`.region[data-region="${regionName}"]`);
    const firstChar = region?.querySelector(".character");
    if (firstChar) setActiveCharacter(firstChar);
  }
  
  function centerActiveEmblem(emblemEl) {
  const carousel = emblemEl.closest(".emblem-carousel");
  if (!carousel) return;

  // Desktop lays this out as a vertical column; the mobile media query
  // switches it to a horizontal row instead, so the axis to scroll has to
  // be detected rather than assumed, or this becomes a no-op on mobile
  // (scrolling top:... on a container with no vertical overflow) — which
  // left the active region stuck wherever scrollLeft happened to default,
  // with no indication that other regions existed off-screen.
  const isRow = getComputedStyle(carousel).flexDirection === "row";

  if (isRow) {
    const carouselWidth = carousel.clientWidth;
    const emblemLeft = emblemEl.offsetLeft;
    const emblemWidth = emblemEl.offsetWidth;
    let scrollLeft = emblemLeft - carouselWidth / 2 + emblemWidth / 2;
    const maxScroll = carousel.scrollWidth - carouselWidth;
    scrollLeft = Math.max(0, Math.min(scrollLeft, maxScroll));
    carousel.scrollTo({ left: scrollLeft, behavior: "smooth" });
    return;
  }

  const carouselHeight = carousel.clientHeight;
  const emblemTop = emblemEl.offsetTop;
  const emblemHeight = emblemEl.offsetHeight;

  // Scroll calculation: center the clicked emblem
  let scrollTop = emblemTop - carouselHeight / 2 + emblemHeight / 2;

  // Clamp scroll to valid range
  const maxScroll = carousel.scrollHeight - carouselHeight;
  scrollTop = Math.max(0, Math.min(scrollTop, maxScroll));

  // Smooth scroll
  carousel.scrollTo({
    top: scrollTop,
    behavior: "smooth"
  });
}


  // ===== Emblem click =====
  emblems.forEach(emblem => {
    emblem.addEventListener("click", () => {
      const regionName = emblem.dataset.region || emblem.querySelector("img")?.alt.toLowerCase();
      activeRegion = regionName;

      // Update active emblem
      document.querySelector(".emblem.active")?.classList.remove("active");
      emblem.classList.add("active");

      // Center emblem vertically
      centerActiveEmblem(emblem);

      // Show region and activate first character
      showRegion(regionName);
      activateFirstCharacter(regionName);
    });
  });

  // ===== Character click =====
  document.querySelectorAll(".character").forEach(char => {
    char.addEventListener("click", () => setActiveCharacter(char));
  });
  
const container = document.querySelector(".characters-container");

// Shared by wheel (desktop) and swipe (mobile, where the thumbnail strip is
// hidden in favor of this gesture): move to the next/previous character,
// wrapping into the next/previous region when stepping past either end.
function stepCharacter(direction) {
  const activeRegionEl = document.querySelector(".region.active");
  if (!activeRegionEl) return;

  const carousel = activeRegionEl.querySelector(".character-carousel");
  const chars = Array.from(carousel.children);
  const activeChar = carousel.querySelector(".character.active");
  if (!activeChar) return;

  const index = chars.indexOf(activeChar);
  const regionsList = Array.from(document.querySelectorAll(".region"));
  const currentRegionIndex = regionsList.indexOf(activeRegionEl);

  if (direction > 0) {
    if (index < chars.length - 1) {
      setActiveCharacter(chars[index + 1]);
    } else {
      const nextRegion = regionsList[(currentRegionIndex + 1) % regionsList.length];
      showRegion(nextRegion.dataset.region);
      activateFirstCharacter(nextRegion.dataset.region);
      updateActiveEmblem(nextRegion.dataset.region);
    }
  } else if (direction < 0) {
    if (index > 0) {
      setActiveCharacter(chars[index - 1]);
    } else {
      const prevRegion = regionsList[(currentRegionIndex - 1 + regionsList.length) % regionsList.length];
      showRegion(prevRegion.dataset.region);
      const lastChar = prevRegion.querySelector(".character:last-child");
      if (lastChar) setActiveCharacter(lastChar);
      updateActiveEmblem(prevRegion.dataset.region);
    }
  }
}

container.addEventListener("wheel", e => {
  e.preventDefault();
  stepCharacter(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

// ===== Touch swipe (mobile): horizontal swipe anywhere on the page
// switches character, since the thumbnail strip is hidden there in favor
// of this gesture. Attached to the whole container (not just the splash
// art) so it works from the description card too. Only the splash art
// filmstrip (#char-strip, inside the static clipped #char-track viewport)
// moves — the info card stays put. Since the prev/next slides are already
// pre-positioned right beside the current one, dragging the strip itself
// is enough to reveal whichever neighbor the user is dragging toward,
// live, before they even release. =====
(() => {
  const swipeTarget = document.querySelector(".characters-container");
  if (!swipeTarget) return;
  const charStrip = document.getElementById("char-strip");

  attachDragSwipe(swipeTarget, {
    getDraggables: () => [charStrip].filter(Boolean),
    onCommit: (direction) => {
      // Cyclic (wraps across regions both ways), so this never reaches a
      // real dead end — always treated as a successful step.
      stepCharacter(direction);
      // The track-slide above already completed the full visual
      // transition (the neighbor slide lands exactly where the current
      // one started) — #char-display's own async crossfade in
      // setActiveCharacter would otherwise leave it briefly showing the
      // old character right as the track snaps back to rest, so its src
      // is forced in sync here instead of waiting on that.
      const display = document.getElementById("char-display");
      const activeChar = document.querySelector(".character.active");
      if (display && activeChar) {
        display.src = getCharImgSrc(activeChar);
        display.classList.add("visible");
      }
      // Once someone's done it once they don't need reminding again —
      // and since this is just in-memory state, it naturally reappears
      // on the next page load for first-time visitors.
      document.getElementById("swipe-hint")?.classList.add("done");
      return true;
    },
    instantSettle: true,
  });
})();

// Helper to update active emblem
function updateActiveEmblem(regionName) {
  const emblem = document.querySelector(`.emblem[data-region="${regionName}"]`);
  if (!emblem) return;
  document.querySelector(".emblem.active")?.classList.remove("active");
  emblem.classList.add("active");
  centerActiveEmblem(emblem);
}
  
  // ===== INITIALIZATION =====
  showRegion(activeRegion);

  const defaultEmblem = document.querySelector(`.emblem[data-region="${activeRegion}"]`);
  defaultEmblem?.classList.add("active");
  if (defaultEmblem) centerActiveEmblem(defaultEmblem);

  activateFirstCharacter(activeRegion);
});
