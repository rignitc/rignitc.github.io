/**
 * Front Matter Parser
 * Extracts YAML front matter from markdown files using regex
 * (Lightweight alternative to js-yaml for vanilla JS)
 */

function parseFrontMatter(markdown) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);

  if (!match) {
    // No front matter, return content as-is
    return {
      frontMatter: {},
      content: markdown,
    };
  }

  const frontMatterText = match[1];
  const content = match[2];

  // Parse YAML-like front matter (simple key-value parser)
  const frontMatter = {};
  const lines = frontMatterText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle arrays (simple comma-separated)
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    }

    frontMatter[key] = value;
  }

  return {
    frontMatter,
    content,
  };
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseFrontMatter };
}

