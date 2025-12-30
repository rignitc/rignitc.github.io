(function () {
  const cursor = document.querySelector(".cursor");
  const cursorRing = document.querySelector(".cursor-ring");
  if (!cursor) return;

  const hoverables = document.querySelectorAll("a, button, .year-btn, .socials a");

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;
  const inertia = 0.3;

  // Force visibility on load for Firefox
  const showCursor = () => {
    cursor.classList.add("visible");
    if (cursorRing) cursorRing.classList.add("visible");
  };

  document.addEventListener("mouseenter", showCursor);
  
  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("visible");
    if (cursorRing) cursorRing.classList.remove("visible");
  });

  hoverables.forEach(el => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("hovered");
      if (cursorRing) cursorRing.classList.add("hovered");
    });
    
    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("hovered");
      if (cursorRing) cursorRing.classList.remove("hovered");
    });
  });

  document.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Ensure the cursor is visible when moving
    if (!cursor.classList.contains("visible")) showCursor();

    // Grouping the update for the main dot
    cursor.style.top = mouseY + "px";
    cursor.style.left = mouseX + "px";
  });

  function animateRing() {
    if (cursorRing) {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;

      ringX += dx * inertia;
      ringY += dy * inertia;

      cursorRing.style.top = ringY + "px";
      cursorRing.style.left = ringX + "px";
    }

    requestAnimationFrame(animateRing);
  }

  animateRing();
})();