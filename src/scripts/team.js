const grid = document.getElementById('team-grid');
const buttons = document.querySelectorAll('.year-btn');
function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function getPlatformIcon(platform) {
    switch (platform.toLowerCase()) {
        case "linkedin":
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.7v2.2h.1c.5-.9 1.8-2.2 3.8-2.2 4 0 4.8 2.6 4.8 6V24h-4v-7.9c0-1.9 0-4.4-2.7-4.4-2.7 0-3.1 2.1-3.1 4.3V24h-4V8z"/></svg>`;
        case "github":
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.1 3.29 9.4 7.86 10.94.58.1.79-.25.79-.56v-2.17c-3.2.7-3.88-1.39-3.88-1.39-.52-1.32-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.57.23 2.73.11 3.02.74.81 1.18 1.83 1.18 3.09 0 4.43-2.69 5.41-5.25 5.69.41.35.77 1.05.77 2.12v3.14c0 .31.21.66.79.55A10.51 10.51 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5z"/></svg>`;
        case "website":
        case "site":
            return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>
        <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
      </svg>`;
        default:
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`;
    }
}
async function loadYear(year) {
    grid.innerHTML = "Loading...";
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.year === year));
    try {
        const resp = await fetch("/src/data/team/" + year + ".json", { cache: "no-cache" });
        if (!resp.ok) throw new Error("failed");
        const data = await resp.json();
        grid.innerHTML = "";
        (Array.isArray(data) ? data : [data]).forEach(m => {
            const card = document.createElement('div');
            card.className = "member-card";
            card.innerHTML = `
            <img src="${m.photo || ''}" alt="${m.name || ''}" class="member-photo">
            <div class="member-name">${m.name || ''}</div>
            <div class="member-role">${m.role || ''}</div>
            <div class="socials">
              ${(m.socials || []).map(s => `<a href="${s.url}" target="_blank">${getPlatformIcon(s.platform)}</a>`).join('')}
            </div>
          `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = "Could not load " + year + ".json";
    }
}
const initial = getQueryParam('year') || 'b23';
loadYear(initial);
buttons.forEach(btn => btn.addEventListener('click', () => {
    const year = btn.dataset.year;
    history.pushState({}, "", "?year=" + year);
    loadYear(year);
}));
