function extractYouTubeID(url) {
  if (!url) return null;
  if (url.includes("youtu.be")) return url.split("/").pop();
  if (url.includes("watch?v=")) return url.split("v=")[1].split("&")[0];
  return null;
}

let currentlyPlaying = null;

async function loadHOF() {
  const container = document.getElementById("hofGrid");
  const res = await fetch("/src/data/hof/origo-robotics-challenge25.json");
  const data = await res.json();
  const entries = Array.isArray(data) ? data : [data];

  entries.forEach((item) => {
    const ytID = extractYouTubeID(item.youtube);

    const card = document.createElement("div");
    card.className = "hof-card";

    const podiumSVG = `
      <svg class="podium-icon" viewBox="0 0 64 64" fill="currentColor">
        <rect x="4" y="24" width="16" height="20"/>
        <rect x="24" y="12" width="16" height="32"/>
        <rect x="44" y="20" width="16" height="24"/>
      </svg>`;

    card.innerHTML = `
      <div class="hof-video-wrapper" data-thumb="https://img.youtube.com/vi/${ytID}/hqdefault.jpg">
        <img 
          src="https://img.youtube.com/vi/${ytID}/hqdefault.jpg"
          onerror="this.src='https://img.youtube.com/vi/${ytID}/default.jpg'"
          class="hof-thumb"
        />
      </div>

      <div class="hof-title">${item.winner ? podiumSVG : ""} ${item.title}</div>
      <div class="hof-person">${item.person}</div>
      <div class="hof-roll">${item.roll_no}</div>
      <div class="hof-category">${item.category}</div>
      <div class="hof-desc">${item.desc}</div>

      ${
        item.youtube
          ? `
        <button class="play-btn" data-video="${ytID}" data-url="${item.youtube}">
          <svg viewBox="0 0 24 24">
            <path d="M23.5 6.2s-.2-1.6-.8-2.3c-.7-.8-1.5-.8-1.9-.9C17.5 2.7 12 2.7 12 2.7S6.5 2.7 3.2 3c-.4.1-1.2.1-1.9.9-.6.7-.8 2.3-.8 2.3S0 8.1 0 10v1.9c0 1.9.2 3.8.2 3.8s.2 1.6.8 2.3c.7.8 1.7.8 2.2.9C4.8 19.1 12 19.2 12 19.2s7.2 0 10.5-.3c.6-.1 1.5-.1 2.2-.9.6-.7.8-2.3.8-2.3s.2-1.9.2-3.8V10c0-1.9-.2-3.8-.2-3.8zM9.7 14.8V8.9l6 3-6 2.9z"/>
          </svg>
        </button>
        `
          : ""
      }
    `;

    container.appendChild(card);
  });

  attachVideoHandlers();
}

function attachVideoHandlers() {
  const buttons = document.querySelectorAll(".play-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();

      const videoID = btn.dataset.video;
      const ytURL = btn.dataset.url;

      window.open(ytURL, "_blank");

      const wrapper = btn.closest(".hof-card").querySelector(".hof-video-wrapper");

      if (currentlyPlaying && currentlyPlaying !== wrapper) {
        currentlyPlaying.innerHTML =
          `<img src="${currentlyPlaying.dataset.thumb}" class="hof-thumb">`;
      }

      wrapper.innerHTML = `
        <iframe
          class="hof-video"
          src="https://www.youtube.com/embed/${videoID}?autoplay=1&controls=1"
          frameborder="0"
          allow="autoplay; encrypted-media"
        ></iframe>
      `;

      currentlyPlaying = wrapper;
    });
  });
}

loadHOF();
