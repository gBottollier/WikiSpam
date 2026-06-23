document.addEventListener("DOMContentLoaded", () => {
  // 🔹 Select DOM elements
  const container = document.querySelector(".timeline-container");
  const yearDiv = document.querySelector(".timeline-year");
  const events = Array.from(document.querySelectorAll(".event-card"));
  const eras = Array.from(document.querySelectorAll(".timeline-era"));

  // =======================
  // 🔹 Per-event year badge (mobile redesign): data-year already existed
  // for the scroll-interpolation logic below but was never shown as text,
  // so individual events had no visible date at all, only the era's
  // overall range.
  // =======================
  events.forEach(card => {
    const year = Number(card.dataset.year);
    if (Number.isNaN(year)) return;
    const badge = document.createElement("span");
    badge.className = "event-year-badge";
    badge.textContent = year.toLocaleString("fr-FR");
    const header = card.querySelector(".event-header");
    (header || card).insertAdjacentElement("afterbegin", badge);
  });

  // =======================
  // 🔹 Group each card's description into one wrapper (mobile story mode
  // scrolls this one element). Several cards have multiple sibling
  // <p class="event-desc"> paragraphs with no shared container — giving
  // .event-desc itself flex+overflow-y:auto meant EACH paragraph became
  // its own independently scrolling box.
  // =======================
  events.forEach(card => {
    const descs = Array.from(card.querySelectorAll(":scope > .event-desc"));
    if (!descs.length) return;
    const wrap = document.createElement("div");
    wrap.className = "event-desc-wrap";
    descs[0].before(wrap);
    descs.forEach(p => wrap.appendChild(p));
  });

  // =======================
  // 🔹 Utility Functions
  // =======================
  const getOffsetRect = (el) => {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
      right: rect.right + window.scrollX,
      bottom: rect.bottom + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  };

  const createDebugLine = (top, color = "rgba(255,0,0,0.8)", labelText = null) => {
    const line = document.createElement("div");
    line.style.position = "absolute";
    line.style.top = `${Math.round(top)}px`;
    line.style.left = "0";
    line.style.width = "100%";
    line.style.height = "2px";
    line.style.background = color;
    line.style.zIndex = "9999";
    line.style.pointerEvents = "none";
    document.body.appendChild(line);

    if (labelText !== null) {
      const label = document.createElement("div");
      Object.assign(label.style, {
        position: "absolute",
        top: `${Math.round(top) - 10}px`,
        left: "6px",
        background: color,
        color: "#fff",
        padding: "2px 6px",
        fontSize: "12px",
        borderRadius: "3px",
        zIndex: 10000,
        pointerEvents: "none"
      });
      label.textContent = labelText;
      document.body.appendChild(label);
    }
  };

  const clearDebug = () => {
    document.querySelectorAll(".debug-line, .year-line, .year-line-label").forEach(n => n.remove());
  };

  // =======================
  // 🔹 Event Card Visibility
  // =======================
  function updateCardVisibility() {
    events.forEach(card => {
      const rect = card.getBoundingClientRect();
      const visible = rect.top < window.innerHeight - 120 && rect.bottom > 60;
      card.classList.toggle("visible", visible);
    });
  }

  // =======================
  // 🔹 Year Sticky Logic
  // =======================
  function updateYearFromSticky() {
    if (!events.length) return;

    const measured = events.map(ev => {
      const r = getOffsetRect(ev);
      return { top: r.top, year: Number(ev.dataset.year), el: ev };
    }).sort((a, b) => a.top - b.top);

    const yrRect = getOffsetRect(yearDiv);
    const yearCenter = yrRect.top + yrRect.height / 2;

    const firstEra = eras[0];
    const lastEra = eras[eras.length - 1];
    const eraStart = Number(firstEra?.dataset.start ?? measured[0].year);
    const eraEnd = Number(lastEra?.dataset.end ?? measured[measured.length - 1].year);

    const lastEvent = measured[measured.length - 1];
    const lastEventRect = getOffsetRect(lastEvent.el);
    const lastEventBottom = lastEventRect.bottom;

    let currentYear;

    if (yearCenter <= measured[0].top) {
      currentYear = eraStart;
    } else if (yearCenter >= measured[0].top && yearCenter <= lastEvent.top) {
      for (let i = 0; i < measured.length - 1; i++) {
        if (yearCenter >= measured[i].top && yearCenter <= measured[i + 1].top) {
          const prev = measured[i];
          const next = measured[i + 1];
          const ratio = (yearCenter - prev.top) / (next.top - prev.top || 1);
          currentYear = Math.round(prev.year + ratio * (next.year - prev.year));
          break;
        }
      }
    } else if (yearCenter > lastEvent.top && yearCenter <= lastEventBottom) {
      const ratio = (yearCenter - lastEvent.top) / (lastEventBottom - lastEvent.top || 1);
      currentYear = Math.round(lastEvent.year + ratio * (eraEnd - lastEvent.year));
    } else {
      currentYear = eraEnd;
    }

    yearDiv.textContent = currentYear;

    // Update any existing year labels
    document.querySelectorAll(".year-line-label")
      .forEach(n => n.textContent = currentYear);
  }

  // =======================
  // 🔹 Debugging Helpers
  // =======================
  function drawDebugLines() {
    clearDebug();
    events.forEach(ev => {
      const r = getOffsetRect(ev);
      createDebugLine(r.top, "rgba(255,0,0,0.8)", ev.dataset.year);
    });
  }

  function drawYearLine() {
    clearDebug();
    const yrRect = getOffsetRect(yearDiv);
    const yearCenter = yrRect.top + yrRect.height / 2;

    // Line
    createDebugLine(yearCenter, "rgba(0,100,255,0.95)");

    // Label
    const label = document.createElement("div");
    Object.assign(label.style, {
      position: "absolute",
      top: `${Math.round(yearCenter) - 12}px`,
      left: "8px",
      background: "rgba(0,100,255,0.95)",
      color: "#fff",
      padding: "2px 6px",
      fontSize: "12px",
      borderRadius: "3px",
      zIndex: 10002,
      pointerEvents: "none"
    });
    label.textContent = yearDiv.textContent || "";
    label.className = "year-line-label";
    document.body.appendChild(label);
  }

  // =======================
  // 🔹 Initialize
  // =======================
  updateCardVisibility();
  updateYearFromSticky();
  // drawDebugLines(); // Uncomment if you want debug visualization
  // drawYearLine();   // Uncomment if you want year line

  // =======================
  // 🔹 Scroll & Resize Events
  // =======================
  window.addEventListener("scroll", () => {
    updateCardVisibility();
    updateYearFromSticky();
  }, { passive: true });

  let resizeTO;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      updateCardVisibility();
      updateYearFromSticky();
    }, 120);
  });

  // =======================
  // 🔹 Era Navigation Logic
  // =======================
  const eraLinks = document.querySelectorAll(".era-link");
  const eraSections = document.querySelectorAll(".timeline-era");

  function updateActiveEra() {
    let currentEraId = "";

    // Find the era currently in view
    eraSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      // If the top of the section is somewhat in the upper half of viewport
      // or if it spans the whole viewport
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
        currentEraId = section.id;
      }
    });

    // Fallback: If no section meets the criteria (e.g. between sections? rare), 
    // keep the last one or find the closest one.
    // simpler approach: find the one that covers the middle of screen
    const middleY = window.innerHeight / 2;
    eraSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= middleY && rect.bottom >= middleY) {
        currentEraId = section.id;
      }
    });

    eraLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === `#${currentEraId}`);
    });
  }

  // Initial check
  updateActiveEra();

  // Add to scroll listener
  window.addEventListener("scroll", updateActiveEra, { passive: true });


  // =======================
  // 🔹 Audio Player Logic
  // =======================
  const audioControls = document.querySelectorAll(".audio-controls");
  let currentAudio = null;
  let currentBtn = null;

  audioControls.forEach(control => {
    const card = control.closest(".event-card");
    const audioSrc = card.dataset.audio;
    const btn = control.querySelector(".audio-btn");
    const slider = control.querySelector(".volume-slider");
    const playShape = btn.querySelector(".play-shape");
    const pauseShape = btn.querySelector(".pause-shape");

    let audio = null;

    btn.addEventListener("click", () => {
      // If we are playing another audio, pause it
      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        // Reset the previous button icon
        if (currentBtn) {
          currentBtn.querySelector(".play-shape").style.display = "block";
          currentBtn.querySelector(".pause-shape").style.display = "none";
        }
      }

      if (!audio) {
        audio = new Audio(audioSrc);
        audio.volume = slider.value;

        audio.addEventListener("ended", () => {
          playShape.style.display = "block";
          pauseShape.style.display = "none";
          currentAudio = null;
        });
      }

      if (audio.paused) {
        audio.play().catch(e => console.log("Audio play failed (file missing?):", e));
        playShape.style.display = "none";
        pauseShape.style.display = "block";
        currentAudio = audio;
        currentBtn = btn;
      } else {
        audio.pause();
        playShape.style.display = "block";
        pauseShape.style.display = "none";
        currentAudio = null; // or keep it to resume? logic allows resume
      }
    });

    slider.addEventListener("input", (e) => {
      if (audio) {
        audio.volume = e.target.value;
      }
    });

    // Allow clicking the slider without triggering the play button if bubbling
    slider.addEventListener("click", (e) => e.stopPropagation());
  });

  // =======================
  // 🔹 Cleanup Function
  // =======================
  window.removeTimelineDebug = () => {
    clearDebug();
    document.querySelectorAll(".year-line-label").forEach(n => n.remove());
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  };

  // =======================
  // 🔹 Mobile "story" mode: the desktop scroll-through-everything layout
  // (sticky era header + a fixed interpolated-year sidebar) didn't carry
  // over well to a phone screen. Below, only one event is shown at a time,
  // full-screen, swiped through horizontally like the character page —
  // with a dedicated header for era + this exact event's year, instead of
  // a small badge easy to miss while reading.
  // =======================
  const mq = window.matchMedia("(max-width: 900px)");
  const storyHeader = document.getElementById("story-header");
  const storyEraTitle = document.getElementById("story-era-title");
  const storyEraDate = document.getElementById("story-era-date");
  const storyYear = document.getElementById("story-year");
  const storyProgressEraBar = document.getElementById("story-progress-era-bar");
  const storyProgressTotalBar = document.getElementById("story-progress-total-bar");
  const storyHint = document.getElementById("story-hint");
  let storyIndex = 0;
  let storyModeOn = false;

  function renderStory() {
    storyIndex = Math.max(0, Math.min(storyIndex, events.length - 1));
    const active = events[storyIndex];
    events.forEach(ev => ev.classList.toggle("story-active", ev === active));
    // The desktop scroll-reveal system (updateCardVisibility below) only
    // adds .visible — and the opacity/transform that go with it — when an
    // actual scroll event fires. Activating a card here doesn't always
    // cause one (e.g. stepping between two short cards that both already
    // fit on screen), which left the "new" card sitting at opacity:0 until
    // the user nudged the page some other way. Story mode doesn't scroll
    // its way into events, so it sets this itself instead of waiting.
    active.classList.add("visible");

    const era = active.closest(".timeline-era");
    if (era) {
      storyEraTitle.textContent = era.querySelector(".era-title")?.textContent || "";
      storyEraDate.textContent = era.querySelector(".era-date")?.textContent || "";

      const eraEvents = Array.from(era.querySelectorAll(".event-card"));
      const localIndex = eraEvents.indexOf(active);
      storyProgressEraBar.style.width = `${((localIndex + 1) / eraEvents.length) * 100}%`;
    }
    const year = Number(active.dataset.year);
    storyYear.textContent = Number.isNaN(year) ? "" : year.toLocaleString("fr-FR");
    storyProgressTotalBar.style.width = `${((storyIndex + 1) / events.length) * 100}%`;

    // The active card is a fixed-position panel (see CSS) with its
    // description scrolling internally, rather than being part of the
    // page's normal flow — so there's no page-level scroll position to
    // manage here at all, which is what the previous scrollIntoView-based
    // approach was fighting with. Just reset that internal scroll.
    const descWrap = active.querySelector(".event-desc-wrap");
    if (descWrap) descWrap.scrollTop = 0;

    syncHeaderHeight();
  }

  // The card panel's CSS position needs the header + hint badge's real
  // rendered height, which can change between events (the era title can
  // wrap to a second line on a long name) — measuring after the content
  // above is set keeps everything in sync, rather than hardcoding a guess.
  function syncHeaderHeight() {
    requestAnimationFrame(() => {
      const headerH = storyHeader.offsetHeight;
      const hintH = storyHint.offsetHeight;
      document.documentElement.style.setProperty("--story-header-h", `${headerH}px`);
      document.documentElement.style.setProperty("--story-top", `${headerH + hintH}px`);
    });
  }

  function enterStoryMode() {
    if (storyModeOn) return;
    storyModeOn = true;
    storyHeader.classList.add("active");
    renderStory();
  }

  function exitStoryMode() {
    if (!storyModeOn) return;
    storyModeOn = false;
    storyHeader.classList.remove("active");
    events.forEach(ev => ev.classList.remove("story-active"));
  }

  mq.addEventListener("change", (e) => (e.matches ? enterStoryMode() : exitStoryMode()));
  if (mq.matches) enterStoryMode();

  // Re-measure on rotation/resize (e.g. the era title wrapping differently
  // at a new width changes the header's height, which the card panel's
  // position depends on).
  window.addEventListener("resize", () => {
    if (storyModeOn) syncHeaderHeight();
  });

  // Swiping the header jumps a whole era at a time (to the first event of
  // the next/previous one) rather than one event — a quick "skip ahead a
  // chapter" gesture separate from the event-by-event swipe below.
  function stepEra(direction) {
    const active = events[storyIndex];
    const era = active.closest(".timeline-era");
    const eraIndex = eras.indexOf(era);
    const newEraIndex = Math.max(0, Math.min(eraIndex + direction, eras.length - 1));
    if (newEraIndex === eraIndex) return;
    const firstEvent = eras[newEraIndex].querySelector(".event-card");
    if (!firstEvent) return;
    storyIndex = events.indexOf(firstEvent);
    renderStory();
  }

  let headerStartX = 0, headerStartY = 0, headerTracking = false;
  storyHeader.addEventListener("touchstart", e => {
    if (!storyModeOn || e.touches.length !== 1) return;
    headerStartX = e.touches[0].clientX;
    headerStartY = e.touches[0].clientY;
    headerTracking = true;
  }, { passive: true });

  storyHeader.addEventListener("touchend", e => {
    if (!storyModeOn || !headerTracking) return;
    headerTracking = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - headerStartX;
    const dy = touch.clientY - headerStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      // Stops this same gesture also being read as an event-swipe by the
      // container-level listener below (touch events bubble through it).
      e.stopPropagation();
      stepEra(dx < 0 ? 1 : -1);
      storyHint?.classList.add("done");
    }
  }, { passive: true });

  let storyStartX = 0, storyStartY = 0, storyTracking = false;
  container.addEventListener("touchstart", e => {
    if (!storyModeOn || e.touches.length !== 1) return;
    storyStartX = e.touches[0].clientX;
    storyStartY = e.touches[0].clientY;
    storyTracking = true;
  }, { passive: true });

  container.addEventListener("touchend", e => {
    if (!storyModeOn || !storyTracking) return;
    storyTracking = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - storyStartX;
    const dy = touch.clientY - storyStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      storyIndex += dx < 0 ? 1 : -1;
      renderStory();
      storyHint?.classList.add("done");
    }
  }, { passive: true });
});
