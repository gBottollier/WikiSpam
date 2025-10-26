document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("bg-video");
  const regions = document.querySelectorAll(".region");
  const emblems = Array.from(document.querySelectorAll(".emblem"));
  const emblemCarousel = document.querySelector(".emblem-carousel");

  let activeRegion = "aelther"; // default region

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

  // --- Update background ---
  const regionBackgrounds = document.querySelectorAll('.region-bg');
  regionBackgrounds.forEach(bg => {
    if (bg.dataset.region === regionName) {
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

  // Update background video
  const video = document.getElementById("bg-video");
  if (characterEl.dataset.video) {
    video.src = characterEl.dataset.video;
    video.play().catch(() => {});
  }

  // ===== Update external info-container =====
  const infoContainer = document.querySelector(".info-container");
  const charInfo = characterEl.querySelector(".character-info");
  if (infoContainer && charInfo) {
    infoContainer.innerHTML = charInfo.innerHTML;
  }
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
      const regionName = emblem.querySelector("img").alt.toLowerCase();
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

container.addEventListener("wheel", e => {
  e.preventDefault();

  const activeRegionEl = document.querySelector(".region.active");
  if (!activeRegionEl) return;

  const carousel = activeRegionEl.querySelector(".character-carousel");
  const chars = Array.from(carousel.children);
  const activeChar = carousel.querySelector(".character.active");
  if (!activeChar) return;

  const index = chars.indexOf(activeChar);
  let newIndex = index;

  const regionsList = Array.from(document.querySelectorAll(".region"));
  const currentRegionIndex = regionsList.indexOf(activeRegionEl);

  if (e.deltaY > 0) {
    // Scroll down -> next character or next region
    if (index < chars.length - 1) {
      newIndex = index + 1;
    } else {
      // Next region (wrap to first if at last)
      const nextRegionIndex = (currentRegionIndex + 1) % regionsList.length;
      const nextRegion = regionsList[nextRegionIndex];
      showRegion(nextRegion.dataset.region);
      activateFirstCharacter(nextRegion.dataset.region);
      updateActiveEmblem(nextRegion.dataset.region);
      return;
    }
  } else if (e.deltaY < 0) {
    // Scroll up -> previous character or previous region
    if (index > 0) {
      newIndex = index - 1;
    } else {
      // Previous region (wrap to last if at first)
      const prevRegionIndex = (currentRegionIndex - 1 + regionsList.length) % regionsList.length;
      const prevRegion = regionsList[prevRegionIndex];
      showRegion(prevRegion.dataset.region);
      const lastChar = prevRegion.querySelector(".character:last-child");
      if (lastChar) setActiveCharacter(lastChar);
      updateActiveEmblem(prevRegion.dataset.region);
      return;
    }
  }

  // Same region
  if (newIndex !== index) setActiveCharacter(chars[newIndex]);
}, { passive: false });

// Helper to update active emblem
function updateActiveEmblem(regionName) {
  const emblem = document.querySelector(`.emblem img[alt="${regionName}"]`)?.parentElement;
  if (!emblem) return;
  document.querySelector(".emblem.active")?.classList.remove("active");
  emblem.classList.add("active");
  centerActiveEmblem(emblem);
}
  
  // ===== INITIALIZATION =====
  showRegion(activeRegion);

  const defaultEmblem = document.querySelector(`.emblem img[alt="${activeRegion}"]`);
  defaultEmblem?.parentElement.classList.add("active");
  centerActiveEmblem(defaultEmblem.parentElement);

  activateFirstCharacter(activeRegion);
});
