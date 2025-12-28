// Scroll reveal for about section
const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            aboutObserver.unobserve(entry.target); // reveal only once
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('#about .about-text, #about .about-image')
    .forEach(el => aboutObserver.observe(el));

// ---------- 3D tilt effect ----------
(function () {
    const wrap = document.getElementById('cardWrap');
    const card = document.getElementById('card');
    const shadow = document.getElementById('cardShadow');

    function handleMove(e) {
        const rect = wrap.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const mouseX = (e.clientX || (e.touches && e.touches[0].clientX));
        const mouseY = (e.clientY || (e.touches && e.touches[0].clientY));
        const dx = (mouseX - cx) / rect.width;
        const dy = (mouseY - cy) / rect.height;

        const rotX = (-dy * 3).toFixed(2);
        const rotY = (dx * 3).toFixed(2);

        card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`;
        shadow.style.transform = `translateY(24px) scale(.86) translateZ(0) rotateX(${rotX / 4}deg) rotateY(${rotY / 4}deg)`;
    }

    function reset() {
        card.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`;
        shadow.style.transform = `translateY(18px) scale(.88)`;
    }

    wrap.addEventListener('mousemove', handleMove);
    wrap.addEventListener('touchmove', handleMove, { passive: true });
    wrap.addEventListener('mouseleave', reset);
    wrap.addEventListener('touchend', reset);
})();

// ---------- Counter Animation ----------
const counters = document.querySelectorAll('#about .stat-number');
const speed = 200; // lower is faster

const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const increment = Math.ceil(target / speed);
                if (count < target) {
                    counter.innerText = count + increment;
                    setTimeout(updateCount, 30);
                } else {
                    counter.innerText = target + "+"; // add "+" at end
                }
            };
            updateCount();
            observer.unobserve(counter);
        }
    });
}, { threshold: 0.3 });

counters.forEach(counter => counterObserver.observe(counter));