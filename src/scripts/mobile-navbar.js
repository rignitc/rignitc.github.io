function initMobileNavbar(navElement) {
  console.log("MobileNavbar: initMobileNavbar called with element:", navElement);

  // The function now expects the actual <nav> element to be passed as 'navElement'
  const nav = navElement;
  const navLinks = nav ? nav.querySelector(".nav-links") : null;

  // Get the placeholder ID to re-use its parentNode for mobile menu expansion
  const navPlaceholder = document.getElementById('navbar-placeholder');

  // Preserve the next sibling reference relative to the actual <nav> element
  const navLinksNextSibling = navLinks ? navLinks.nextSibling : null;

  if (!nav || !navLinks) {
    console.error("MobileNavbar: Required <nav> or .nav-links element not found during init.");
    return;
  }

  let hamburger = nav.querySelector(".hamburger-menu");

  if (!hamburger) {
    hamburger = document.createElement("button");
    hamburger.className = "hamburger-menu";
    hamburger.innerHTML = "≡";
    hamburger.setAttribute("aria-label", "Toggle menu");
    hamburger.setAttribute("aria-expanded", "false");

    // Insert hamburger button before the sponsor button or at the end
    const sponsorBtn = nav.querySelector(".btn-sponsor");
    if (sponsorBtn) {
      nav.insertBefore(hamburger, sponsorBtn);
    } else {
      nav.appendChild(hamburger);
    }
  }

  // Handle hamburger menu toggle
  hamburger.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    toggleMobileMenu();
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (e) {
    if (!nav.contains(e.target) && navLinks.classList.contains("open")) {
      closeMobileMenu();
    }
  });

  // Close menu when clicking on nav links (mobile)
  navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A" && window.innerWidth <= 768) {
      setTimeout(() => {
        closeMobileMenu();
      }, 150);
    }
  });

  // Handle window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      closeMobileMenu();
    }
  });

  // Handle escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navLinks.classList.contains("open")) {
      closeMobileMenu();
    }
  });

  function toggleMobileMenu() {
    const isOpen = navLinks.classList.contains("open");
    console.log("MobileNavbar: toggleMobileMenu, isOpen=", isOpen);

    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function openMobileMenu() {
    console.log("MobileNavbar: openMobileMenu");
    navLinks.classList.add("open");
    hamburger.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.innerHTML = "✕";

    // Clone sponsor button into mobile dropdown
    const originalSponsor = nav.querySelector(".btn-sponsor");
    if (originalSponsor) {
      const clonedSponsor = originalSponsor.cloneNode(true);
      clonedSponsor.classList.add("mobile-sponsor-clone");
      navLinks.appendChild(clonedSponsor);
    }

    // Force display for mobile: detach navLinks and insert after navPlaceholder
    if (window.innerWidth <= 768) {
      // Use navPlaceholder's parent for insertion into the main document flow
      navPlaceholder.parentNode.insertBefore(navLinks, navPlaceholder.nextSibling);
      navLinks.style.display = "flex";
    }

    // Prevent body scroll when menu is open
    document.body.style.overflow = "hidden";

    // Add active state for accessibility
    navLinks.setAttribute("aria-hidden", "false");
  }

  function closeMobileMenu() {
    console.log("MobileNavbar: closeMobileMenu");
    navLinks.classList.remove("open");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.innerHTML = "≡";

    // Restore body scroll
    document.body.style.overflow = "";

    // Update accessibility
    navLinks.setAttribute("aria-hidden", "true");

    // Restore navLinks into original position inside nav
    if (window.innerWidth <= 768) {
      nav.insertBefore(navLinks, navLinksNextSibling);
    }
    // Remove cloned sponsor button after closing mobile menu
    const mobileSponsor = navLinks.querySelector(".mobile-sponsor-clone");
    if (mobileSponsor) {
      mobileSponsor.remove();
    }
  }

  // Initialize accessibility attributes
  if (window.innerWidth <= 768) {
    navLinks.setAttribute("aria-hidden", "true");
  }
}

// Utility function to check if device is mobile
function isMobile() {
  return window.innerWidth <= 768;
}

// Export functions for external use
window.MobileNavbar = {
  init: initMobileNavbar,
  isMobile: isMobile,
};

document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) {
    console.error("MobileNavbar: Placeholder #navbar-placeholder not found in DOM.");
    return;
  }

  const observer = new MutationObserver(function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      // Check if nodes were added (i.e., the fetch completed and injected the HTML)
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // The expected injected element is the <nav> element
        const navElement = placeholder.querySelector('nav');

        if (navElement && window.MobileNavbar && window.MobileNavbar.init) {
          // The navbar is loaded! Run the initialization.
          window.MobileNavbar.init(navElement);
          // Stop observing since we only need to initialize once
          observer.disconnect();
        }
      }
    }
  });

  // Start observing the placeholder for when its children list changes
  observer.observe(placeholder, { childList: true });
});