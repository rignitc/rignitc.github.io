(async function () {
    const container = document.getElementById('projects-container');
    
    // Function to get project ID from URL hash
    function getProjectIdFromHash() {
        const hash = window.location.hash.substring(1);
        return hash || sessionStorage.getItem('expandProject');
    }
    
    // Function to update URL without hash (for Show less)
    function updateUrlWithoutHash() {
        const newUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', newUrl);
        sessionStorage.removeItem('expandProject');
    }
    
    // Function to expand a specific project
    function expandProjectById(projectId) {
        // Clear any stored value after use
        sessionStorage.removeItem('expandProject');
        
        if (!projectId) return;
        
        // Find all project cards
        const cards = container.querySelectorAll('.card');
        let targetCard = null;
        let targetRow = null;
        let isLeftCard = false;
        
        // Find the card with matching project ID
        cards.forEach(card => {
            if (card._proj && card._proj.id === projectId) {
                targetCard = card;
                targetRow = card.closest('.row');
                isLeftCard = card.classList.contains('left');
            }
        });
        
        if (targetCard && targetRow) {
            // Collapse any currently expanded row first
            const expandedRows = container.querySelectorAll('.row.expanded-left, .row.expanded-right');
            expandedRows.forEach(row => {
                row.classList.remove('expanded-left', 'expanded-right');
                row.querySelectorAll('.card').forEach(card => {
                    card.setAttribute('aria-expanded', 'false');
                    const btn = card.querySelector('.btn-expand');
                    if (btn) {
                        btn.setAttribute('aria-expanded', 'false');
                        btn.textContent = 'Read more';
                    }
                    const extra = card.querySelector('.extra');
                    if (extra) extra.setAttribute('aria-hidden', 'true');
                });
            });
            
            // Expand the target card
            if (isLeftCard) {
                targetRow.classList.add('expanded-left');
                targetCard.setAttribute('aria-expanded', 'true');
                targetCard.querySelector('.btn-expand').setAttribute('aria-expanded', 'true');
                targetCard.querySelector('.extra').setAttribute('aria-hidden', 'false');
                targetCard.querySelector('.btn-expand').textContent = 'Show less';
            } else {
                targetRow.classList.add('expanded-right');
                targetCard.setAttribute('aria-expanded', 'true');
                targetCard.querySelector('.btn-expand').setAttribute('aria-expanded', 'true');
                targetCard.querySelector('.extra').setAttribute('aria-hidden', 'false');
                targetCard.querySelector('.btn-expand').textContent = 'Show less';
            }
            
            // Update URL with hash
            const newUrl = window.location.pathname + window.location.search + '#' + projectId;
            window.history.replaceState(null, '', newUrl);
            
            // Smooth scroll to the expanded project
            setTimeout(() => {
                targetCard.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // Add highlight animation
                targetCard.style.animation = 'none';
                setTimeout(() => {
                    targetCard.style.animation = 'highlight-pulse 2s ease';
                }, 10);
            }, 300);
        }
    }
    
    // Your existing helper functions
    function escapeHtml(s) { 
        if (!s) return ''; 
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); 
    }
    
    function slug(s) { 
        return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); 
    }
    
    function formatDate(d) { 
        try { 
            const dt = new Date(d); 
            if (isNaN(dt)) return ''; 
            return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }); 
        } catch (e) { 
            return d || ''; 
        } 
    }
    
    function createCard(project, side) {
        const card = document.createElement('article');
        card.className = 'card ' + side;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'article');
        card.dataset.title = project.title || '';
        card.dataset.projectId = project.id || '';
        
        card.innerHTML = `
      <div class="media" aria-hidden="true">
        <img loading="lazy" src="/assets/images/projects/${encodeURIComponent(project.image || 'placeholder-1.jpg')}" alt="${escapeHtml(project.title || '')}">
      </div>
      <div class="info">
        <h3 class="title" id="title-${slug(project.title || Math.random().toString(36).slice(2, 7))}">${escapeHtml(project.title)}</h3>
        <div class="meta">
          <div class="chips">${(project.tags || []).slice(0, 4).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('')}</div>
          <div style="flex:1"></div>
          <div style="color:var(--muted-2);font-size:0.85rem;">${project.date ? formatDate(project.date) : ''}</div>
        </div>
        <p class="short">${escapeHtml(project.short_description || '')}</p>
        <div class="actions">
          <button class="btn primary btn-expand" aria-expanded="false" type="button">Read more</button>
        </div>
        <div class="extra" aria-hidden="true">${escapeHtml(project.description || '')}</div>
      </div>
    `;
        card._proj = project;
        return card;
    }
    
    function renderRows(projects) {
        container.innerHTML = '';
        for (let i = 0; i < projects.length; i += 2) {
            const row = document.createElement('div');
            row.className = 'row';
            const left = createCard(projects[i], 'left');
            row.appendChild(left);
            if (i + 1 < projects.length) { 
                const right = createCard(projects[i + 1], 'right'); 
                row.appendChild(right); 
            } else { 
                row.classList.add('single'); 
            }
            bindRowInteractions(row);
            container.appendChild(row);
        }
    }
    
    function bindRowInteractions(row) {
        const left = row.querySelector('.card.left');
        const right = row.querySelector('.card.right');
        
        function collapseRow() {
            row.classList.remove('expanded-left', 'expanded-right');
            updateUrlWithoutHash(); // Remove hash when collapsing
            
            if (left) { 
                left.setAttribute('aria-expanded', 'false'); 
                left.querySelector('.btn-expand').setAttribute('aria-expanded', 'false'); 
                left.querySelector('.extra').setAttribute('aria-hidden', 'true'); 
                left.querySelector('.btn-expand').textContent = 'Read more'; 
            }
            if (right) { 
                right.setAttribute('aria-expanded', 'false'); 
                right.querySelector('.btn-expand').setAttribute('aria-expanded', 'false'); 
                right.querySelector('.extra').setAttribute('aria-hidden', 'true'); 
                right.querySelector('.btn-expand').textContent = 'Read more'; 
            }
        }
        
        function expandLeft() {
            if (!left) return;
            row.classList.remove('expanded-right'); 
            row.classList.add('expanded-left');
            left.setAttribute('aria-expanded', 'true'); 
            left.querySelector('.btn-expand').setAttribute('aria-expanded', 'true'); 
            left.querySelector('.extra').setAttribute('aria-hidden', 'false'); 
            left.querySelector('.btn-expand').textContent = 'Show less';
            
            // Update URL with hash
            const projectId = left._proj.id;
            const newUrl = window.location.pathname + window.location.search + '#' + projectId;
            window.history.replaceState(null, '', newUrl);
            
            if (right) { 
                right.setAttribute('aria-expanded', 'false'); 
                right.querySelector('.btn-expand').setAttribute('aria-expanded', 'false'); 
                right.querySelector('.extra').setAttribute('aria-hidden', 'true'); 
                right.querySelector('.btn-expand').textContent = 'Read more'; 
            }
        }
        
        function expandRight() {
            if (!right) return;
            row.classList.remove('expanded-left'); 
            row.classList.add('expanded-right');
            right.setAttribute('aria-expanded', 'true'); 
            right.querySelector('.btn-expand').setAttribute('aria-expanded', 'true'); 
            right.querySelector('.extra').setAttribute('aria-hidden', 'false'); 
            right.querySelector('.btn-expand').textContent = 'Show less';
            
            // Update URL with hash
            const projectId = right._proj.id;
            const newUrl = window.location.pathname + window.location.search + '#' + projectId;
            window.history.replaceState(null, '', newUrl);
            
            if (left) { 
                left.setAttribute('aria-expanded', 'false'); 
                left.querySelector('.btn-expand').setAttribute('aria-expanded', 'false'); 
                left.querySelector('.extra').setAttribute('aria-hidden', 'true'); 
                left.querySelector('.btn-expand').textContent = 'Read more'; 
            }
        }
        
        if (left) {
            const btn = left.querySelector('.btn-expand');
            btn.addEventListener('click', e => { 
                e.stopPropagation(); 
                if (row.classList.contains('expanded-left')) collapseRow(); 
                else expandLeft(); 
            });
            
            left.addEventListener('keydown', ev => { 
                if (ev.key === 'Enter' || ev.key === ' ') { 
                    ev.preventDefault(); 
                    if (row.classList.contains('expanded-left')) collapseRow(); 
                    else expandLeft(); 
                } else if (ev.key === 'Escape') { 
                    collapseRow(); 
                } 
            });
        }
        
        if (right) {
            const btn = right.querySelector('.btn-expand');
            btn.addEventListener('click', e => { 
                e.stopPropagation(); 
                if (row.classList.contains('expanded-right')) collapseRow(); 
                else expandRight(); 
            });
            
            right.addEventListener('keydown', ev => { 
                if (ev.key === 'Enter' || ev.key === ' ') { 
                    ev.preventDefault(); 
                    if (row.classList.contains('expanded-right')) collapseRow(); 
                    else expandRight(); 
                } else if (ev.key === 'Escape') { 
                    collapseRow(); 
                } 
            });
        }
    }
    
    async function fetchProjects() {
        try {
            const r = await fetch('/src/data/projects/projects.json', { cache: 'no-cache' });
            if (!r.ok) throw new Error('projects.json load failed');
            const data = await r.json();
            if (!Array.isArray(data)) throw new Error('projects.json must be array');
            return data;
        } catch (e) {
            console.error('projects load failed:', e);
            return []; // Return empty array instead of fallback
        }
    }
    
    // Main execution
    const projects = await fetchProjects();
    if (projects.length === 0) {
        container.innerHTML = '<p class="no-projects">No projects available at the moment.</p>';
        return;
    }
    
    renderRows(projects);
    
    // Check if we need to auto-expand a project
    const projectIdToExpand = getProjectIdFromHash();
    if (projectIdToExpand) {
        // Wait a moment for rendering to complete, then expand
        setTimeout(() => {
            expandProjectById(projectIdToExpand);
        }, 500);
    }
    
    // Listen for hash changes (if user manually changes URL)
    window.addEventListener('hashchange', function() {
        const newProjectId = getProjectIdFromHash();
        if (newProjectId) {
            expandProjectById(newProjectId);
        }
    });
})();