// 1. Logic for Blog List Page (index.html)
document.addEventListener('DOMContentLoaded', async () => {
  const blogListContainer = document.getElementById('blog-list');
  const blogContentContainer = document.getElementById('blog-content');
  const params = new URLSearchParams(window.location.search);
  const blogId = params.get('id');

  if (blogId) {
    // Show Blog Content
    if (blogListContainer) blogListContainer.style.display = 'none';
    if (blogContentContainer) {
      blogContentContainer.style.display = 'block';
      await loadBlogPost(blogContentContainer, blogId);
    }
  } else {
    // Show Blog List
    if (blogContentContainer) blogContentContainer.style.display = 'none';
    if (blogListContainer) {
      blogListContainer.style.display = 'grid'; // Maintain grid layout
      await loadBlogList(blogListContainer);
    }
  }
});

async function loadBlogList(container) {
  const empty = document.getElementById('empty-placeholder');

  try {
    if (!window.githubClient) {
      console.error('GithubClient not loaded');
      if (empty) empty.style.display = 'block';
      return;
    }

    container.innerHTML = '<div class="loading" style="grid-column: 1/-1; text-align: center;">Loading blogs...</div>';

    // Fetch list of blogs from test repo
    const blogs = await window.githubClient.listBlogs();

    container.innerHTML = ''; // Clear loading

    if (!blogs || blogs.length === 0) {
      if (empty) {
        empty.style.display = 'block';
        container.appendChild(empty);
      }
      return;
    }

    if (empty) empty.style.display = 'none';

    blogs.forEach(blog => {
      const card = document.createElement('div');
      card.className = 'achievement-card';
      card.onclick = () => {
        window.location.search = `?id=${encodeURIComponent(blog.path)}`;
      };
      card.style.cursor = 'pointer';

      // Cover Image (New)
      if (blog.coverImage) {
        const img = document.createElement('img');
        img.src = blog.coverImage;
        img.alt = blog.title;
        img.style.width = '100%';
        img.style.aspectRatio = '1 / 1';
        img.style.objectFit = 'cover';
        img.style.borderTopLeftRadius = 'var(--radius-lg)';
        img.style.borderTopRightRadius = 'var(--radius-lg)';
        card.appendChild(img);
      }

      // Badge (Category)
      /*
      const badge = document.createElement('div');
      badge.className = 'achievement-badge';
      badge.textContent = blog.category || 'Blog';
      card.appendChild(badge);
      */

      // Title
      const title = document.createElement('div');
      title.className = 'achievement-title';
      title.textContent = blog.title;
      card.appendChild(title);

      // Description / Date
      const desc = document.createElement('div');
      desc.className = 'achievement-description';
      const dateStr = blog.date ? new Date(blog.date).toLocaleDateString() : '';
      desc.innerHTML = `${blog.description || 'No description'} <br> <small style="opacity: 0.6">${dateStr}</small>`;
      card.appendChild(desc);

      container.appendChild(card);
      // Trigger animation
      setTimeout(() => card.classList.add('show'), 10);
    });

  } catch (err) {
    console.error('Error loading blog list:', err);
    container.innerHTML = '';
    if (empty) {
      empty.style.display = 'block';
      empty.innerHTML = `Failed to load blogs.<br><small>${err.message}</small>`;
      container.appendChild(empty);
    }
  }
}

async function loadBlogPost(container, blogId) {

  if (!blogId) {
    container.innerHTML = '<p>No blog specified.</p>';
    return;
  }

  try {
    container.innerHTML = `<div class="loading">Loading content...</div>`;

    if (!window.githubClient) throw new Error('GithubClient not loaded');

    const rawText = await window.githubClient.getFileContent(blogId);

    // Parse frontmatter
    const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
    let meta = {};
    let contentV = rawText;

    const match = rawText.match(frontmatterRegex);
    if (match) {
      contentV = rawText.replace(frontmatterRegex, '').trim();
      const yaml = match[1];
      yaml.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          let key = parts[0].trim();
          let val = parts.slice(1).join(':').trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          meta[key] = val;
        }
      });
    }

    const title = meta.title || blogId;
    const author = meta.author || 'Unknown';
    const date = meta.date ? new Date(meta.date).toLocaleDateString() : '';

    document.title = `${title} | Blogs`;

    // Back Button (with block display for new line)
    const backBtn = '<a href="?" style="display: block; margin-bottom: 20px; color: var(--fg); text-decoration: none; font-weight: bold;">&larr; Back to Blogs</a>';

    const headerHtml = `${backBtn}<p class="blog-header-title" style="text-align: center; font-size: 3em; font-weight: bold; margin: 0.67em 0;">${escapeHtml(title)}</p><p class="blog-header-meta" style="text-align: right; margin-top: -10px; margin-bottom: 40px;">By ${escapeHtml(author)} ${date ? '&bull; ' + date : ''}</p>`;

    const loadingDiv = container.querySelector('.loading');
    if (loadingDiv) loadingDiv.remove();

    // Handle relative images
    // Assume rignitc/blogs is public, use raw.githubusercontent.com
    const folderPath = blogId.substring(0, blogId.lastIndexOf('/'));
    const baseUrl = `https://raw.githubusercontent.com/rignitc/blogs/main/${folderPath}/`;

    // Replace relative paths like [](./image.png) or [](image.png) with full URL
    contentV = contentV.replace(/!\[([^\]]*)\]\((?!http)([^)]+)\)/g, (match, alt, src) => {
      const cleanSrc = src.replace(/^\.\//, '');
      return `![${alt}](${baseUrl}${cleanSrc})`;
    });

    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = headerHtml + markdownToHtml(contentV);
    container.appendChild(contentDiv);

  } catch (err) {
    console.error('Error loading blog post:', err);
    container.innerHTML = `<p style="color:red; margin-top:20px;">Error loading content: ${err.message}</p>
        <p><button onclick="window.githubClient.clearToken(); location.reload()">Clear Token & Retry</button></p>`;
  }
}

// Utility Functions

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[c]));
}

function markdownToHtml(md) {
  if (!md) return '';
  md = md.replace(/\r\n?/g, '\n');

  const codeBlocks = [];
  md = md.replace(/```([\s\S]*?)```/g, (m, p1) => {
    const idx = codeBlocks.length;
    codeBlocks.push('<pre><code>' + escapeHtml(p1) + '</code></pre>');
    return `{{CODEBLOCK_${idx}}}`;
  });

  // Images
  md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; margin: 1rem 0;">');

  // Headings - process from most specific to least specific
  md = md.replace(/^######\s+(.*)$/gm, '<h6 style="margin-bottom: 1rem;">$1</h6>');
  md = md.replace(/^#####\s+(.*)$/gm, '<h6 style="margin-bottom: 1rem;">$1</h6>');
  md = md.replace(/^####\s+(.*)$/gm, '<h5 style="margin-bottom: 1rem;">$1</h5>');
  md = md.replace(/^###\s+(.*)$/gm, '<h4 style="margin-bottom: 1rem;">$1</h4>');
  md = md.replace(/^##\s+(.*)$/gm, '<h3 style="margin-bottom: 1rem;">$1</h3>');
  md = md.replace(/^#\s+(.*)$/gm, '<h2 style="margin-bottom: 1rem;">$1</h2>');

  md = md.replace(/^---$/gm, '<hr/>');

  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  md = md.replace(/`([^`]+)`/g, '<code>$1</code>');
  md = md.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  md = md.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  md = md.replace(/(^|\n)([-*])\s+([^\n]+)/g, (m, p1, p2, p3) => {
    return `${p1}<li>${p3}</li>`;
  });
  md = md.replace(/(<li>[\s\S]*?<\/li>)(?=[^<]|$)/g, '<ul>$1</ul>');

  const parts = md.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const htmlParts = parts.map(p => {
    if (/^<(h[1-6]|ul|pre|blockquote|hr|ol|img)/.test(p)) return p;
    if (p.includes('<li>')) return p;
    // Preserve line breaks within paragraphs - convert single \n to <br/>
    const withLineBreaks = p.split('\n').map(line => line.trim()).filter(Boolean).join('<br/>');
    return '<p style="margin-bottom: 1.5rem; line-height: 1.6;">' + withLineBreaks + '</p>';
  });

  let html = htmlParts.join('\n');
  html = html.replace(/\{\{CODEBLOCK_(\d+)\}\}/g, (m, idx) => codeBlocks[Number(idx)] || '');
  return html;
}
