// main_projects.js - Modular version with JSON config
document.addEventListener('DOMContentLoaded', async function() {
  // Fetch featured projects configuration
  async function fetchFeaturedProjects() {
    try {
      const response = await fetch('/src/data/projects/featured-projects.json');
      if (!response.ok) throw new Error('Failed to fetch featured projects');
      const data = await response.json();
      return data.featured_projects || [];
    } catch (error) {
      console.error('Error loading featured projects:', error);
      // Default featured projects if config fails
      return ['riggu', 'avibot', 'gnss-drone'];
    }
  }
  
  // Fetch all projects to get their data
  async function fetchAllProjects() {
    try {
      const response = await fetch('/src/data/projects/projects.json');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }
  
  // Create featured project cards dynamically
  async function renderFeaturedProjects() {
    const [featuredIds, allProjects] = await Promise.all([
      fetchFeaturedProjects(),
      fetchAllProjects()
    ]);
    
    // Filter projects to only include featured ones
    const featuredProjects = allProjects.filter(project => 
      featuredIds.includes(project.id)
    );
    
    // Sort projects according to the order in featuredIds
    const sortedProjects = featuredIds.map(id => 
      featuredProjects.find(project => project.id === id)
    ).filter(Boolean); // Remove undefined if project not found
    
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;
    
    // Clear existing content (except the template if exists)
    projectsGrid.innerHTML = '';
    
    // Create project cards for each featured project
    sortedProjects.forEach(project => {
      if (!project) return;
      
      const projectCard = document.createElement('div');
      projectCard.className = 'project-card';
      
      // Determine image paths (default and hover)
      // Assuming naming convention: image.webp (default) and imageH.webp (hover)
      const imageBase = project.image.replace('.webp', '');
      const defaultImage = `${imageBase}H.webp`; // Your current pattern
      const hoverImage = `${imageBase}.webp`; // Your current pattern
      
      projectCard.innerHTML = `
        <div class="project-image">
          <img
            src="/assets/images/projects/${defaultImage}"
            alt="${project.title}"
            class="default-img"
            loading="lazy"
          />
          <img
            src="/assets/images/projects/${hoverImage}"
            alt="${project.title} - Alternate view"
            class="hover-img"
            loading="lazy"
          />
        </div>
        <div class="project-content">
          <h2><strong>${project.title}</strong></h2>
          <p>${project.short_description || 'No description available.'}</p>
          <a href="/projects/#${project.id}" class="project-link" data-project-id="${project.id}">
            View Project ↗
          </a>
        </div>
      `;
      
      projectsGrid.appendChild(projectCard);
    });
    
    // Add intersection observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.projects-header, .project-card, .view-all').forEach(el => {
      observer.observe(el);
    });
  }
  
  // Initialize
  await renderFeaturedProjects();
});