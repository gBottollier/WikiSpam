document.addEventListener("DOMContentLoaded", () => {
  // 🔹 Select DOM elements
  const container = document.querySelector(".timeline-container");
  const yearDiv = document.querySelector(".timeline-year");
  const events = Array.from(document.querySelectorAll(".event-card"));
  const eras = Array.from(document.querySelectorAll(".timeline-era"));

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
  // 🔹 Cleanup Function
  // =======================
  window.removeTimelineDebug = () => {
    clearDebug();
    document.querySelectorAll(".year-line-label").forEach(n => n.remove());
  };
});
