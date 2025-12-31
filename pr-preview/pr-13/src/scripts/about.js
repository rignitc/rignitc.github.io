(function () {
  const wrap = document.getElementById("heroWrap");
  const scene = document.getElementById("imageScene");
  const img = scene && scene.querySelector("img");
  if (!wrap || !scene) return;

  let enabled = window.innerWidth > 720;

  function handleMove(e) {
    if (!enabled) return;
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const mouseX = e.clientX || (e.touches && e.touches[0].clientX);
    const mouseY = e.clientY || (e.touches && e.touches[0].clientY);
    if (mouseX == null || mouseY == null) return;
    const dx = (mouseX - cx) / rect.width;
    const dy = (mouseY - cy) / rect.height;
    const rotX = (-dy * 6).toFixed(2);
    const rotY = (dx * 8).toFixed(2);

    scene.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0px)`;
    if (img) img.style.transform = `scale(1)`; // no jump
  }

  function reset() {
    scene.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    if (img) img.style.transform = `scale(1)`;
  }

  function addListeners() {
    wrap.addEventListener("mousemove", handleMove);
    wrap.addEventListener("touchmove", handleMove, {
      passive: true,
    });
    wrap.addEventListener("mouseleave", reset);
    wrap.addEventListener("touchend", reset);
  }
  function removeListeners() {
    wrap.removeEventListener("mousemove", handleMove);
    wrap.removeEventListener("touchmove", handleMove);
    wrap.removeEventListener("mouseleave", reset);
    wrap.removeEventListener("touchend", reset);
    reset();
  }

  if (enabled) addListeners();

  window.addEventListener("resize", () => {
    const was = enabled;
    enabled = window.innerWidth > 720;
    if (enabled && !was) addListeners();
    if (!enabled && was) removeListeners();
  });
})();
