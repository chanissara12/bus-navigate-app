import { strings } from './i18n.mjs';
import { groupBySeverity } from './verdict.mjs';

export class RenderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RenderError';
  }
}

const HTML_RE = /<\/?[a-zA-Z][^>]*>|<!--/;
// The leading `[\w.]*` pulls an adjacent identifier inside the backticks, so a
// generic reads `Promise<void>` rather than Promise`<void>`. A tag preceded by a
// space keeps its own boundary.
const BARE_TAG_RE = /<!--[\s\S]*?-->|[\w.]*<\/?[a-zA-Z][^>\n]*>+/g;

/**
 * Wrap tag-shaped sequences in prose with backticks.
 *
 * A finding that names `<ng-container>` or `Promise<void>` is describing code,
 * and Markdown treats the bare form as HTML: GitHub strips it and the sentence
 * silently loses a word. Adding the backticks here means the reviewer never has
 * to think about it and no draft is rejected over punctuation.
 *
 * Applied to prose only — never to `patch`, where the code must reach the reader
 * byte for byte. Text already inside a code span is left alone, so escaping
 * twice is a no-op.
 */
export function escapeBareTags(text) {
  if (text == null) return text;
  return String(text)
    .split(/(`[^`\n]*`)/)
    .map((chunk, index) =>
      index % 2 === 1 ? chunk : chunk.replace(BARE_TAG_RE, (tag) => `\`${tag}\``)
    )
    .join('');
}

/**
 * Refuse to emit raw HTML.
 *
 * Bitbucket Cloud renders none of it, so an `<sub>` or `<details>` reaches the
 * reader as literal text — twice already this shipped unnoticed because nothing
 * checked. Everything this renderer produces must be plain Markdown.
 *
 * Code spans and fenced blocks are stripped first, so anything inside a patch is
 * fine. A tag-shaped sequence left bare in prose — a generic, a template element,
 * a JSX component — is *not* a false positive: GitHub would swallow it as HTML
 * and the sentence would lose it, so it needs backticks either way. Comparisons
 * that are not tag-shaped (`x < 0`, SQL `<>`) do not match.
 */
export function assertNoHtml(markdown, where = 'output') {
  const prose = markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const found = HTML_RE.exec(prose);
  if (!found) return markdown;

  throw new RenderError(
    `${where}: พบ HTML ในผลลัพธ์ — ${JSON.stringify(found[0])}\n` +
      `  Bitbucket ไม่ render HTML ผู้อ่านจะเห็นแท็กเป็นข้อความดิบ\n` +
      `  ถ้ามาจาก renderer ให้เปลี่ยนไปใช้ markdown แทน\n` +
      `  ถ้ามาจากเนื้อ finding ให้ครอบด้วย backtick (GitHub จะกลืนข้อความนั้นหายไปเช่นกัน)`
  );
}

function targetRange(target) {
  if (!target) return null;
  switch (target.type) {
    case 'git_diff':
      return `${target.base}...${target.head}`;
    case 'commit_range':
      return `${target.base}..${target.head}`;
    case 'working_tree':
      return 'working tree';
    case 'staged':
      return 'staged';
    case 'files':
      return (target.files ?? []).join(', ');
    case 'path':
      return target.path;
    default:
      return null;
  }
}

/**
 * Prefix each line of a code block with a diff marker.
 *
 * Trailing newlines are dropped so a block does not end with a bare marker, but
 * interior blank lines are kept — they are part of the code as written.
 */
function prefixLines(code, marker) {
  if (code == null || code === '') return [];
  return String(code).replace(/\n+$/, '').split('\n').map((line) => `${marker}${line}`);
}

/**
 * One finding, rendered.
 *
 * The order is fixed and deliberate: what is wrong, what it costs, how to fix
 * it, and only then how it was proven. `message` and `impact` sit in one
 * paragraph as separate sentences — never merged into a block of prose, and
 * never reordered so the method comes first.
 */
export function renderFinding(finding, index, lang) {
  const t = strings(lang);
  const lines = [];

  // A heading, not a numbered list item. Everything a finding contains must sit
  // at column 0: Bitbucket does not parse a fenced block indented under a list
  // item, and silently collapses it into one inline run with the language tag
  // leaking in as text. Flat output is the only shape that renders everywhere.
  lines.push(`#### ${index + 1}. ${escapeBareTags(finding.title)}`);

  const locationParts = [];
  if (finding.file) {
    locationParts.push(finding.line ? `\`${finding.file}:${finding.line}\`` : `\`${finding.file}\``);
  }
  if (finding.rule) locationParts.push(`${t.violates} \`${finding.rule}\``);
  if (locationParts.length) lines.push('', locationParts.join(' · '));

  lines.push('');
  lines.push([finding.message, finding.impact].filter(Boolean).map(escapeBareTags).join('\n'));

  if (finding.preExisting) lines.push('', `_${t.preExisting}_`);

  lines.push('');
  lines.push(`**${t.recommended}:** ${escapeBareTags(finding.suggestion)}`);

  for (const hunk of finding.patch ?? []) {
    const at = hunk.line ? `\`${hunk.file}:${hunk.line}\`` : `\`${hunk.file}\``;
    lines.push('', `${at}${hunk.note ? ` — ${escapeBareTags(hunk.note)}` : ''}`, '');
    lines.push('```diff');
    lines.push(...prefixLines(hunk.before, '-'));
    lines.push(...prefixLines(hunk.after, '+'));
    lines.push('```');
  }

  if (finding.previouslyDismissed) {
    lines.push('', `_${t.reconsidered}: ${escapeBareTags(finding.previouslyDismissed)}_`);
  }

  // Italic, not <sub>. Bitbucket Cloud renders no raw HTML, so an HTML tag here
  // reaches the reader as literal `<sub>` text. Keeping the renderer to pure
  // Markdown means one output that is correct on every provider.
  if (finding.evidence) {
    lines.push('', `_${t.evidenceLabel}: ${escapeBareTags(finding.evidence)}_`);
  }

  return lines.join('\n');
}

function renderSection(heading, findings, lang) {
  if (!findings.length) return [];
  const blocks = findings.map((finding, index) => renderFinding(finding, index, lang));
  return [`### ${heading}`, '', ...blocks.flatMap((block) => [block, ''])];
}

export function renderScopeLine(scope, lang) {
  if (!scope) return null;
  const t = strings(lang);
  return t.scopeLine(scope.reviewedFileCount, scope.changedFileCount, scope.exclusions ?? []);
}

/** The standalone Markdown report returned by `code-review` itself. */
export function renderReport(result, lang) {
  const t = strings(lang);
  const out = [`## ${t.reportTitle}`, ''];

  out.push(`**${t.labels.verdict}:** ${t.verdicts[result.verdict]}  `);
  const range = targetRange(result.reviewTarget);
  if (range) out.push(`**${t.labels.range}:** \`${range}\`  `);
  const scopeLine = renderScopeLine(result.scope, lang);
  if (scopeLine) out.push(`**${t.labels.scope}:** ${scopeLine}  `);
  out.push('');

  const groups = groupBySeverity(result.findings ?? []);
  out.push(...renderSection(t.sections.blocking, groups.blocking, lang));
  out.push(...renderSection(t.sections.warning, groups.warning, lang));
  out.push(...renderSection(t.sections.suggestion, groups.suggestion, lang));

  const checks = result.checks ?? [];
  if (checks.length) {
    out.push(`### ${t.sections.checks}`, '');
    for (const check of checks) {
      const detail = check.details ? ` — ${escapeBareTags(check.details)}` : '';
      out.push(`- \`${check.name}\` — ${t.checkStatus[check.status]}${detail}`);
    }
    out.push('');
  }

  const limitations = result.limitations ?? [];
  if (limitations.length) {
    out.push(`### ${t.sections.limitations}`, '');
    for (const limitation of limitations) out.push(`- ${escapeBareTags(limitation)}`);
    out.push('');
  }

  const report = out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  return assertNoHtml(report, 'renderReport');
}
