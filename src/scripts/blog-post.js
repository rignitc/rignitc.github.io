/**
 * Blog post rendering script
 * Loads markdown content and renders with Marked.js, KaTeX, and Highlight.js
 * Uses URL parameters and front matter parsing
 */

// Front matter parser (inline)
// Declare closeTOCModal in outer scope so it can be accessed
let closeTOCModal = () => {};

function parseFrontMatter(markdown) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);

  if (!match) {
    return { frontMatter: {}, content: markdown };
  }

  const frontMatterText = match[1];
  const content = match[2];
  const frontMatter = {};
  const lines = frontMatterText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    }

    frontMatter[key] = value;
  }

  return { frontMatter, content };
}

// Get slug from URL parameter
function getSlugFromURL() {
  // URL: /blog/posts/#/baking-a-pie
  if (window.location.hash.startsWith('#/')) {
    return window.location.hash.replace('#/', '');
  }
  return null;
}


// Check for cover image
async function checkCoverImage(slug) {
  try {
    const resp = await fetch(`/content/${slug}/imgs/cover.webp`, { method: "HEAD" });
    if (resp.ok) {
      return `/content/${slug}/imgs/cover.webp`;
    }
  } catch (err) {
    // Ignore errors
  }
  return null;
}

// Load markdown content
async function loadMarkdownContent(slug) {
  try {
    const resp = await fetch(`/content/${slug}/index.md`, { cache: "no-cache" });
    if (!resp.ok) throw new Error(`Failed to load content for ${slug}`);
    return await resp.text();
  } catch (err) {
    console.error("Error loading markdown content:", err);
    return null;
  }
}

// Process image paths to be relative to content folder
function processImagePaths(markdown, slug) {
  return markdown.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, src) => {
      if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
        return match;
      }
      return `![${alt}](/content/${slug}/${src})`;
    }
  );
}

// Generate Table of Contents from headings
// Generate Table of Contents from headings
function generateTOC(contentElement) {
  const headings = contentElement.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const tocList = document.getElementById("toc-list");
  if (!tocList || headings.length === 0) return;

  tocList.innerHTML = "";
  let currentLevel = 0;
  let currentList = tocList;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.substring(1));
    const id = `heading-${index}`;
    heading.id = id;

    if (level > currentLevel) {
      while (level > currentLevel) {
        const newList = document.createElement("ul");
        const lastItem = currentList.lastElementChild;
        if (lastItem) {
          lastItem.appendChild(newList);
          currentList = newList;
        } else {
          currentList.appendChild(newList);
          currentList = newList;
        }
        currentLevel++;
      }
    } else if (level < currentLevel) {
      while (level < currentLevel) {
        currentList = currentList.parentElement.closest("ul") || tocList;
        currentLevel--;
      }
    }

    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = heading.textContent;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
      // Close modal on mobile after clicking
      closeTOCModal();
    });
    li.appendChild(a);
    currentList.appendChild(li);
  });

  // Setup mobile TOC FAB and modal
  setupMobileTOC();
}

// Setup mobile TOC FAB and modal
// Setup mobile TOC FAB and modal
function setupMobileTOC() {
  const tocSidebar = document.getElementById("toc-sidebar");
  if (!tocSidebar) return;

  // Create FAB
  const fab = document.createElement("button");
  fab.className = "toc-fab";
  fab.setAttribute("aria-label", "Open table of contents");
  fab.innerHTML = "☰";
  document.body.appendChild(fab);

  // Create overlay and modal
  const overlay = document.createElement("div");
  overlay.className = "toc-overlay";
  
  const modal = document.createElement("div");
  modal.className = "toc-modal";
  
  const modalHeader = document.createElement("div");
  modalHeader.className = "toc-modal-header";
  
  const headerTitle = document.createElement("div");
  headerTitle.className = "toc-header";
  headerTitle.textContent = "Contents";
  
  const closeBtn = document.createElement("button");
  closeBtn.className = "toc-close-btn";
  closeBtn.setAttribute("aria-label", "Close table of contents");
  closeBtn.innerHTML = "×";
  
  modalHeader.appendChild(headerTitle);
  modalHeader.appendChild(closeBtn);
  
  // Clone TOC list for modal
  const tocList = document.getElementById("toc-list");
  const modalTocList = tocList.cloneNode(true);
  modalTocList.id = "toc-list-modal";
  
  modal.appendChild(modalHeader);
  modal.appendChild(modalTocList);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Open modal
  function openTOCModal() {
    overlay.classList.add("active");
    fab.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // Close modal
  closeTOCModal = function() {
    overlay.classList.remove("active");
    fab.classList.remove("active");
    document.body.style.overflow = "";
  };

  // Event listeners
  fab.addEventListener("click", openTOCModal);
  closeBtn.addEventListener("click", closeTOCModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeTOCModal();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) {
      closeTOCModal();
    }
  });

  // Update active state in modal TOC as well
  const modalTocLinks = modalTocList.querySelectorAll("a");
  const originalTocLinks = tocList.querySelectorAll("a");
  
  // Add click handlers to modal TOC links to auto-close on mobile
  modalTocLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href");
      const targetElement = document.querySelector(href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", href);
        // Auto-close the modal after clicking (only on mobile)
        closeTOCModal();
      }
    });
  });
  
  // Sync active states
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        originalTocLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
          }
        });
        modalTocLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
          }
        });
      }
    });
  }, { rootMargin: '-100px 0px -66% 0px', threshold: 0 });

  document.querySelectorAll("#blog-post-content .markdown-body h1, #blog-post-content .markdown-body h2, #blog-post-content .markdown-body h3").forEach(heading => {
    observer.observe(heading);
  });
}

// Setup TOC scroll sync using IntersectionObserver
function setupTOCScrollSync() {
  const headings = document.querySelectorAll("#blog-post-content .markdown-body h1, #blog-post-content .markdown-body h2, #blog-post-content .markdown-body h3");
  const tocLinks = document.querySelectorAll("#toc-list a");

  if (headings.length === 0 || tocLinks.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-10% 0px -80% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    const isDesktop = window.innerWidth > 1200; // Check against your CSS breakpoint

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        
        tocLinks.forEach(link => {
          const parentLi = link.parentElement;
          link.classList.remove('active');
          
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
            
            // Only affect expansion on Desktop
            if (isDesktop) {
              const nextElement = link.nextElementSibling;
              if (nextElement && nextElement.tagName === 'UL') {
                nextElement.classList.add('expanded');
              }

              let parent = parentLi.parentElement;
              while (parent && parent.id !== 'toc-list') {
                if (parent.tagName === 'UL') parent.classList.add('expanded');
                parent = parent.parentElement;
              }
            }
          } else if (isDesktop) {
            // Collapse non-active menus only on Desktop
            const nextElement = link.nextElementSibling;
            const isActiveChild = parentLi.querySelector('a.active');
            if (nextElement && nextElement.tagName === 'UL' && !isActiveChild) {
              nextElement.classList.remove('expanded');
            }
          }
        });
      }
    });
  }, observerOptions);

  headings.forEach(heading => observer.observe(heading));
}

// Setup reading progress bar
function setupReadingProgress() {
  const progressBar = document.createElement('div');
  progressBar.id = 'reading-progress';
  progressBar.className = 'reading-progress-bar';
  document.body.appendChild(progressBar);

  const markdownBody = document.querySelector('.markdown-body');
  if (!markdownBody) return;

  function updateProgress() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const contentTop = markdownBody.offsetTop;
    const contentHeight = markdownBody.offsetHeight;
    const contentBottom = contentTop + contentHeight;

    // Calculate progress based on markdown body scroll
    let progress = 0;
    if (scrollTop < contentTop) {
      progress = 0;
    } else if (scrollTop > contentBottom - windowHeight) {
      progress = 100;
    } else {
      const scrolled = scrollTop - contentTop;
      progress = (scrolled / (contentHeight - windowHeight)) * 100;
    }

    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  window.addEventListener('scroll', updateProgress);
  window.addEventListener('resize', updateProgress);
  updateProgress();
}

// Configure Marked.js with GitHub Flavored Markdown
if (typeof marked !== "undefined") {
  marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
  });

  // Custom renderer for code blocks
  const renderer = new marked.Renderer();
  const originalCode = renderer.code.bind(renderer);

  renderer.code = function (code, language) {
    const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Escape HTML in code (simple escape function)
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    if (language) {
      return `<pre class="code-block-wrapper"><code class="language-${language}" id="${codeId}">${escapedCode}</code><button class="code-copy-btn" data-code-id="${codeId}" aria-label="Copy code"><span class="copy-icon">📋</span><span class="copied-text">Copied!</span></button></pre>`;
    }
    return `<pre class="code-block-wrapper"><code id="${codeId}">${escapedCode}</code><button class="code-copy-btn" data-code-id="${codeId}" aria-label="Copy code"><span class="copy-icon">📋</span><span class="copied-text">Copied!</span></button></pre>`;
  };

  // Custom renderer for admonitions (Note, Warning, Error)
  renderer.blockquote = function (quote) {
    const noteMatch = quote.match(/^\[!NOTE\]\s*(.*)/s);
    const warningMatch = quote.match(/^\[!WARNING\]\s*(.*)/s);
    const errorMatch = quote.match(/^\[!ERROR\]\s*(.*)/s);

    if (noteMatch) {
      const content = marked.parse(noteMatch[1].trim());
      return `<div class="admonition admonition-note">
        <div class="admonition-title">Note</div>
        <div class="admonition-content">${content}</div>
      </div>`;
    } else if (warningMatch) {
      const content = marked.parse(warningMatch[1].trim());
      return `<div class="admonition admonition-warning">
        <div class="admonition-title">Warning</div>
        <div class="admonition-content">${content}</div>
      </div>`;
    } else if (errorMatch) {
      const content = marked.parse(errorMatch[1].trim());
      return `<div class="admonition admonition-error">
        <div class="admonition-title">Error</div>
        <div class="admonition-content">${content}</div>
      </div>`;
    }

    return `<blockquote>${quote}</blockquote>`;
  };

  marked.setOptions({ renderer });
}

function createShareHTML() {
  return `
    <div class="post-share">
      <span class="share-label"><strong>Share this post:</strong></span>

      <div class="share-icons">
        <!-- WhatsApp -->
        <button class="share-btn" data-share="whatsapp" aria-label="Share on WhatsApp">
          <svg viewBox="0 0 24 24">
            <path d="M20.5 3.5A11 11 0 0 0 3.9 18.7L3 22l3.4-.9A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.7.7.7-2.6-.2-.3A9 9 0 1 1 12 20.5zm5-6.6c-.3-.1-1.8-.9-2.1-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.3 8.3 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.4c.1-.2 0-.4 0-.6s-.7-1.7-.9-2.3c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.8 3.8 0 0 0-1.2 2.8c0 1.6 1.2 3.1 1.3 3.3a13.4 13.4 0 0 0 5.2 4.6c.7.3 1.2.5 1.6.6a3.8 3.8 0 0 0 1.8.1c.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4s-.3-.2-.6-.3z"/>
          </svg>
        </button>

        <!-- Instagram -->
        <button class="share-btn" data-share="instagram" aria-label="Share on Instagram">
          <svg viewBox="0 0 24 24">
            <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.1.1 1.7.2 2.1.4a4.3 4.3 0 0 1 1.6 1 4.3 4.3 0 0 1 1 1.6c.2.4.3 1 .4 2.1.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.1-.2 1.7-.4 2.1a4.3 4.3 0 0 1-1 1.6 4.3 4.3 0 0 1-1.6 1c-.4.2-1 .3-2.1.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.1-.1-1.7-.2-2.1-.4a4.3 4.3 0 0 1-1.6-1 4.3 4.3 0 0 1-1-1.6c-.2-.4-.3-1-.4-2.1C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.1.2-1.7.4-2.1a4.3 4.3 0 0 1 1-1.6 4.3 4.3 0 0 1 1.6-1c.4-.2 1-.3 2.1-.4C8.4 2.2 8.8 2.2 12 2.2zm0 2.2a5.6 5.6 0 1 0 5.6 5.6A5.6 5.6 0 0 0 12 4.4zm0 9.2a3.6 3.6 0 1 1 3.6-3.6A3.6 3.6 0 0 1 12 13.6zm5.8-9.8a1.3 1.3 0 1 1-1.3-1.3 1.3 1.3 0 0 1 1.3 1.3z"/>
          </svg>
        </button>

        <!-- LinkedIn -->
        <button class="share-btn" data-share="linkedin" aria-label="Share on LinkedIn">
          <svg viewBox="0 0 24 24">
            <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9h4v12H3zM9 9h3.8v1.6h.1c.5-.9 1.7-1.9 3.6-1.9 3.9 0 4.6 2.5 4.6 5.8V21h-4v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9z"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Render post
async function renderPost() {
  const slug = getSlugFromURL();
  if (!slug) {
    document.getElementById("blog-post-content").innerHTML =
      '<div class="loading">Post not found. <a href="/blog/">Return to blog</a></div>';
    return;
  }

  let markdown = await loadMarkdownContent(slug);
  if (!markdown) {
    document.getElementById("blog-post-content").innerHTML =
      '<div class="loading">Post content not found. <a href="/blog/">Return to blog</a></div>';
    return;
  }

  // Parse front matter
  const { frontMatter, content: markdownContent } = parseFrontMatter(markdown);

  // Check for cover image
  const coverImage = await checkCoverImage(slug);

  // Update page title and meta
  const title = frontMatter.title || slug;
  document.title = `${title} | RIGNITC Blog`;
  const metaDesc = document.getElementById("page-description");
  if (metaDesc) {
    metaDesc.content = frontMatter.summary || title;
  }

  // Process image paths
  const processedMarkdown = processImagePaths(markdownContent, slug);

  // Render markdown to HTML
  let html = "";
  if (typeof marked !== "undefined") {
    html = marked.parse(processedMarkdown);
  } else {
    html = `<pre>${escapeHtml(processedMarkdown)}</pre>`;
  }

  // Format date
  const date = frontMatter.date ? new Date(frontMatter.date) : new Date();
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build post HTML
  const postHTML = `
    <div class="post-header">
      <a href="/blog/" class="back-to-blog-btn">
        <span>←</span>
        <span>Back to Blog</span>
      </a>
      ${frontMatter.category ? `<div class="post-category">${escapeHtml(frontMatter.category)}</div>` : ''}
      <h1 class="post-title">${escapeHtml(title)}</h1>
      ${createShareHTML()}
      <div class="post-meta">
        <div class="post-date">
          <span>📅</span>
          <span>${escapeHtml(formattedDate)}</span>
        </div>
        ${frontMatter.author ? `<div class="post-author">
          <span>✍️</span>
          <span>${escapeHtml(frontMatter.author)}</span>
        </div>` : ''}
      </div>
    </div>
    <div class="markdown-body">${html}</div>
  `;

  const contentEl = document.getElementById("blog-post-content");
  contentEl.innerHTML = postHTML;

  // Highlight code blocks and setup copy buttons
  if (typeof hljs !== "undefined") {
    contentEl.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  // Setup copy buttons for code blocks
  setupCodeCopyButtons(contentEl);

  // Render math with KaTeX
  if (typeof renderMathInElement !== "undefined") {
    renderMathInElement(contentEl, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
    });
  }

  // Generate TOC
  generateTOC(contentEl);

  // Setup TOC scroll sync
  setupTOCScrollSync();

  // Setup reading progress bar
  setupReadingProgress();

  // Share Buttons
  setupShareButtons();

  // Setup back to top button
  setupBackToTop();
}

function setupShareButtons() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);

  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.share;

      if (type === 'whatsapp') {
        window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
      }

      if (type === 'linkedin') {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
      }

      if (type === 'instagram') {
        navigator.clipboard.writeText(window.location.href);
        window.open('https://www.instagram.com/', '_blank');
      }
    });
  });
}


// Setup code copy buttons
function setupCodeCopyButtons(container) {
  const copyButtons = container.querySelectorAll('.code-copy-btn');
  
  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const codeId = button.getAttribute('data-code-id');
      const codeElement = document.getElementById(codeId);
      if (!codeElement) return;

      const codeText = codeElement.textContent || codeElement.innerText;
      
      try {
        await navigator.clipboard.writeText(codeText);
        button.classList.add('copied');
        setTimeout(() => {
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = codeText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          button.classList.add('copied');
          setTimeout(() => {
            button.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
        document.body.removeChild(textArea);
      }
    });
  });
}

// Setup back to top button with progress indicator
function setupBackToTop() {
  // Check if button already exists
  if (document.querySelector('.back-to-top-btn')) {
    return;
  }

  // Create the button with progress SVG
  const backToTopBtn = document.createElement('button');
  backToTopBtn.className = 'back-to-top-btn';
  backToTopBtn.setAttribute('aria-label', 'Back to top');
  backToTopBtn.setAttribute('tabindex', '-1');
  backToTopBtn.innerHTML = `
    <svg class="back-to-top-progress" width="50" height="50" viewBox="0 0 50 50">
      <circle class="back-to-top-progress-bg" cx="25" cy="25" r="22" 
              fill="none" stroke="rgba(255, 255, 255, 0.1)" 
              stroke-width="2"/>
      <circle class="back-to-top-progress-fill" cx="25" cy="25" r="22" 
              fill="none" stroke="var(--accent)" stroke-width="2" 
              stroke-linecap="round" stroke-dasharray="138.23" stroke-dashoffset="138.23"/>
    </svg>
    <span class="back-to-top-icon">↑</span>
  `;
  
  document.body.appendChild(backToTopBtn);

  // Calculate total scrollable height
  function getMaxScrollHeight() {
    // Use the larger of the two to ensure we get the actual content height
    const scrollHeight = Math.max(
      document.body.scrollHeight, 
      document.documentElement.scrollHeight
    );
    return scrollHeight - window.innerHeight;
  }

  // Update progress circle based on scroll
  function updateProgressCircle() {
    const maxScroll = getMaxScrollHeight();
    if (maxScroll <= 0) return;
    
    const scrollProgress = Math.min(window.scrollY / maxScroll, 1);
    const progressFill = backToTopBtn.querySelector('.back-to-top-progress-fill');
    
    if (progressFill) {
      const circumference = 2 * Math.PI * 22; // r=22
      const offset = circumference - (scrollProgress * circumference);
      progressFill.style.strokeDashoffset = offset;
    }
  }

  // Show/hide based on scroll position
  function toggleBackToTop() {
    const shouldShow = window.scrollY > 300;
    
    if (shouldShow && !backToTopBtn.classList.contains('visible')) {
      backToTopBtn.classList.add('visible');
      backToTopBtn.setAttribute('tabindex', '0');
    } else if (!shouldShow && backToTopBtn.classList.contains('visible')) {
      backToTopBtn.classList.remove('visible');
      backToTopBtn.setAttribute('tabindex', '-1');
    }
  }

  // Smooth scroll to top with easing
  function scrollToTop() {
    const startPosition = window.scrollY;
    const duration = 600;
    const startTime = performance.now();
    
    function animateScroll(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing function (easeInOutCubic)
      const easeProgress = progress < 0.5 
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      window.scrollTo(0, startPosition * (1 - easeProgress));
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        // Scroll complete, focus on post title for accessibility
        const postTitle = document.querySelector('.post-title');
        if (postTitle) {
          postTitle.setAttribute('tabindex', '-1');
          postTitle.focus();
          setTimeout(() => postTitle.removeAttribute('tabindex'), 1000);
        }
      }
    }
    
    requestAnimationFrame(animateScroll);
  }

  // Event listeners
  backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToTop();
  });

  // Keyboard support
  backToTopBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  });

  // Update on scroll
  function handleScroll() {
    toggleBackToTop();
    updateProgressCircle();
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Initial state
  toggleBackToTop();
  updateProgressCircle();

  // Handle resize to recalculate max scroll
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateProgressCircle();
    }, 100);
  });
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Change this part at the end of your blog-post.js
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    renderPost();        // Logic for content
    setupBackToTop();   // Logic for button (now independent)
  });
} else {
  renderPost();
  setupBackToTop();
}