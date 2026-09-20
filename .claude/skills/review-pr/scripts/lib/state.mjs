import { execFileSync } from 'node:child_process';

export class StateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StateError';
  }
}

const MARKER_LABEL = 'ai-review-state';
const SHA_RE = /^[0-9a-f]{7,40}$/;

/**
 * Pull the JSON object that follows the marker label, brace-balanced.
 *
 * The label appears in two shapes: an HTML comment on GitHub/GitLab, and a
 * fenced code block on Bitbucket, which renders neither raw HTML nor HTML
 * comments. Scanning from the label to the matching close brace reads both, and
 * survives a provider adding markup around the payload.
 */
function extractPayload(text) {
  const start = text.indexOf(MARKER_LABEL);
  if (start === -1) return null;

  const open = text.indexOf('{', start);
  if (open === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = open; i < text.length; i++) {
    const ch = text[i];

    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return null;
}

/**
 * Undo provider auto-linking of a bare value.
 *
 * Bitbucket rewrites a commit SHA inside the marker into `[sha](url)`, which
 * silently turns every re-review into a full review reported as a force-push.
 * Markers already posted cannot be fixed retroactively, so recover them here.
 */
function unlink(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/^\[([^\]]+)\]\([^)]*\)$/, '$1').replace(/^`|`$/g, '').trim();
}

/**
 * Machine-readable state carried in the posted comment.
 *
 * It records more than the SHA: every finding reported and — the part that
 * matters — everything the previous review looked at and deliberately did not
 * report. Without the dismissed list a later run has no way to know it is
 * reversing an earlier judgement, and silently contradicts itself.
 */
export function parseMarker(text) {
  const payload = extractPayload(text ?? '');
  if (!payload) return null;

  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch (err) {
    throw new StateError(`state marker อ่านไม่ได้ (JSON เสีย): ${err.message}`);
  }

  const sha = unlink(parsed.reviewedHeadSha);
  if (!sha) throw new StateError('state marker ไม่มี reviewedHeadSha');
  if (!SHA_RE.test(sha)) {
    throw new StateError(
      `state marker มี reviewedHeadSha ที่ไม่ใช่ SHA: ${JSON.stringify(sha)} — ` +
        `marker เสียหาย ให้รีวิวใหม่ทั้ง PR แทนการรีวิวเฉพาะส่วนเพิ่ม`
    );
  }

  return {
    reviewedHeadSha: sha,
    reviewVersion: parsed.reviewVersion ?? 1,
    findings: parsed.findings ?? [],
    dismissed: parsed.dismissed ?? [],
  };
}

/**
 * Render the marker for a provider.
 *
 * GitHub and GitLab hide an HTML comment, so the state stays invisible there.
 * Bitbucket Cloud renders neither raw HTML nor HTML comments — the payload
 * showed up as visible text and its SHA got auto-linked, corrupting the state —
 * so it gets a fenced code block instead: visible, but inert and never rewritten.
 */
export function buildMarker(
  { reviewedHeadSha, reviewVersion, findings = [], dismissed = [] },
  provider = 'github'
) {
  const payload = {
    reviewedHeadSha,
    reviewVersion,
    findings: findings.map((f) => ({ fp: f.fp, id: f.id, sev: f.sev ?? f.severity })),
    dismissed: dismissed.map((d) => ({ fp: d.fp, why: d.why })),
  };
  const json = JSON.stringify(payload, null, 2);

  if (provider === 'bitbucket') {
    return ['```json', `// ${MARKER_LABEL} — do not edit`, json, '```'].join('\n');
  }
  return `<!-- ${MARKER_LABEL}:\n${json}\n-->`;
}

function shaReachable(sha, cwd) {
  try {
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Decide whether this run can review incrementally, and say why when it cannot.
 *
 * A full re-review labelled as "update N" without a stated reason is
 * indistinguishable from a bug, so the reason travels with the decision rather
 * than being left to the caller to remember.
 */
export function decideMode({ previousSha, headSha, cwd = process.cwd(), lang = 'en' }) {
  const reasons = {
    en: {
      noPrevious: 'no previous review comment was found on this PR',
      unreachable: (sha) =>
        `the previously reviewed commit \`${sha}\` is no longer reachable, which happens after a force-push, rebase or squash`,
      same: 'the head commit is unchanged since the previous review',
    },
    th: {
      noPrevious: 'ยังไม่เคยมีรีวิวบน PR นี้มาก่อน',
      unreachable: (sha) =>
        `commit ที่รีวิวรอบก่อน (\`${sha}\`) ไม่มีอยู่ใน history แล้ว ซึ่งเกิดจากการ force-push, rebase หรือ squash`,
      same: 'commit ล่าสุดยังเป็นตัวเดิมตั้งแต่รีวิวรอบก่อน',
    },
  }[lang];

  if (!reasons) throw new StateError(`ไม่รองรับภาษา: ${lang}`);
  if (!previousSha) return { mode: 'full', reason: reasons.noPrevious, previousSha: null };

  if (!shaReachable(previousSha, cwd)) {
    return { mode: 'full', reason: reasons.unreachable(previousSha.slice(0, 8)), previousSha: null };
  }

  if (previousSha === headSha) {
    return { mode: 'incremental', reason: reasons.same, previousSha, unchanged: true };
  }

  return { mode: 'incremental', reason: null, previousSha };
}
