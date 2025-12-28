let competitionData = [];
let activeCompetitionTag = "All";

async function loadAchievements(type, url, containerId, emptyId, viewMoreBtnId) {
  const container = document.getElementById(containerId);
  const empty = document.getElementById(emptyId);
  const viewMoreBtn = viewMoreBtnId ? document.getElementById(viewMoreBtnId) : null;
  if (!container || !empty) return;

  if (type === 'research') {
    container.classList.add('research-list');
  } else {
    container.classList.remove('research-list');
  }

  try {
    container.innerHTML = '';
    empty.style.display = 'none';

    const resp = await fetch(url, { cache: "no-cache" });
    if (!resp.ok) throw new Error('Network error ' + resp.status);

    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      empty.style.display = 'block';
      return;
    }

    /* ===============================
       COMPETITIONS: STORE + FILTER
    =============================== */
    if (type === "competitions") {
      competitionData = data;
      renderCompetitionFilters(data);
      renderCompetitionCards(data, container, viewMoreBtn);
      return;
    }

    /* ===============================
       STARTUPS + RESEARCH (UNCHANGED)
    =============================== */
    renderCards(type, data, container, viewMoreBtn);

  } catch (err) {
    console.error('Error', err);
    empty.style.display = 'block';
    empty.textContent = 'Could not load ' + url;
  }
}

/* =================================
   FILTER BUTTONS (COMPETITIONS ONLY)
================================= */
function renderCompetitionFilters(data) {
  let filterBar = document.getElementById("achievement-filters");

  if (!filterBar) {
    filterBar = document.createElement("div");
    filterBar.id = "achievement-filters";
    filterBar.className = "filter-bar";

    const achievementsContainer = document.getElementById("achievements");
    achievementsContainer.parentNode.insertBefore(filterBar, achievementsContainer);
  }

  const tags = [
    "All",
    ...new Set(data.map(item => item.tag).filter(Boolean))
  ];

  filterBar.innerHTML = "";

  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.textContent = tag;
    if (tag === activeCompetitionTag) btn.classList.add("active");

    btn.addEventListener("click", () => {
      activeCompetitionTag = tag;
      filterBar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filtered =
        tag === "All"
          ? competitionData
          : competitionData.filter(item => item.tag === tag);

      renderCompetitionCards(filtered, document.getElementById("achievements"),
        document.getElementById("view-more-achievements"));
    });

    filterBar.appendChild(btn);
  });
}

/* =================================
   COMPETITION CARD RENDER
================================= */
function renderCompetitionCards(data, container, viewMoreBtn) {
  container.innerHTML = "";

  data.forEach((item, idx) => {
    const card = document.createElement('article');
    card.className = 'achievement-card';
    card.setAttribute('tabindex', '0');

    const photoPath = item.photo ? `${item.photo}` : '';

    card.innerHTML = `
      <div>
        ${item.photo ? `
          <div class="achievement-photo">
            <img src="${escapeHtml(photoPath)}" alt="${escapeHtml(item.title)}">
          </div>` : ''}
        <div class="achievement-badge">#${item.badge ?? (idx + 1)}</div>
        <div class="achievement-title">${escapeHtml(item.title)}</div>
        <div class="achievement-description">${escapeHtml(item.description)}</div>
      </div>
    `;

    if (idx >= 4) {
      card.style.display = 'none';
      card.classList.add('hidden-card');
    } else {
      card.style.display = 'flex';
    }

    container.appendChild(card);
    setTimeout(() => card.classList.add('show'), 90 * idx);
  });

  if (data.length > 4 && viewMoreBtn) {
    viewMoreBtn.style.display = 'inline-block';
    viewMoreBtn.replaceWith(viewMoreBtn.cloneNode(true));
    const newBtn = document.getElementById(viewMoreBtn.id);

    newBtn.addEventListener('click', () => {
      container.querySelectorAll('.hidden-card').forEach(card => {
        card.style.display = 'flex';
        setTimeout(() => card.classList.add('show'), 60);
        card.classList.remove('hidden-card');
      });
      newBtn.style.display = 'none';
    });
  } else if (viewMoreBtn) {
    viewMoreBtn.style.display = 'none';
  }
}

/* =================================
   GENERIC RENDER (UNCHANGED LOGIC)
================================= */
function renderCards(type, data, container, viewMoreBtn) {
  container.innerHTML = "";

  data.forEach((item, idx) => {
    let card;

    if (type === 'research') {
      card = document.createElement('article');
      card.className = 'achievement-card horizontal';
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <div class="badge-col">
          <div class="achievement-badge">#${item.badge ?? (idx + 1)}</div>
        </div>
        <div class="card-content">
          <div class="achievement-title">${escapeHtml(item.title)}</div>
          <div class="achievement-description">${escapeHtml(item.description)}</div>
        </div>
      `;
    }

    else if (type === 'startups') {
      card = document.createElement('article');
      card.className = 'startup-card';
      card.innerHTML = `
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)} main image" class="startup-image">
        <div class="startup-info">
          <div class="startup-header">
            ${item.logo ? `<img src="${escapeHtml(item.logo)}" class="logo">` : ''}
            <h2>
              ${item.link
                ? `<a href="${escapeHtml(item.link)}" target="_blank">${escapeHtml(item.title)}</a>`
                : escapeHtml(item.title)}
            </h2>
          </div>
          <div class="startup-desc">${escapeHtml(item.desc)}</div>
        </div>
      `;
    }

    if (type !== 'startups') {
      if (idx >= 4) {
        card.style.display = 'none';
        card.classList.add('hidden-card');
      } else {
        card.style.display = 'flex';
      }
    }

    container.appendChild(card);
    setTimeout(() => card.classList.add('show'), 90 * idx);
  });

  if (type !== 'startups' && data.length > 4 && viewMoreBtn) {
    viewMoreBtn.style.display = 'inline-block';
    viewMoreBtn.replaceWith(viewMoreBtn.cloneNode(true));
    const newBtn = document.getElementById(viewMoreBtn.id);

    newBtn.addEventListener('click', () => {
      container.querySelectorAll('.hidden-card').forEach(card => {
        card.style.display = 'flex';
        setTimeout(() => card.classList.add('show'), 60);
        card.classList.remove('hidden-card');
      });
      newBtn.style.display = 'none';
    });
  } else if (viewMoreBtn) {
    viewMoreBtn.style.display = 'none';
  }
}

/* =================================
   UTILS
================================= */
function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", "&#39;");
}

/* =================================
   INIT
================================= */
loadAchievements(
  'competitions',
  '/src/data/achievements/competitions.json',
  'achievements',
  'empty-placeholder',
  'view-more-achievements'
);

loadAchievements(
  'startups',
  '/src/data/achievements/startups.json',
  'startups',
  'startups-empty'
);

loadAchievements(
  'research',
  '/src/data/achievements/research.json',
  'research',
  'research-empty',
  'view-more-research'
);
