const REPO_OWNER = 'rignitc';
const REPO_NAME = 'blogs';
const BRANCH = 'main';
const BASE_PATH = 'content/posts';

class GithubClient {
    constructor() {
        if (window.RIGNITC_CONFIG && window.RIGNITC_CONFIG.GITHUB_TOKEN) {
            this.token = window.RIGNITC_CONFIG.GITHUB_TOKEN;
        } else {
            this.token = localStorage.getItem('s_github_token');
        }
    }

    async getToken() {
        if (this.token) return this.token;
        return null; // Try without token for public, or fail if private
    }

    async requireToken() {
        const input = prompt('Please enter your GitHub Personal Access Token (PAT).');
        if (input) {
            this.token = input.trim();
            localStorage.setItem('s_github_token', this.token);
            return this.token;
        }
        return null;
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('s_github_token');
        location.reload();
    }

    async request(url, options = {}) {
        const token = await this.getToken();

        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 && token) {
            this.clearToken();
            throw new Error('Invalid GitHub token. Please refresh and try again.');
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`GitHub API Error: ${response.status} ${errText}`);
        }

        return response.json();
    }

    async getFileContent(path) {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
        const data = await this.request(url);
        if (data.encoding === 'base64') {
            return new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
        }
        throw new Error('Unexpected content encoding');
    }

    async listBlogs() {
        // 1. List contents of content/posts
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BASE_PATH}?ref=${BRANCH}`;
        let items = [];
        try {
            items = await this.request(url);
        } catch (e) {
            if (e.message.includes('404')) return []; // Folder doesn't exist yet
            throw e;
        }

        if (!Array.isArray(items)) return [];

        // Filter for directories (each dir is a blog)
        const blogDirs = items.filter(item => item.type === 'dir');

        // 2. Fetch details for each blog (index.md)
        const blogs = await Promise.all(blogDirs.map(async (dir) => {
            try {
                const indexPath = `${dir.path}/index.md`;
                const content = await this.getFileContent(indexPath);
                const meta = this.parseFrontmatter(content) || {};

                // Construct cover image URL
                // Check dir contents for cover image - can cause rate limits with many blogs.
                // Assuming standard naming 'cover.png' or 'cover.jpg' and public repo raw access or API download_url.

                const dirContentsUrl = dir.url;
                const dirFiles = await this.request(dirContentsUrl);

                const coverFile = dirFiles.find(f => f.name.toLowerCase().startsWith('cover.'));

                let coverUrl = null;
                if (coverFile) {
                    coverUrl = coverFile.download_url;
                }

                return {
                    id: indexPath,
                    title: meta.title || dir.name,
                    date: meta.date || new Date().toISOString(),
                    description: meta.description || 'No description available',
                    tags: meta.tags || [],
                    author: meta.author || 'RIGNITC',
                    // category: meta.category || 'Blog',
                    path: indexPath,
                    coverImage: coverUrl,
                    slug: dir.name
                };
            } catch (e) {
                console.warn(`Skipping blog folder ${dir.name}:`, e);
                return null;
            }
        }));

        return blogs.filter(b => b !== null).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async submitBlog(data) {
        if (!this.token) {
            await this.requireToken();
        }
        if (!this.token) {
            throw new Error('GitHub token is required to submit a blog. Please provide your token.');
        }
        const { title, content, author, email, tags, /* category, */ coverImageBase64, images } = data;

        // Create slug from title
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
        const folderPath = `${BASE_PATH}/${slug}`;

        const dateStr = new Date().toISOString().split('T')[0];
        const tagsStr = Array.isArray(tags) ? `[${tags.map(t => `"${t}"`).join(', ')}]` : '[]';
        const descSafe = (title + ' by ' + author).replace(/"/g, '\\"');

        const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${dateStr}
author: "${(author || 'Anonymous').replace(/"/g, '\\"')}"
tags: ${tagsStr}
description: "${descSafe}"
---

`;
        const fullContent = frontmatter + content;

        // 1. Upload index.md
        // Note: Creating a file in a non-existent folder recursively creates the folder in Git
        const indexContentEncoded = btoa(unescape(encodeURIComponent(fullContent)));
        const indexUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folderPath}/index.md`;

        const committer = (author && email) ? { name: author, email: email } : undefined;

        await this.request(indexUrl, {
            method: 'PUT',
            body: JSON.stringify({
                message: `Add blog: ${title}`,
                content: indexContentEncoded,
                branch: BRANCH,
                committer: committer
            })
        });

        // 2. Upload cover.png if exists
        if (coverImageBase64) {
            const base64Content = coverImageBase64.split(',')[1] || coverImageBase64;
            // Determine extension from base64 header if possible, else default to png
            let ext = 'png';
            if (coverImageBase64.startsWith('data:image/jpeg')) ext = 'jpg';
            else if (coverImageBase64.startsWith('data:image/webp')) ext = 'webp';

            const coverUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folderPath}/cover.${ext}`;

            await this.request(coverUrl, {
                method: 'PUT',
                body: JSON.stringify({
                    message: `Add cover for: ${title}`,
                    content: base64Content,
                    branch: BRANCH,
                    committer: committer
                })
            });
        }

        // 3. Upload additional blog images if exists
        if (images && Array.isArray(images) && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const base64Content = image.base64.split(',')[1] || image.base64;

                // Sanitize filename
                let sanitizedFilename = image.filename
                    .toLowerCase()
                    .replace(/[^a-z0-9.-]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/(^-|-$)/g, '');

                // If filename doesn't have extension, add one based on base64 header
                if (!sanitizedFilename.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                    let ext = 'png';
                    if (image.base64.startsWith('data:image/jpeg')) ext = 'jpg';
                    else if (image.base64.startsWith('data:image/webp')) ext = 'webp';
                    else if (image.base64.startsWith('data:image/gif')) ext = 'gif';
                    sanitizedFilename += '.' + ext;
                }

                const imageUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folderPath}/${sanitizedFilename}`;

                await this.request(imageUrl, {
                    method: 'PUT',
                    body: JSON.stringify({
                        message: `Add image: ${sanitizedFilename} for blog: ${title}`,
                        content: base64Content,
                        branch: BRANCH,
                        committer: committer
                    })
                });
            }
        }

        return `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${BRANCH}/${folderPath}`;
    }

    parseFrontmatter(text) {
        const match = text.match(/^---\s*([\s\S]*?)\s*---/);
        if (!match) return null;
        const yaml = match[1];
        const data = {};
        yaml.split('\n').forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim().toLowerCase(); // Normalize key to lowercase
                let value = parts.slice(1).join(':').trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);

                if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
                    const inner = value.slice(1, -1);
                    data[key] = inner.split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
                } else {
                    data[key] = value;
                }
            }
        });
        return data;
    }
}

// Expose globally
window.githubClient = new GithubClient();
