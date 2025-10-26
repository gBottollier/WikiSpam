let lastScroll = 0; // global
let butterflyTimer = null; // timer for delayed appearance

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("navbar.html");
    if (!res.ok) throw new Error("Navbar fetch failed: " + res.status);
    const html = await res.text();

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Insert navbars
    const desktopNav = tempDiv.querySelector("nav.navbar");
    if (desktopNav) document.body.insertBefore(desktopNav, document.body.firstChild);
    const mobileNav = tempDiv.querySelector("nav.bottom-nav");
    if (mobileNav) document.body.appendChild(mobileNav);

    // Butterfly scroll-to-top div
    let butterflyBtn = document.getElementById("butterflyBtn");
    if (!butterflyBtn) {
      butterflyBtn = document.createElement("div");
      butterflyBtn.id = "butterflyBtn";
      document.body.appendChild(butterflyBtn);
    }

    highlightActiveLinks();

    // Hide butterfly initially
    butterflyBtn.style.opacity = 0;
    butterflyBtn.style.pointerEvents = "none";
    butterflyBtn.style.transition = "opacity 0.5s ease";

    // Unified scroll listener
    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset;
      const screenHeight = window.innerHeight; // viewport height
      let showButterfly = false;

      // Desktop navbar scroll
      if (desktopNav) {
        desktopNav.style.top = (currentScroll > lastScroll && currentScroll > screenHeight) ? '-120px' : '0';
        if (currentScroll > screenHeight) showButterfly = true; // threshold = 1 screen
      }

      // Mobile navbar scroll
      if (mobileNav && currentScroll > screenHeight) showButterfly = true;

      // Update butterfly visibility with slight delay
      if (butterflyBtn) {
        if (showButterfly) {
          if (!butterflyTimer) {
            butterflyTimer = setTimeout(() => {
              butterflyBtn.style.opacity = 1;
              butterflyBtn.style.pointerEvents = 'auto';
              butterflyTimer = null;
            }, 400); // 0.4s delay
          }
        } else {
          clearTimeout(butterflyTimer);
          butterflyTimer = null;
          butterflyBtn.style.opacity = 0;
          butterflyBtn.style.pointerEvents = 'none';
        }
      }

      lastScroll = currentScroll;
    });

    // Butterfly click animation
    butterflyBtn.addEventListener("click", () => {
      butterflyBtn.classList.add("fly-top");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        butterflyBtn.classList.remove("fly-top");
        butterflyBtn.style.opacity = 0;
        butterflyBtn.style.pointerEvents = 'none';
      }, 1000);
    });

  } catch (err) {
    console.error("Error loading navbar:", err);
  }
});

function highlightActiveLinks() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll("nav.navbar a, nav.bottom-nav a");
  links.forEach(a => {
    const href = (a.getAttribute("href") || "").split("/").pop();
    if (!href) return;
    if (href === current || (href === "" && current === "index.html")) {
      a.classList.add("active-link");
    }
  });
}
