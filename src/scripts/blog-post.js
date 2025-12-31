/**
 * Blog post rendering script
 * Loads markdown content and renders with Marked.js, KaTeX, and Highlight.js
 * Uses URL parameters and front matter parsing
 */

// Front matter parser (inline)
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
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('post');
  if (slug) return slug;

  // Fallback: try to get from path
  const path = window.location.pathname;
  const match = path.match(/\/blog\/([^\/]+)\/?$/);
  if (match) {
    return match[1];
  }
  const pathParts = path.split('/').filter(p => p);
  const blogIndex = pathParts.indexOf('blog');
  if (blogIndex !== -1 && blogIndex < pathParts.length - 1) {
    return pathParts[blogIndex + 1];
  }
  return null;
}

// Check for cover image
async function checkCoverImage(slug) {
  try {
    const resp = await fetch('/content/${slug}/imgs/cover.webp', { method: "HEAD" });
    if (resp.ok) {
      return '/content/${slug}/imgs/cover.webp';
    }
  } catch (err) {
    // Ignore errors
  }
  return null;
}

// Load markdown content
async function loadMarkdownContent(slug) {
  try {
    const resp = await fetch('/content/${slug}/index.md', { cache: "no-cache" });
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
      return '![${alt}](/content/${slug}/${src})';
    }
  );
}

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
    });
    li.appendChild(a);
    currentList.appendChild(li);
  });
}

// Setup TOC scroll sync using IntersectionObserver
function setupTOCScrollSync() {
  const headings = document.querySelectorAll("#blog-post-content .markdown-body h1, #blog-post-content .markdown-body h2, #blog-post-content .markdown-body h3");
  const tocLinks = document.querySelectorAll("#toc-list a");

  if (headings.length === 0 || tocLinks.length === 0) return;

  // Create IntersectionObserver
  const observerOptions = {
    root: null,
    rootMargin: '-100px 0px -66% 0px', // Trigger when heading is near top
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.id;
      const tocLink = Array.from(tocLinks).find(link => link.getAttribute('href') === `#${id}`);
      
      if (entry.isIntersecting) {
        // Remove active from all links
        tocLinks.forEach(link => link.classList.remove('active'));
        // Add active to current link
        if (tocLink) {
          tocLink.classList.add('active');
        }
      }
    });
  }, observerOptions);

  // Observe all headings
  headings.forEach(heading => {
    observer.observe(heading);
  });
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
    if (language) {
      return `<pre><code class="language-${language}">${code}</code></pre>`;
    }
    return originalCode(code, language);
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

  // Set cover image as hero background if available
  if (coverImage) {
    const heroSection = document.querySelector('.blog-post-content');
    if (heroSection) {
      heroSection.style.backgroundImage = `url(${coverImage})`;
      heroSection.style.backgroundSize = 'cover';
      heroSection.style.backgroundPosition = 'center';
      heroSection.classList.add('has-cover');
    }
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

  // Highlight code blocks
  if (typeof hljs !== "undefined") {
    contentEl.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

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
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderPost);
} else {
  renderPost();
}
