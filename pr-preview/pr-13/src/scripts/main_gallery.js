const galleryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            galleryObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });
galleryObserver.observe(document.querySelector('#gallery h1'));

const stage = document.getElementById('polaroidStage');
const polaroids = [];
const images = []; // store image URLs for lightbox navigation

// Dynamically load gallery images
(function loadImages() {
    const exts = ['webp'];
    const MAX_SCAN = 20;
    let i = 1;

    function tryLoad() {
        if (i > MAX_SCAN) {
            shuffle(); // Shuffle after all images are loaded
            return;
        }
        let extIndex = 0;

        function tryExt() {
            if (extIndex >= exts.length) {
                i++;
                tryLoad();
                return;
            }
            const img = new Image();
            img.src = `assets/images/gallery/${i}.${exts[extIndex]}`;
            img.onload = () => {
                const div = document.createElement('div');
                div.className = 'polaroid';
                div.innerHTML = `<img src="${img.src}" alt="Gallery ${i}">`;
                stage.appendChild(div);
                polaroids.push(div);
                images.push(img.src);

                // Progressive shuffle
                div.style.top = Math.random() * (stage.clientHeight - 220) + 'px';
                div.style.left = Math.random() * (stage.clientWidth - 200) + 'px';
                div.style.transform = `rotate(${(Math.random() - 0.5) * 60}deg)`;

                i++;
                tryLoad();
            };
            img.onerror = () => {
                extIndex++;
                tryExt();
            };
        }
        tryExt();
    }
    tryLoad();
})();

// Layout functions
function shuffle() {
    polaroids.forEach(p => {
        p.style.top = Math.random() * (stage.clientHeight - 220) + 'px';
        p.style.left = Math.random() * (stage.clientWidth - 200) + 'px';
        p.style.transform = `rotate(${(Math.random() - 0.5) * 60}deg)`;
    });
}

function spread() {
    const cols = Math.ceil(Math.sqrt(polaroids.length));
    const rows = Math.ceil(polaroids.length / cols);
    const w = stage.clientWidth / cols;
    const h = stage.clientHeight / rows;
    polaroids.forEach((p, i) => {
        const x = (i % cols) * w + 20;
        const y = Math.floor(i / cols) * h + 20;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.transform = 'rotate(0deg)';
    });
}

function gather() {
    polaroids.forEach(p => {
        p.style.top = (stage.clientHeight / 2 - 100 + Math.random() * 40 - 20) + 'px';
        p.style.left = (stage.clientWidth / 2 - 100 + Math.random() * 40 - 20) + 'px';
        p.style.transform = `rotate(${(Math.random() - 0.5) * 60}deg)`;
    });
}

function arrange() {
    polaroids.forEach((p, i) => {
        p.style.top = '50px';
        p.style.left = (i * 220) + 20 + 'px';
        p.style.transform = 'rotate(0deg)';
    });
}

// Buttons
document.getElementById('shuffle').onclick = shuffle;
document.getElementById('spread').onclick = spread;
document.getElementById('gather').onclick = gather;
document.getElementById('arrange').onclick = arrange;

// Lightbox
const lightbox = document.getElementById('lightbox');
lightbox.innerHTML = `
  <div class="arrow left">&#10094;</div>
  <img src="" alt="Expanded view">
  <div class="arrow right">&#10095;</div>
`;
const lightboxImg = lightbox.querySelector('img');
const arrowLeft = lightbox.querySelector('.left');
const arrowRight = lightbox.querySelector('.right');
let currentIndex = 0;

function showLightbox(index) {
    currentIndex = index;
    lightboxImg.src = images[index];
    lightbox.classList.add('show');
}

function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    lightboxImg.src = images[currentIndex];
}

function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    lightboxImg.src = images[currentIndex];
}

// Open lightbox on click
stage.addEventListener('click', e => {
    const imgEl = e.target.closest('.polaroid img');
    if (imgEl) {
        const index = images.indexOf(imgEl.src);
        showLightbox(index);
    }
});

// Close lightbox on clicking outside image
lightbox.addEventListener('click', e => {
    if (e.target === lightbox) lightbox.classList.remove('show');
});

// Arrow events
arrowLeft.addEventListener('click', e => {
    e.stopPropagation();
    prevImage();
});
arrowRight.addEventListener('click', e => {
    e.stopPropagation();
    nextImage();
});

// Keyboard navigation
document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('show')) return;
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'Escape') lightbox.classList.remove('show');
});

document.getElementById('help').onclick = () => {
    alert('🔀 Shuffle | ⬌ Spread | ⬍ Gather | ⬜ Arrange | ◀ ▶ Lightbox arrows');
};
