/**
 * /src/scripts/componentLoader.js
 * * Fetches and injects an HTML component into a specified placeholder element.
 * Handles client-side component fetching for static sites (e.g., python -m http.server).
 * * @param {string} placeholderId - The ID of the element where the component will be inserted (e.g., 'navbar-placeholder').
 * @param {string} componentPath - The relative path to the component's HTML file (e.g., '../components/Navbar.html').
 * @param {Object} data - Optional data to pass to the component.
 * @returns {Promise<void>}
 */
function loadComponent(placeholderId, componentPath, data = null) {
    const placeholder = document.getElementById(placeholderId);

    if (!placeholder) {
        console.error(`ComponentLoader: Placeholder element not found: #${placeholderId}`);
        return Promise.reject(new Error(`Placeholder #${placeholderId} not found.`));
    }

    // Set aria-busy while loading for accessibility
    placeholder.setAttribute('aria-busy', 'true');

    return fetch(componentPath)
        .then(response => {
            if (!response.ok) {
                // Log the error but still resolve the promise to prevent blocking other loads
                console.error(`ComponentLoader: Failed to fetch ${componentPath}. Status: ${response.status}`);
                placeholder.removeAttribute('aria-busy');
                placeholder.innerHTML = `<p style="color:red;">Error loading component: ${componentPath}</p>`;
                return;
            }
            return response.text();
        })
        .then(html => {
            if (html) {
                // If data is provided, replace placeholders in the HTML
                if (data) {
                    html = replacePlaceholders(html, data);
                }
                placeholder.innerHTML = html;
                
                // Add 'loaded' class to scroll-text elements to trigger animation
                setTimeout(() => {
                    const scrollTextElements = placeholder.querySelectorAll('.scroll-text');
                    scrollTextElements.forEach(element => {
                        element.classList.add('loaded');
                    });
                }, 50); // Small delay to ensure DOM is updated
                
                // If there's a callback function in data, execute it
                if (data && data.onLoad) {
                    data.onLoad();
                }
            }
        })
        .catch(error => {
            console.error('ComponentLoader: Network error during fetch:', error);
        })
        .finally(() => {
            // Remove aria-busy regardless of success/failure
            placeholder.removeAttribute('aria-busy');
        });
}

/**
 * Replace placeholders in HTML template with data
 * @param {string} html - HTML template string
 * @param {Object} data - Data object with key-value pairs
 * @returns {string} Processed HTML
 */
function replacePlaceholders(html, data) {
    return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
}

// Optionally, expose the function globally so it can be called from HTML
window.loadComponent = loadComponent;
window.replacePlaceholders = replacePlaceholders;