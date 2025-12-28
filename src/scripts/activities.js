async function loadActivities(type, url, containerId, emptyId) {
    const container = document.getElementById(containerId);
    const empty = document.getElementById(emptyId);
    if (!container || !empty) return;

    try {
        const resp = await fetch(url, { cache: "no-cache" });
        if (!resp.ok) throw new Error('Network error ' + resp.status);
        const data = await resp.json();
        if (!Array.isArray(data) || data.length === 0) { empty.style.display = 'block'; return; }

        data.forEach((item, idx) => {
            const card = document.createElement('article');
            card.className = 'activity-card';
            const photoPath = item.photo || item.image ? `${item.photo || item.image}` : '';
            let buttonHtml = '';
            // 1. Preferred Method: Check for 'button_text' and 'button_link' fields in your JSON data.
            // Example data item: { "title": "My Workshop", "button_text": "Register Now", "button_link": "/register.html" }
            if (item.button_text && item.button_link) {
              buttonHtml = `
                <div class="activity-actions">
                  <a href="${item.button_link}" class="action-btn">${item.button_text}</a>
                </div>
              `;
            }
            card.innerHTML = `
            ${photoPath ? `<div class="activity-photo"><img src="${photoPath}" alt="${item.title}"></div>` : ''}
            <div class="activity-content">
              <div class="activity-badge">#${item.badge ?? (idx + 1)}</div>
              <div class="activity-title">${item.title}</div>
              <div class="activity-description">${item.description}</div>
              ${buttonHtml}
            </div>
          `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading', err);
        empty.style.display = 'block';
        empty.textContent = 'Could not load ' + url;
    }
}

loadActivities('workshops', '/src/data/activities/workshops.json', 'workshops', 'workshops-empty');
loadActivities('exhibitions', '/src/data/activities/exhib.json', 'exhibitions', 'exhibitions-empty');
