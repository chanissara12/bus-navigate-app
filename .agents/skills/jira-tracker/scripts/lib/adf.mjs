// Basic markdown <-> Atlassian Document Format (ADF) conversion.
// Supports: paragraphs, **bold**, _italic_/*italic*, [text](url) links,
// bullet/ordered lists. Anything fancier (tables, nested lists, images) is
// out of scope for now — Jira descriptions round-trip through this.

const INLINE_RE = /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|\[([^\]]+)\]\(([^)]+)\)/g;

function parseInline(text) {
  const nodes = [];
  let lastIndex = 0;
  let m;

  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, m.index) });
    }
    if (m[1] !== undefined || m[2] !== undefined) {
      nodes.push({ type: 'text', text: m[1] ?? m[2], marks: [{ type: 'strong' }] });
    } else if (m[3] !== undefined || m[4] !== undefined) {
      nodes.push({ type: 'text', text: m[3] ?? m[4], marks: [{ type: 'em' }] });
    } else if (m[5] !== undefined) {
      nodes.push({ type: 'text', text: m[5], marks: [{ type: 'link', attrs: { href: m[6] } }] });
    }
    lastIndex = INLINE_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) });
  }
  return nodes.filter((n) => n.text !== '');
}

export function markdownToAdf(markdown) {
  const lines = (markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  const content = [];
  let i = 0;

  const isBullet = (line) => /^[-*]\s+/.test(line);
  const isOrdered = (line) => /^\d+\.\s+/.test(line);

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    if (isBullet(line)) {
      const items = [];
      while (i < lines.length && isBullet(lines[i])) {
        const itemText = lines[i].replace(/^[-*]\s+/, '');
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: parseInline(itemText) }] });
        i++;
      }
      content.push({ type: 'bulletList', content: items });
      continue;
    }

    if (isOrdered(line)) {
      const items = [];
      while (i < lines.length && isOrdered(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '');
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: parseInline(itemText) }] });
        i++;
      }
      content.push({ type: 'orderedList', content: items });
      continue;
    }

    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !isBullet(lines[i]) && !isOrdered(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    content.push({ type: 'paragraph', content: parseInline(paraLines.join(' ')) });
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [] });
  }

  return { type: 'doc', version: 1, content };
}

function renderMarks(text, marks = []) {
  let result = text;
  for (const mark of marks) {
    if (mark.type === 'strong') result = `**${result}**`;
    else if (mark.type === 'em') result = `_${result}_`;
    else if (mark.type === 'code') result = `\`${result}\``;
    else if (mark.type === 'link') result = `[${result}](${mark.attrs?.href ?? ''})`;
  }
  return result;
}

function renderInline(nodes = []) {
  return nodes
    .map((n) => {
      if (n.type === 'text') return renderMarks(n.text, n.marks);
      if (n.type === 'hardBreak') return '\n';
      return '';
    })
    .join('');
}

function renderNode(node) {
  if (!node) return '';
  switch (node.type) {
    case 'paragraph':
      return renderInline(node.content);
    case 'bulletList':
      return (node.content || []).map((item) => `- ${renderNode(item.content?.[0])}`).join('\n');
    case 'orderedList':
      return (node.content || []).map((item, idx) => `${idx + 1}. ${renderNode(item.content?.[0])}`).join('\n');
    case 'codeBlock': {
      const code = (node.content || []).map((c) => c.text).join('');
      return `\`\`\`${node.attrs?.language ?? ''}\n${code}\n\`\`\``;
    }
    case 'heading':
      return `${'#'.repeat(node.attrs?.level ?? 1)} ${renderInline(node.content)}`;
    case 'blockquote':
      return (node.content || []).map((n) => `> ${renderNode(n)}`).join('\n');
    case 'rule':
      return '---';
    case 'mediaSingle':
    case 'media':
      return '[attachment]';
    default:
      return node.content ? node.content.map(renderNode).join(' ') : '';
  }
}

/** Renders an ADF document (as returned by the Jira REST API) back to markdown text. */
export function adfToMarkdown(doc) {
  if (!doc || !Array.isArray(doc.content)) return '';
  return doc.content
    .map(renderNode)
    .filter((s) => s !== undefined)
    .join('\n\n')
    .trim();
}
