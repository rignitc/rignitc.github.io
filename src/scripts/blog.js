/**
 * Blog listing page script
 * Loads and renders blog posts by scanning content/ directory and parsing front matter
 */

// Load front matter parser
const { parseFrontMatter } = (function() {
  // Inline front matter parser (since we can't easily import)
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

  return { parseFrontMatter };
})();

async function loadBlogPosts() {
  const container = document.getElementById("blog-posts");
  const empty = document.getElementById("empty-placeholder");
  if (!container || !empty) return;

  // Check if draft mode is enabled via URL: /blog/?draft=true
  const urlParams = new URLSearchParams(window.location.search);
  const showDrafts = urlParams.get('draft') === 'true';

  try {
    container.innerHTML = "";
    empty.style.display = "none";

    const slugsResp = await fetch("/src/data/blogs/slugs.json", { cache: "no-cache" });
    if (!slugsResp.ok) throw new Error("Failed to load slugs");
    const slugs = await slugsResp.json();

    const posts = await Promise.all(
      slugs.map(async (slug) => {
        try {
          const resp = await fetch(`/content/${slug}/index.md`, { cache: "no-cache" });
          if (!resp.ok) return null;
          const markdown = await resp.text();
          const { frontMatter } = parseFrontMatter(markdown);
          
          // DRAFT LOGIC: 
          // 1. If 'draft' is not specified, it defaults to true.
          // 2. We convert the value to a boolean.
          const isDraft = frontMatter.draft !== undefined ? String(frontMatter.draft) === 'true' : true;

          // If it's a draft and we aren't in draft mode, skip this post
          if (isDraft && !showDrafts) {
            return null;
          }

          const coverImage = await checkCoverImage(slug);
          
          return {
            slug,
            title: frontMatter.title || slug,
            date: frontMatter.date || new Date().toISOString().split('T')[0],
            summary: frontMatter.summary || "",
            author: frontMatter.author || "RIGNITC Team",
            category: frontMatter.category || "Uncategorized",
            tags: frontMatter.tags || [],
            coverImage,
            isDraft // Pass this along if you want to style draft cards differently
          };
        } catch (err) {
          console.warn(`Failed to load post ${slug}:`, err);
          return null;
        }
      })
    );

    // Filter out nulls and sort
    const validPosts = posts
      .filter(post => post !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (validPosts.length === 0) {
      empty.style.display = "block";
      empty.textContent = showDrafts ? "No draft posts found." : "No public blog posts found.";
      return;
    }

    renderBlogCards(validPosts, container);
  } catch (err) {
    console.error("Error loading blog posts:", err);
    empty.style.display = "block";
    empty.textContent = "Could not load blog posts";
  }
}

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

function renderBlogCards(posts, container) {
  posts.forEach((post, idx) => {
    const card = document.createElement("a");
    card.className = "blog-card";
    card.href = `/blog/posts/#/${post.slug}`;
    card.setAttribute("tabindex", "0");

    const date = new Date(post.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    card.innerHTML = `
      ${post.isDraft ? `<div style="background:red; color:white; position:absolute; top:10px; left:10px; padding:2px 8px; font-size:10px; z-index:10; border-radius:4px;">DRAFT</div>` : ''}
      ${post.coverImage ? `<div class="blog-card-image">
        <img src="${post.coverImage}" alt="${escapeHtml(post.title)}" loading="lazy">
      </div>` : ''}
      <div class="blog-card-content">
        ${post.category ? `<div class="blog-category">${escapeHtml(post.category)}</div>` : ''}
        <div class="blog-title">${escapeHtml(post.title)}</div>
        <div class="blog-excerpt">${escapeHtml(post.summary)}</div>
        <div class="blog-card-footer">
          <div class="blog-date">${escapeHtml(formattedDate)}</div>
          ${post.author ? `<div class="blog-author">By ${escapeHtml(post.author)}</div>` : ''}
        </div>
      </div>
    `;

    container.appendChild(card);
    setTimeout(() => card.classList.add("show"), 90 * idx);
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

// Initialize on page load
loadBlogPosts();
