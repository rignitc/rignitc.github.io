(function () {
    const images = [
        "assets/images/main/0.webp",
        "assets/images/main/1.webp",
        "assets/images/main/2.webp",
        "assets/images/main/3.webp",
        "assets/images/main/4.webp",
        "assets/images/main/5.webp",
        "assets/images/main/6.webp",
        "assets/images/main/7.webp",
        "assets/images/main/8.webp",
        "assets/images/main/9.webp",
        "assets/images/main/10.webp",
        "assets/images/main/11.webp",
        "assets/images/main/12.webp",
        // "assets/images/main/13.webp",
        "assets/images/main/14.webp",
        "assets/images/main/15.webp",
        "assets/images/main/16.webp"
    ];

    const imgEl = document.getElementById("slideshow");
    const DELAY = 4000;
    const FADE = 300;

    // Start with first image
    let index = 0;
    imgEl.src = images[index];

    function nextImage() {
        const nextIndex = (index + 1) % images.length;
        const nextSrc = images[nextIndex];

        // Preload the next image to avoid flashes
        const pre = new Image();
        pre.onload = () => {
            imgEl.style.opacity = 0;
            setTimeout(() => {
                imgEl.src = nextSrc;
                imgEl.style.opacity = 1;
                index = nextIndex;
                setTimeout(nextImage, DELAY);
            }, FADE);
        };
        pre.src = nextSrc;
    }
    setTimeout(nextImage, DELAY);
})();