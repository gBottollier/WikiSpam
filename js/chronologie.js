document.addEventListener("DOMContentLoaded", () => {
  const eras = document.querySelectorAll(".timeline-era");
  const eventCards = document.querySelectorAll(".event-card");

  // === Floating year card ===
  const yearCard = document.createElement("div");
  yearCard.classList.add("scroll-year-card");
  const yearValue = document.createElement("div");
  yearValue.classList.add("scroll-year-value");
  yearCard.appendChild(yearValue);
  document.body.appendChild(yearCard);

  // === Helpers ===
  let lastYear = 0;
  let lastScrollTop = window.scrollY;

  function getCurrentYear() {
    const scrollTop = window.scrollY;
    const scrollCenter = scrollTop + window.innerHeight * 0.25;
    let currentYear = null;

    eras.forEach((era) => {
      const rect = era.getBoundingClientRect();
      const top = rect.top + scrollTop;
      const bottom = rect.bottom + scrollTop;
      const [start, end] = era.querySelector(".era-date").textContent.match(/\d+/g).map(Number);

      if (scrollCenter >= top && scrollCenter <= bottom) {
        const progress = (scrollCenter - top) / (bottom - top);
        currentYear = Math.round(start + (end - start) * progress);
      }
    });

    // if still null, pick the first or last era depending on scroll
    if (currentYear === null) {
      const firstEraRect = eras[0].getBoundingClientRect();
      const lastEraRect = eras[eras.length - 1].getBoundingClientRect();
      const scrollBottom = scrollTop + window.innerHeight;

      if (scrollTop < firstEraRect.top + scrollTop) {
        const [start] = eras[0].querySelector(".era-date").textContent.match(/\d+/g).map(Number);
        currentYear = start;
      } else if (scrollBottom > lastEraRect.bottom + scrollTop) {
        const [, end] = eras[eras.length - 1].querySelector(".era-date").textContent.match(/\d+/g).map(Number);
        currentYear = end;
      } else {
        currentYear = lastYear || 0;
      }
    }

    lastScrollTop = scrollTop;
    return currentYear;
  }
  
  function updateYearCard(currentYear) {
  // always update on first load
  if (currentYear !== lastYear || lastYear === 0) {
    yearValue.textContent = currentYear.toLocaleString();
    lastYear = currentYear;
  }
}

  function updateYearCardPosition() {
    if (window.innerWidth <= 900)
    {
      yearCard.style.transform = "translateX(0)";
      const timelineLine = document.querySelector(".timeline-line");
      const rect = timelineLine.getBoundingClientRect();
      const centerX =  rect.width / 2;
      yearCard.style.left = `${centerX}px`;
    }
    else
      {
      yearCard.style.left = "50%"; // desktop center
      yearCard.style.transform = "translateX(-50%)";
    }
  }

  function updateCardVisibility() {
    eventCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight - 100 && rect.bottom > 0;
      card.classList.toggle("visible", isVisible);
    });
  }

  function handleScroll() {
    const currentYear = getCurrentYear();
    updateYearCard(currentYear);
    updateCardVisibility();
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", updateYearCardPosition);

  // initial setup
  updateYearCardPosition();
  handleScroll();
});
